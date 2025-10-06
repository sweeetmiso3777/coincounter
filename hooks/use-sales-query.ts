"use client"

import { useEffect, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { onSnapshot, collection, query, where, orderBy, getDocsFromCache, getDocsFromServer } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import type { SalesDocument } from "@/types/sales"

const CACHE_KEY = ["sales", "today"]

// GLOBAL REF COUNT TRACKING (outside hook, but only for this module)
const listenerRefCount = new Map<string, number>()
const activeListeners = new Map<string, () => void>()
const processedSales = new Set<string>() // Track sales that have already been toasted

function getTodayKey() {
  return new Date().toLocaleDateString("en-CA")
}

function getStartOfDay(): Date {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

function getEndOfDay(): Date {
  const now = new Date()
  now.setHours(23, 59, 59, 999)
  return now
}

async function fetchSalesWithCacheFallback(todayKey: string): Promise<SalesDocument[]> {
  const startOfDay = getStartOfDay()
  const endOfDay = getEndOfDay()
  
  const q = query(
    collection(db, "sales"),
    where("timestamp", ">=", startOfDay),
    where("timestamp", "<=", endOfDay),
    orderBy("timestamp", "desc")
  )

  try {
    // try to get from cache first
    console.log(`Attempting to read from cache for ${todayKey}`)
    const cacheSnapshot = await getDocsFromCache(q)
    
    if (!cacheSnapshot.empty) {
      console.log(`Cache hit: ${cacheSnapshot.docs.length} documents found in cache`)
      return cacheSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SalesDocument))
    }
    
    console.log(`Cache miss: No documents found in cache, fetching from server`)
  } catch (cacheError) {
    console.warn(`Cache read failed:`, cacheError)
  }

  // Fallback to server - THIS MUST RETURN
  try {
    const serverSnapshot = await getDocsFromServer(q)
    console.log(`YYY Server fetch: ${serverSnapshot.docs.length} documents retrieved`)
    
    // Mark all initial sales as processed to avoid toasting them
    serverSnapshot.docs.forEach(doc => {
      processedSales.add(doc.id)
    })
    
    return serverSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SalesDocument))
  } catch (serverError) {
    console.error(`XXX Server fetch failed:`, serverError)
    throw serverError 
  }
}

