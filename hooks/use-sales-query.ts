"use client"

import { useEffect, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { onSnapshot, collection, query, where, orderBy, getDocsFromCache, getDocsFromServer } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import type { SalesDocument } from "@/types/sales"

const CACHE_KEY = ["sales", "today"]

// GLOBAL REF COUNT TRACKING
const listenerRefCount = new Map<string, number>()
const activeListeners = new Map<string, () => void>()
const processedSales = new Set<string>()

// Track components using the hook
const componentRefCount = { count: 0 }

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
    console.log(`%c[useSalesQuery] Checking cache for ${todayKey}`, "color: blue; font-weight: bold;")
    const cacheSnapshot = await getDocsFromCache(q)
    
    if (!cacheSnapshot.empty) {
      console.log(`%c[useSalesQuery] Cache HIT: ${cacheSnapshot.docs.length} documents`, "color: green; font-weight: bold;")
      return cacheSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SalesDocument))
    }
    
    console.log(`%c[useSalesQuery] Cache MISS: Fetching from server`, "color: orange; font-weight: bold;")
  } catch (cacheError) {
    console.warn(`%c[useSalesQuery] Cache read failed:`, "color: red; font-weight: bold;", cacheError)
  }

  try {
    const serverSnapshot = await getDocsFromServer(q)
    console.log(`%c[useSalesQuery] Server fetch: ${serverSnapshot.docs.length} documents`, "color: lime; font-weight: bold;")
    
    serverSnapshot.docs.forEach(doc => {
      processedSales.add(doc.id)
    })
    
    return serverSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SalesDocument))
  } catch (serverError) {
    console.error(`%c[useSalesQuery] Server fetch failed:`, "color: red; font-weight: bold;", serverError)
    throw serverError 
  }
}

export function useSalesQuery() {
  const queryClient = useQueryClient()
  const todayKey = getTodayKey()
  const isInitialLoad = useRef(true)
  const toastCooldown = useRef<number>(0)

  // Track component usage
  useEffect(() => {
    componentRefCount.count++
    console.log(
      `%c[useSalesQuery] Components using hook: ${componentRefCount.count}`,
      "color: yellow; font-weight: bold; background: #333; padding: 2px 4px;"
    )
    
    return () => {
      componentRefCount.count--
      console.log(
        `%c[useSalesQuery] Components using hook: ${componentRefCount.count} (unmount)`,
        "color: orange; font-weight: bold; background: #333; padding: 2px 4px;"
      )
    }
  }, [])

  const queryResult = useQuery<SalesDocument[], Error>({
    queryKey: [...CACHE_KEY, todayKey],
    queryFn: async () => {
      console.log(`%c[useSalesQuery] Initial fetch for ${todayKey}`, "color: cyan; font-weight: bold;")
      const sales = await fetchSalesWithCacheFallback(todayKey)
      console.log(`%c[useSalesQuery] Fetch completed: ${sales.length} sales`, "color: green; font-weight: bold;")
      return sales
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
  })

  // REAL-TIME LISTENER WITH REF COUNTING
  useEffect(() => {
    const refCount = (listenerRefCount.get(todayKey) || 0) + 1
    listenerRefCount.set(todayKey, refCount)
    
    console.log(
      `%c[useSalesQuery] Firestore Listener Ref Count: ${refCount}`,
      "color: magenta; font-weight: bold; background: #333; padding: 2px 4px;"
    )

    // Only setup listener if first component
    if (refCount === 1) {
      console.log(
        `%c[useSalesQuery] SETTING UP SINGLE FIRESTORE LISTENER`,
        "color: lime; font-weight: bold; background: #333; padding: 2px 4px;"
      )
      
      const startOfDay = getStartOfDay()
      const currentData = queryClient.getQueryData<SalesDocument[]>([...CACHE_KEY, todayKey])
      
      let realTimeQuery
      
      if (currentData && currentData.length > 0) {
        const latest = currentData[0]
        let latestTimestamp: Date
        
        try {
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
          
          const effectiveTimestamp = latestTimestamp > startOfDay ? latestTimestamp : startOfDay
          
          console.log(`%c[useSalesQuery] Listening for sales after:`, "color: blue; font-weight: bold;", effectiveTimestamp)
          realTimeQuery = query(
            collection(db, "sales"),
            where("timestamp", ">", effectiveTimestamp),
            orderBy("timestamp", "desc")
          )
        } catch (error) {
          console.warn(`%c[useSalesQuery] Failed to parse timestamp, falling back to today:`, "color: orange; font-weight: bold;", error)
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
            console.log(`%c[useSalesQuery] Real-time update: ${fresh.length} new sales`, "color: green; font-weight: bold;")
            
            const currentCache = queryClient.getQueryData<SalesDocument[]>([...CACHE_KEY, todayKey])
            const currentIds = new Set(currentCache?.map(sale => sale.id) || [])
            const newSales = fresh.filter(sale => !currentIds.has(sale.id))
            
            const newSalesForToast = newSales.filter(sale => {
              if (processedSales.has(sale.id)) return false
              processedSales.add(sale.id)
              return true
            })

            if (!isInitialLoad.current && newSalesForToast.length > 0) {
              const toastsToShow = newSalesForToast.slice(0, 3)
              
              toastsToShow.forEach((sale) => {
                const now = Date.now()
                if (now - toastCooldown.current > 1000) {
                  toast.success(`₱${sale.total} received`, {
                    description: `Device: ${sale.deviceId}`,
                  })
                  toastCooldown.current = now
                }
              })

              if (newSalesForToast.length > 3) {
                setTimeout(() => {
                  toast.info(`${newSalesForToast.length} new sales`, {
                    description: `${newSalesForToast.length - 3} more sales were processed`,
                    duration: 3000,
                  })
                }, 500)
              }
            }

            queryClient.setQueryData<SalesDocument[]>([...CACHE_KEY, todayKey], (old) => {
              if (!old) return fresh
              
              const existingIds = new Set(old.map(sale => sale.id))
              const updatedNewSales = fresh.filter(sale => !existingIds.has(sale.id))
              const updated = [...updatedNewSales, ...old].sort((a, b) => {
                const timeA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp as any)
                const timeB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp as any)
                return timeB.getTime() - timeA.getTime()
              })
              
              console.log(`%c[useSalesQuery] 💾 Cache updated: ${old.length} → ${updated.length} items`, "color: cyan; font-weight: bold;")
              return updated
            })
          }
        },
        (error) => {
          console.error(`%c[useSalesQuery] Listener error:`, "color: red; font-weight: bold;", error)
        }
      )

      activeListeners.set(todayKey, unsub)
    }

    // Mark initial load as complete
    setTimeout(() => {
      isInitialLoad.current = false
      console.log(`%c[useSalesQuery] Initial load complete - toasts enabled`, "color: green; font-weight: bold;")
    }, 2000)

    return () => {
      const newRefCount = (listenerRefCount.get(todayKey) || 1) - 1
      listenerRefCount.set(todayKey, newRefCount)
      
      console.log(
        `%c[useSalesQuery] Firestore Listener Ref Count: ${newRefCount} (unmount)`,
        "color: magenta; font-weight: bold; background: #333; padding: 2px 4px;"
      )

      if (newRefCount === 0) {
        console.log(
          `%c[useSalesQuery] CLEANING UP FIRESTORE LISTENER`,
          "color: red; font-weight: bold; background: #333; padding: 2px 4px;"
        )
        activeListeners.get(todayKey)?.()
        activeListeners.delete(todayKey)
        listenerRefCount.delete(todayKey)
      }
    }
  }, [todayKey, queryClient]) 

  return queryResult
}