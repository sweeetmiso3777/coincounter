"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Download,
  X,
  MapPin,
  User,
  Calendar,
  Percent,
  Users,
} from "lucide-react";
import React, { useState } from "react";
import {
  useBranchHarvestData,
  HarvestData,
} from "@/hooks/use-branch-harvest-data";
import { useUnits } from "@/hooks/use-units-query";
import { BranchData } from "@/hooks/use-branches-query";
import { formatDateRange, formatDate } from "@/lib/date-utils";
import { generateCompactBranchHarvestPDF } from "@/lib/branch-reports";
import type { HarvestResult, BranchInfo } from "@/hooks/use-branch-harvest";
import Link from "next/link";
import { Unit } from "@/types/unit";

interface BranchDetailsModalProps {
  branch: {
    id: string;
    name: string;
    manager: string;
    location: string;
    totalHarvest: number;
    harvestCount: number;
    sharePercentage?: number;
    harvestDay?: number;
    affiliates?: string[];
  };
  onClose: () => void;
}

interface UnitSummary {
  unitId: string;
  total_amount?: number;
  aggregates_count?: number;
  total_sales?: number;
  coins_1?: number;
  coins_5?: number;
  coins_10?: number;
  coins_20?: number;
  date_range?: {
    start: string;
    end: string;
  };
}

// Compact Coin Breakdown Table
const CompactCoinBreakdown = ({
  coins_1 = 0,
  coins_5 = 0,
  coins_10 = 0,
  coins_20 = 0,
}: {
  coins_1?: number;
  coins_5?: number;
  coins_10?: number;
  coins_20?: number;
}) => {
  const coinTotals = {
    coins_1: coins_1 * 1,
    coins_5: coins_5 * 5,
    coins_10: coins_10 * 10,
    coins_20: coins_20 * 20,
  };

  const grandTotal = Object.values(coinTotals).reduce(
    (sum, total) => sum + total,
    0
  );

  return (
    <div className="text-xs">
      <div className="grid grid-cols-5 gap-1 font-mono">
        {/* Headers */}
        <div className="font-semibold text-muted-foreground">Coin</div>
        <div className="font-semibold text-muted-foreground text-right">
          Qty
        </div>
        <div className="font-semibold text-muted-foreground text-right">
          Value
        </div>
        <div className="font-semibold text-muted-foreground text-right">
          Total
        </div>
        <div className="font-semibold text-muted-foreground text-right">%</div>

        {/* 1 Peso */}
        <div>₱1</div>
        <div className="text-right">{coins_1.toLocaleString()}</div>
        <div className="text-right">₱1</div>
        <div className="text-right">₱{coinTotals.coins_1.toLocaleString()}</div>
        <div className="text-right text-muted-foreground">
          {grandTotal > 0
            ? ((coinTotals.coins_1 / grandTotal) * 100).toFixed(1)
            : "0"}
          %
        </div>

        {/* 5 Peso */}
        <div>₱5</div>
        <div className="text-right">{coins_5.toLocaleString()}</div>
        <div className="text-right">₱5</div>
        <div className="text-right">₱{coinTotals.coins_5.toLocaleString()}</div>
        <div className="text-right text-muted-foreground">
          {grandTotal > 0
            ? ((coinTotals.coins_5 / grandTotal) * 100).toFixed(1)
            : "0"}
          %
        </div>

        {/* 10 Peso */}
        <div>₱10</div>
        <div className="text-right">{coins_10.toLocaleString()}</div>
        <div className="text-right">₱10</div>
        <div className="text-right">
          ₱{coinTotals.coins_10.toLocaleString()}
        </div>
        <div className="text-right text-muted-foreground">
          {grandTotal > 0
            ? ((coinTotals.coins_10 / grandTotal) * 100).toFixed(1)
            : "0"}
          %
        </div>

        {/* 20 Peso */}
        <div>₱20</div>
        <div className="text-right">{coins_20.toLocaleString()}</div>
        <div className="text-right">₱20</div>
        <div className="text-right">
          ₱{coinTotals.coins_20.toLocaleString()}
        </div>
        <div className="text-right text-muted-foreground">
          {grandTotal > 0
            ? ((coinTotals.coins_20 / grandTotal) * 100).toFixed(1)
            : "0"}
          %
        </div>

        {/* Grand Total Row */}
        <div className="col-span-3 border-t pt-1 font-semibold">Total</div>
        <div className="col-span-2 border-t pt-1 text-right font-bold text-green-600">
          ₱{grandTotal.toLocaleString()}
        </div>
      </div>
    </div>
  );
};

