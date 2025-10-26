"use client";

import React from "react";
import { useState, useEffect } from "react";
import {
  DollarSign,
  AlertTriangle,
  Zap,
  Calendar,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  useBranchHarvest,
  type HarvestPreview,
  type BranchInfo,
  type HarvestResult,
} from "@/hooks/use-branch-harvest";
import { SuccessModalContent } from "./success-modal-content";
import { AggregateListModal } from "./AggregateListModal";
import { generateCompactBranchHarvestPDF } from "@/lib/branch-reports";

interface HarvestPreviewModalProps {
  branchId: string;
  branchInfo: BranchInfo;
  open: boolean;
  onClose: () => void;
}

type HarvestMode = "normal" | "include_today" | "backdate";

export function HarvestPreviewModal({
  branchId,
  branchInfo,
  open,
  onClose,
}: HarvestPreviewModalProps) {
  const [harvestPreview, setHarvestPreview] = useState<HarvestPreview | null>(
    null
  );
  const [harvestResult, setHarvestResult] = useState<HarvestResult | null>(
    null
  );
  const [generatePDF, setGeneratePDF] = useState(true);
  const [actualAmountProcessed, setActualAmountProcessed] =
    useState<string>("");
  const [customHarvestDate, setCustomHarvestDate] = useState<string>("");
  const [harvestMode, setHarvestMode] = useState<HarvestMode>("normal");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAggregateListModal, setShowAggregateListModal] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [hasInitialPreview, setHasInitialPreview] = useState(false);

  const { previewHarvest, executeHarvest, isHarvesting } = useBranchHarvest();

  // Load initial preview when modal opens
  useEffect(() => {
    if (open && !hasInitialPreview) {
      handleLoadPreview();
      setHasInitialPreview(true);
    }
  }, [open, hasInitialPreview]);

  // Auto-reload preview when date or mode changes
  useEffect(() => {
    if (open && hasInitialPreview) {
      const timer = setTimeout(() => {
        handleLoadPreview();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [customHarvestDate, harvestMode, open, hasInitialPreview]);

  const handleLoadPreview = async () => {
    if (harvestMode === "backdate" && !customHarvestDate) {
      return;
    }

    setIsLoadingPreview(true);
    try {
      const harvestDate =
        harvestMode === "backdate" && customHarvestDate
          ? customHarvestDate
          : undefined;
      const preview = await previewHarvest(
        branchId,
        harvestMode,
        branchInfo,
        harvestDate
      );
      setHarvestPreview(preview);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to preview harvest";
      if (
        !errorMessage.includes("No unit summaries") ||
        harvestMode !== "backdate"
      ) {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleModeChange = async (newMode: HarvestMode) => {
    setHarvestMode(newMode);
    if (newMode !== "backdate") {
      setCustomHarvestDate("");
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomHarvestDate(e.target.value);
  };

  // NEW: Convert preview to result format for PDF generation
  const convertPreviewToResult = (): HarvestResult | null => {
    if (!harvestPreview) return null;

    const actualAmount = actualAmountProcessed
      ? Number.parseFloat(actualAmountProcessed.replace(/,/g, ""))
      : undefined;

    const expectedAmount = harvestPreview.summary.totalAmount;
    let variance: number | undefined;
    let variancePercentage: number | undefined;

    if (actualAmount !== undefined && !isNaN(actualAmount)) {
      variance = actualAmount - expectedAmount;
      variancePercentage =
        expectedAmount > 0 ? (variance / expectedAmount) * 100 : 0;
    }

    return {
      success: true,
      branchId: branchId,
      harvestDate: harvestPreview.dateRange.end,
      previousHarvestDate: harvestPreview.dateRange.start,
      harvestMode: harvestMode,
      summary: {
        totalAmount: expectedAmount,
        totalSales: harvestPreview.summary.totalSales,
        unitsProcessed: harvestPreview.summary.unitsCount,
        aggregatesHarvested: harvestPreview.summary.aggregatesCount,
        totalCoins1: harvestPreview.summary.coins1,
        totalCoins5: harvestPreview.summary.coins5,
        totalCoins10: harvestPreview.summary.coins10,
        totalCoins20: harvestPreview.summary.coins20,
        branchSharePercentage: branchInfo.sharePercentage,
        branchShareAmount: expectedAmount * (branchInfo.sharePercentage / 100),
        companyShareAmount:
          expectedAmount * ((100 - branchInfo.sharePercentage) / 100),
        actualAmountProcessed: actualAmount,
        variance: variance,
        variancePercentage: variancePercentage,
      },
      monthlyAggregate: {
        month: harvestPreview.dateRange.end.substring(0, 7),
        coins_1: harvestPreview.summary.coins1,
        coins_5: harvestPreview.summary.coins5,
        coins_10: harvestPreview.summary.coins10,
        coins_20: harvestPreview.summary.coins20,
        sales_count: harvestPreview.summary.totalSales,
        total: expectedAmount,
        aggregates_included: harvestPreview.summary.aggregatesCount,
        units_count: harvestPreview.summary.unitsCount,
        last_harvest_date: harvestPreview.dateRange.end,
        branchSharePercentage: branchInfo.sharePercentage,
        unit_summaries: [], // Preview doesn't have unit summaries
        actualAmountProcessed: actualAmount,
        variance: variance,
        variancePercentage: variancePercentage,
      },
      // ADD THIS: Empty unitAggregates object for preview
      unitAggregates: {},
    };
  };

  // NEW: Handle preview PDF generation
  const handleGeneratePreviewPDF = () => {
    const previewResult = convertPreviewToResult();
    if (!previewResult) {
      toast.error("No preview data available to generate PDF");
      return;
    }

    try {
      generateCompactBranchHarvestPDF(previewResult, branchInfo);
      toast.success("PDF preview generated successfully");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF preview");
    }
  };

  const handleConfirmHarvest = async () => {
    if (!harvestPreview) return;

    try {
      const actualAmount = actualAmountProcessed
        ? Number.parseFloat(actualAmountProcessed.replace(/,/g, ""))
        : undefined;

      const harvestDate =
        harvestMode === "backdate" && customHarvestDate
          ? customHarvestDate
          : undefined;

      const result = await executeHarvest(
        branchId,
        harvestPreview.previewId,
        harvestMode,
        branchInfo,
        actualAmount,
        harvestDate
      );

      setHarvestResult(result);
      setActualAmountProcessed("");
      setCustomHarvestDate("");
      setShowSuccessModal(true);

      // Generate PDF if option is checked
      if (generatePDF) {
        generateCompactBranchHarvestPDF(result, branchInfo);
      }

      let message = "";
      switch (result.harvestMode) {
        case "normal":
          message = `Harvested ${
            result.summary.aggregatesHarvested
          } aggregates (up to yesterday). Total: ₱${result.summary.totalAmount.toFixed(
            2
          )}`;
          break;
        case "include_today":
          message = `Harvested ${
            result.summary.aggregatesHarvested
          } aggregates (including today's sales). Total: ₱${result.summary.totalAmount.toFixed(
            2
          )}`;
          break;
        case "backdate":
          message = `Backdated harvest for ${result.harvestDate}: ${
            result.summary.aggregatesHarvested
          } aggregates. Total: ₱${result.summary.totalAmount.toFixed(2)}`;
          break;
      }

      toast.success(message);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Harvest failed";
      toast.error(errorMessage);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    let cleaned = input.replace(/[^\d.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      cleaned = parts[0] + "." + parts.slice(1).join("");
    }
    if (parts.length === 2) {
      cleaned = parts[0] + "." + parts[1].slice(0, 2);
    }
    if (cleaned.includes(".")) {
      const [whole, decimal] = cleaned.split(".");
      const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      setActualAmountProcessed(
        decimal ? `${formattedWhole}.${decimal}` : formattedWhole
      );
    } else {
      const formatted = cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      setActualAmountProcessed(formatted);
    }
  };

  const handleClose = () => {
    setHarvestPreview(null);
    setHarvestResult(null);
    setActualAmountProcessed("");
    setCustomHarvestDate("");
    setHarvestMode("normal");
    setShowSuccessModal(false);
    setShowAggregateListModal(false);
    setHasInitialPreview(false);
    onClose();
  };

  const getModeDescription = () => {
    switch (harvestMode) {
      case "normal":
        return "Harvest all unprocessed data up to yesterday";
      case "include_today":
        return "Include today's sales (pre-aggregates current day sales)";
      case "backdate":
        return "Harvest for a specific past date";
      default:
        return "";
    }
  };

  const getModeIcon = (mode: HarvestMode) => {
    switch (mode) {
      case "normal":
        return <DollarSign className="h-4 w-4" />;
      case "include_today":
        return <Zap className="h-4 w-4" />;
      case "backdate":
        return <Calendar className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  if (!open) return null;

  if (showSuccessModal && harvestResult) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Harvest Complete!
            </h3>
          </div>

          {harvestResult.preAggregatePerformed &&
            harvestResult.preAggregateStats && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium">Todays Sales Included</p>
                    <p className="text-xs mt-1">
                      Early Summarized{" "}
                      {harvestResult.preAggregateStats.aggregatesCreated} units,
                      that had {harvestResult.preAggregateStats.salesDeleted}{" "}
                      sales records today
                    </p>
                  </div>
                </div>
              </div>
            )}

          <SuccessModalContent
            harvestResult={harvestResult}
            branchInfo={branchInfo}
            onClose={handleClose}
          />
        </div>
      </div>
    );
  }

  if (showAggregateListModal && harvestPreview) {
    return (
      <AggregateListModal
        open={showAggregateListModal}
        onClose={() => setShowAggregateListModal(false)}
        harvestPreview={harvestPreview}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        {isLoadingPreview && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Processing...
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Loading harvest preview
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="p-6">
          {/* Header with PDF Preview Button */}
          <div className="flex items-center justify-between mb-6 border-b pb-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Harvest Preview
                </h3>
                {harvestPreview && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {harvestPreview.dateRange.start
                      ? new Date(
                          harvestPreview.dateRange.start
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Beginning"}{" "}
                    to{" "}
                    {harvestPreview.dateRange.end
                      ? new Date(
                          harvestPreview.dateRange.end
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : ""}
                  </p>
                )}
              </div>
            </div>

            {/* PDF Preview Button */}
            {harvestPreview && (
              <button
                onClick={handleGeneratePreviewPDF}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Generate PDF Preview"
              >
                <FileDown className="h-4 w-4" />
                Preview PDF
              </button>
            )}
          </div>

          {/* Harvest Mode Selection */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Harvest Mode
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  mode: "normal",
                  label: "Normal",
                  description: "Up to yesterday",
                },
                {
                  mode: "include_today",
                  label: "Include Today",
                  description: "With today's sales",
                },
                {
                  mode: "backdate",
                  label: "Backdate",
                  description: "Specific date",
                },
              ].map(({ mode, label, description }) => (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode as HarvestMode)}
                  className={`p-3 border rounded-lg text-left transition-all ${
                    harvestMode === mode
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getModeIcon(mode as HarvestMode)}
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {description}
                  </p>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {getModeDescription()}
            </p>
          </div>

          {/* Backdate Date Picker */}
          {harvestMode === "backdate" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Harvest Date
              </label>
              <input
                type="date"
                value={customHarvestDate}
                onChange={handleDateChange}
                max={new Date().toISOString().split("T")[0]}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Select the date you want to harvest for
              </p>
            </div>
          )}

          {/* Preview content */}
          {harvestPreview ? (
            <>
              {/* Summary Stats */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-foreground mb-3">
                  Summary
                </h4>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {harvestPreview.summary.aggregatesCount}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Aggregates
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ₱{harvestPreview.summary.totalAmount.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Total
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {harvestPreview.summary.unitsCount}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Units
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground dark:text-amber-400">
                      {harvestPreview.summary.totalSales}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Sales
                    </div>
                  </div>
                </div>
              </div>

              {/* Coin Breakdown */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Coin Breakdown
                </h4>
                <div className="grid grid-cols-4 gap-2 text-sm border rounded-lg divide-x divide-gray-200 dark:divide-gray-700">
                  <div className="text-center py-3">
                    <div className="font-semibold text-foreground">₱1</div>
                    <div className="text-lg font-bold text-foreground">
                      {harvestPreview.summary.coins1}
                    </div>
                  </div>
                  <div className="text-center py-3">
                    <div className="font-semibold text-foreground">₱5</div>
                    <div className="text-lg font-bold text-foreground">
                      {harvestPreview.summary.coins5}
                    </div>
                  </div>
                  <div className="text-center py-3">
                    <div className="font-semibold text-foreground">₱10</div>
                    <div className="text-lg font-bold text-foreground">
                      {harvestPreview.summary.coins10}
                    </div>
                  </div>
                  <div className="text-center py-3">
                    <div className="font-semibold text-foreground">₱20</div>
                    <div className="text-lg font-bold text-foreground">
                      {harvestPreview.summary.coins20}
                    </div>
                  </div>
                </div>
              </div>

              {/* View Aggregates Button */}
              <div className="mb-6">
                <button
                  onClick={() => setShowAggregateListModal(true)}
                  className="w-full py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors"
                >
                  View {harvestPreview.summary.aggregatesCount} Unit Summaries →
                </button>
              </div>
            </>
          ) : (
            <div className="mb-6 p-4 text-center border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isLoadingPreview
                  ? "Loading preview..."
                  : "Select a harvest date to see preview"}
              </p>
            </div>
          )}

          {/* Actual Amount Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Actual Amount Processed
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                ₱
              </span>
              <input
                type="text"
                value={actualAmountProcessed}
                onChange={handleAmountChange}
                placeholder="Physical cash collected"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              For variance tracking
            </p>
          </div>

          {/* PDF Export Option */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={generatePDF}
                onChange={(e) => setGeneratePDF(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Generate PDF Report After Harvest
              </span>
            </label>
          </div>

          {/* Warning */}
          {harvestPreview && (
            <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium">Ready to Process</p>
                  <p className="text-xs mt-1">
                    This will harvest {harvestPreview.summary.aggregatesCount}{" "}
                    summaries and update branch records.
                    {harvestMode === "include_today" &&
                      " Todays sales will be summarized early."}
                    {harvestMode === "backdate" &&
                      " This will process data for the selected date."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end border-t pt-4">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmHarvest}
              disabled={
                isHarvesting ||
                !harvestPreview ||
                (harvestMode === "backdate" && !customHarvestDate)
              }
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isHarvesting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                "Confirm Harvest"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
