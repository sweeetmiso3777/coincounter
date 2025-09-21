"use client"

import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { onSnapshot, query, where, collection, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { fetchSalesByDay } from "@/lib/sales-api"
import { toast } from "sonner"
import type { SalesDocument } from "@/types/sales"

export type SalesCache = {
  days: string[]
  salesByDay: Record<string, SalesDocument[]>
}

const CACHE_KEY = ["sales", "rolling-30"]

function getTodayKey() {
  return new Date().toLocaleDateString("en-CA") // YYYY-MM-DD in local PH time
}

export function useSalesQuery() {
  const queryClient = useQueryClient()
  const todayKey = getTodayKey()

  // 🚨 Notice: queryFn may not even run if we already have cached data
  const queryResult = useQuery<SalesDocument[], Error>({
    queryKey: [...CACHE_KEY, todayKey],
    queryFn: async () => {
      // Check if cache exists first
      const cached = queryClient.getQueryData<SalesDocument[]>([...CACHE_KEY, todayKey])
      if (cached && cached.length > 0) {
        // ✅ Already have today’s sales in cache → skip fetch
        return cached
      }
      // ❌ No cache → fetch all from Firestore (this will cost N reads once)
      return fetchSalesByDay(todayKey)
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24 * 30,
  })

  useEffect(() => {
    if (queryResult.error) {
      console.error("Failed to load today's sales:", queryResult.error)
      toast.error("Failed to load today's sales")
    }
  }, [queryResult.error])

  useEffect(() => {
    const cached = queryClient.getQueryData<SalesDocument[]>([...CACHE_KEY, todayKey])
    if (!cached || cached.length === 0) return // no base data, no listener

    // ✅ Use latest cached sale timestamp as cutoff
    const latest = cached[0] // assuming ordered desc
    if (!latest?.timestamp) return
    const latestTimestamp = latest.timestamp.toDate()

    const q = query(
      collection(db, "sales"),
      where("timestamp", ">", latestTimestamp),
      orderBy("timestamp", "desc")
    )

    const unsub = onSnapshot(q, (snapshot) => {
      try {
        const fresh: SalesDocument[] = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as SalesDocument)
        )

        if (fresh.length > 0) {
          // Update rolling cache
          queryClient.setQueryData<SalesCache>(CACHE_KEY, (old) => {
            if (!old) return { days: [todayKey], salesByDay: { [todayKey]: fresh } }
            return {
              ...old,
              salesByDay: {
                ...old.salesByDay,
                [todayKey]: [...fresh, ...(old.salesByDay[todayKey] || [])],
              },
            }
          })

          // Update per-day query
          queryClient.setQueryData<SalesDocument[]>([...CACHE_KEY, todayKey], (old) => {
            return [...fresh, ...(old || [])]
          })

          // Toast for each new sale
          fresh.forEach((sale) => {
            toast.success(`₱${sale.total} received`, {
              description: `Branch: ${sale.branchId || "Unassigned"} | Device: ${sale.deviceId}`,
            })
          })
        }
      } catch (err) {
        console.error("Failed processing snapshot:", err)
      }
    })

    return () => unsub()
  }, [queryResult.data, queryClient, todayKey])

  return queryResult
}
