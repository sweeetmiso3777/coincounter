"use client"

import { useCallback, useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, limit, Timestamp, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useQueryClient } from "@tanstack/react-query"
import { useBranches } from "@/hooks/use-branches-query"

export interface Aggregate {
  id: string
  coins_1: number
  coins_5: number
  coins_10: number
  coins_20: number
  sales_count: number
  total: number
  branchId: string
  timestamp: Date
  harvested: boolean
  isPartial?: boolean
  partialHarvestTime?: string
}

export interface AggregatesState {
  aggregates: Aggregate[]
  loading: boolean
  error: string | null
}

export interface UnitInfo {
  deviceId: string
  alias?: string
  branchId?: string
}

function useBranchLocationMap() {
  const { data: branches = [] } = useBranches()

  const branchMap = branches.reduce(
    (acc, branch) => {
      acc[branch.id] = branch.location
      return acc
    },
    {} as Record<string, string>,
  )

  return branchMap
}

// Helper function to fetch unit info
async function fetchUnitInfo(deviceId: string): Promise<UnitInfo> {
  try {
    const unitDoc = await getDoc(doc(db, "Units", deviceId))
    if (unitDoc.exists()) {
      const data = unitDoc.data()
      return {
        deviceId,
        alias: data.alias || undefined,
        branchId: data.branchId || undefined,
      }
    }
    return { deviceId }
  } catch (error) {
    console.error("Failed to fetch unit info:", error)
    return { deviceId }
  }
}

export function useUnitsAggregates() {
  const [state, setState] = useState<AggregatesState>({
    aggregates: [],
    loading: false,
    error: null,
  })

  const [unitInfo, setUnitInfo] = useState<UnitInfo | null>(null)

  const queryClient = useQueryClient()
  const branchMap = useBranchLocationMap()

  // Stable fetch function
  const fetchAggregates = useCallback(async (deviceId: string): Promise<{ aggregates: Aggregate[], unitInfo: UnitInfo }> => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    setUnitInfo(null)

    try {
      // Fetch unit info and aggregates in parallel
      const [unitInfoResult, aggregatesSnapshot] = await Promise.all([
        fetchUnitInfo(deviceId),
        getDocs(query(collection(db, "Units", deviceId, "aggregates"), orderBy("timestamp", "desc"), limit(30)))
      ])

      const aggregates = aggregatesSnapshot.docs.map((doc) => {
        const data = doc.data()
        const docId = doc.id
        const isPartial = docId.includes("_partial")

        return {
          id: docId,
          ...data,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : data.timestamp,
          harvested: data.harvested || false,
          isPartial: isPartial || data.isPartial || false,
          partialHarvestTime: data.partialHarvestTime || undefined,
        } as Aggregate
      })

      setState({ aggregates, loading: false, error: null })
      setUnitInfo(unitInfoResult)
      
      queryClient.setQueryData(["aggregates", deviceId], aggregates)
      queryClient.setQueryData(["unitInfo", deviceId], unitInfoResult)

      return { aggregates, unitInfo: unitInfoResult }
    } catch (err) {
      const errorMessage = `Failed to fetch aggregates for ${deviceId}`
      console.error(`${errorMessage}:`, err)

      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }))

      throw new Error(errorMessage)
    }
  }, [queryClient])

  const clearAggregates = useCallback(() => {
    setState({ aggregates: [], loading: false, error: null })
    setUnitInfo(null)
  }, [])

  return {
    ...state,
    unitInfo,
    fetchAggregates,
    clearAggregates,
    branchMap,
  }
}

export function useUnitAggregates(deviceId: string | null) {
  const { aggregates, loading, error, unitInfo, fetchAggregates, clearAggregates, branchMap } = useUnitsAggregates()

  useEffect(() => {
    if (!deviceId) {
      clearAggregates()
      return
    }

    fetchAggregates(deviceId)
  }, [deviceId]) // Only depend on deviceId

  return {
    aggregates,
    loading,
    error,
    unitInfo,
    branchMap,
    fetchAggregates,
  }
}