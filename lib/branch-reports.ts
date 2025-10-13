import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { HarvestResult } from '@/hooks/use-branch-harvest';

// Extend jsPDF type to include autoTable and page handling
interface CustomJsPDF extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
  pages?: number;
}

interface BranchInfo {
  branchName: string;
  branchAddress: string;
  managerName: string;
  contactNumber: string;
}

export function generateBranchHarvestPDF(
  result: HarvestResult,
  branchInfo: BranchInfo,
  options?: {
    includeDailyBreakdown?: boolean;
    includeUnitDetails?: boolean;
    compact?: boolean;
  }
): void {
  const doc = new jsPDF() as CustomJsPDF;
  const pageWidth = doc.internal.pageSize.getWidth();
  const totalPages: number = doc.internal.pages ? doc.internal.pages.length - 1 : 1;
  let yPosition = 20;

  // Title - Matching the unit harvest style
  doc.setFontSize(20);
  doc.setTextColor(0, 128, 0);
  doc.text('BRANCH HARVEST SUMMARY REPORT', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;

  // Generation date with long month name
  const now = new Date();
  const generatedDate = `${now.toLocaleDateString('en-PH', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })} ${now.toLocaleTimeString()}`;
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${generatedDate}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 20;

  // Branch Information Section
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('BRANCH INFORMATION', 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(10);
  doc.text(`Branch Name: ${branchInfo.branchName}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Manager: ${branchInfo.managerName}`, 20, yPosition);
  yPosition += 7;
  
  // Format harvest date with long month name
  const harvestDate = new Date(result.harvestDate);
  const formattedHarvestDate = harvestDate.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(`Harvest Date: ${formattedHarvestDate}`, 20, yPosition);
  yPosition += 7;
  
  // Format previous harvest date with long month name if it exists
  if (result.previousHarvestDate) {
    const prevHarvestDate = new Date(result.previousHarvestDate);
    const formattedPrevHarvestDate = prevHarvestDate.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`Previous Harvest: ${formattedPrevHarvestDate}`, 20, yPosition);
  } else {
    doc.text(`Previous Harvest: First Harvest`, 20, yPosition);
  }
  yPosition += 7;
  
  yPosition += 15;

  // Financial Summary Section
  doc.setFontSize(14);
  doc.text('FINANCIAL SUMMARY', 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(16);
  doc.setTextColor(0, 128, 0);
  doc.text(`Total Harvested: ₱${result.summary.totalAmount.toFixed(2)}`, 20, yPosition);
  
  yPosition += 15;

  // Key Metrics in clean format
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('KEY METRICS', 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(10);
  
  const metricsData = [
    { label: 'Total Transactions:', value: result.summary.totalSales.toString() },
    { label: 'Units Processed:', value: result.summary.unitsProcessed.toString() },
    { label: 'Aggregates Harvested:', value: result.summary.aggregatesHarvested.toString() },
  ];
  
  metricsData.forEach((metric, index) => {
    doc.setTextColor(100, 100, 100);
    doc.text(metric.label, 20, yPosition + index * 7);
    doc.setTextColor(0, 0, 0);
    doc.text(metric.value, 80, yPosition + index * 7);
  });
  
  yPosition += 25;

  // Coin Breakdown Section
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('COIN BREAKDOWN', 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(10);

  // Coin breakdown in two columns like the unit version
  const coinData = [
    { label: '₱1 Coins:', value: result.summary.totalCoins1.toLocaleString() },
    { label: '₱5 Coins:', value: result.summary.totalCoins5.toLocaleString() },
    { label: '₱10 Coins:', value: result.summary.totalCoins10.toLocaleString() },
    { label: '₱20 Coins:', value: result.summary.totalCoins20.toLocaleString() },
  ];
  
  coinData.forEach((coin, index) => {
    const xPosition = index % 2 === 0 ? 20 : 110;
    const rowY = yPosition + Math.floor(index / 2) * 7;
    doc.text(`${coin.label}`, xPosition, rowY);
    doc.text(`${coin.value}`, xPosition + 40, rowY);
  });

  yPosition += 20;

  // Monthly Progress Section (simplified) - Using long month names
  if (result.monthlyAggregate) {
    doc.setFontSize(14);
    doc.text('MONTHLY PROGRESS', 20, yPosition);
    
    yPosition += 10;
    doc.setFontSize(10);
    
    // Convert month to long name
    const monthlyData = [
      { 
        label: 'Month:', 
        value: formatMonthToLongName(result.monthlyAggregate.month) 
      },
      { 
        label: 'Month to Date:', 
        value: `₱${result.monthlyAggregate.total.toFixed(2)}` 
      },
      { 
        label: 'Monthly Transactions:', 
        value: result.monthlyAggregate.sales_count.toString() 
      },
    ];
    
    monthlyData.forEach((item, index) => {
      doc.setTextColor(100, 100, 100);
      doc.text(item.label, 20, yPosition + index * 7);
      doc.setTextColor(0, 0, 0);
      doc.text(item.value, 70, yPosition + index * 7);
    });
    
    yPosition += 25;
  }

  // Performance Summary
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('PERFORMANCE SUMMARY', 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(10);
  
  const avgPerUnit = result.summary.totalAmount / result.summary.unitsProcessed;
  
  // Format next expected harvest with long month name
  const nextHarvestDate = new Date(getNextHarvestDate(result.harvestDate));
  const formattedNextHarvestDate = nextHarvestDate.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const performanceData = [
    { label: 'Average per Unit:', value: `₱${avgPerUnit.toFixed(2)}` },
    { label: 'Next Expected Harvest:', value: formattedNextHarvestDate },
  ];
  
  performanceData.forEach((item, index) => {
    doc.setTextColor(100, 100, 100);
    doc.text(item.label, 20, yPosition + index * 7);
    doc.setTextColor(0, 0, 0);
    doc.text(item.value, 70, yPosition + index * 7);
  });

  // Footer with long month name
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Report generated by Coin Harvest System - Page 1 of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Save the PDF
  const fileName = `branch-harvest-${branchInfo.branchName.replace(/\s+/g, '-').toLowerCase()}-${result.harvestDate}.pdf`;
  doc.save(fileName);
}

// Alternative compact version matching the unit compact style
export function generateCompactBranchHarvestPDF(
  result: HarvestResult,
  branchInfo: BranchInfo
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header with green background - matching unit compact style
  doc.setFillColor(0, 128, 0);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  // Title
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('BRANCH HARVEST SUMMARY', pageWidth / 2, 18, { align: 'center' });
  
  let yPosition = 45;
  
  // Key information in a table-like format with long month names
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  // Format harvest date with long month name
  const harvestDate = new Date(result.harvestDate);
  const formattedHarvestDate = harvestDate.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const infoData = [
    { label: 'Branch:', value: branchInfo.branchName },
    { label: 'Manager:', value: branchInfo.managerName },
    { label: 'Harvest Date:', value: formattedHarvestDate },
    { label: 'Branch ID:', value: result.branchId },
    { label: 'Units Processed:', value: result.summary.unitsProcessed.toString() },
  ];
  
  infoData.forEach((item, index) => {
    doc.setTextColor(100, 100, 100);
    doc.text(item.label, 20, yPosition + index * 6);
    doc.setTextColor(0, 0, 0);
    doc.text(item.value, 60, yPosition + index * 6);
  });
  
  yPosition += 35;
  
  // Total amount highlighted
  doc.setFontSize(16);
  doc.setTextColor(0, 128, 0);
  doc.text(`TOTAL AMOUNT: ₱${result.summary.totalAmount.toFixed(2)}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 20;
  
  // Coin breakdown in a clean table
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('COIN BREAKDOWN', 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(10);
  
  const coins = [
    { denomination: '₱1', count: result.summary.totalCoins1 },
    { denomination: '₱5', count: result.summary.totalCoins5 },
    { denomination: '₱10', count: result.summary.totalCoins10 },
    { denomination: '₱20', count: result.summary.totalCoins20 },
  ];
  
  coins.forEach((coin, index) => {
    const rowY = yPosition + index * 7;
    doc.text(coin.denomination, 30, rowY);
    doc.text(coin.count.toLocaleString(), 80, rowY);
    doc.text(`₱${(parseInt(coin.denomination.replace('₱', '')) * coin.count).toFixed(2)}`, 120, rowY);
  });
  
  yPosition += 35;
  
  // Summary metrics
  const summaryData = [
    { label: 'Total Transactions:', value: result.summary.totalSales.toString() },
    { label: 'Aggregates Harvested:', value: result.summary.aggregatesHarvested.toString() },
  ];
  
  summaryData.forEach((item, index) => {
    doc.setTextColor(100, 100, 100);
    doc.text(item.label, 20, yPosition + index * 7);
    doc.setTextColor(0, 0, 0);
    doc.text(item.value, 80, yPosition + index * 7);
  });
  
  // Footer with long month name
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  
  const footerDate = new Date().toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  doc.text(`Generated on ${footerDate}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  // Save
  const fileName = `branch-harvest-${branchInfo.branchName.replace(/\s+/g, '-')}-${result.harvestDate}.pdf`;
  doc.save(fileName);
}

function getNextHarvestDate(currentHarvestDate: string): string {
  const date = new Date(currentHarvestDate);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
}

// Helper function to convert month to long name
function formatMonthToLongName(monthInput: string): string {
  // If it's already a long name, return as is
  const longMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Check if input is already a long month name
  if (longMonths.some(month => monthInput.toLowerCase().includes(month.toLowerCase()))) {
    return monthInput;
  }
  
  // Try to parse as date string
  const date = new Date(monthInput);
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
  }
  
  // Try to parse as month number (1-12)
  const monthNumber = parseInt(monthInput);
  if (monthNumber >= 1 && monthNumber <= 12) {
    const currentYear = new Date().getFullYear();
    return new Date(currentYear, monthNumber - 1).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
  }
  
  // If all else fails, return the original input
  return monthInput;
}