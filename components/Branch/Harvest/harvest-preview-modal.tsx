"use client";

import React from "react";
import { useState, useEffect } from "react";
import { DollarSign, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  useBranchHarvest,
  type HarvestPreview,
  type BranchInfo,
  type HarvestResult,
} from "@/hooks/use-branch-harvest";
import { SuccessModalContent } from "./success-modal-content";
import { AggregateListModal } from "./AggregateListModal";

interface HarvestPreviewModalProps {
  branchId: string;
  branchInfo: BranchInfo;
  open: boolean;
  onClose: () => void;
}

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
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAggregateListModal, setShowAggregateListModal] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const {
    previewHarvest,
    executeHarvest,
    isHarvesting,
    generateHarvestReport,
  } = useBranchHarvest();

  useEffect(() => {
    if (open && !harvestPreview) {
      handleLoadPreview();
    }
  }, [open]);

  const handleLoadPreview = async (customDate?: string) => {
    setIsLoadingPreview(true);
    try {
      const preview = await previewHarvest(branchId, branchInfo, customDate);
      setHarvestPreview(preview);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to preview harvest";
      toast.error(errorMessage);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleConfirmHarvest = async () => {
    if (!harvestPreview) return;

    try {
      const actualAmount = actualAmountProcessed
        ? Number.parseFloat(actualAmountProcessed.replace(/,/g, ""))
        : undefined;

      const harvestDate =
        useCustomDate && customHarvestDate ? customHarvestDate : undefined;

      const result = await executeHarvest(
        branchId,
        harvestPreview.previewId,
        branchInfo,
        generatePDF,
        actualAmount,
        harvestDate
      );

      setHarvestResult(result);
      setActualAmountProcessed("");
      setCustomHarvestDate("");
      setUseCustomDate(false);
      setShowSuccessModal(true);

      toast.success(
        `Harvested ${
          result.summary.aggregatesHarvested
        } aggregates. Total: ₱${result.summary.totalAmount.toFixed(2)}`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Harvest failed";
      toast.error(errorMessage);
    }
  };

  const handleExportPDF = (compact = false) => {
    if (!harvestResult) return;

    try {
      generateHarvestReport(harvestResult, branchInfo, { compact });
      toast.success("PDF report generated successfully");
      setShowSuccessModal(false);
      handleClose();
    } catch (error) {
      toast.error("Failed to generate PDF report");
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
    setUseCustomDate(false);
    setShowSuccessModal(false);
    setShowAggregateListModal(false);
    onClose();
  };

  if (!open) return null;

  // Show success modal
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

          <SuccessModalContent
            harvestResult={harvestResult}
            onExportPDF={handleExportPDF}
            onClose={handleClose}
          />
        </div>
      </div>
    );
  }

  // Show aggregate list modal
  if (showAggregateListModal && harvestPreview) {
    return (
      <AggregateListModal
        open={showAggregateListModal}
        onClose={() => setShowAggregateListModal(false)}
        harvestPreview={harvestPreview}
      />
    );
  }

  // Show preview modal
  if (!harvestPreview) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Loading Overlay */}
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
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 border-b pb-4">
            <DollarSign className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Harvest Preview
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {harvestPreview.dateRange.start || "Beginning"} to{" "}
                {harvestPreview.dateRange.end}
              </p>
            </div>
          </div>

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
                <div className="text-2xl font-bold text-green-600 ">
                  ₱{harvestPreview.summary.totalAmount.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Total
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground ">
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
              View {harvestPreview.summary.aggregatesCount} Aggregates →
            </button>
          </div>

          {/* Custom Date Option */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={useCustomDate}
                onChange={(e) => {
                  setUseCustomDate(e.target.checked);
                  if (!e.target.checked) {
                    setCustomHarvestDate("");
                    handleLoadPreview();
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Use Custom Harvest Date
              </span>
            </label>
            {useCustomDate && (
              <div className="ml-7 mt-2">
                <input
                  type="date"
                  value={customHarvestDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setCustomHarvestDate(newDate);
                    if (newDate) {
                      setTimeout(() => handleLoadPreview(newDate), 100);
                    }
                  }}
                  max={new Date().toISOString().split("T")[0]}
                  required={useCustomDate}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  For backdating harvests - preview will load automatically when
                  date is selected
                </p>
              </div>
            )}
          </div>

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
                Generate PDF Report
              </span>
            </label>
          </div>

          {/* Warning */}
          <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium">Ready to Process</p>
                <p className="text-xs mt-1">
                  This will harvest {harvestPreview.summary.aggregatesCount}{" "}
                  aggregates and update branch records.
                </p>
              </div>
            </div>
          </div>

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
              disabled={isHarvesting || (useCustomDate && !customHarvestDate)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isHarvesting ? "Processing..." : "Confirm Harvest"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