// Compact Unit Breakdown
// Expandable Unit Breakdown
const CompactUnitBreakdown = ({
  unit,
  unitAlias,
}: {
  unit: UnitSummary;
  unitAlias: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-lg bg-card mb-2 overflow-hidden">
      {/* Header - Clickable Area */}
      <div
        className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
          <span className="font-medium text-sm">{unitAlias}</span>
          <span className="text-xs text-muted-foreground font-mono">
            ({unit.unitId})
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="text-sm font-bold text-green-600">
              ₱{(unit.total_amount || 0).toLocaleString()}
            </span>
            <span>{unit.aggregates_count || 0} sum</span>
            <span>{unit.total_sales || 0} sales</span>
          </div>
          <button
            className="p-1 hover:bg-muted rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-3 border-t bg-muted/10 space-y-3">
          {/* Detailed Unit Information */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-semibold text-muted-foreground">
                Unit ID:
              </span>
              <div className="font-mono mt-1">{unit.unitId}</div>
            </div>
            <div>
              <span className="font-semibold text-muted-foreground">
                Alias:
              </span>
              <div className="mt-1">{unitAlias}</div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-2 bg-background rounded-lg border">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                ₱{(unit.total_amount || 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Total Amount</div>
            </div>
            <div className="text-center">
              <div className="text-md font-bold text-blue-600">
                {unit.aggregates_count || 0}
              </div>
              <div className="text-xs text-muted-foreground">Aggregates</div>
            </div>
            <div className="text-center">
              <div className="text-md font-bold text-purple-600">
                {unit.total_sales || 0}
              </div>
              <div className="text-xs text-muted-foreground">Sales</div>
            </div>
            <div className="text-center">
              <div className="text-md font-bold text-amber-600">
                {unit.total_amount && unit.total_sales
                  ? `₱${Math.round(
                      unit.total_amount / unit.total_sales
                    ).toLocaleString()}`
                  : "₱0"}
              </div>
              <div className="text-xs text-muted-foreground">Avg/Sale</div>
            </div>
          </div>

          {/* Date Range */}
          {unit.date_range && (
            <div className="text-xs p-2 bg-muted/20 rounded">
              <span className="font-semibold text-muted-foreground">
                Period:{" "}
              </span>
              {formatDateRange(unit.date_range.start, unit.date_range.end)}
            </div>
          )}

          {/* Coin Breakdown for this specific unit */}
          {(unit.coins_1 || unit.coins_5 || unit.coins_10 || unit.coins_20) && (
            <div className="border rounded-lg p-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-xs text-muted-foreground">
                  Unit Coin Breakdown
                </span>
              </div>
              <CompactCoinBreakdown
                coins_1={unit.coins_1}
                coins_5={unit.coins_5}
                coins_10={unit.coins_10}
                coins_20={unit.coins_20}
              />
            </div>
          )}

          {/* Additional unit details can go here */}
          <div className="text-xs text-muted-foreground italic">
            Last updated:{" "}
            {unit.date_range?.end ? formatDate(unit.date_range.end) : "N/A"}
          </div>
        </div>
      )}
    </div>
  );
};

