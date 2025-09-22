"use client"

import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { onSnapshot, collection, query, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { fetchSalesByDay } from "@/lib/sales-api"
import { toast } from "sonner"
import type { SalesDocument } from "@/types/sales"

const CACHE_KEY = ["sales", "today"]

function getTodayKey() {
  return new Date().toLocaleDateString("en-CA") // YYYY-MM-DD
}

export function useSalesQuery() {
  const queryClient = useQueryClient()
  const todayKey = getTodayKey()

  const existingCache = queryClient.getQueryData<SalesDocument[]>([...CACHE_KEY, todayKey])
  console.log(
    `[v0] Cache check for ${todayKey}:`,
    existingCache ? `Found ${existingCache.length} cached items` : "No cache found",
  )

  const queryResult = useQuery<SalesDocument[], Error>({
    queryKey: [...CACHE_KEY, todayKey],
    queryFn: async () => {
      console.log(`[v0] LETS GET THIS FUCKING STARTED - NO FUCKING CATCH FOR ${todayKey} MOTHERFUCKER`)
      console.log(`[v0] YOUR KEY DUMBASS:`, [...CACHE_KEY, todayKey])
      const sales = await fetchSalesByDay(todayKey)
      console.log(`[v0]  ITS FUCKING DONE!: ${sales.length} SALES RETRIVED`)
      return sales
    },
    staleTime: Number.POSITIVE_INFINITY, // Data never goes stale
    gcTime: Number.POSITIVE_INFINITY, // Keep in cache forever
  })

  useEffect(() => {
    console.log(`[v0] SOMETHING CHANGED MOTHERFUCKER:`, {
      isLoading: queryResult.isLoading,
      isFetching: queryResult.isFetching,
      isSuccess: queryResult.isSuccess,
      dataLength: queryResult.data?.length || 0,
      cacheStatus: queryResult.isLoading ? "Loading" : queryResult.isFetching ? "Fetching" : "Using Cache",
    })
  }, [queryResult.isLoading, queryResult.isFetching, queryResult.isSuccess, queryResult.data])

  useEffect(() => {
    if (queryResult.error) {
      console.error(`[v0]  Failed to load today's sales:`, queryResult.error)
      toast.error("Failed to load today's sales")
    }
  }, [queryResult.error])

  useEffect(() => {
    if (!queryResult.data || queryResult.data.length === 0) {
      console.log(`[v0] No data available for real-time listener setup`)
      return
    }

    console.log(`[v0]  Setting up real-time listener with ${queryResult.data.length} existing items`)

    const latest = queryResult.data[0] // assuming ordered desc
    if (!latest?.timestamp) return

    let latestTimestamp: Date
    if (latest.timestamp && typeof latest.timestamp === "object" && latest.timestamp.seconds) {
      // Serialized Firestore timestamp
      latestTimestamp = new Date(latest.timestamp.seconds * 1000 + (latest.timestamp.nanoseconds || 0) / 1000000)
    } else if (latest.timestamp && typeof latest.timestamp.toDate === "function") {
      // Firestore Timestamp object
      latestTimestamp = latest.timestamp.toDate()
    } else if (latest.timestamp instanceof Date) {
      // Already a Date object
      latestTimestamp = latest.timestamp
    } else if (typeof latest.timestamp === "string") {
      // String timestamp
      latestTimestamp = new Date(latest.timestamp)
    } else {
      // Fallback - skip if we can't parse the timestamp
      console.warn("[v0]  Unable to parse timestamp:", latest.timestamp)
      return
    }

    console.log(`[v0] Real-time listener watching for sales after:`, latestTimestamp)

    const q = query(collection(db, "sales"), where("timestamp", ">", latestTimestamp), orderBy("timestamp", "desc"))

    const unsub = onSnapshot(q, (snapshot) => {
      const fresh: SalesDocument[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as SalesDocument)

      if (fresh.length > 0) {
        console.log(`[v0]  Real-time update: ${fresh.length} new sales detected`)
        console.log(`[v0] Updating cache for key:`, [...CACHE_KEY, todayKey])

        queryClient.setQueryData<SalesDocument[]>([...CACHE_KEY, todayKey], (old) => {
          const updated = [...fresh, ...(old || [])]
          console.log(`[v0] Cache updated: ${old?.length || 0} → ${updated.length} items`)
          return updated
        })

        fresh.forEach((sale) => {
          toast.success(`₱${sale.total} received`, {
            description: `Branch: ${sale.branchId || "Unassigned"} | Device: ${sale.deviceId}`,
          })
        })
      } else {
        console.log(`[v0] Real-time listener triggered but no new sales found`)
      }
    })

    return () => {
      console.log(`[v0]  Cleaning up real-time listener`)
      unsub()
    }
  }, [queryResult.data, queryClient, todayKey])

  return queryResult
}
