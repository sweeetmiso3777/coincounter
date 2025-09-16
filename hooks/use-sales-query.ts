"use client"

import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { onSnapshot, query, where, collection, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { fetchAllSales, salesKeys } from "@/lib/sales-api"
import { toast } from "sonner"

export function useSalesQuery() {
  const queryClient = useQueryClient()

  const queryResult = useQuery({
    queryKey: salesKeys.realTime(),
    queryFn: fetchAllSales,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 1000 * 60 * 60 * 24 * 3,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  useEffect(() => {
    if (!queryResult.data) return

    const cachedSales = queryResult.data
    const latestTimestamp = cachedSales.length
      ? Math.max(...cachedSales.map((s) => s.timestamp.seconds))
      : 0

    // ✅ Now just listen on the flat "sales" collection
    const q = query(
      collection(db, "sales"),
      where("timestamp", ">", new Date(latestTimestamp * 1000)),
      orderBy("timestamp", "desc")
    )

    const unsub = onSnapshot(q, (snapshot) => {
      const newDocs = snapshot.docs.map((doc) => ({
        id: doc.id,
        deviceId: doc.data().deviceId || "",
        branchId: doc.data().branchId || "",
        coins_1: doc.data().coins_1 || 0,
        coins_5: doc.data().coins_5 || 0,
        coins_10: doc.data().coins_10 || 0,
        coins_20: doc.data().coins_20 || 0,
        total: doc.data().total || 0,
        timestamp: doc.data().timestamp,
      }))

      if (newDocs.length > 0) {
        newDocs.forEach((sale) => {
          toast.success(`₱${sale.total} received`, {
            description: `Branch: ${sale.branchId || "Unassigned"} | Device: ${sale.deviceId} | ₱1:${sale.coins_1} ₱5:${sale.coins_5} ₱10:${sale.coins_10} ₱20:${sale.coins_20}`,
          })
        })

        queryClient.setQueryData<any[]>(salesKeys.realTime(), (old = []) => [
          ...newDocs,
          ...old,
        ])
      }

    })

    return () => unsub()
  }, [queryResult.data, queryClient])

  return queryResult
}
