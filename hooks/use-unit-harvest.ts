"use client"

import { useState, useCallback } from "react"
import { collection, getDocs, query, where, Timestamp, writeBatch, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useQueryClient } from "@tanstack/react-query"
import type { Aggregate } from "./use-unit-aggregates"

export interface HarvestResult {
  totalHarvested: number
  coins_1: number
  coins_5: number
  coins_10: number
  coins_20: number
  sales_count: number
  documentsUpdated: number
  harvestDate: Date
  dateRange: {
    start: string
    end: string
  }
  harvestedDates: string[]
  branchLocation: string 
}


interface HarvestState {
  loading: boolean
  error: string | null
  result: HarvestResult | null
  harvestingDeviceId: string | null // Track which device is being harvested
}

export function useUnitHarvest() {
  const [state, setState] = useState<HarvestState>({
    loading: false,
    error: null,
    result: null,
    harvestingDeviceId: null,
  })

  const queryClient = useQueryClient()

  const harvestUnitAggregates = useCallback(
    async (deviceId: string): Promise<HarvestResult> => {
      // Prevent multiple simultaneous harvests
      if (state.loading && state.harvestingDeviceId === deviceId) {
        throw new Error(`Harvest already in progress for ${deviceId}`)
      }

      setState({ 
        loading: true, 
        error: null, 
        result: null,
        harvestingDeviceId: deviceId 
      })

      try {
        console.log("[v0] Starting harvest for deviceId:", deviceId)

        // First, get the unit document to find the branchId
        const unitDocRef = doc(db, "Units", deviceId)
        const unitDoc = await getDoc(unitDocRef)
        
        if (!unitDoc.exists()) {
          throw new Error(`Unit ${deviceId} not found`)
        }

        const unitData = unitDoc.data()
        const branchId = unitData.branchId
        
        if (!branchId) {
          throw new Error(`No branchId found for unit ${deviceId}`)
        }

        // Get branch location
        const branchDocRef = doc(db, "Branches", branchId)
        const branchDoc = await getDoc(branchDocRef)
        const branchLocation = branchDoc.exists() 
          ? branchDoc.data().location 
          : "Unknown Location"

        const aggregatesCol = collection(db, "Units", deviceId, "aggregates")

        // Query for unharvested aggregates only
        const q = query(aggregatesCol, where("harvested", "==", false))

        console.log("[v0] Querying aggregates...")
        const snapshot = await getDocs(q)
        console.log("[v0] Found documents:", snapshot.docs.length)

        if (snapshot.empty) {
          throw new Error("No unharvested aggregates found")
        }

        const harvestedDates: string[] = []

        // Calculate totals from all aggregates
        const harvestResult: HarvestResult = {
          totalHarvested: 0,
          coins_1: 0,
          coins_5: 0,
          coins_10: 0,
          coins_20: 0,
          sales_count: 0,
          documentsUpdated: snapshot.docs.length,
          harvestDate: new Date(),
          dateRange: { start: "", end: "" },
          harvestedDates: [],
          branchLocation: branchLocation, // Include branch location
        }

        const batch = writeBatch(db)

        // Process each aggregate document
        snapshot.docs.forEach((docSnapshot) => {
          const data = docSnapshot.data() as Aggregate

          console.log("[v0] Processing doc:", docSnapshot.id, data)

          harvestedDates.push(docSnapshot.id)

          // Add to totals
          harvestResult.totalHarvested += data.total || 0
          harvestResult.coins_1 += data.coins_1 || 0
          harvestResult.coins_5 += data.coins_5 || 0
          harvestResult.coins_10 += data.coins_10 || 0
          harvestResult.coins_20 += data.coins_20 || 0
          harvestResult.sales_count += data.sales_count || 0

          // Mark document as harvested
          const docRef = doc(db, "Units", deviceId, "aggregates", docSnapshot.id)
          batch.update(docRef, {
            harvested: true,
            harvestedAt: Timestamp.fromDate(new Date()),
          })
        })

        harvestedDates.sort()
        harvestResult.harvestedDates = harvestedDates
        harvestResult.dateRange = {
          start: harvestedDates[0],
          end: harvestedDates[harvestedDates.length - 1],
        }

        // Commit all updates
        console.log("[v0] Committing batch update...")
        await batch.commit()
        console.log("[v0] Harvest complete:", harvestResult)

        // Invalidate queries more specifically
        queryClient.invalidateQueries({ 
          queryKey: ["aggregates", deviceId] 
        })
        queryClient.invalidateQueries({ 
          queryKey: ["units"] // If you have a units query
        })

        setState({
          loading: false,
          error: null,
          result: harvestResult,
          harvestingDeviceId: null,
        })

        return harvestResult
      } catch (err) {
        const errorMessage = `Failed to harvest aggregates for ${deviceId}: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
        console.error("[v0]", errorMessage, err)

        setState({
          loading: false,
          error: errorMessage,
          result: null,
          harvestingDeviceId: null,
        })

        throw new Error(errorMessage)
      }
    },
    [queryClient, state.loading, state.harvestingDeviceId]
  )

  const clearHarvest = useCallback(() => {
    setState({ 
      loading: false, 
      error: null, 
      result: null,
      harvestingDeviceId: null 
    })
  }, [])

  return {
    ...state,
    harvestUnitAggregates,
    clearHarvest,
  }
}