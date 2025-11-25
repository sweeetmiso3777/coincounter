"use client"

import { useState } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, writeBatch, doc, getDoc, Timestamp, setDoc } from "firebase/firestore"

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

export interface HarvestResult {
  success: boolean
  branchId: string
  harvestDate: string
  previousHarvestDate: string | null
  harvestMode: "normal" | "include_today" | "backdate"
  preAggregatePerformed?: boolean
  preAggregateStats?: {
    unitsProcessed: number
    salesDeleted: number
    aggregatesCreated: number
  }
  summary: {
    unitsProcessed: number
    aggregatesHarvested: number
    totalCoins1: number
    totalCoins5: number
    totalCoins10: number
    totalCoins20: number
    totalSales: number
    totalAmount: number
    branchSharePercentage: number
    branchShareAmount: number
    companyShareAmount: number
    actualAmountProcessed?: number
    variance?: number
    variancePercentage?: number
  }
  monthlyAggregate: {
    month: string
    coins_1: number
    coins_5: number
    coins_10: number
    coins_20: number
    sales_count: number
    total: number
    aggregates_included: number
    units_count: number
    last_harvest_date: string
    branchSharePercentage: number
    unit_summaries: UnitSummary[]
    actualAmountProcessed?: number
    variance?: number
    variancePercentage?: number
  }
  // ADD THIS: Individual aggregates per unit
  unitAggregates: {
    [unitId: string]: Array<{
      date: string
      coins_1: number
      coins_5: number
      coins_10: number
      coins_20: number
      sales_count: number
      total: number
      isPartial?: boolean
    }>
  }
}

export interface HarvestPreview {
  previewId: string
  branchId: string
  harvestMode: "normal" | "include_today" | "backdate"
  dateRange: {
    start: string | null
    end: string
  }
  summary: {
    unitsCount: number
    aggregatesCount: number
    totalSales: number
    totalAmount: number
    coins1: number
    coins5: number
    coins10: number
    coins20: number
  }
  aggregates: Array<{
    coins_1: number
    coins_5: number
    coins_10: number
    coins_20: number
    unitId: string
    aggregateId: string
    createdAt: string
    total: number
    sales_count: number
    isPartial?: boolean
  }>
}

export interface BranchInfo {
  branchName: string
  branchAddress: string
  managerName: string
  contactNumber: string
  sharePercentage: number
}

interface DeviceAggregate {
  coins_1: number
  coins_5: number
  coins_10: number
  coins_20: number
  total: number
  sales_count: number
  branchId: string
  timestamp: Timestamp
  createdAt: Timestamp
  harvested: boolean
  isPartial: boolean
  partialHarvestTime: string
}

interface UseBranchHarvest {
  previewHarvest: (
    branchId: string,
    harvestMode: "normal" | "include_today" | "backdate",
    branchInfo?: BranchInfo,
    customHarvestDate?: string,
  ) => Promise<HarvestPreview>
  executeHarvest: (
    branchId: string,
    previewId: string,
    harvestMode: "normal" | "include_today" | "backdate",
    branchInfo?: BranchInfo,
    actualAmountProcessed?: number,
    customHarvestDate?: string,
  ) => Promise<HarvestResult>
  isHarvesting: boolean
  error: string | null
}

