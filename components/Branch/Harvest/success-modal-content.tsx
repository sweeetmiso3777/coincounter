"use client";

import type { HarvestResult, BranchInfo } from "@/hooks/use-branch-harvest";
import { FileText } from "lucide-react";
import {
  generateBranchHarvestPDF,
  generateCompactBranchHarvestPDF,
} from "@/lib/branch-reports";
import { toast } from "sonner";

interface SuccessModalContentProps {
  harvestResult: HarvestResult;
  branchInfo: BranchInfo;
  onClose: () => void;
}

export function SuccessModalContent({
  harvestResult,
  branchInfo,
  onClose,
}: SuccessModalContentProps) {
  const variance = harvestResult.summary.variance ?? 0;
  const variancePercentage = harvestResult.summary.variancePercentage ?? 0;
  const isPositive = variance >= 0;

  const handleExportPDF = (compact: boolean) => {
    try {
      if (compact) {
        generateCompactBranchHarvestPDF(harvestResult, branchInfo);
        toast.success("Compact PDF generated successfully");
      } else {
        generateBranchHarvestPDF(harvestResult, branchInfo);
        toast.success("Detailed PDF generated successfully");
      }
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <>
      <div className="mb-6 space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Daily Summaries Harvested:
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {harvestResult.summary.aggregatesHarvested.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Expected Amount:
          </span>
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            ₱
            {harvestResult.summary.totalAmount.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        {harvestResult.summary.actualAmountProcessed !== undefined && (
          <>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Actual Amount Processed:
              </span>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                ₱
                {harvestResult.summary.actualAmountProcessed.toLocaleString(
                  "en-PH",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </span>
            </div>
            <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Variance:
              </span>
              <span
                className={`text-sm font-bold ${
                  isPositive
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {isPositive ? "+" : ""}₱
                {variance.toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                ({isPositive ? "+" : ""}
                {variancePercentage.toFixed(2)}%)
              </span>
            </div>
          </>
        )}
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Total Transactions:
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {harvestResult.summary.totalSales.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Harvest Date:
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {new Date(harvestResult.harvestDate).toLocaleDateString("en-PH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleExportPDF(false)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <FileText className="h-4 w-4" />
          Detailed PDF
        </button>
        <button
          onClick={() => handleExportPDF(true)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
        >
          <FileText className="h-4 w-4" />
          Compact PDF
        </button>
      </div>

      <button
        onClick={onClose}
        className="w-full mt-3 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        Close
      </button>
    </>
  );
}
