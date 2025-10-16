"use client"

import { useState } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, writeBatch, doc, getDoc, Timestamp, setDoc } from "firebase/firestore"
import { generateBranchHarvestPDF, generateCompactBranchHarvestPDF } from "@/lib/branch-reports"

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
}

export interface HarvestPreview {
  previewId: string
  branchId: string
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
  }>
}

export interface BranchInfo {
  branchName: string
  branchAddress: string
  managerName: string
  contactNumber: string
  sharePercentage: number
}

interface UseBranchHarvest {
  previewHarvest: (branchId: string, branchInfo?: BranchInfo) => Promise<HarvestPreview>
  executeHarvest: (
    branchId: string,
    previewId: string,
    branchInfo?: BranchInfo,
    generatePDF?: boolean,
    actualAmountProcessed?: number,
    customHarvestDate?: string,
  ) => Promise<HarvestResult>
  generateHarvestReport: (result: HarvestResult, branchInfo: BranchInfo, options?: { compact?: boolean }) => void
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
      month: "short",
      day: "2-digit",
    })
    return formatter.format(date)
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

  // Preview harvest without making any changes
  const previewHarvest = async (branchId: string, branchInfo?: BranchInfo): Promise<HarvestPreview> => {
    setIsHarvesting(true)
    setError(null)

    try {
      // Calculate harvest date (yesterday)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const harvestDateStr = getManilaDateString(yesterday)

      console.log(`Previewing harvest for branch ${branchId} up to ${harvestDateStr}`)

      // Get branch data
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
      if (previousHarvestDateStr) {
        const lastHarvestDate = new Date(previousHarvestDateStr + "T00:00:00+08:00")
        lastHarvestDate.setDate(lastHarvestDate.getDate() + 1)
        startDate = getManilaDateString(lastHarvestDate)

        if (startDate > harvestDateStr) {
          throw new Error(
            `No unit summaries to harvest.`
          )
        }
      }

      // Find all units for this branch
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

      // Scan aggregates for preview
      for (const unitDoc of unitsSnapshot.docs) {
        const unitId = unitDoc.id
        const aggregatesQuery = query(collection(db, "Units", unitId, "aggregates"), where("harvested", "==", false))
        const aggregatesSnapshot = await getDocs(aggregatesQuery)

        aggregatesSnapshot.forEach((aggDoc) => {
          const agg = aggDoc.data()
          const aggregateDate = agg.createdAt?.toDate?.()

          if (!aggregateDate) return

          const aggregateDateStr = getManilaDateString(aggregateDate)
          const isWithinRange = startDate
            ? aggregateDateStr >= startDate && aggregateDateStr <= harvestDateStr
            : aggregateDateStr <= harvestDateStr

          if (isWithinRange) {
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
            })
          }
        })
      }

      if (totalAggregates === 0) {
        throw new Error(
          `No unharvested summaries found for date range ${startDate || "beginning"} to ${harvestDateStr}`
        )
      }

      const preview: HarvestPreview = {
        previewId: `preview_${branchId}_${Date.now()}`,
        branchId,
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

  // Execute the actual harvest
  const executeHarvest = async (
    branchId: string,
    previewId: string,
    branchInfo?: BranchInfo,
    generatePDF = false,
    actualAmountProcessed?: number,
    customHarvestDate?: string,
  ): Promise<HarvestResult> => {
    setIsHarvesting(true)
    setError(null)

    try {
      const batch = writeBatch(db)

      // Determine harvest date
      let harvestDate: Date
      if (customHarvestDate) {
        harvestDate = new Date(customHarvestDate + "T00:00:00+08:00")
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (harvestDate > today) {
          throw new Error("Harvest date cannot be in the future")
        }
      } else {
        harvestDate = new Date()
        harvestDate.setDate(harvestDate.getDate() - 1)
      }

      const harvestDateStr = getManilaDateString(harvestDate)
      const monthKey = getMonthKey(harvestDateStr)

      console.log(`Executing harvest for branch ${branchId} up to ${harvestDateStr}`)

      // Get branch data
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
      if (previousHarvestDateStr) {
        const lastHarvestDate = new Date(previousHarvestDateStr + "T00:00:00+08:00")
        lastHarvestDate.setDate(lastHarvestDate.getDate() + 1)
        startDate = getManilaDateString(lastHarvestDate)

        if (startDate > harvestDateStr) {
          throw new Error(
            `No data to harvest. Last harvest was on ${previousHarvestDateStr}`
          )
        }
      }

      // Find all units
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

      // Process each unit
      for (const unitDoc of unitsSnapshot.docs) {
        const unitId = unitDoc.id
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
          const isWithinRange = startDate
            ? aggregateDateStr >= startDate && aggregateDateStr <= harvestDateStr
            : aggregateDateStr <= harvestDateStr

          if (isWithinRange) {
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

            batch.update(aggDoc.ref, { harvested: true })

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

      // Calculate shares and variance
      const shareCalculation = calculateShares(totalAmount, branchSharePercentage)

      let variance: number | undefined
      let variancePercentage: number | undefined

      if (actualAmountProcessed !== undefined && !isNaN(actualAmountProcessed)) {
        variance = actualAmountProcessed - totalAmount
        variancePercentage = totalAmount > 0 ? (variance / totalAmount) * 100 : 0
      }

      // Create/update monthly aggregate
      const documentId = getDateRangeDocumentId(startDate, harvestDateStr)
      const branchAggregateRef = doc(db, "Branches", branchId, "aggregates", documentId)
      const existingAggDoc = await getDoc(branchAggregateRef)
      const existingData = existingAggDoc.exists() ? existingAggDoc.data() : {}

      const monthlyAggregate = {
        branchId,
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
        ...(actualAmountProcessed !== undefined && {
          actualAmountProcessed,
          variance,
          variancePercentage,
        }),
      }

      await setDoc(branchAggregateRef, monthlyAggregate, { merge: true })

      // Update branch last harvest date
      batch.update(branchRef, { last_harvest_date: harvestDateStr })

      // Commit the batch
      await batch.commit()

      console.log(`Successfully harvested ${totalAggregates} aggregates for branch ${branchId}`)

      const finalBranchInfo = branchInfo || (await getBranchInfo(branchId))

      const result: HarvestResult = {
        success: true,
        branchId,
        harvestDate: harvestDateStr,
        previousHarvestDate: previousHarvestDateStr,
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
      }

      // Generate PDF if requested
      if (generatePDF && finalBranchInfo) {
        try {
          generateBranchHarvestPDF(result, finalBranchInfo)
          console.log("PDF report generated successfully")
        } catch (pdfError) {
          console.warn("Failed to generate PDF report:", pdfError)
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

  const generateHarvestReport = (
    result: HarvestResult,
    branchInfo: BranchInfo,
    options?: { compact?: boolean },
  ): void => {
    try {
      if (options?.compact) {
        generateCompactBranchHarvestPDF(result, branchInfo)
      } else {
        generateBranchHarvestPDF(result, branchInfo)
      }
    } catch (error) {
      console.error("Failed to generate harvest report:", error)
      throw new Error("PDF generation failed")
    }
  }

  return {
    previewHarvest,
    executeHarvest,
    generateHarvestReport,
    isHarvesting,
    error,
  }
}