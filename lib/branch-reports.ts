import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { HarvestResult, BranchInfo } from "@/hooks/use-branch-harvest"

// Extend jsPDF type to include autoTable and page handling
interface CustomJsPDF extends jsPDF {
  lastAutoTable?: {
    finalY: number
  }
  pages?: number
}

export function generateBranchHarvestPDF(result: HarvestResult, branchInfo: BranchInfo): void {
  const doc = new jsPDF() as CustomJsPDF
  doc.setFont("helvetica")
  const pageWidth = doc.internal.pageSize.getWidth()
  let currentPage = 1

  // Title
  doc.setFontSize(20)
  doc.setTextColor(0, 128, 0)
  doc.text("BRANCH HARVEST SUMMARY REPORT", pageWidth / 2, 20, { align: "center" })

  // Generation date
  const now = new Date()
  const generatedDate = `${now.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })} ${now.toLocaleTimeString()}`

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated on: ${generatedDate}`, pageWidth / 2, 35, { align: "center" })

  let yPosition = 50

  // Branch Information Section
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text("BRANCH INFORMATION", 20, yPosition)

  yPosition += 8
  doc.setFontSize(10)
  doc.text(`Branch Name: ${branchInfo.branchName}`, 20, yPosition)
  yPosition += 6
  doc.text(`Manager: ${branchInfo.managerName}`, 20, yPosition)
  yPosition += 6

  // Format harvest date range
  const harvestDate = new Date(result.harvestDate)
  const formattedHarvestDate = harvestDate.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Previous harvest date
  if (result.previousHarvestDate) {
    const prevHarvestDate = new Date(result.previousHarvestDate)
    const formattedPrevHarvestDate = prevHarvestDate.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // Calculate the start date (day after previous harvest)
    const startDate = new Date(prevHarvestDate)
    startDate.setDate(startDate.getDate() + 1)
    const formattedStartDate = startDate.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    doc.text(`Date Range: ${formattedStartDate} to ${formattedHarvestDate}`, 20, yPosition)
    yPosition += 6
    doc.text(`Previous Harvest: ${formattedPrevHarvestDate}`, 20, yPosition)
  } else {
    doc.text(`Date Range: Beginning to ${formattedHarvestDate}`, 20, yPosition)
    yPosition += 6
    doc.text(`Previous Harvest: First Harvest`, 20, yPosition)
  }
  yPosition += 12

  // Financial Summary Section
  doc.setFontSize(14)
  doc.text("FINANCIAL SUMMARY", 20, yPosition)

  yPosition += 8
  doc.setFontSize(16)
  doc.setTextColor(0, 128, 0)
  doc.text(
    `Expected Revenue: P ${result.summary.totalAmount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    20,
    yPosition,
  )

  yPosition += 12

  if (result.summary.actualAmountProcessed !== undefined) {
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text("VARIANCE ANALYSIS", 20, yPosition)

    yPosition += 8
    doc.setFontSize(10)

    const variance = result.summary.variance || 0
    const variancePercentage = result.summary.variancePercentage || 0
    const isPositive = variance >= 0

    const varianceData = [
      {
        label: "Expected Amount:",
        value: `P ${result.summary.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
      {
        label: "Actual Amount Processed:",
        value: `P ${result.summary.actualAmountProcessed.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
      {
        label: "Variance:",
        value: `${isPositive ? "+" : ""}P ${variance.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${isPositive ? "+" : ""}${variancePercentage.toFixed(2)}%)`,
      },
    ]

    varianceData.forEach((item, index) => {
      doc.setTextColor(100, 100, 100)
      doc.text(item.label, 20, yPosition + index * 6)

      // Color code the variance
      if (index === 2) {
        doc.setTextColor(isPositive ? 0 : 255, isPositive ? 128 : 0, 0)
      } else {
        doc.setTextColor(0, 0, 0)
      }
      doc.text(item.value, 80, yPosition + index * 6)
    })

    yPosition += 25
  }

  // NEW: Your Expected Share Section
  if (result.summary.branchSharePercentage && result.summary.branchSharePercentage > 0) {
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text("YOUR EXPECTED SHARE", 20, yPosition)

    yPosition += 8
    doc.setFontSize(10)

    const shareData = [
      { label: "Your Share Percentage:", value: `${result.summary.branchSharePercentage}%` },
      {
        label: "Your Share Amount:",
        value: `P ${result.summary.branchShareAmount?.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
      {
        label: "Company Share Amount:",
        value: `P ${result.summary.companyShareAmount?.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
    ]

    shareData.forEach((item, index) => {
      doc.setTextColor(100, 100, 100)
      doc.text(item.label, 20, yPosition + index * 6)
      doc.setTextColor(0, 0, 0)
      doc.text(item.value, 80, yPosition + index * 6)
    })

    yPosition += 25
  }

  // Key Metrics
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text("KEY METRICS", 20, yPosition)

  yPosition += 8
  doc.setFontSize(10)

  const metricsData = [
    { label: "Total Transactions:", value: result.summary.totalSales.toLocaleString() },
    { label: "Units Processed:", value: result.summary.unitsProcessed.toLocaleString() },
    { label: "Daily Summaries Harvested:", value: result.summary.aggregatesHarvested.toLocaleString() },
  ]

  metricsData.forEach((metric, index) => {
    doc.setTextColor(100, 100, 100)
    doc.text(metric.label, 20, yPosition + index * 6)
    doc.setTextColor(0, 0, 0)
    doc.text(metric.value, 80, yPosition + index * 6)
  })

  // Footer for Page 1
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text(`Report generated by Coin Harvest System - Page ${currentPage}`, pageWidth / 2, pageHeight - 10, {
    align: "center",
  })

  // PAGE 2: Detailed Breakdowns
  doc.addPage()
  currentPage++
  yPosition = 30

  // Coin Breakdown Section - MOVED TO PAGE 2
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text("COIN BREAKDOWN", 20, yPosition)

  yPosition += 8

  // Create coin breakdown table with calculations
  const coinHeaders = ["Denomination", "Coins Count", "Calculation", "Amount"]
  const coinData = [
    [
      "P1 Coins",
      result.summary.totalCoins1.toLocaleString(),
      `${result.summary.totalCoins1} × P1`,
      `P${(result.summary.totalCoins1 * 1).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ],
    [
      "P5 Coins",
      result.summary.totalCoins5.toLocaleString(),
      `${result.summary.totalCoins5} × P5`,
      `P${(result.summary.totalCoins5 * 5).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ],
    [
      "P10 Coins",
      result.summary.totalCoins10.toLocaleString(),
      `${result.summary.totalCoins10} × P10`,
      `P${(result.summary.totalCoins10 * 10).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ],
    [
      "P20 Coins",
      result.summary.totalCoins20.toLocaleString(),
      `${result.summary.totalCoins20} × P20`,
      `P${(result.summary.totalCoins20 * 20).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ],
  ]

  autoTable(doc, {
    startY: yPosition,
    head: [coinHeaders],
    body: coinData,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [0, 128, 0], textColor: 255, fontStyle: "bold" },
    margin: { left: 20, right: 20 },
  })

  yPosition = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 15 : yPosition + 100

  // Performance Summary - MOVED TO PAGE 2
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text("PERFORMANCE SUMMARY", 20, yPosition)

  yPosition += 8
  doc.setFontSize(10)

  const avgPerUnit = result.summary.totalAmount / result.summary.unitsProcessed

  const nextHarvestDate = new Date(getNextHarvestDate(result.harvestDate))
  const formattedNextHarvestDate = nextHarvestDate.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const performanceData = [
    {
      label: "Average per Unit:",
      value: `P${avgPerUnit.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    { label: "Next Expected Harvest:", value: formattedNextHarvestDate },
  ]

  performanceData.forEach((item, index) => {
    doc.setTextColor(100, 100, 100)
    doc.text(item.label, 20, yPosition + index * 6)
    doc.setTextColor(0, 0, 0)
    doc.text(item.value, 70, yPosition + index * 6)
  })

  yPosition += 20

  // UPDATED: Unit Summary Table - Using unit_summaries instead of harvested_documents
  if (result.monthlyAggregate?.unit_summaries && result.monthlyAggregate.unit_summaries.length > 0) {
    // Check if we need a new page for the units table
    if (yPosition > 180) {
      doc.addPage()
      currentPage++
      yPosition = 30
    }

    doc.setFontSize(14)
    doc.text("UNIT SUMMARY", 20, yPosition)
    yPosition += 8

    // Prepare table data from unit_summaries - one row per unit
    const tableData = result.monthlyAggregate.unit_summaries.map((unitSummary) => {
      return [
        unitSummary.unitId,
        unitSummary.aggregates_count.toLocaleString(),
        unitSummary.total_sales.toLocaleString(),
        `P${unitSummary.total_amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        unitSummary.coins_1.toLocaleString(),
        unitSummary.coins_5.toLocaleString(),
        unitSummary.coins_10.toLocaleString(),
        unitSummary.coins_20.toLocaleString(),
      ]
    })

    const tableHeaders = [
      "Unit",
      "Summaries",
      "Sales Count",
      "Total Amount",
      "P1 Coins",
      "P5 Coins",
      "P10 Coins",
      "P20 Coins",
    ]

    autoTable(doc, {
      startY: yPosition,
      head: [tableHeaders],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [70, 130, 180], textColor: 255, fontStyle: "bold" },
      bodyStyles: { textColor: 0 },
      margin: { left: 15, right: 15 },
      pageBreak: "auto",
    })

    // Update current page count after autoTable
    const totalPages = doc.internal.pages ? doc.internal.pages.length - 1 : currentPage
    currentPage = totalPages
  }

  // Footer for Page 2+
  const finalPageHeight = doc.internal.pageSize.getHeight()
  const finalTotalPages = doc.internal.pages ? doc.internal.pages.length - 1 : currentPage

  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text(
    `Report generated by Coin Harvest System - Page ${currentPage} of ${finalTotalPages}`,
    pageWidth / 2,
    finalPageHeight - 10,
    { align: "center" },
  )

  // Save the PDF
  const fileName = `branch-harvest-${branchInfo.branchName.replace(/\s+/g, "-").toLowerCase()}-${result.harvestDate}.pdf`
  doc.save(fileName)
}

// Alternative compact version - UPDATED with variance
export function generateCompactBranchHarvestPDF(result: HarvestResult, branchInfo: BranchInfo): void {
  const doc = new jsPDF() as CustomJsPDF
  doc.setFont("helvetica")
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header with green background
  doc.setFillColor(0, 128, 0)
  doc.rect(0, 0, pageWidth, 30, "F")

  // Title
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text("BRANCH HARVEST SUMMARY", pageWidth / 2, 18, { align: "center" })

  let yPosition = 45

  // Key information
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)

  const harvestDate = new Date(result.harvestDate)
  const formattedHarvestDate = harvestDate.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  let dateRangeText = ""
  if (result.previousHarvestDate) {
    const prevHarvestDate = new Date(result.previousHarvestDate)
    const startDate = new Date(prevHarvestDate)
    startDate.setDate(startDate.getDate() + 1)
    const formattedStartDate = startDate.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    dateRangeText = `${formattedStartDate} to ${formattedHarvestDate}`
  } else {
    dateRangeText = `Beginning to ${formattedHarvestDate}`
  }

  const infoData = [
    { label: "Branch:", value: branchInfo.branchName },
    { label: "Manager:", value: branchInfo.managerName },
    { label: "Date Range:", value: dateRangeText },
    { label: "Branch ID:", value: result.branchId },
    { label: "Units Processed:", value: result.summary.unitsProcessed.toString() },
  ]

  infoData.forEach((item, index) => {
    doc.setTextColor(100, 100, 100)
    doc.text(item.label, 20, yPosition + index * 5)
    doc.setTextColor(0, 0, 0)
    doc.text(item.value, 60, yPosition + index * 5)
  })

  yPosition += 30

  // Total amount highlighted
  doc.setFontSize(16)
  doc.setTextColor(0, 128, 0)
  doc.text(
    `EXPECTED REVENUE: P ${result.summary.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    pageWidth / 2,
    yPosition,
    { align: "center" },
  )

  yPosition += 15

  if (result.summary.actualAmountProcessed !== undefined) {
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text("VARIANCE ANALYSIS", 20, yPosition)

    yPosition += 8
    doc.setFontSize(10)

    const variance = result.summary.variance || 0
    const variancePercentage = result.summary.variancePercentage || 0
    const isPositive = variance >= 0

    const varianceData = [
      {
        label: "Actual Amount:",
        value: `P ${result.summary.actualAmountProcessed.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
      {
        label: "Variance:",
        value: `${isPositive ? "+" : ""}P ${variance.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${isPositive ? "+" : ""}${variancePercentage.toFixed(2)}%)`,
      },
    ]

    varianceData.forEach((item, index) => {
      doc.setTextColor(100, 100, 100)
      doc.text(item.label, 20, yPosition + index * 6)

      // Color code the variance
      if (index === 1) {
        doc.setTextColor(isPositive ? 0 : 255, isPositive ? 128 : 0, 0)
      } else {
        doc.setTextColor(0, 0, 0)
      }
      doc.text(item.value, 60, yPosition + index * 6)
    })

    yPosition += 20
  }

  // NEW: Your Expected Share in compact version
  if (result.summary.branchSharePercentage && result.summary.branchSharePercentage > 0) {
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text("YOUR SHARE", 20, yPosition)

    yPosition += 8
    doc.setFontSize(10)

    const shareData = [
      {
        label: "Your Share:",
        value: `P ${result.summary.branchShareAmount?.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${result.summary.branchSharePercentage}%)`,
      },
    ]

    shareData.forEach((item, index) => {
      doc.setTextColor(100, 100, 100)
      doc.text(item.label, 20, yPosition + index * 6)
      doc.setTextColor(0, 0, 0)
      doc.text(item.value, 60, yPosition + index * 6)
    })

    yPosition += 20
  }

  // Coin breakdown
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text("COIN BREAKDOWN", 20, yPosition)

  yPosition += 8

  // Create compact coin table with calculations
  const coinHeaders = ["Coin", "Count", "Calculation", "Amount"]
  const coinData = [
    [
      "P1",
      result.summary.totalCoins1.toLocaleString(),
      `${result.summary.totalCoins1} × P1`,
      `P${(result.summary.totalCoins1 * 1).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ],
    [
      "P5",
      result.summary.totalCoins5.toLocaleString(),
      `${result.summary.totalCoins5} × P5`,
      `P${(result.summary.totalCoins5 * 5).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ],
    [
      "P10",
      result.summary.totalCoins10.toLocaleString(),
      `${result.summary.totalCoins10} × P10`,
      `P${(result.summary.totalCoins10 * 10).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ],
    [
      "P20",
      result.summary.totalCoins20.toLocaleString(),
      `${result.summary.totalCoins20} × P20`,
      `P${(result.summary.totalCoins20 * 20).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ],
  ]

  autoTable(doc, {
    startY: yPosition,
    head: [coinHeaders],
    body: coinData,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [0, 128, 0], textColor: 255, fontStyle: "bold" },
    margin: { left: 20, right: 20 },
    tableWidth: 150,
  })

  yPosition = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 12 : yPosition + 80

  // Summary metrics
  const summaryData = [
    { label: "Total Transactions:", value: result.summary.totalSales.toLocaleString() },
    { label: "Daily Summaries Harvested:", value: result.summary.aggregatesHarvested.toLocaleString() },
  ]

  summaryData.forEach((item, index) => {
    doc.setTextColor(100, 100, 100)
    doc.text(item.label, 20, yPosition + index * 6)
    doc.setTextColor(0, 0, 0)
    doc.text(item.value, 80, yPosition + index * 6)
  })

  // UPDATED: Unit Summary using unit_summaries
  if (result.monthlyAggregate?.unit_summaries && result.monthlyAggregate.unit_summaries.length > 0) {
    yPosition += 15
    doc.setFontSize(12)
    doc.text("UNIT SUMMARY", 20, yPosition)
    yPosition += 8

    // Prepare compact table data from unit_summaries
    const tableData = result.monthlyAggregate.unit_summaries.map((unitSummary) => {
      return [
        unitSummary.unitId,
        unitSummary.aggregates_count.toString(),
        `P${unitSummary.total_amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        unitSummary.coins_1.toLocaleString(),
        unitSummary.coins_5.toLocaleString(),
        unitSummary.coins_10.toLocaleString(),
        unitSummary.coins_20.toLocaleString(),
      ]
    })

    const tableHeaders = ["Unit", "Summaries", "Amount", "P1", "P5", "P10", "P20"]

    autoTable(doc, {
      startY: yPosition,
      head: [tableHeaders],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [70, 130, 180], textColor: 255, fontStyle: "bold" },
      margin: { left: 15, right: 15 },
      tableWidth: 180,
    })
  }

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)

  const footerDate = new Date().toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  doc.text(`Generated on ${footerDate}`, pageWidth / 2, pageHeight - 10, { align: "center" })

  // Save
  const fileName = `branch-harvest-${branchInfo.branchName.replace(/\s+/g, "-")}-${result.harvestDate}.pdf`
  doc.save(fileName)
}

function getNextHarvestDate(currentHarvestDate: string): string {
  const date = new Date(currentHarvestDate)
  date.setDate(date.getDate() + 1)
  return date.toISOString().split("T")[0]
}

// Helper function to convert month to long name
function formatMonthToLongName(monthInput: string): string {
  const longMonths = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  if (longMonths.some((month) => monthInput.toLowerCase().includes(month.toLowerCase()))) {
    return monthInput
  }

  const date = new Date(monthInput)
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString("en-PH", { month: "long", year: "numeric" })
  }

  const monthNumber = Number.parseInt(monthInput)
  if (monthNumber >= 1 && monthNumber <= 12) {
    const currentYear = new Date().getFullYear()
    return new Date(currentYear, monthNumber - 1).toLocaleDateString("en-PH", { month: "long", year: "numeric" })
  }

  return monthInput
}
