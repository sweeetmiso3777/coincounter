"use client"

import { useState } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, writeBatch, doc, getDoc, Timestamp, setDoc } from "firebase/firestore"

interface HarvestResult {
  success: boolean
  branchId: string
  harvestDate: string
  previousHarvestDate: string | null
  summary: {
    unitsProcessed: number
    aggregatesHarvested: number
    totalCoins1: number
    totalCoins5: number
    totalCoins10: number
    totalCoins20: number
    totalSales: number
    totalAmount: number
  }
  monthlyAggregate: {
    month: string
    coins_1: number
    coins_5: number
    coins_10: number
    coins_20: number
    sales_count: number
    total: number
  }
}

interface UseBranchHarvest {
  harvestToday: (branchId: string) => Promise<HarvestResult>
  harvestBackdate: (branchId: string, harvestDate: string) => Promise<HarvestResult>
  isHarvesting: boolean
  error: string | null
}

export function useBranchHarvest(): UseBranchHarvest {
  const [isHarvesting, setIsHarvesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getManilaDateString = (date: Date = new Date()) => {
    return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Manila" })).toISOString().split("T")[0]
  }

  const addDays = (timestamp: unknown, days: number): string => {
    let date: Date;
    
    // Handle Firestore Timestamp
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } 
    // Handle string dates (like "2025-09-01")
    else if (typeof timestamp === 'string') {
      date = new Date(timestamp + "T00:00:00+08:00");
    } 
    // Handle Date objects
    else if (timestamp instanceof Date) {
      date = new Date(timestamp);
    }
    // Fallback - try to create date from whatever we have
    else {
      date = new Date(String(timestamp));
    }
    
    // Add days and return Manila date string
    date.setDate(date.getDate() + days);
    return getManilaDateString(date);
  }

  const getMonthKey = (dateString: string) => {
    return dateString.substring(0, 7) // Returns YYYY-MM
  }

  // Get yesterday's date for harvesting
  const getYesterday = () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday
  }

  const harvestBranch = async (branchId: string, harvestDate: Date): Promise<HarvestResult> => {
    setIsHarvesting(true)
    setError(null)

    try {
      const batch = writeBatch(db)
      const harvestDateStr = getManilaDateString(harvestDate)
      const monthKey = getMonthKey(harvestDateStr)

      console.log(`Starting harvest for branch ${branchId} up to ${harvestDateStr}`)

      // 1. Get branch data to find last_harvest_date
      const branchRef = doc(db, "Branches", branchId)
      const branchDoc = await getDoc(branchRef)

      if (!branchDoc.exists()) {
        throw new Error("Branch not found")
      }

      const branchData = branchDoc.data()
      const lastHarvest = branchData?.last_harvest_date
      const startDate = lastHarvest ? addDays(lastHarvest, 1) : "1970-01-01"

      console.log(`Last harvest: ${lastHarvest || 'never'}, starting from: ${startDate}`)

      // 2. Find all units that belong to this branch
      const unitsQuery = query(collection(db, "Units"), where("branchId", "==", branchId))
      const unitsSnapshot = await getDocs(unitsQuery)

      if (unitsSnapshot.empty) {
        throw new Error("No units found for this branch")
      }

      console.log(`Found ${unitsSnapshot.size} units for branch ${branchId}`)

      let totalAggregates = 0
      let totalCoins1 = 0
      let totalCoins5 = 0
      let totalCoins10 = 0
      let totalCoins20 = 0
      let totalSales = 0
      let totalAmount = 0

      // 3. For each unit, scan their aggregates collection
      for (const unitDoc of unitsSnapshot.docs) {
        const unitId = unitDoc.id
        console.log(`Scanning aggregates for unit: ${unitId}`)

        // Get ALL aggregates for this unit that are not harvested yet
        const aggregatesQuery = query(
          collection(db, "Units", unitId, "aggregates"),
          where("harvested", "==", false)
        )

        const aggregatesSnapshot = await getDocs(aggregatesQuery)
        console.log(`Found ${aggregatesSnapshot.size} unharvested aggregates for unit ${unitId}`)

        // Filter aggregates by date range manually since we can't query by multiple conditions easily
        aggregatesSnapshot.forEach((aggDoc) => {
          const agg = aggDoc.data()
          
          // Use createdAt field as per your instruction
          const aggregateDate = agg.createdAt?.toDate?.()
          
          if (!aggregateDate) {
            console.warn(`Aggregate ${aggDoc.id} has no createdAt date, skipping`)
            return
          }

          const aggregateDateStr = getManilaDateString(aggregateDate)
          
          // Check if this aggregate is within our harvest date range
          // Start date: day after last harvest (or beginning of time)
          // End date: harvest date (yesterday for today's harvest)
          if (aggregateDateStr >= startDate && aggregateDateStr <= harvestDateStr) {
            console.log(`Including aggregate ${aggDoc.id} from ${aggregateDateStr}`)
            
            // Mark as harvested
            batch.update(aggDoc.ref, { harvested: true })

            // Sum totals
            totalAggregates++
            totalCoins1 += agg.coins_1 || 0
            totalCoins5 += agg.coins_5 || 0
            totalCoins10 += agg.coins_10 || 0
            totalCoins20 += agg.coins_20 || 0
            totalSales += agg.sales_count || 0
            totalAmount += agg.total || 0
          } else {
            console.log(`Skipping aggregate ${aggDoc.id} from ${aggregateDateStr} (outside range ${startDate} to ${harvestDateStr})`)
          }
        })
      }

      if (totalAggregates === 0) {
        throw new Error(`No unharvested aggregates found for date range ${startDate} to ${harvestDateStr}`)
      }

      console.log(`Harvesting ${totalAggregates} aggregates with totals: ${totalAmount} amount, ${totalSales} sales`)

      // 4. Create/update monthly aggregate under Branches/{branchId}/aggregates/{YYYY-MM}
      const branchAggregateRef = doc(db, "Branches", branchId, "aggregates", monthKey)
      
      // Get existing monthly aggregate if it exists
      const existingAggDoc = await getDoc(branchAggregateRef)
      const existingData = existingAggDoc.exists() ? existingAggDoc.data() : {}

      // Prepare monthly aggregate data
      const monthlyAggregate = {
        branchId,
        month: monthKey,
        coins_1: (existingData.coins_1 || 0) + totalCoins1,
        coins_5: (existingData.coins_5 || 0) + totalCoins5,
        coins_10: (existingData.coins_10 || 0) + totalCoins10,
        coins_20: (existingData.coins_20 || 0) + totalCoins20,
        sales_count: (existingData.sales_count || 0) + totalSales,
        total: (existingData.total || 0) + totalAmount,
        last_updated: Timestamp.now(),
        // Track harvest details
        last_harvest_date: harvestDateStr,
        aggregates_included: (existingData.aggregates_included || 0) + totalAggregates,
        units_count: unitsSnapshot.size
      }

      // Use setDoc with merge for the aggregate
      await setDoc(branchAggregateRef, monthlyAggregate, { merge: true })

      // 5. Update branch last harvest date
      batch.update(branchRef, { last_harvest_date: harvestDateStr })

      // 6. Commit the batch
      await batch.commit()

      console.log(`Successfully harvested ${totalAggregates} aggregates for branch ${branchId}`)

      const result: HarvestResult = {
        success: true,
        branchId,
        harvestDate: harvestDateStr,
        previousHarvestDate: lastHarvest ? getManilaDateString(lastHarvest.toDate()) : null,
        summary: {
          unitsProcessed: unitsSnapshot.size,
          aggregatesHarvested: totalAggregates,
          totalCoins1,
          totalCoins5,
          totalCoins10,
          totalCoins20,
          totalSales,
          totalAmount,
        },
        monthlyAggregate: {
          month: monthKey,
          coins_1: monthlyAggregate.coins_1,
          coins_5: monthlyAggregate.coins_5,
          coins_10: monthlyAggregate.coins_10,
          coins_20: monthlyAggregate.coins_20,
          sales_count: monthlyAggregate.sales_count,
          total: monthlyAggregate.total
        }
      }

      return result
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Harvest failed"
      console.error("Harvest error details:", err)
      setError(errorMessage)
      throw err
    } finally {
      setIsHarvesting(false)
    }
  }

  // Harvest up to yesterday instead of today
  const harvestToday = async (branchId: string): Promise<HarvestResult> => {
    return harvestBranch(branchId, getYesterday())
  }

  const harvestBackdate = async (branchId: string, harvestDate: string): Promise<HarvestResult> => {
    const inputDate = new Date(harvestDate + "T00:00:00+08:00") // Use Manila timezone
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Set to start of day for comparison

    // Allow yesterday or earlier, but not today/future
    if (inputDate >= today) {
      throw new Error("Harvest date must be before today")
    }

    return harvestBranch(branchId, inputDate)
  }

  return {
    harvestToday,
    harvestBackdate,
    isHarvesting,
    error,
  }
}