// Harvest Item Component
const HarvestItem = ({
  harvest,
  units,
}: {
  harvest: HarvestData;
  units: Unit[];
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const dateRange = harvest.date_range || { start: "N/A", end: "N/A" };
  const unitSummaries = harvest.unit_summaries || [];
  const hasVarianceData = harvest.actualAmountProcessed !== undefined;
  const isPositiveVariance = (harvest.variance ?? 0) >= 0;

  // Get unit alias from deviceId
  const getUnitAlias = (deviceId: string) => {
    const unit = units.find((u) => u.deviceId === deviceId);
    return unit?.alias || deviceId;
  };

  // Convert for PDF generation
  const convertToHarvestResult = (harvest: HarvestData): HarvestResult => {
    return {
      success: true,
      branchId: harvest.branchId || "",
      harvestDate: harvest.date_range?.end || harvest.last_harvest_date || "",
      previousHarvestDate:
        harvest.date_range?.start === "Beginning"
          ? null
          : harvest.date_range?.start || null,
      harvestMode: "normal",
      monthlyAggregate: {
        month: harvest.month || "",
        total: harvest.total || 0,
        coins_1: harvest.coins_1 || 0,
        coins_5: harvest.coins_5 || 0,
        coins_10: harvest.coins_10 || 0,
        coins_20: harvest.coins_20 || 0,
        sales_count: harvest.sales_count || 0,
        units_count: harvest.units_count || 0,
        aggregates_included: harvest.aggregates_included || 0,
        last_harvest_date:
          harvest.last_harvest_date || harvest.date_range?.end || "",
        branchSharePercentage: harvest.branchSharePercentage || 0,
        unit_summaries: harvest.unit_summaries || [],
        actualAmountProcessed: harvest.actualAmountProcessed,
        variance: harvest.variance,
        variancePercentage: harvest.variancePercentage,
      },
      summary: {
        totalAmount: harvest.total || 0,
        totalSales: harvest.sales_count || 0,
        unitsProcessed: harvest.units_count || 0,
        aggregatesHarvested: harvest.aggregates_included || 0,
        totalCoins1: harvest.coins_1 || 0,
        totalCoins5: harvest.coins_5 || 0,
        totalCoins10: harvest.coins_10 || 0,
        totalCoins20: harvest.coins_20 || 0,
        branchSharePercentage: harvest.branchSharePercentage || 0,
        branchShareAmount: harvest.branchSharePercentage
          ? (harvest.total || 0) * (harvest.branchSharePercentage / 100)
          : 0,
        companyShareAmount: harvest.branchSharePercentage
          ? (harvest.total || 0) * ((100 - harvest.branchSharePercentage) / 100)
          : harvest.total || 0,
        actualAmountProcessed: harvest.actualAmountProcessed,
        variance: harvest.variance,
        variancePercentage: harvest.variancePercentage,
      },
      unitAggregates: harvest.unitAggregates || {},
    };
  };

  const handleGeneratePDF = () => {
    const harvestResult = convertToHarvestResult(harvest);
    const branchInfo: BranchInfo = {
      branchName: harvest.location || "Branch",
      managerName: harvest.branch_manager || "N/A",
      branchAddress: harvest.location || "N/A",
      contactNumber: "N/A",
      sharePercentage: harvest.branchSharePercentage || 0,
    };

    generateCompactBranchHarvestPDF(harvestResult, branchInfo);
  };

  return (
    <div className="border rounded-lg bg-card shadow-sm mb-3">
      {/* Header */}
      <div className="border-b p-3 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-bold text-sm">
                {formatDateRange(dateRange.start, dateRange.end)}
              </h3>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-muted rounded"
              >
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              {harvest.month || "N/A"} • {harvest.aggregates_included || 0} sum
              • {harvest.sales_count || 0} sales • {harvest.units_count || 0}{" "}
              units
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-lg font-bold text-green-600">
              ₱{(harvest.total || 0).toLocaleString()}
            </div>
            <button
              onClick={handleGeneratePDF}
              className="p-1 hover:bg-muted rounded transition-colors"
              title="Download PDF"
            >
              <Download className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Variance */}
          {hasVarianceData && (
            <div className="p-2 bg-muted/20 rounded-lg border text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">
                    Expected: ₱{(harvest.total || 0).toLocaleString()}
                  </span>
                  <span className="text-blue-600 font-medium">
                    Actual: ₱
                    {(harvest.actualAmountProcessed || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {isPositiveVariance ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span
                    className={`font-bold ${
                      isPositiveVariance ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isPositiveVariance ? "+" : ""}₱
                    {(harvest.variance || 0).toLocaleString()}
                  </span>
                  <span
                    className={`${
                      isPositiveVariance ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ({isPositiveVariance ? "+" : ""}
                    {harvest.variancePercentage?.toFixed(2) || "0.00"}%)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Coin Breakdown */}
          <div className="p-2 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-xs text-muted-foreground">
                Coin Breakdown
              </span>
            </div>
            <CompactCoinBreakdown
              coins_1={harvest.coins_1}
              coins_5={harvest.coins_5}
              coins_10={harvest.coins_10}
              coins_20={harvest.coins_20}
            />
          </div>

          {/* Revenue Share */}
          {harvest.branchSharePercentage > 0 && (
            <div className="p-2 bg-muted/20 rounded-lg text-xs">
              <span className="font-medium text-muted-foreground mr-2">
                Revenue:
              </span>
              <span className="text-foreground font-medium">
                Branch({harvest.branchSharePercentage}%): ₱
                {(
                  (harvest.total || 0) *
                  (harvest.branchSharePercentage / 100)
                ).toLocaleString()}
              </span>
              <span className="text-green-600 mx-2">•</span>
              <span className="text-green-600">
                Your({100 - harvest.branchSharePercentage}%): ₱
                {(
                  (harvest.total || 0) *
                  ((100 - harvest.branchSharePercentage) / 100)
                ).toLocaleString()}
              </span>
            </div>
          )}

          {/* Unit Summaries */}
          {unitSummaries.length > 0 && (
            <div className="border rounded-lg bg-muted/10">
              <div className="p-2 text-xs font-semibold border-b">
                Unit Performance ({unitSummaries.length})
              </div>
              <div className="max-h-60 overflow-y-auto p-2 space-y-2">
                {unitSummaries.map((unit, idx) => (
                  <CompactUnitBreakdown
                    key={`${unit.unitId}-${idx}`}
                    unit={unit}
                    unitAlias={getUnitAlias(unit.unitId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-xs text-muted-foreground">
            Last updated: {formatDate(harvest.last_harvest_date || "N/A")}
          </div>
        </div>
      )}
    </div>
  );
};

// Main Modal Component
export function BranchDetailsModal({
  branch,
  onClose,
}: BranchDetailsModalProps) {
  const {
    data: harvestData,
    isLoading,
    error,
  } = useBranchHarvestData(branch.id);
  const { units } = useUnits();

  // Get next harvest date
  const getNextHarvestDate = (harvestDay: number) => {
    const now = new Date();
    let harvestDate = new Date(now.getFullYear(), now.getMonth(), harvestDay);
    if (harvestDay < now.getDate())
      harvestDate = new Date(now.getFullYear(), now.getMonth() + 1, harvestDay);
    if (harvestDate.getDate() !== harvestDay)
      harvestDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return harvestDate;
  };

  const harvestDate = branch.harvestDay
    ? getNextHarvestDate(branch.harvestDay)
    : null;
  const affiliateCount = branch.affiliates?.length || 0;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  <Link
                    href={`/branches/${branch.id}`}
                    className="hover:text-blue-600 hover:underline transition-colors"
                  >
                    {branch.name}
                  </Link>
                </h2>
                <p className="text-sm text-muted-foreground">
                  Harvest History & Performance
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Branch Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{branch.manager}</span>
            </div>

            {harvestDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Next Harvest: {formatDate(harvestDate)}</span>
              </div>
            )}

            {branch.sharePercentage && (
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span>Share: {branch.sharePercentage}%</span>
              </div>
            )}

            {affiliateCount > 0 && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>
                  {affiliateCount} Affiliate{affiliateCount !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-muted/20 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ₱{branch.totalHarvest.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">
                {branch.harvestCount}
              </div>
              <div className="text-xs text-muted-foreground">Harvests</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">
                {branch.harvestCount > 0
                  ? Math.round(
                      branch.totalHarvest / branch.harvestCount
                    ).toLocaleString()
                  : "0"}
              </div>
              <div className="text-xs text-muted-foreground">
                Avg per Harvest
              </div>
            </div>
            <div className="text-center">
              <Link
                href={`/branches/${branch.id}`}
                className="text-xl font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                {branch.location.split(" ")[0]}
              </Link>
              <div className="text-xs text-muted-foreground">Location</div>
            </div>
          </div>
        </div>

        {/* Harvest History */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Harvest History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse bg-muted rounded-lg p-4"
                    >
                      <div className="h-4 bg-muted-foreground/20 rounded w-1/4 mb-2"></div>
                      <div className="space-y-1.5">
                        <div className="h-3 bg-muted-foreground/20 rounded w-3/4"></div>
                        <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="border border-destructive/20 bg-destructive/5 rounded-lg p-4">
                  <div className="text-sm text-destructive">
                    Error loading harvest data
                  </div>
                </div>
              ) : !harvestData || harvestData.length === 0 ? (
                <div className="border border-dashed rounded-lg p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No harvest records found for this branch.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {harvestData.map((harvest) => (
                    <HarvestItem
                      key={harvest.id}
                      harvest={harvest}
                      units={units}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
