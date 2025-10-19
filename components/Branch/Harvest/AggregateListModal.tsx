// components/Branch/AggregateListModal.tsx
"use client";

import { useState } from "react";
import {
  X,
  Calendar,
  DollarSign,
  TrendingUp,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { HarvestPreview } from "@/hooks/use-branch-harvest";

interface AggregateListModalProps {
  open: boolean;
  onClose: () => void;
  harvestPreview: HarvestPreview;
}

export function AggregateListModal({
  open,
  onClose,
  harvestPreview,
}: AggregateListModalProps) {
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  if (!open) return null;

  // Group aggregates by unit
  const aggregatesByUnit = harvestPreview.aggregates.reduce((acc, agg) => {
    if (!acc[agg.unitId]) {
      acc[agg.unitId] = [];
    }
    acc[agg.unitId].push(agg);
    return acc;
  }, {} as Record<string, typeof harvestPreview.aggregates>);

  // Sort aggregates by date within each unit
  Object.keys(aggregatesByUnit).forEach((unitId) => {
    aggregatesByUnit[unitId].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const toggleUnit = (unitId: string) => {
    const newExpanded = new Set(expandedUnits);
    if (newExpanded.has(unitId)) {
      newExpanded.delete(unitId);
    } else {
      newExpanded.add(unitId);
    }
    setExpandedUnits(newExpanded);
  };

  // Expand all units by default on first open

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Aggregate Details
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {harvestPreview.summary.aggregatesCount} aggregates from{" "}
              {Object.keys(aggregatesByUnit).length} units
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {Object.entries(aggregatesByUnit).map(([unitId, aggregates]) => {
              const unitTotal = aggregates.reduce(
                (sum, agg) => sum + agg.total,
                0
              );
              const unitSales = aggregates.reduce(
                (sum, agg) => sum + agg.sales_count,
                0
              );
              const isExpanded = expandedUnits.has(unitId);

              return (
                <div
                  key={unitId}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  {/* Unit Header - Clickable */}
                  <button
                    onClick={() => toggleUnit(unitId)}
                    className="w-full bg-gray-50 dark:bg-gray-900/50 p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                        <div className="text-left">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            Unit: {unitId}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {aggregates.length} aggregates • {unitSales} sales
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          ₱{unitTotal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Collapsible Content */}
                  {isExpanded && (
                    <div className="animate-in fade-in duration-200">
                      {/* Aggregates Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                                Date
                              </th>
                              <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                                Sales
                              </th>
                              <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">
                                ₱1
                              </th>
                              <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">
                                ₱5
                              </th>
                              <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">
                                ₱10
                              </th>
                              <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">
                                ₱20
                              </th>
                              <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {aggregates.map((agg) => (
                              <tr
                                key={agg.aggregateId}
                                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                              >
                                <td className="px-3 py-2 text-gray-900 dark:text-white">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3 text-gray-400" />
                                    {formatDate(agg.createdAt)}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">
                                  {agg.sales_count}
                                </td>
                                <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">
                                  {agg.coins_1}
                                </td>
                                <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">
                                  {agg.coins_5}
                                </td>
                                <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">
                                  {agg.coins_10}
                                </td>
                                <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">
                                  {agg.coins_20}
                                </td>
                                <td className="px-3 py-2 text-right font-medium text-green-600 dark:text-green-400">
                                  ₱{agg.total.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          {/* Unit Summary Footer */}
                          <tfoot className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                            <tr className="font-semibold">
                              <td className="px-3 py-2 text-gray-900 dark:text-white">
                                Unit Total
                              </td>
                              <td className="px-3 py-2 text-right text-gray-900 dark:text-white">
                                {unitSales}
                              </td>
                              <td className="px-3 py-2 text-center text-gray-900 dark:text-white">
                                {aggregates.reduce(
                                  (sum, a) => sum + a.coins_1,
                                  0
                                )}
                              </td>
                              <td className="px-3 py-2 text-center text-gray-900 dark:text-white">
                                {aggregates.reduce(
                                  (sum, a) => sum + a.coins_5,
                                  0
                                )}
                              </td>
                              <td className="px-3 py-2 text-center text-gray-900 dark:text-white">
                                {aggregates.reduce(
                                  (sum, a) => sum + a.coins_10,
                                  0
                                )}
                              </td>
                              <td className="px-3 py-2 text-center text-gray-900 dark:text-white">
                                {aggregates.reduce(
                                  (sum, a) => sum + a.coins_20,
                                  0
                                )}
                              </td>
                              <td className="px-3 py-2 text-right text-green-600 dark:text-green-400">
                                ₱{unitTotal.toFixed(2)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Summary */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  Total Sales:
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {harvestPreview.summary.totalSales}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  Grand Total:
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  ₱{harvestPreview.summary.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Expand/Collapse All Buttons */}
              <button
                onClick={() => {
                  const allUnitIds = new Set(Object.keys(aggregatesByUnit));
                  setExpandedUnits(allUnitIds);
                }}
                className="px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Expand All
              </button>
              <button
                onClick={() => setExpandedUnits(new Set())}
                className="px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Collapse All
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
