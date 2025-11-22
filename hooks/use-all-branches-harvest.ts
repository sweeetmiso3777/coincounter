"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, query, getDocs, orderBy, Timestamp } from "firebase/firestore"
import { useBranches } from "./use-branches-query"

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
  date_range: {
    start: string
    end: string
  }
  last_harvest_date: string
  last_updated: Timestamp
  location: string
  branch_manager: string
  sales_count: number
  total: number
  coins_1: number
  coins_5: number
  coins_10: number
  coins_20: number
  aggregates_included?: number
  branchSharePercentage?: number
  month?: string
  unit_summaries?: UnitSummary[]
}

export interface BranchHarvestSummary {
  branchId: string
  branchName: string
  branchManager: string
  totalSales: number
  totalHarvest: number
  lastHarvestDate: string | null
  harvestCount: number
  harvests: HarvestData[]
  coins_1: number
  coins_5: number
  coins_10: number
  coins_20: number
}

interface UseAllBranchesHarvestData {
  data: BranchHarvestSummary[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAllBranchesHarvestData(): UseAllBranchesHarvestData {
  const { data: branches, isLoading: isBranchesLoading } = useBranches()
  const [data, setData] = useState<BranchHarvestSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAllHarvestData = async () => {
    if (!branches || branches.length === 0) {
      if (!isBranchesLoading) {
        setIsLoading(false)
      }
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const promises = branches.map(async (branch) => {
        try {
          const aggregatesRef = collection(db, "Branches", branch.id, "aggregates")
          const aggregatesQuery = query(aggregatesRef, orderBy("last_harvest_date", "desc"))

          const snapshot = await getDocs(aggregatesQuery)

          const harvests: HarvestData[] = []

          snapshot.forEach((doc) => {
            const docData = doc.data()

            // Create harvest data with proper fallbacks
            const harvest: HarvestData = {
              id: doc.id,
              date_range: docData.date_range || {
                start: "Beginning",
                end: docData.last_harvest_date || "Unknown"
              },
              last_harvest_date: docData.last_harvest_date || "",
              last_updated: docData.last_updated,
              location: docData.location || branch.location,
              branch_manager: docData.branch_manager || branch.branch_manager,
              sales_count: Number(docData.sales_count) || 0,
              total: Number(docData.total) || 0,
              coins_1: Number(docData.coins_1) || 0,
              coins_5: Number(docData.coins_5) || 0,
              coins_10: Number(docData.coins_10) || 0,
              coins_20: Number(docData.coins_20) || 0,
              aggregates_included: Number(docData.aggregates_included) || 0,
              branchSharePercentage: Number(docData.branchSharePercentage) || 0,
              month: docData.month,
              unit_summaries: docData.unit_summaries || []
            }

            harvests.push(harvest)
          })

          // Calculate totals from all harvests
          const totalSales = harvests.reduce((sum, h) => sum + h.sales_count, 0)
          const totalHarvest = harvests.reduce((sum, h) => sum + h.total, 0)
          const coins1 = harvests.reduce((sum, h) => sum + h.coins_1, 0)
          const coins5 = harvests.reduce((sum, h) => sum + h.coins_5, 0)
          const coins10 = harvests.reduce((sum, h) => sum + h.coins_10, 0)
          const coins20 = harvests.reduce((sum, h) => sum + h.coins_20, 0)

          // Get the most recent harvest date
          const lastHarvestDate = harvests.length > 0 ? harvests[0].last_harvest_date : null

          return {
            branchId: branch.id,
            branchName: branch.location,
            branchManager: branch.branch_manager,
            totalSales,
            totalHarvest,
            lastHarvestDate,
            harvestCount: harvests.length,
            harvests,
            coins_1: coins1,
            coins_5: coins5,
            coins_10: coins10,
            coins_20: coins20
          }
        } catch (branchError) {
          console.error(`Error processing branch ${branch.id}:`, branchError)
          // Return a fallback object for this branch if there's an error
          return {
            branchId: branch.id,
            branchName: branch.location,
            branchManager: branch.branch_manager,
            totalSales: 0,
            totalHarvest: 0,
            lastHarvestDate: null,
            harvestCount: 0,
            harvests: [],
            coins_1: 0,
            coins_5: 0,
            coins_10: 0,
            coins_20: 0
          }
        }
      })

      const results = await Promise.all(promises)

      // Filter out branches with no harvests and sort by total harvest descending
      const branchesWithHarvests = results.filter(branch => branch.harvestCount > 0)
      const sortedResults = branchesWithHarvests.sort((a, b) => b.totalHarvest - a.totalHarvest)

      setData(sortedResults)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch all branches harvest data"
      console.error("Error fetching all branches harvest data:", err)
      setError(errorMessage)
      setData([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isBranchesLoading) {
      fetchAllHarvestData()
    }
  }, [branches, isBranchesLoading])

  return {
    data,
    isLoading: isLoading || isBranchesLoading,
    error,
    refetch: fetchAllHarvestData,
  }
}