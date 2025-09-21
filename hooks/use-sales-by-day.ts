"use client"

import { useEffect } from "react"
import { useQueryClient, useQuery, UseQueryOptions } from "@tanstack/react-query"
import { fetchSalesByDay } from "@/lib/sales-api"
import type { SalesCache } from "./use-sales-query"
import type { SalesDocument } from "@/types/sales"
import { toast } from "sonner"

const CACHE_KEY = ["sales", "rolling-30"]

export function useSalesByDay(day: string) {
  const queryClient = useQueryClient()
  const cache = queryClient.getQueryData<SalesCache>(CACHE_KEY)
  const cachedSales = cache?.salesByDay[day]

  if (cachedSales) return { data: cachedSales, isLoading: false }

  const queryResult = useQuery<SalesDocument[], Error>({
  queryKey: ["sales", "by-day", day],
  queryFn: () => fetchSalesByDay(day),
  staleTime: 1000 * 60 * 60 * 24, // 1 day
  cacheTime: 1000 * 60 * 60 * 24 * 30, // 30 days
  enabled: !cachedSales,
  onSuccess: (sales: SalesDocument[]) => {
    queryClient.setQueryData<SalesCache>(CACHE_KEY, (old) => {
      if (!old) return { days: [day], salesByDay: { [day]: sales } }
      const days = [...old.days, day].slice(-30)
      const salesByDay = { ...old.salesByDay, [day]: sales }
      return { days, salesByDay }
    })
  },
} as UseQueryOptions<SalesDocument[], Error>)


  // handle errors in useEffect
  useEffect(() => {
    if (queryResult.error) {
      const err = queryResult.error as Error
      console.error(`Failed to fetch sales for ${day}:`, err)
      toast.error(`Failed to load sales for ${day}`)
    }
  }, [queryResult.error, day])

  return { data: queryResult.data, isLoading: queryResult.isLoading }
}