export function useBranchHarvest(): UseBranchHarvest {
  const [isHarvesting, setIsHarvesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getManilaDateString = (date: Date = new Date()) => {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    return formatter.format(date)
  }

  const getManilaDateTime = (date: Date = new Date()) => {
    return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Manila" }))
  }

  const getMonthKey = (dateString: string) => {
    return dateString.substring(0, 7)
  }

  const getDateRangeDocumentId = (startDate: string | null, endDate: string): string => {
    if (!startDate) {
      return `Beginning-To-${endDate}`
    }
    return `${startDate}-To-${endDate}`
  }

  const getBranchInfo = async (branchId: string): Promise<BranchInfo> => {
    try {
      const branchRef = doc(db, "Branches", branchId)
      const branchDoc = await getDoc(branchRef)

      if (!branchDoc.exists()) {
        throw new Error("Branch not found")
      }

      const branchData = branchDoc.data()

      return {
        branchName: branchData?.name || branchData?.branchName || "Unknown Branch",
        branchAddress: branchData?.address || branchData?.location || "Address not specified",
        managerName: branchData?.managerName || branchData?.branch_manager || "Manager not specified",
        contactNumber: branchData?.contactNumber || branchData?.phone || "Contact not specified",
        sharePercentage: branchData?.sharePercentage || branchData?.share || 0,
      }
    } catch (error) {
      console.warn("Could not fetch branch info, using defaults:", error)
      return {
        branchName: `Branch ${branchId}`,
        branchAddress: "Address not available",
        managerName: "Manager not specified",
        contactNumber: "Contact not specified",
        sharePercentage: 0,
      }
    }
  }

  const calculateShares = (totalAmount: number, sharePercentage = 0) => {
    const branchShareAmount = totalAmount * (sharePercentage / 100)
    const companyShareAmount = totalAmount - branchShareAmount

    return {
      branchSharePercentage: sharePercentage,
      branchShareAmount,
      companyShareAmount,
    }
  }

  // Pre-aggregate function for including today's sales
  const preAggregate = async (branchId: string, harvestTime: Date) => {
    const manilaTime = getManilaDateTime(harvestTime)
    const todayDateId = getManilaDateString(manilaTime)

    const startOfDay = new Date(manilaTime)
    startOfDay.setHours(0, 0, 0, 0)

    console.log(
      `Pre-aggregating for branch ${branchId} from ${startOfDay.toISOString()} to ${manilaTime.toISOString()}`,
    )

    // Get all units for this branch
    const unitsQuery = query(collection(db, "Units"), where("branchId", "==", branchId))
    const unitsSnapshot = await getDocs(unitsQuery)

    if (unitsSnapshot.empty) {
      throw new Error("No units found for this branch")
    }

    const unitIds = unitsSnapshot.docs.map((doc) => doc.id)
    console.log(`Found ${unitIds.length} units for branch ${branchId}`)

    // Check if partial aggregate already exists for today
    for (const unitId of unitIds) {
      const partialAggRef = doc(db, "Units", unitId, "aggregates", `${todayDateId}_partial`)
      const partialAggDoc = await getDoc(partialAggRef)

      if (partialAggDoc.exists()) {
        throw new Error(
          `Pre-aggregation already completed for ${todayDateId}. ` +
            `Partial aggregates already exist. Cannot run twice for the same day.`,
        )
      }
    }

    // Process units in batches (Firestore 'in' query limit is 10)
    const batchSize = 10
    const deviceAggregates = new Map<string, DeviceAggregate>()
    const salesToDelete: string[] = []

    for (let i = 0; i < unitIds.length; i += batchSize) {
      const batchUnitIds = unitIds.slice(i, i + batchSize)

      const salesQuery = query(
        collection(db, "sales"),
        where("deviceId", "in", batchUnitIds),
        where("timestamp", ">=", Timestamp.fromDate(startOfDay)),
        where("timestamp", "<=", Timestamp.fromDate(manilaTime)),
      )

      const salesSnapshot = await getDocs(salesQuery)
      console.log(`Batch ${Math.floor(i / batchSize) + 1}: Found ${salesSnapshot.size} sales`)

      salesSnapshot.forEach((saleDoc) => {
        const data = saleDoc.data()
        const deviceId = data.deviceId as string

        if (!deviceAggregates.has(deviceId)) {
          deviceAggregates.set(deviceId, {
            coins_1: 0,
            coins_5: 0,
            coins_10: 0,
            coins_20: 0,
            total: 0,
            sales_count: 0,
            branchId: branchId,
            timestamp: Timestamp.now(),
            createdAt: Timestamp.now(),
            harvested: false,
            isPartial: true,
            partialHarvestTime: manilaTime.toISOString(),
          })
        }

        const agg = deviceAggregates.get(deviceId)!
        agg.coins_1 += data.coins_1 || 0
        agg.coins_5 += data.coins_5 || 0
        agg.coins_10 += data.coins_10 || 0
        agg.coins_20 += data.coins_20 || 0
        agg.total += data.total || 0
        agg.sales_count += 1

        salesToDelete.push(saleDoc.id)
      })
    }

    if (deviceAggregates.size === 0) {
      console.log(`No sales data found for branch ${branchId} to pre-aggregate`)
      return {
        unitsProcessed: 0,
        salesDeleted: 0,
        aggregatesCreated: 0,
      }
    }

    // Write partial aggregates and delete sales in batches
    const FIRESTORE_BATCH_LIMIT = 500
    let currentBatch = writeBatch(db)
    let operationCount = 0

    for (const [deviceId, agg] of deviceAggregates.entries()) {
      const aggRef = doc(db, "Units", deviceId, "aggregates", `${todayDateId}_partial`)
      currentBatch.set(aggRef, agg)
      operationCount++

      if (operationCount >= FIRESTORE_BATCH_LIMIT) {
        await currentBatch.commit()
        currentBatch = writeBatch(db)
        operationCount = 0
      }
    }

    for (const saleId of salesToDelete) {
      const saleRef = doc(db, "sales", saleId)
      currentBatch.delete(saleRef)
      operationCount++

      if (operationCount >= FIRESTORE_BATCH_LIMIT) {
        await currentBatch.commit()
        currentBatch = writeBatch(db)
        operationCount = 0
      }
    }

    if (operationCount > 0) {
      await currentBatch.commit()
    }

    console.log(`Pre-aggregation completed: ${deviceAggregates.size} aggregates, ${salesToDelete.length} sales deleted`)

    return {
      unitsProcessed: deviceAggregates.size,
      salesDeleted: salesToDelete.length,
      aggregatesCreated: deviceAggregates.size,
    }
  }

  const previewHarvest = async (
    branchId: string,
    harvestMode: "normal" | "include_today" | "backdate" = "normal",
    branchInfo?: BranchInfo,
    customHarvestDate?: string,
  ): Promise<HarvestPreview> => {
    setIsHarvesting(true)
    setError(null)

    try {
      let harvestDate: Date

      // Determine harvest date based on mode
      switch (harvestMode) {
        case "normal":
          // Harvest up to yesterday
          harvestDate = new Date()
          harvestDate.setDate(harvestDate.getDate() - 1)
          break
        case "include_today":
          // Harvest up to today (will include pre-aggregated today's sales)
          harvestDate = new Date()
          break
        case "backdate":
          // Use custom date for backdating
          if (!customHarvestDate) {
            throw new Error("Custom harvest date is required for backdate mode")
          }
          harvestDate = new Date(customHarvestDate + "T00:00:00+08:00")
          break
        default:
          harvestDate = new Date()
          harvestDate.setDate(harvestDate.getDate() - 1)
      }

      const harvestDateStr = getManilaDateString(harvestDate)

      console.log(`Previewing ${harvestMode} harvest for branch ${branchId} up to ${harvestDateStr}`)

      const branchRef = doc(db, "Branches", branchId)
      const branchDoc = await getDoc(branchRef)

      if (!branchDoc.exists()) {
        throw new Error("Branch not found")
      }

      const branchData = branchDoc.data()
      const lastHarvest = branchData?.last_harvest_date

      let previousHarvestDateStr: string | null = null

      if (lastHarvest) {
        if (lastHarvest instanceof Timestamp) {
          previousHarvestDateStr = getManilaDateString(lastHarvest.toDate())
        } else if (lastHarvest instanceof Date) {
          previousHarvestDateStr = getManilaDateString(lastHarvest)
        } else if (typeof lastHarvest === "string") {
          if (/^\d{4}-\d{2}-\d{2}$/.test(lastHarvest)) {
            previousHarvestDateStr = lastHarvest
          } else {
            const parsedDate = new Date(lastHarvest + "T00:00:00+08:00")
            previousHarvestDateStr = getManilaDateString(parsedDate)
          }
        }
      }

      let startDate: string | null = null

      // For all modes, calculate start date from last harvest
      if (previousHarvestDateStr) {
        const lastHarvestDate = new Date(previousHarvestDateStr + "T00:00:00+08:00")
        // lastHarvestDate.setDate(lastHarvestDate.getDate() + 1) feeling cute might add it later
        startDate = getManilaDateString(lastHarvestDate)

        // For backdate mode, we allow the start date to be after the harvest date
        // This means there's no data to harvest for that period
        if (startDate > harvestDateStr && harvestMode !== "backdate") {
          throw new Error(`No unit summaries to harvest. Last harvest was on ${previousHarvestDateStr}`)
        }
      }

      const unitsQuery = query(collection(db, "Units"), where("branchId", "==", branchId))
      const unitsSnapshot = await getDocs(unitsQuery)

      if (unitsSnapshot.empty) {
        throw new Error("No units found for this branch")
      }

      let totalAggregates = 0
      let totalCoins1 = 0
      let totalCoins5 = 0
      let totalCoins10 = 0
      let totalCoins20 = 0
      let totalSales = 0
      let totalAmount = 0

      const aggregates: HarvestPreview["aggregates"] = []

      for (const unitDoc of unitsSnapshot.docs) {
        const unitId = unitDoc.id

        // Query for all unharvested aggregates (both regular and partial)
        const aggregatesQuery = query(collection(db, "Units", unitId, "aggregates"), where("harvested", "==", false))
        const aggregatesSnapshot = await getDocs(aggregatesQuery)

        aggregatesSnapshot.forEach((aggDoc) => {
          const agg = aggDoc.data()
          const aggregateDate = agg.createdAt?.toDate?.()

          if (!aggregateDate) return

          const aggregateDateStr = getManilaDateString(aggregateDate)

          // For all modes, use the same range logic: from startDate to harvestDateStr
          const isWithinRange = startDate
            ? aggregateDateStr >= startDate && aggregateDateStr <= harvestDateStr
            : aggregateDateStr <= harvestDateStr

          const isPartialWithinRange =
            agg.isPartial &&
            (startDate
              ? aggregateDateStr >= startDate && aggregateDateStr <= harvestDateStr
              : aggregateDateStr <= harvestDateStr)

          if (isWithinRange || isPartialWithinRange) {
            totalAggregates++
            totalCoins1 += agg.coins_1 || 0
            totalCoins5 += agg.coins_5 || 0
            totalCoins10 += agg.coins_10 || 0
            totalCoins20 += agg.coins_20 || 0
            totalSales += agg.sales_count || 0
            totalAmount += agg.total || 0

            aggregates.push({
              unitId,
              aggregateId: aggDoc.id,
              createdAt: aggregateDateStr,
              total: agg.total || 0,
              sales_count: agg.sales_count || 0,
              coins_1: agg.coins_1 || 0,
              coins_5: agg.coins_5 || 0,
              coins_10: agg.coins_10 || 0,
              coins_20: agg.coins_20 || 0,
              isPartial: agg.isPartial || false,
            })
          }
        })
      }

      if (totalAggregates === 0) {
        throw new Error(
          `No unharvested summaries found for date range ${startDate || "beginning"} to ${harvestDateStr}`,
        )
      }

      const preview: HarvestPreview = {
        previewId: `preview_${branchId}_${Date.now()}`,
        branchId,
        harvestMode,
        dateRange: {
          start: startDate,
          end: harvestDateStr,
        },
        summary: {
          unitsCount: unitsSnapshot.size,
          aggregatesCount: totalAggregates,
          totalSales,
          totalAmount,
          coins1: totalCoins1,
          coins5: totalCoins5,
          coins10: totalCoins10,
          coins20: totalCoins20,
        },
        aggregates,
      }

      return preview
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Preview failed"
      console.error("Preview error details:", err)
      setError(errorMessage)
      throw err
    } finally {
      setIsHarvesting(false)
    }
  }

  const executeHarvest = async (
    branchId: string,
    previewId: string,
    harvestMode: "normal" | "include_today" | "backdate" = "normal",
    branchInfo?: BranchInfo,
    actualAmountProcessed?: number,
    customHarvestDate?: string,
  ): Promise<HarvestResult> => {
    setIsHarvesting(true)
    setError(null)

    try {
      let preAggregateStats

      // Step 1: Pre-aggregate if "Include Today's Sales" mode is selected
      if (harvestMode === "include_today") {
        console.log("Include Today mode - running pre-aggregation...")
        const harvestTime = customHarvestDate ? new Date(customHarvestDate + "T23:59:59+08:00") : new Date()
        preAggregateStats = await preAggregate(branchId, harvestTime)
      }

      // Step 2: Execute normal harvest
      const batch = writeBatch(db)

      let harvestDate: Date

      // Determine harvest date based on mode
      switch (harvestMode) {
        case "normal":
          // Harvest up to yesterday
          harvestDate = new Date()
          harvestDate.setDate(harvestDate.getDate() - 1)
          break
        case "include_today":
          // Harvest up to today (includes pre-aggregated today's sales)
          harvestDate = new Date()
          break
        case "backdate":
          // Use custom date for backdating
          if (!customHarvestDate) {
            throw new Error("Custom harvest date is required for backdate mode")
          }
          harvestDate = new Date(customHarvestDate + "T00:00:00+08:00")

          // Validate backdate is not in the future
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          if (harvestDate > today) {
            throw new Error("Backdate harvest cannot be in the future")
          }
          break
        default:
          harvestDate = new Date()
          harvestDate.setDate(harvestDate.getDate() - 1)
      }

      const harvestDateStr = getManilaDateString(harvestDate)
      const monthKey = getMonthKey(harvestDateStr)

      console.log(`Executing ${harvestMode} harvest for branch ${branchId} up to ${harvestDateStr}`)

      const branchRef = doc(db, "Branches", branchId)
      const branchDoc = await getDoc(branchRef)

      if (!branchDoc.exists()) {
        throw new Error("Branch not found")
      }

      const branchData = branchDoc.data()
      const lastHarvest = branchData?.last_harvest_date
      const branchSharePercentage = branchData?.sharePercentage || branchData?.share || 0

      let previousHarvestDateStr: string | null = null

      if (lastHarvest) {
        if (lastHarvest instanceof Timestamp) {
          previousHarvestDateStr = getManilaDateString(lastHarvest.toDate())
        } else if (lastHarvest instanceof Date) {
          previousHarvestDateStr = getManilaDateString(lastHarvest)
        } else if (typeof lastHarvest === "string") {
          if (/^\d{4}-\d{2}-\d{2}$/.test(lastHarvest)) {
            previousHarvestDateStr = lastHarvest
          } else {
            const parsedDate = new Date(lastHarvest + "T00:00:00+08:00")
            previousHarvestDateStr = getManilaDateString(parsedDate)
          }
        }
      }

      let startDate: string | null = null

      // For all modes, calculate start date from last harvest
      if (previousHarvestDateStr) {
        const lastHarvestDate = new Date(previousHarvestDateStr + "T00:00:00+08:00")
        lastHarvestDate.setDate(lastHarvestDate.getDate() + 1)
        startDate = getManilaDateString(lastHarvestDate)

        // For backdate mode, we allow the start date to be after the harvest date
        // This means there's no data to harvest for that period
        if (startDate > harvestDateStr && harvestMode !== "backdate") {
          throw new Error(`No data to harvest. Last harvest was on ${previousHarvestDateStr}`)
        }
      }

      const unitsQuery = query(collection(db, "Units"), where("branchId", "==", branchId))
      const unitsSnapshot = await getDocs(unitsQuery)

      if (unitsSnapshot.empty) {
        throw new Error("No units found for this branch")
      }

      let totalAggregates = 0
      let totalCoins1 = 0
      let totalCoins5 = 0
      let totalCoins10 = 0
      let totalCoins20 = 0
      let totalSales = 0
      let totalAmount = 0

      const unitSummaries: UnitSummary[] = []
      const unitAggregates: HarvestResult['unitAggregates'] = {};

      for (const unitDoc of unitsSnapshot.docs) {
        const unitId = unitDoc.id
        unitAggregates[unitId] = [];

        // Query for both regular aggregates AND partial aggregates
        const aggregatesQuery = query(collection(db, "Units", unitId, "aggregates"), where("harvested", "==", false))
        const aggregatesSnapshot = await getDocs(aggregatesQuery)

        let unitAggregatesCount = 0
        let unitSales = 0
        let unitAmount = 0
        let unitCoins1 = 0
        let unitCoins5 = 0
        let unitCoins10 = 0
        let unitCoins20 = 0
        let unitEarliestDate: string | null = null
        let unitLatestDate: string | null = null

        aggregatesSnapshot.forEach((aggDoc) => {
          const agg = aggDoc.data()
          const aggregateDate = agg.createdAt?.toDate?.()

          if (!aggregateDate) return

          const aggregateDateStr = getManilaDateString(aggregateDate)

          // For all modes, use the same range logic: from startDate to harvestDateStr
          const isWithinRange = startDate
            ? aggregateDateStr >= startDate && aggregateDateStr <= harvestDateStr
            : aggregateDateStr <= harvestDateStr

          const isPartialWithinRange =
            agg.isPartial &&
            (startDate
              ? aggregateDateStr >= startDate && aggregateDateStr <= harvestDateStr
              : aggregateDateStr <= harvestDateStr)

          if (isWithinRange || isPartialWithinRange) {
            // ADD: Store individual aggregate data
            unitAggregates[unitId].push({
              date: aggregateDateStr,
              coins_1: agg.coins_1 || 0,
              coins_5: agg.coins_5 || 0,
              coins_10: agg.coins_10 || 0,
              coins_20: agg.coins_20 || 0,
              sales_count: agg.sales_count || 0,
              total: agg.total || 0,
              isPartial: agg.isPartial || false
            });

            if (!unitEarliestDate || aggregateDateStr < unitEarliestDate) {
              unitEarliestDate = aggregateDateStr
            }
            if (!unitLatestDate || aggregateDateStr > unitLatestDate) {
              unitLatestDate = aggregateDateStr
            }

            unitAggregatesCount++
            unitCoins1 += agg.coins_1 || 0
            unitCoins5 += agg.coins_5 || 0
            unitCoins10 += agg.coins_10 || 0
            unitCoins20 += agg.coins_20 || 0
            unitSales += agg.sales_count || 0
            unitAmount += agg.total || 0

            // MARK AS HARVESTED
            batch.update(aggDoc.ref, {
              harvested: true,
              isPartial: false, // Remove partial flag since it's now fully harvested
            })

            totalAggregates++
            totalCoins1 += agg.coins_1 || 0
            totalCoins5 += agg.coins_5 || 0
            totalCoins10 += agg.coins_10 || 0
            totalCoins20 += agg.coins_20 || 0
            totalSales += agg.sales_count || 0
            totalAmount += agg.total || 0
          }
        })

        if (unitAggregatesCount > 0) {
          unitSummaries.push({
            unitId,
            aggregates_count: unitAggregatesCount,
            total_sales: unitSales,
            total_amount: unitAmount,
            coins_1: unitCoins1,
            coins_5: unitCoins5,
            coins_10: unitCoins10,
            coins_20: unitCoins20,
            date_range: {
              start: unitEarliestDate!,
              end: unitLatestDate!,
            },
          })
        }
      }

      if (totalAggregates === 0) {
        throw new Error(`No unharvested daily summaries found`)
      }

      const shareCalculation = calculateShares(totalAmount, branchSharePercentage)

      let variance: number | undefined
      let variancePercentage: number | undefined

      if (actualAmountProcessed !== undefined && !isNaN(actualAmountProcessed)) {
        variance = actualAmountProcessed - totalAmount
        variancePercentage = totalAmount > 0 ? (variance / totalAmount) * 100 : 0
      }

      const documentId = getDateRangeDocumentId(startDate, harvestDateStr)
      const branchAggregateRef = doc(db, "Branches", branchId, "aggregates", documentId)
      const existingAggDoc = await getDoc(branchAggregateRef)
      const existingData = existingAggDoc.exists() ? existingAggDoc.data() : {}

      const monthlyAggregate = {
        branchId,
        branch_manager: branchData?.branch_manager || branchData?.managerName || "Unknown",
        location: branchData?.location || branchData?.address || "Unknown",
        month: monthKey,
        date_range: {
          start: startDate || "Beginning",
          end: harvestDateStr,
        },
        coins_1: (existingData.coins_1 || 0) + totalCoins1,
        coins_5: (existingData.coins_5 || 0) + totalCoins5,
        coins_10: (existingData.coins_10 || 0) + totalCoins10,
        coins_20: (existingData.coins_20 || 0) + totalCoins20,
        sales_count: (existingData.sales_count || 0) + totalSales,
        total: (existingData.total || 0) + totalAmount,
        last_updated: Timestamp.now(),
        last_harvest_date: harvestDateStr,
        aggregates_included: (existingData.aggregates_included || 0) + totalAggregates,
        units_count: unitsSnapshot.size,
        branchSharePercentage: branchSharePercentage,
        unit_summaries: [...(existingData.unit_summaries || []), ...unitSummaries],
        unitAggregates: unitAggregates,
        ...(actualAmountProcessed !== undefined && {
          actualAmountProcessed,
          variance,
          variancePercentage,
        }),
      }

      await setDoc(branchAggregateRef, monthlyAggregate, { merge: true })
      batch.update(branchRef, { last_harvest_date: harvestDateStr })
      await batch.commit()

      console.log(`Successfully harvested ${totalAggregates} aggregates for branch ${branchId} in ${harvestMode} mode`)

      const finalBranchInfo = branchInfo || (await getBranchInfo(branchId))

      const result: HarvestResult = {
        success: true,
        branchId,
        harvestDate: harvestDateStr,
        previousHarvestDate: previousHarvestDateStr,
        harvestMode,
        preAggregatePerformed: harvestMode === "include_today",
        preAggregateStats: preAggregateStats,
        summary: {
          unitsProcessed: unitsSnapshot.size,
          aggregatesHarvested: totalAggregates,
          totalCoins1,
          totalCoins5,
          totalCoins10,
          totalCoins20,
          totalSales,
          totalAmount,
          ...shareCalculation,
          ...(actualAmountProcessed !== undefined && {
            actualAmountProcessed,
            variance,
            variancePercentage,
          }),
        },
        monthlyAggregate: {
          month: monthKey,
          coins_1: monthlyAggregate.coins_1,
          coins_5: monthlyAggregate.coins_5,
          coins_10: monthlyAggregate.coins_10,
          coins_20: monthlyAggregate.coins_20,
          sales_count: monthlyAggregate.sales_count,
          total: monthlyAggregate.total,
          aggregates_included: monthlyAggregate.aggregates_included,
          units_count: monthlyAggregate.units_count,
          last_harvest_date: monthlyAggregate.last_harvest_date,
          branchSharePercentage: monthlyAggregate.branchSharePercentage,
          unit_summaries: monthlyAggregate.unit_summaries,
          ...(actualAmountProcessed !== undefined && {
            actualAmountProcessed,
            variance,
            variancePercentage,
          }),
        },
        // ADD THIS:
        unitAggregates,
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

  return {
    previewHarvest,
    executeHarvest,
    isHarvesting,
    error,
  }
}