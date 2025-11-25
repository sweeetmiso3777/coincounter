import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { HarvestResult, BranchInfo } from "@/hooks/use-branch-harvest"

// Extend jsPDF type to include autoTable and page handling
interface CustomJsPDF extends jsPDF {
  lastAutoTable?: {
    finalY: number
  }
  pages?: number
  getNumberOfPages(): number
}

export function generateBranchHarvestPDF(result: HarvestResult, branchInfo: BranchInfo, isDetailed: boolean = true): void {
  const doc = new jsPDF() as CustomJsPDF
  doc.setFont("helvetica")
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20

  // Add footer function that will be called on every page
  const addFooter = () => {
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setFont(undefined, "normal")
      doc.setTextColor(100, 100, 100)
      doc.text(
        `Computer Generated Report - Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      )
    }
  }

  // Header
  const now = new Date()
  const generatedDate = `${now.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })} ${now.toLocaleTimeString()}`

  doc.setFontSize(16)
  doc.setFont(undefined, "bold")
  doc.setTextColor(0, 0, 0)
  doc.text("BRANCH HARVEST SUMMARY REPORT", pageWidth / 2, margin, { align: "center" })

  doc.setFontSize(10)
  doc.setFont(undefined, "normal")
  doc.setTextColor(100, 100, 100)
  doc.text(`Computer Generated on: ${generatedDate}`, pageWidth / 2, margin + 8, { align: "center" })

  // Top section layout
  const topStartY = margin + 18

  // Branch Information
  doc.setFontSize(12)
  doc.setFont(undefined, "bold")
  doc.setTextColor(0, 0, 0)
  doc.text("Branch Information", margin, topStartY + 6)

  const harvestDate = new Date(result.harvestDate)
  const formattedHarvestDate = harvestDate.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  let dateRangeText = `Beginning to ${formattedHarvestDate}`
  if (result.previousHarvestDate) {
    const prev = new Date(result.previousHarvestDate)
    const start = new Date(prev)
    start.setDate(start.getDate() + 1)
    const formattedStart = start.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    dateRangeText = `${formattedStart} to ${formattedHarvestDate}`
  }

  const branchLines: [string, string][] = [
    ["Branch Location:", branchInfo.branchName ?? ""],
    ["Manager:", branchInfo.managerName ?? ""],
    ["Branch ID:", String(result.branchId ?? "")],
    ["Date Range:", dateRangeText],
  ]

  doc.setFontSize(10)
  doc.setFont(undefined, "normal")
  const labelX = margin
  const valueX = margin + 50
  branchLines.forEach((row, i) => {
    doc.setTextColor(100, 100, 100)
    doc.text(row[0], labelX, topStartY + 18 + i * 6)
    doc.setTextColor(0, 0, 0)
    doc.text(String(row[1]), valueX, topStartY + 18 + i * 6)
  })

  // REVENUE SECTION - Updated layout
  const revenueStartY = topStartY + 18 + (branchLines.length * 6) + 10

  // Expected Revenue
  const expectedRevenue = result.summary.totalAmount ?? 0
  doc.setFontSize(12)
  doc.setFont(undefined, "bold")
  doc.setTextColor(0, 0, 0)
  doc.text("Expected Revenue:", margin, revenueStartY)

  doc.setFontSize(14)
  doc.text(
    `P ${expectedRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    margin + 50,
    revenueStartY,
  )

  // Actual Amount Processed (if available)
  let currentY = revenueStartY + 8
  if (result.summary.actualAmountProcessed !== undefined) {
    const actualAmount = result.summary.actualAmountProcessed ?? 0
    
    doc.setFontSize(11)
    doc.setFont(undefined, "bold")
    doc.text("Actual Amount Processed:", margin, currentY)
    
    doc.setFontSize(12)
    doc.text(
      `P ${actualAmount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      margin + 60,
      currentY,
    )

    // Variance
    currentY += 5
    const variance = result.summary.variance ?? 0
    const variancePercentage = result.summary.variancePercentage ?? 0
    const isPositive = variance >= 0
    const varianceSign = isPositive ? "+" : ""

    doc.setFontSize(9)
    doc.setFont(undefined, "bold")
    doc.text("Variance:", margin, currentY)
    doc.setFont(undefined, "normal")
    doc.text(
      `${varianceSign}P ${Math.abs(variance).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${varianceSign}${Math.abs(variancePercentage).toFixed(2)}%)`,
      margin + 22,
      currentY,
    )

    
    // Reset text color
    doc.setTextColor(0, 0, 0)
  }

  // Your Expected Share
  currentY += 12
  doc.setFontSize(12)
  doc.setFont(undefined, "bold")
  doc.setTextColor(0, 0, 0)
  doc.text("Your Expected Share", margin, currentY)

  doc.setFontSize(10)
  doc.setFont(undefined, "normal")
  const shareAmount = result.summary.branchShareAmount ?? 0
  const sharePercentage = result.summary.branchSharePercentage ?? 0
  doc.text(
    `P ${shareAmount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${sharePercentage}%)`,
    margin,
    currentY + 8,
  )

  // Key Metrics (moved to right side)
  const metricsStartY = revenueStartY
  const rightHalfX = margin + 100

  doc.setFontSize(12)
  doc.setFont(undefined, "bold")
  doc.text("Key Metrics", rightHalfX, metricsStartY)

  doc.setFontSize(10)
  doc.setFont(undefined, "normal")
  const metrics = [
    ["Total Transactions:", (result.summary.totalSales ?? 0).toLocaleString()],
    ["Units Processed:", (result.summary.unitsProcessed ?? 0).toLocaleString()],
    ["Daily Summaries:", (result.summary.aggregatesHarvested ?? 0).toLocaleString()],
  ]
  metrics.forEach((m, i) => {
    doc.setTextColor(100, 100, 100)
    doc.text(m[0], rightHalfX, metricsStartY + 8 + i * 6)
    doc.setTextColor(0, 0, 0)
    doc.text(String(m[1]), rightHalfX + 70, metricsStartY + 8 + i * 6)
  })

  // Tables area - adjusted starting position
  const tableStartY = currentY + 20

  // Compact header info for coin breakdown
  doc.setFontSize(10)
  doc.setFont(undefined, "normal")
  doc.setTextColor(0, 0, 0)
  doc.text(dateRangeText, margin, tableStartY)

  const summaryLine = `${result.harvestDate?.slice(0, 7) ?? ""} • ${result.summary.aggregatesHarvested ?? 0} agg • ${result.summary.totalSales ?? 0} sales • ${result.summary.unitsProcessed ?? 0} units`
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(summaryLine, margin, tableStartY + 6)

  // Total amount line (bold)
  doc.setFont(undefined, "bold")
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text(
    `P ${expectedRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    margin,
    tableStartY + 18,
  )
  doc.setFont(undefined, "normal")

  // Coin Breakdown Table
  const coinTableStartY = tableStartY + 26
  const coinHeaders = ["Coin Type", "Quantity", "Total Value", "Percentage"]

  const coins = [
    { label: "P1 Coins", count: result.summary.totalCoins1 ?? 0, value: (result.summary.totalCoins1 ?? 0) * 1 },
    { label: "P5 Coins", count: result.summary.totalCoins5 ?? 0, value: (result.summary.totalCoins5 ?? 0) * 5 },
    { label: "P10 Coins", count: result.summary.totalCoins10 ?? 0, value: (result.summary.totalCoins10 ?? 0) * 10 },
    { label: "P20 Coins", count: result.summary.totalCoins20 ?? 0, value: (result.summary.totalCoins20 ?? 0) * 20 },
  ]
  const totalValue = coins.reduce((s, c) => s + c.value, 0)

  const coinBody = coins.map((c) => {
    const pct = totalValue > 0 ? `${((c.value / totalValue) * 100).toFixed(1)}%` : "0.0%"
    return [
      c.label,
      c.count.toLocaleString(),
      `P ${c.value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      pct,
    ]
  })
  // Grand total row
  coinBody.push([
    "Grand Total",
    "",
    `P ${totalValue.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    "100%",
  ])

  autoTable(doc, {
    startY: coinTableStartY,
    head: [coinHeaders],
    body: coinBody,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: "bold", lineWidth: 0.01 },
    margin: { left: margin, right: margin },
  })

  const afterCoinY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : coinTableStartY + 80

  // Unit Summary Table
  if (result.monthlyAggregate?.unit_summaries && result.monthlyAggregate.unit_summaries.length > 0) {
    const unitSummaries = result.monthlyAggregate.unit_summaries
    // Prepare rows and totals
    const totals = {
      aggregates_count: 0,
      total_sales: 0,
      total_amount: 0,
      coins_1: 0,
      coins_5: 0,
      coins_10: 0,
      coins_20: 0,
    }

    const unitBody = unitSummaries.map((u) => {
      totals.aggregates_count += u.aggregates_count ?? 0
      totals.total_sales += u.total_sales ?? 0
      totals.total_amount += u.total_amount ?? 0
      totals.coins_1 += u.coins_1 ?? 0
      totals.coins_5 += u.coins_5 ?? 0
      totals.coins_10 += u.coins_10 ?? 0
      totals.coins_20 += u.coins_20 ?? 0

      return [
        u.unitId,
        (u.aggregates_count ?? 0).toLocaleString(),
        (u.total_sales ?? 0).toLocaleString(),
        `P ${(u.total_amount ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `P1 × ${u.coins_1 ?? 0}`,
        `P5 × ${u.coins_5 ?? 0}`,
        `P10 × ${u.coins_10 ?? 0}`,
        `P20 × ${u.coins_20 ?? 0}`,
      ]
    })

    // Final totals row
    unitBody.push([
      "Total",
      totals.aggregates_count.toLocaleString(),
      totals.total_sales.toLocaleString(),
      `P ${totals.total_amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `P1 × ${totals.coins_1}`,
      `P5 × ${totals.coins_5}`,
      `P10 × ${totals.coins_10}`,
      `P20 × ${totals.coins_20}`,
    ])

    const unitHeaders = ["Unit ID", "Summaries", "Sales", "Amount", "P1", "P5", "P10", "P20"]

    autoTable(doc, {
      startY: afterCoinY,
      head: [unitHeaders],
      body: unitBody,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: "bold", lineWidth: 0.01 },
      margin: { left: margin, right: margin },
      pageBreak: "auto",
    })

    // DETAILED MODE: Add individual unit aggregate tables
    if (isDetailed && result.unitAggregates) {
      doc.addPage();

      const afterUnitSummaryY = margin;
      
      // Add section header for detailed unit aggregates
      doc.setFontSize(12)
      doc.setFont(undefined, "bold")
      doc.setTextColor(0, 0, 0)
      doc.text("DETAILED DAILY AGGREGATES BY UNIT", margin, afterUnitSummaryY)
      
      let currentTableY = afterUnitSummaryY + 10;

      // Process each unit to create individual tables
      for (const [unitId, aggregates] of Object.entries(result.unitAggregates)) {
        if (aggregates.length === 0) continue;

        // Check if we need a new page
        if (currentTableY > pageHeight - 100) {
          doc.addPage();
          currentTableY = margin;
        }

        // Unit header
        doc.setFontSize(11)
        doc.setFont(undefined, "bold")
        doc.setTextColor(0, 0, 0)
        doc.text(`Unit: ${unitId}`, margin, currentTableY)
        
        doc.setFontSize(9)
        doc.setFont(undefined, "normal")
        doc.setTextColor(100, 100, 100)
        
        // Find date range for this unit
        const dates = aggregates.map(a => a.date).sort();
        const dateRange = `${dates[0]} to ${dates[dates.length - 1]}`;
        doc.text(`Date Range: ${dateRange} | ${aggregates.length} summaries`, margin, currentTableY + 5)

        // Create table for this unit's daily aggregates
        const unitTableHeaders = ["Date", "1 Coins", "5 Coins", "10 Coins", "20 Coins", "Transactions", "Amount Earned", "Status"];
        
        const unitTableBody = aggregates
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by date descending
  .map(agg => [
    new Date(agg.date).toLocaleDateString("en-PH", { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }),
    `${agg.coins_1.toLocaleString()}×1`,  // Added ×1
    `${agg.coins_5.toLocaleString()}×5`,  // Added ×5
    `${agg.coins_10.toLocaleString()}×10`, // Added ×10
    `${agg.coins_20.toLocaleString()}×20`, // Added ×20
    agg.sales_count.toLocaleString(),
    `P${agg.total.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    agg.isPartial ? "Partial" : "Harvested"
  ]);

// Add totals row
const totals = aggregates.reduce((acc, agg) => ({
  coins1: acc.coins1 + agg.coins_1,
  coins_5: acc.coins_5 + agg.coins_5,    // Fixed property name
  coins_10: acc.coins_10 + agg.coins_10, // Fixed property name
  coins_20: acc.coins_20 + agg.coins_20, // Fixed property name
  sales: acc.sales + agg.sales_count,
  amount: acc.amount + agg.total
}), { coins1: 0, coins_5: 0, coins_10: 0, coins_20: 0, sales: 0, amount: 0 });

unitTableBody.push([
  "TOTAL",
  `${totals.coins1.toLocaleString()}×1`,      // Added ×1
  `${totals.coins_5.toLocaleString()}×5`,     // Added ×5 and fixed property
  `${totals.coins_10.toLocaleString()}×10`,   // Added ×10 and fixed property
  `${totals.coins_20.toLocaleString()}×20`,   // Added ×20 and fixed property
  totals.sales.toLocaleString(),
  `P${totals.amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  ""
]);

autoTable(doc, {
  startY: currentTableY + 10,
  head: [unitTableHeaders],
  body: unitTableBody,
  theme: "grid",
  styles: { 
    fontSize: 7, 
    cellPadding: 2,
    overflow: 'linebreak'
  },
  headStyles: { 
    fillColor: [240, 240, 240], 
    textColor: 0, 
    fontStyle: "bold", 
    lineWidth: 0.01,
    fontSize: 7
  },
  margin: { left: margin, right: margin },
  pageBreak: 'auto',
  didDrawPage: (data) => {
    // Update current Y position after drawing table - safely handle null cursor
    if (data.cursor) {
      currentTableY = data.cursor.y;
    }
  }
});

        // Update Y position for next unit
        currentTableY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 15 : currentTableY + 50;
        
        // Add some spacing between unit tables
        if (currentTableY < pageHeight - 40) {
          // Draw a separator line
          doc.setDrawColor(200, 200, 200);
          doc.line(margin, currentTableY - 8, pageWidth - margin, currentTableY - 8);
          currentTableY += 5;
        }
      }
    }
  }

  // Add footer to all pages
  addFooter();

  const fileName = `branch-harvest-${branchInfo.branchName.replace(/\s+/g, "-")}-${result.harvestDate}.pdf`;
  const pdfBlob = doc.output("blob");
  const blobUrl = URL.createObjectURL(pdfBlob);
  window.open(blobUrl, "_blank");
}

// Compact version with fixed page numbering
export function generateCompactBranchHarvestPDF(result: HarvestResult, branchInfo: BranchInfo): void {
  const doc = new jsPDF() as CustomJsPDF
  doc.setFont("helvetica")
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 18

  // Add footer function that will be called on every page
  const addFooter = () => {
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setFont(undefined, "normal")
      doc.setTextColor(100, 100, 100)
      doc.text(
        `Computer Generated on ${new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })} - Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      )
    }
  }

  // Header
  const now = new Date()
  const generatedDate = now.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) + " " + now.toLocaleTimeString()

  doc.setFontSize(16)
  doc.setFont(undefined, "bold")
  doc.setTextColor(0, 0, 0)
  doc.text("BRANCH HARVEST SUMMARY", pageWidth / 2, margin, { align: "center" })

  doc.setFontSize(9)
  doc.setFont(undefined, "normal")
  doc.setTextColor(100, 100, 100)
  doc.text(`Computer Generated on: ${generatedDate}`, pageWidth / 2, margin + 8, { align: "center" })

  // Top section
  const topStartY = margin + 18

  // Branch Info
  doc.setFontSize(12)
  doc.setFont(undefined, "bold")
  doc.setTextColor(0, 0, 0)
  doc.text("Branch Information", margin, topStartY + 6)

  const harvestDate = new Date(result.harvestDate)
  const formattedHarvestDate = harvestDate.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  let dateRangeText = `Beginning to ${formattedHarvestDate}`
  if (result.previousHarvestDate) {
    const prev = new Date(result.previousHarvestDate)
    const start = new Date(prev)
    start.setDate(start.getDate() + 1)
    dateRangeText = `${start.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })} to ${formattedHarvestDate}`
  }

  const infoRows: [string, string][] = [
    ["Branch:", branchInfo.branchName ?? ""],
    ["Manager:", branchInfo.managerName ?? ""],
    ["Date Range:", dateRangeText],
    ["Branch ID:", String(result.branchId ?? "")],
  ]
  doc.setFontSize(10)
  doc.setFont(undefined, "normal")
  infoRows.forEach((r, i) => {
    doc.setTextColor(100, 100, 100)
    doc.text(r[0], margin, topStartY + 18 + i * 6)
    doc.setTextColor(0, 0, 0)
    doc.text(String(r[1]), margin + 45, topStartY + 18 + i * 6)
  })

  // REVENUE SECTION - Updated layout for compact version
  const revenueStartY = topStartY + 18 + (infoRows.length * 6) + 8

  // Expected Revenue
  const expectedRevenue = result.summary.totalAmount ?? 0
  doc.setFontSize(11)
  doc.setFont(undefined, "bold")
  doc.setTextColor(0, 0, 0)
  doc.text("Expected Revenue:", margin, revenueStartY)

  doc.setFontSize(12)
  doc.text(`P ${expectedRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin + 45, revenueStartY)

  // Actual Amount Processed (if available)
  let currentY = revenueStartY + 6
  if (result.summary.actualAmountProcessed !== undefined) {
    const actualAmount = result.summary.actualAmountProcessed ?? 0
    
    doc.setFontSize(10)
    doc.setFont(undefined, "bold")
    doc.text("Actual Amount Processed:", margin, currentY)
    
    doc.setFontSize(11)
    doc.text(
      `P ${actualAmount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      margin + 55,
      currentY,
    )

    // Variance
    currentY += 5
    const variance = result.summary.variance ?? 0
    const variancePercentage = result.summary.variancePercentage ?? 0
    const isPositive = variance >= 0
    const varianceSign = isPositive ? "+" : ""
    

    doc.setFontSize(9)
    doc.setFont(undefined, "bold")
    doc.text("Variance:", margin, currentY)
    doc.setFont(undefined, "normal")
    doc.setTextColor(0,0,0)
    doc.text(
      `${varianceSign}P ${Math.abs(variance).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${varianceSign}${Math.abs(variancePercentage).toFixed(2)}%)`,
      margin + 22,
      currentY,
    )
    
    // Reset text color
    doc.setTextColor(0, 0, 0)
  }

  // Your Expected Share
  currentY += 10
  doc.setFontSize(11)
  doc.setFont(undefined, "bold")
  doc.setTextColor(0, 0, 0)
  doc.text("Your Expected Share", margin, currentY)
  doc.setFont(undefined, "normal")
  const shareAmount = result.summary.branchShareAmount ?? 0
  const sharePercentage = result.summary.branchSharePercentage ?? 0
  doc.text(
    `P ${shareAmount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${sharePercentage}%)`,
    margin,
    currentY + 6,
  )

  // Key Metrics (right side)
  const metricsStartY = revenueStartY
  const rightHalfX = margin + 90

  doc.setFont(undefined, "bold")
  doc.text("Key Metrics", rightHalfX, metricsStartY)
  doc.setFont(undefined, "normal")
  const compactMetrics = [
    ["Total Transactions:", (result.summary.totalSales ?? 0).toLocaleString()],
    ["Daily Summaries:", (result.summary.aggregatesHarvested ?? 0).toLocaleString()],
    ["Units:", (result.summary.unitsProcessed ?? 0).toLocaleString()],
  ]
  compactMetrics.forEach((m, i) => {
    doc.setTextColor(100, 100, 100)
    doc.text(m[0], rightHalfX, metricsStartY + 8 + i * 6)
    doc.setFont(undefined, "bold")
    doc.setTextColor(0, 0, 0)
    doc.text(String(m[1]), rightHalfX + 65, metricsStartY + 8 + i * 6)
    doc.setFont(undefined, "normal")
  })

  // Rest of the compact version...
  const tableStartY = currentY + 18

  // Coin breakdown compact
  doc.setFontSize(9)
  doc.setFont(undefined, "normal")
  doc.setTextColor(0, 0, 0)
  doc.text(dateRangeText, margin, tableStartY)
  const compactSummaryLine = `${result.harvestDate?.slice(0, 7) ?? ""} • ${result.summary.aggregatesHarvested ?? 0} agg • ${result.summary.totalSales ?? 0} sales • ${result.summary.unitsProcessed ?? 0} units`
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(compactSummaryLine, margin, tableStartY + 6)

  doc.setFont(undefined, "bold")
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text(`P ${(result.summary.totalAmount ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, tableStartY + 18)
  doc.setFont(undefined, "normal")

  const coinTableStartY = tableStartY + 24
  const coinsList = [
    { label: "P1 Coins", count: result.summary.totalCoins1 ?? 0, value: (result.summary.totalCoins1 ?? 0) * 1 },
    { label: "P5 Coins", count: result.summary.totalCoins5 ?? 0, value: (result.summary.totalCoins5 ?? 0) * 5 },
    { label: "P10 Coins", count: result.summary.totalCoins10 ?? 0, value: (result.summary.totalCoins10 ?? 0) * 10 },
    { label: "P20 Coins", count: result.summary.totalCoins20 ?? 0, value: (result.summary.totalCoins20 ?? 0) * 20 },
  ]
  const coinTotalValue = coinsList.reduce((s, c) => s + c.value, 0)
  const coinBody = coinsList.map((c) => {
    const pct = coinTotalValue > 0 ? `${((c.value / coinTotalValue) * 100).toFixed(1)}%` : "0.0%"
    return [
      c.label,
      c.count.toLocaleString(),
      `P ${c.value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      pct,
    ]
  })
  coinBody.push(["Grand Total", "", `P ${coinTotalValue.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "100%"])

  autoTable(doc, {
    startY: coinTableStartY,
    head: [["Coin Type", "Quantity", "Total Value", "Percentage"]],
    body: coinBody,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: "bold", lineWidth: 0.01 },
    margin: { left: margin, right: margin },
  })

  const afterCoinY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : coinTableStartY + 70

  // Unit Summary compact
  if (result.monthlyAggregate?.unit_summaries && result.monthlyAggregate.unit_summaries.length > 0) {
    const unitSummaries = result.monthlyAggregate.unit_summaries
    const totals = {
      aggregates_count: 0,
      total_sales: 0,
      total_amount: 0,
      coins_1: 0,
      coins_5: 0,
      coins_10: 0,
      coins_20: 0,
    }

    const unitBody = unitSummaries.map((u) => {
      totals.aggregates_count += u.aggregates_count ?? 0
      totals.total_sales += u.total_sales ?? 0
      totals.total_amount += u.total_amount ?? 0
      totals.coins_1 += u.coins_1 ?? 0
      totals.coins_5 += u.coins_5 ?? 0
      totals.coins_10 += u.coins_10 ?? 0
      totals.coins_20 += u.coins_20 ?? 0

      return [
        u.unitId,
        (u.aggregates_count ?? 0).toLocaleString(),
        (u.total_sales ?? 0).toLocaleString(),
        `P ${(u.total_amount ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `P1 × ${u.coins_1 ?? 0}`,
        `P5 × ${u.coins_5 ?? 0}`,
        `P10 × ${u.coins_10 ?? 0}`,
        `P20 × ${u.coins_20 ?? 0}`,
      ]
    })

    unitBody.push([
      "Total",
      totals.aggregates_count.toLocaleString(),
      totals.total_sales.toLocaleString(),
      `P ${totals.total_amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `P1 × ${totals.coins_1}`,
      `P5 × ${totals.coins_5}`,
      `P10 × ${totals.coins_10}`,
      `P20 × ${totals.coins_20}`,
    ])

    autoTable(doc, {
      startY: afterCoinY,
      head: [["Unit ID", "Summaries", "Sales", "Amount", "P1", "P5", "P10", "P20"]],
      body: unitBody,
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: "bold", lineWidth: 0.01 },
      margin: { left: margin, right: margin },
      tableWidth: "auto",
      pageBreak: "auto",
    })
  }

  // Add footer to all pages at the end
  addFooter();

  const fileName = `branch-harvest-${branchInfo.branchName.replace(/\s+/g, "-")}-${result.harvestDate}.pdf`;
  const pdfBlob = doc.output("blob");
  const blobUrl = URL.createObjectURL(pdfBlob);
  window.open(blobUrl, "_blank");
}

// Helper functions remain the same...
function getNextHarvestDate(currentHarvestDate: string): string {
  const date = new Date(currentHarvestDate)
  date.setDate(date.getDate() + 1)
  return date.toISOString().split("T")[0]
}

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