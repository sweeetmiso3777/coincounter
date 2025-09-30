"use client"

import { useEffect, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { onSnapshot, collection, query, where, orderBy, getDocsFromCache, getDocsFromServer } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import type { SalesDocument } from "@/types/sales"

const CACHE_KEY = ["sales", "today"]

function getTodayKey() {
  return new Date().toLocaleDateString("en-CA") // YYYY-MM-DD
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

// Enhanced function to fetch sales with cache-first strategy
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
    // Try to get from cache first
    console.log(`[v1] Attempting to read from cache for ${todayKey}`)
    const cacheSnapshot = await getDocsFromCache(q)
    
    if (!cacheSnapshot.empty) {
      console.log(`[v1] Cache hit: ${cacheSnapshot.docs.length} documents found in cache`)
      return cacheSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SalesDocument))
    }
    
    console.log(`[v1] Cache miss: No documents found in cache, fetching from server`)
  } catch (cacheError) {
    console.warn(`[v1] Cache read failed:`, cacheError)
  }

  // Fallback to server
  try {
    const serverSnapshot = await getDocsFromServer(q)
    console.log(`[v1] Server fetch: ${serverSnapshot.docs.length} documents retrieved`)
    return serverSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SalesDocument))
  } catch (serverError) {
    console.error(`[v1] Server fetch failed:`, serverError)
    throw serverError
  }
}

export function useSalesQuery() {
  const queryClient = useQueryClient()
  const todayKey = getTodayKey()
  const realTimeListenerSetup = useRef(false)

  const existingCache = queryClient.getQueryData<SalesDocument[]>([...CACHE_KEY, todayKey])
  console.log(
    `[v1] Cache check for ${todayKey}:`,
    existingCache ? `Found ${existingCache.length} cached items` : "No cache found",
  )

  const queryResult = useQuery<SalesDocument[], Error>({
    queryKey: [...CACHE_KEY, todayKey],
    queryFn: async () => {
      console.log(`[v1] Fetching sales for ${todayKey}`)
      const sales = await fetchSalesWithCacheFallback(todayKey)
      console.log(`[v1] Fetch completed: ${sales.length} sales retrieved`)
      return sales
    },
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
    gcTime: 30 * 60 * 1000, // 30 minutes cache time
    retry: 2,
  })

  // Debug effect
  useEffect(() => {
    console.log(`[v1] Query state:`, {
      isLoading: queryResult.isLoading,
      isFetching: queryResult.isFetching,
      isSuccess: queryResult.isSuccess,
      dataLength: queryResult.data?.length || 0,
      hasError: !!queryResult.error,
    })
  }, [queryResult.isLoading, queryResult.isFetching, queryResult.isSuccess, queryResult.data, queryResult.error])

  // Error handling
  useEffect(() => {
    if (queryResult.error) {
      console.error(`[v1] Failed to load today's sales:`, queryResult.error)
      toast.error("Failed to load today's sales")
    }
  }, [queryResult.error])

  // Real-time listener setup
  useEffect(() => {
    if (!queryResult.data || realTimeListenerSetup.current) {
      return
    }

    const setupRealTimeListener = async () => {
      if (!queryResult.data || queryResult.data.length === 0) {
        console.log(`[v1] No data available for real-time listener setup`)
        return
      }

      realTimeListenerSetup.current = true
      console.log(`[v1] Setting up real-time listener with ${queryResult.data.length} existing items`)

      // Get the latest timestamp from cached data
      const latest = queryResult.data[0]
      if (!latest?.timestamp) {
        console.warn(`[v1] No timestamp found in latest document`)
        return
      }

      let latestTimestamp: Date
      try {
        if (latest.timestamp && typeof latest.timestamp === 'object' && 'toDate' in latest.timestamp) {
          // Firestore Timestamp object
          latestTimestamp = latest.timestamp.toDate()
        } else if (latest.timestamp && typeof latest.timestamp === 'object' && 'seconds' in latest.timestamp) {
          // Serialized Firestore timestamp
          latestTimestamp = new Date(
            (latest.timestamp as any).seconds * 1000 + 
            ((latest.timestamp as any).nanoseconds || 0) / 1000000
          )
        } else if (latest.timestamp instanceof Date) {
          // Already a Date object
          latestTimestamp = latest.timestamp
        } else if (typeof latest.timestamp === 'string') {
          // String timestamp
          latestTimestamp = new Date(latest.timestamp)
        } else {
          console.warn(`[v1] Unable to parse timestamp:`, latest.timestamp)
          return
        }

        console.log(`[v1] Real-time listener watching for sales after:`, latestTimestamp)

        const q = query(
          collection(db, "sales"),
          where("timestamp", ">", latestTimestamp),
          orderBy("timestamp", "desc")
        )

        const unsub = onSnapshot(
          q,
          (snapshot) => {
            const fresh: SalesDocument[] = snapshot.docs.map((doc) => 
              ({ id: doc.id, ...doc.data() } as SalesDocument)
            )

            if (fresh.length > 0) {
              console.log(`[v1] Real-time update: ${fresh.length} new sales detected`)
              
              queryClient.setQueryData<SalesDocument[]>([...CACHE_KEY, todayKey], (old) => {
                const updated = [...fresh, ...(old || [])]
                console.log(`[v1] Cache updated: ${old?.length || 0} → ${updated.length} items`)
                return updated
              })

              // Show toasts for new sales
              fresh.forEach((sale) => {
                toast.success(`₱${sale.total} received`, {
                  description: `Branch: ${sale.branchId || "Unassigned"} | Device: ${sale.deviceId}`,
                })
              })
            } else {
              console.log(`[v1] Real-time listener triggered but no new sales found`)
            }
          },
          (error) => {
            console.error(`[v1] Real-time listener error:`, error)
          }
        )

        return unsub
      } catch (error) {
        console.error(`[v1] Failed to setup real-time listener:`, error)
        realTimeListenerSetup.current = false
      }
    }

    const cleanup = setupRealTimeListener()

    return () => {
      realTimeListenerSetup.current = false
      if (cleanup) {
        cleanup.then(unsub => unsub && unsub())
      }
    }
  }, [queryResult.data, queryClient, todayKey])

  return queryResult
}