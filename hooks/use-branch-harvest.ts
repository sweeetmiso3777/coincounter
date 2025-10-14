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

export interface BranchInfo {
  branchName: string
  branchAddress: string
  managerName: string
  contactNumber: string
  sharePercentage: number
}

interface UseBranchHarvest {
  harvestToday: (
    branchId: string,
    branchInfo?: BranchInfo,
    generatePDF?: boolean,
    actualAmountProcessed?: number,
  ) => Promise<HarvestResult>
  harvestBackdate: (
    branchId: string,
    harvestDate: string,
    branchInfo?: BranchInfo,
    generatePDF?: boolean,
    actualAmountProcessed?: number,
  ) => Promise<HarvestResult>
  generateHarvestReport: (result: HarvestResult, branchInfo: BranchInfo, options?: { compact?: boolean }) => void
  isHarvesting: boolean
  error: string | null
}

export function useBranchHarvest(): UseBranchHarvest {
  const [isHarvesting, setIsHarvesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getManilaDateString = (date: Date = new Date()) => {
    // Use Intl.DateTimeFormat for reliable timezone conversion
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })

    // Returns YYYY-MM-DD format
    return formatter.format(date)
  }

  const addDays = (timestamp: Timestamp | Date | string | unknown, days: number): string => {
    let date: Date

    if (timestamp && typeof timestamp === "object" && "toDate" in timestamp && typeof timestamp.toDate === "function") {
      date = (timestamp as Timestamp).toDate()
    } else if (typeof timestamp === "string") {
      date = new Date(timestamp + "T00:00:00+08:00")
    } else if (timestamp instanceof Date) {
      date = new Date(timestamp)
    } else {
      date = new Date(String(timestamp))
    }

    date.setDate(date.getDate() + days)
    return getManilaDateString(date)
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

  const harvestBranch = async (
    branchId: string,
    harvestDate: Date,
    branchInfo?: BranchInfo,
    generatePDF = false,
    isBackdate = false,
    actualAmountProcessed?: number,
  ): Promise<HarvestResult> => {
    setIsHarvesting(true)
    setError(null)

    try {
      const batch = writeBatch(db)

      const harvestDateStr = getManilaDateString(harvestDate)
      const monthKey = getMonthKey(harvestDateStr)

      console.log(`Starting harvest for branch ${branchId} up to ${harvestDateStr}${isBackdate ? " (backdate)" : ""}`)

      // 1. Get branch data to find last_harvest_date AND share percentage
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
          // If it's already in YYYY-MM-DD format, use it directly
          if (/^\d{4}-\d{2}-\d{2}$/.test(lastHarvest)) {
            previousHarvestDateStr = lastHarvest
          } else {
            // Otherwise parse it with Manila timezone
            const parsedDate = new Date(lastHarvest + "T00:00:00+08:00")
            previousHarvestDateStr = getManilaDateString(parsedDate)
          }
        } else {
          console.warn("Unexpected lastHarvest type:", typeof lastHarvest, lastHarvest)
        }
      }

      let startDate: string | null = null
      if (previousHarvestDateStr) {
        const lastHarvestDate = new Date(previousHarvestDateStr + "T00:00:00+08:00")
        lastHarvestDate.setDate(lastHarvestDate.getDate() + 1)
        startDate = getManilaDateString(lastHarvestDate)

        if (startDate > harvestDateStr) {
          throw new Error(
            `No data to harvest. Last harvest was on ${previousHarvestDateStr} and you're trying to harvest up to ${harvestDateStr}`,
          )
        }
      }

      console.log(
        `Last harvest: ${previousHarvestDateStr || "never"}, starting from: ${startDate || "beginning of time"}, up to: ${harvestDateStr}`,
      )

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

      const unitSummaries: UnitSummary[] = []
      let earliestDate: string | null = null
      let latestDate: string | null = null

      // 3. For each unit, scan their aggregates collection and create summaries
      for (const unitDoc of unitsSnapshot.docs) {
        const unitId = unitDoc.id
        console.log(`Scanning aggregates for unit: ${unitId}`)

        const aggregatesQuery = query(collection(db, "Units", unitId, "aggregates"), where("harvested", "==", false))

        const aggregatesSnapshot = await getDocs(aggregatesQuery)
        console.log(`Found ${aggregatesSnapshot.size} unharvested aggregates for unit ${unitId}`)

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

          if (!aggregateDate) {
            console.warn(`Aggregate ${aggDoc.id} has no createdAt date, skipping`)
            return
          }

          const aggregateDateStr = getManilaDateString(aggregateDate)
          const isWithinRange = startDate
            ? aggregateDateStr >= startDate && aggregateDateStr <= harvestDateStr
            : aggregateDateStr <= harvestDateStr

          if (isWithinRange) {
            console.log(`Including aggregate ${aggDoc.id} from ${aggregateDateStr}`)

            // Track date range for this unit
            if (!unitEarliestDate || aggregateDateStr < unitEarliestDate) {
              unitEarliestDate = aggregateDateStr
            }
            if (!unitLatestDate || aggregateDateStr > unitLatestDate) {
              unitLatestDate = aggregateDateStr
            }

            // Track overall date range
            if (!earliestDate || aggregateDateStr < earliestDate) {
              earliestDate = aggregateDateStr
            }
            if (!latestDate || aggregateDateStr > latestDate) {
              latestDate = aggregateDateStr
            }

            // Sum unit totals
            unitAggregatesCount++
            unitCoins1 += agg.coins_1 || 0
            unitCoins5 += agg.coins_5 || 0
            unitCoins10 += agg.coins_10 || 0
            unitCoins20 += agg.coins_20 || 0
            unitSales += agg.sales_count || 0
            unitAmount += agg.total || 0

            // Mark as harvested
            batch.update(aggDoc.ref, { harvested: true })

            // Sum overall totals
            totalAggregates++
            totalCoins1 += agg.coins_1 || 0
            totalCoins5 += agg.coins_5 || 0
            totalCoins10 += agg.coins_10 || 0
            totalCoins20 += agg.coins_20 || 0
            totalSales += agg.sales_count || 0
            totalAmount += agg.total || 0
          } else {
            console.log(
              `Skipping aggregate ${aggDoc.id} from ${aggregateDateStr} (outside range ${startDate || "beginning"} to ${harvestDateStr})`,
            )
          }
        })

        // Create unit summary if this unit had aggregates to harvest
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
        throw new Error(
          `No unharvested aggregates found for date range ${startDate || "beginning"} to ${harvestDateStr}`,
        )
      }

      console.log(`Harvesting ${totalAggregates} aggregates with totals: ${totalAmount} amount, ${totalSales} sales`)

      // Calculate shares
      const shareCalculation = calculateShares(totalAmount, branchSharePercentage)

      let variance: number | undefined
      let variancePercentage: number | undefined

      if (actualAmountProcessed !== undefined && !isNaN(actualAmountProcessed)) {
        variance = actualAmountProcessed - totalAmount
        variancePercentage = totalAmount > 0 ? (variance / totalAmount) * 100 : 0
        console.log(
          `Variance calculated: Expected ${totalAmount}, Actual ${actualAmountProcessed}, Variance ${variance} (${variancePercentage.toFixed(2)}%)`,
        )
      }

      // 4. Generate date range document ID
      const documentId = getDateRangeDocumentId(startDate, harvestDateStr)
      console.log(`Creating harvest document with ID: ${documentId}`)

      // 5. Create/update monthly aggregate under Branches/{branchId}/aggregates/{date-range}
      const branchAggregateRef = doc(db, "Branches", branchId, "aggregates", documentId)
      const existingAggDoc = await getDoc(branchAggregateRef)
      const existingData = existingAggDoc.exists() ? existingAggDoc.data() : {}

      // Prepare monthly aggregate data WITH unit summaries and share percentage
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

      // Use setDoc with merge for the aggregate
      await setDoc(branchAggregateRef, monthlyAggregate, { merge: true })

      // 6. Update branch last harvest date
      batch.update(branchRef, { last_harvest_date: harvestDateStr })

      // 7. Commit the batch
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

      // Generate PDF report if requested
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

  // Harvest all unharvested aggregates up to yesterday
  const harvestToday = async (
    branchId: string,
    branchInfo?: BranchInfo,
    generatePDF = false,
    actualAmountProcessed?: number,
  ): Promise<HarvestResult> => {
    const finalBranchInfo = branchInfo || (await getBranchInfo(branchId))

    // Adjust date to yesterday for today's harvest
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    return harvestBranch(branchId, yesterday, finalBranchInfo, generatePDF, false, actualAmountProcessed)
  }

  const harvestBackdate = async (
    branchId: string,
    harvestDate: string,
    branchInfo?: BranchInfo,
    generatePDF = false,
    actualAmountProcessed?: number,
  ): Promise<HarvestResult> => {
    const inputDate = new Date(harvestDate + "T00:00:00+08:00")
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (inputDate > today) {
      throw new Error("Harvest date cannot be in the future")
    }

    const finalBranchInfo = branchInfo || (await getBranchInfo(branchId))
    return harvestBranch(branchId, inputDate, finalBranchInfo, generatePDF, true, actualAmountProcessed)
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
    harvestToday,
    harvestBackdate,
    generateHarvestReport,
    isHarvesting,
    error,
  }
}