export function useSalesQuery() {
  const queryClient = useQueryClient()
  const todayKey = getTodayKey()
  const isInitialLoad = useRef(true)
  const toastCooldown = useRef<number>(0)

  const queryResult = useQuery<SalesDocument[], Error>({
    queryKey: [...CACHE_KEY, todayKey],
    queryFn: async () => {
      console.log(`Fetching sales for ${todayKey}`)
      const sales = await fetchSalesWithCacheFallback(todayKey)
      console.log(`Fetch completed: ${sales.length} sales retrieved`)
      return sales
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
  })

  // REAL-TIME LISTENER WITH REF COUNTING
  useEffect(() => {
    // track how many components want this listener
    const refCount = (listenerRefCount.get(todayKey) || 0) + 1
    listenerRefCount.set(todayKey, refCount)
    
    console.log(` Ref count for ${todayKey}: ${refCount}`)

    // only setup listener if first component
    if (refCount === 1) {
      console.log(` Setting up SINGLE listener for ${todayKey} (first component)`)
      
      const startOfDay = getStartOfDay()
      const currentData = queryClient.getQueryData<SalesDocument[]>([...CACHE_KEY, todayKey])
      
      let realTimeQuery
      
      if (currentData && currentData.length > 0) {
        // query logic to determine latest timestamp
        const latest = currentData[0]
        let latestTimestamp: Date
        
        try {
          // parsing timestamp logic
          if (latest.timestamp && typeof latest.timestamp === 'object' && 'toDate' in latest.timestamp) {
            latestTimestamp = latest.timestamp.toDate()
          } else if (latest.timestamp && typeof latest.timestamp === 'object' && 'seconds' in latest.timestamp) {
            latestTimestamp = new Date(
              (latest.timestamp as any).seconds * 1000 + 
              ((latest.timestamp as any).nanoseconds || 0) / 1000000
            )
          } else if (latest.timestamp instanceof Date) {
            latestTimestamp = latest.timestamp
          } else if (typeof latest.timestamp === 'string') {
            latestTimestamp = new Date(latest.timestamp)
          } else {
            throw new Error('Unable to parse timestamp')
          }
          
          // listen only for today
          const effectiveTimestamp = latestTimestamp > startOfDay ? latestTimestamp : startOfDay
          
          console.log(`Real-time listener watching for sales after:`, effectiveTimestamp)
          realTimeQuery = query(
            collection(db, "sales"),
            where("timestamp", ">", effectiveTimestamp),
            orderBy("timestamp", "desc")
          )
        } catch (error) {
          console.warn(`Failed to parse latest timestamp, falling back to today:`, error)
          realTimeQuery = query(
            collection(db, "sales"),
            where("timestamp", ">=", startOfDay),
            orderBy("timestamp", "desc")
          )
        }
      } else {
        realTimeQuery = query(
          collection(db, "sales"),
          where("timestamp", ">=", startOfDay),
          orderBy("timestamp", "desc")
        )
      }

      const unsub = onSnapshot(
        realTimeQuery,
        (snapshot) => {
          const fresh: SalesDocument[] = snapshot.docs.map((doc) => 
            ({ id: doc.id, ...doc.data() } as SalesDocument)
          )

          if (fresh.length > 0) {
            console.log(`Real-time update: ${fresh.length} new sales detected`)
            
            const currentCache = queryClient.getQueryData<SalesDocument[]>([...CACHE_KEY, todayKey])
            const currentIds = new Set(currentCache?.map(sale => sale.id) || [])
            const newSales = fresh.filter(sale => !currentIds.has(sale.id))
            
            // SMART TOASTING: Only toast truly new sales that haven't been processed before
            const newSalesForToast = newSales.filter(sale => {
              if (processedSales.has(sale.id)) {
                return false // Already toasted this sale
              }
              processedSales.add(sale.id) // Mark as processed
              return true
            })

            // RATE LIMIT TOASTS: Only show toasts if we're not in initial load and not too many at once
            if (!isInitialLoad.current && newSalesForToast.length > 0) {
              // Show maximum 3 toasts at once to avoid spam
              const toastsToShow = newSalesForToast.slice(0, 3)
              
              toastsToShow.forEach((sale) => {
                // Additional cooldown check to prevent rapid-fire toasts
                const now = Date.now()
                if (now - toastCooldown.current > 1000) { // 1 second cooldown
                  toast.success(`₱${sale.total} received`, {
                    description: `Branch: ${sale.branchId || "Unassigned"} | Device: ${sale.deviceId}`,
                  })
                  toastCooldown.current = now
                }
              })

              // If there are more than 3 new sales, show a summary toast
              if (newSalesForToast.length > 3) {
                setTimeout(() => {
                  toast.info(`${newSalesForToast.length} new sales`, {
                    description: `${newSalesForToast.length - 3} more sales were processed`,
                    duration: 3000,
                  })
                }, 500)
              }
            }

            // Update cache (this happens regardless of toasts)
            queryClient.setQueryData<SalesDocument[]>([...CACHE_KEY, todayKey], (old) => {
              if (!old) return fresh
              
              const existingIds = new Set(old.map(sale => sale.id))
              const updatedNewSales = fresh.filter(sale => !existingIds.has(sale.id))
              const updated = [...updatedNewSales, ...old].sort((a, b) => {
                const timeA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp as any)
                const timeB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp as any)
                return timeB.getTime() - timeA.getTime()
              })
              
              console.log(`Cache updated: ${old.length} → ${updated.length} items`)
              return updated
            })
          }
        },
        (error) => {
          console.error(`Real-time listener error:`, error)
        }
      )

      activeListeners.set(todayKey, unsub)
    }

    // Mark initial load as complete after first render
    setTimeout(() => {
      isInitialLoad.current = false
    }, 2000)

    return () => {
      // decrease ref count
      const newRefCount = (listenerRefCount.get(todayKey) || 1) - 1
      listenerRefCount.set(todayKey, newRefCount)
      
      console.log(` Ref count for ${todayKey}: ${newRefCount} (after unmount)`)

      // only cleanup if last component
      if (newRefCount === 0) {
        console.log(` Cleaning up listener for ${todayKey} (last component unmounted)`)
        activeListeners.get(todayKey)!()
        activeListeners.delete(todayKey)
        listenerRefCount.delete(todayKey)
      }
    }
  }, [todayKey, queryClient, queryResult.data])

  return queryResult
}