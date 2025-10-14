"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, query, getDocs, orderBy } from "firebase/firestore"

export interface UnitSummary {
  unitId: string
  aggregates_count: number
  total_sales: number
  total_amount: number
  coins_1: number
  coins_5: number
  coins_10: number
  coins_20: number
  date_range: {
    start: string
    end: string
  }
}

export interface HarvestData {
  id: string
  branchId: string
  month: string
  date_range: {
    start: string
    end: string
  }
  coins_1: number
  coins_5: number
  coins_10: number
  coins_20: number
  sales_count: number
  total: number
  last_updated: any
  last_harvest_date: string
  aggregates_included: number
  units_count: number
  branchSharePercentage: number
  unit_summaries: UnitSummary[]
  actualAmountProcessed?: number
  variance?: number
  variancePercentage?: number
}

interface UseBranchHarvestData {
  data: HarvestData[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useBranchHarvestData(branchId: string): UseBranchHarvestData {
  const [data, setData] = useState<HarvestData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHarvestData = async () => {
    if (!branchId) {
      setError("Branch ID is required")
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Query the aggregates subcollection for this branch
      const aggregatesRef = collection(db, "Branches", branchId, "aggregates")
      const aggregatesQuery = query(aggregatesRef, orderBy("last_harvest_date", "desc"))

      const snapshot = await getDocs(aggregatesQuery)

      const harvestData: HarvestData[] = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as HarvestData,
      )

      setData(harvestData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch harvest data"
      console.error("Error fetching harvest data:", err)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHarvestData()
  }, [branchId])

  return {
    data,
    isLoading,
    error,
    refetch: fetchHarvestData,
  }
}
