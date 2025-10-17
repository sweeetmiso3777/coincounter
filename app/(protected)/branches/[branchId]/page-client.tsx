"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  BarChart3,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  MapPin,
  FileDown,
} from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import { Virtuoso } from "react-virtuoso";
import {
  useBranchHarvestData,
  HarvestData,
} from "@/hooks/use-branch-harvest-data";
import { useUnits } from "@/hooks/use-units-query";
import { BranchData, useBranches } from "@/hooks/use-branches-query";
import { formatDateRange, formatDate } from "@/lib/date-utils";
import { MapModal } from "@/components/Branch/MapModal";
import CompactMap from "@/components/Branch/CompactMap";
import { BranchUnitsStatus } from "@/components/Branch/branch-units";
import { generateCompactBranchHarvestPDF } from "@/lib/branch-reports";
import type { HarvestResult, BranchInfo } from "@/hooks/use-branch-harvest";

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

// ========== COIN BREAKDOWN TABLE COMPONENT ==========
const CoinBreakdownTable = ({
  coins_1 = 0,
  coins_5 = 0,
  coins_10 = 0,
  coins_20 = 0,
  compact = false,
}: {
  coins_1?: number;
  coins_5?: number;
  coins_10?: number;
  coins_20?: number;
  compact?: boolean;
}) => {
  const coinValues = {
    coins_1: coins_1,
    coins_5: coins_5,
    coins_10: coins_10,
    coins_20: coins_20,
  };

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

  if (compact) {
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
          <div className="font-semibold text-muted-foreground text-right">
            %
          </div>

          {/* 1 Peso */}
          <div>₱1</div>
          <div className="text-right">
            {coinValues.coins_1.toLocaleString()}
          </div>
          <div className="text-right">₱1</div>
          <div className="text-right">
            ₱{coinTotals.coins_1.toLocaleString()}
          </div>
          <div className="text-right text-muted-foreground">
            {grandTotal > 0
              ? ((coinTotals.coins_1 / grandTotal) * 100).toFixed(1)
              : "0"}
            %
          </div>

          {/* 5 Peso */}
          <div>₱5</div>
          <div className="text-right">
            {coinValues.coins_5.toLocaleString()}
          </div>
          <div className="text-right">₱5</div>
          <div className="text-right">
            ₱{coinTotals.coins_5.toLocaleString()}
          </div>
          <div className="text-right text-muted-foreground">
            {grandTotal > 0
              ? ((coinTotals.coins_5 / grandTotal) * 100).toFixed(1)
              : "0"}
            %
          </div>

          {/* 10 Peso */}
          <div>₱10</div>
          <div className="text-right">
            {coinValues.coins_10.toLocaleString()}
          </div>
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
          <div className="text-right">
            {coinValues.coins_20.toLocaleString()}
          </div>
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
  }

  return (
    <div className="text-xs">
      <div className="grid grid-cols-4 gap-2 font-mono border-b pb-1 mb-1">
        <div className="font-semibold text-muted-foreground">Coin Type</div>
        <div className="font-semibold text-muted-foreground text-right">
          Quantity
        </div>
        <div className="font-semibold text-muted-foreground text-right">
          Total Value
        </div>
        <div className="font-semibold text-muted-foreground text-right">
          Percentage
        </div>
      </div>

      <div className="space-y-1">
        {/* 1 Peso Row */}
        <div className="grid grid-cols-4 gap-2">
          <div>₱1 Coins</div>
          <div className="text-right">
            {coinValues.coins_1.toLocaleString()}
          </div>
          <div className="text-right">
            ₱{coinTotals.coins_1.toLocaleString()}
          </div>
          <div className="text-right text-muted-foreground">
            {grandTotal > 0
              ? ((coinTotals.coins_1 / grandTotal) * 100).toFixed(1)
              : "0"}
            %
          </div>
        </div>

        {/* 5 Peso Row */}
        <div className="grid grid-cols-4 gap-2">
          <div>₱5 Coins</div>
          <div className="text-right">
            {coinValues.coins_5.toLocaleString()}
          </div>
          <div className="text-right">
            ₱{coinTotals.coins_5.toLocaleString()}
          </div>
          <div className="text-right text-muted-foreground">
            {grandTotal > 0
              ? ((coinTotals.coins_5 / grandTotal) * 100).toFixed(1)
              : "0"}
            %
          </div>
        </div>

        {/* 10 Peso Row */}
        <div className="grid grid-cols-4 gap-2">
          <div>₱10 Coins</div>
          <div className="text-right">
            {coinValues.coins_10.toLocaleString()}
          </div>
          <div className="text-right">
            ₱{coinTotals.coins_10.toLocaleString()}
          </div>
          <div className="text-right text-muted-foreground">
            {grandTotal > 0
              ? ((coinTotals.coins_10 / grandTotal) * 100).toFixed(1)
              : "0"}
            %
          </div>
        </div>

        {/* 20 Peso Row */}
        <div className="grid grid-cols-4 gap-2">
          <div>₱20 Coins</div>
          <div className="text-right">
            {coinValues.coins_20.toLocaleString()}
          </div>
          <div className="text-right">
            ₱{coinTotals.coins_20.toLocaleString()}
          </div>
          <div className="text-right text-muted-foreground">
            {grandTotal > 0
              ? ((coinTotals.coins_20 / grandTotal) * 100).toFixed(1)
              : "0"}
            %
          </div>
        </div>

        {/* Grand Total Row */}
        <div className="grid grid-cols-4 gap-2 border-t pt-1 font-semibold">
          <div className="col-span-2">Grand Total</div>
          <div className="text-right text-green-600">
            ₱{grandTotal.toLocaleString()}
          </div>
          <div className="text-right">100%</div>
        </div>
      </div>
    </div>
  );
};

const UnitBreakdown = ({
  unit,
  isExpanded,
  onToggle,
  unitAlias,
}: {
  unit: UnitSummary;
  isExpanded: boolean;
  onToggle: () => void;
  unitAlias: string;
}) => {
  const unitDateRange = unit.date_range || { start: "N/A", end: "N/A" };

  return (
    <div className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
      {/* Unit Header - More Compact */}
      <div
        className="flex items-center justify-between p-2 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
          <span className="font-medium text-sm">{unitAlias}</span>
          <span className="text-xs text-muted-foreground font-mono">
            ({unit.unitId})
          </span>
          <span className="text-sm font-bold text-green-600 ml-2">
            ₱{(unit.total_amount || 0).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{unit.aggregates_count || 0} agg</span>
          <span>{unit.total_sales || 0} sales</span>
          {isExpanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </div>
      </div>

      {/* Expanded Content - Tabular Coin Breakdown */}
      {isExpanded && (
        <div className="px-2 pb-2 pl-8">
          <div className="text-xs text-muted-foreground space-y-2">
            <CoinBreakdownTable
              coins_1={unit.coins_1}
              coins_5={unit.coins_5}
              coins_10={unit.coins_10}
              coins_20={unit.coins_20}
              compact={true}
            />
            <div className="text-muted-foreground/80">
              {formatDateRange(unitDateRange.start, unitDateRange.end)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ========== HARVEST DATA DISPLAY ==========
const HarvestDataDisplay = React.memo(({ branchId }: { branchId: string }) => {
  const {
    data: harvestData,
    isLoading,
    error,
  } = useBranchHarvestData(branchId);

  const { units } = useUnits();
  const { data: branches } = useBranches();
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [showUnitPerformance, setShowUnitPerformance] = useState<
    Record<string, boolean>
  >({});

  const branch = branches?.find((b) => b.id === branchId);

  const toggleUnit = (unitId: string) => {
    const newExpanded = new Set(expandedUnits);
    if (newExpanded.has(unitId)) {
      newExpanded.delete(unitId);
    } else {
      newExpanded.add(unitId);
    }
    setExpandedUnits(newExpanded);
  };

  const toggleUnitPerformance = (harvestId: string) => {
    setShowUnitPerformance((prev) => ({
      ...prev,
      [harvestId]: !prev[harvestId],
    }));
  };

  // Get unit alias from deviceId
  const getUnitAlias = (deviceId: string) => {
    const unit = units.find((u) => u.deviceId === deviceId);
    return unit?.alias || deviceId;
  };

  // Convert HarvestData to HarvestResult format for PDF generation
  const convertToHarvestResult = (harvest: HarvestData): HarvestResult => {
    return {
      success: true,
      branchId: branchId,
      harvestDate:
        harvest.date_range?.end ||
        harvest.last_harvest_date ||
        new Date().toISOString().split("T")[0],
      previousHarvestDate:
        harvest.date_range?.start === "Beginning"
          ? null
          : harvest.date_range?.start || null,
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
    };
  };

  // Generate PDF for a specific harvest with minimal branch info
  const handleGeneratePDF = (harvest: HarvestData) => {
    const harvestResult = convertToHarvestResult(harvest);

    // Use branch info from harvest data if available, otherwise use defaults
    const branchInfo: BranchInfo = {
      branchName: harvest.location || branch?.location || `Branch ${branchId}`,
      managerName: harvest.branch_manager || branch?.branch_manager || "N/A",
      branchAddress: harvest.location || branch?.location || "N/A",
      contactNumber: "N/A",
      sharePercentage: harvest.branchSharePercentage || 0,
    };

    generateCompactBranchHarvestPDF(harvestResult, branchInfo);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="animate-pulse bg-muted rounded-lg p-3">
            <div className="h-4 bg-muted-foreground/20 rounded w-1/4 mb-2"></div>
            <div className="space-y-1.5">
              <div className="h-3 bg-muted-foreground/20 rounded w-3/4"></div>
              <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-destructive/20 bg-destructive/5 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4 text-destructive" />
          <span className="font-semibold">Error Loading Data:</span>
          <span className="text-muted-foreground">{error}</span>
        </div>
      </div>
    );
  }

  if (!harvestData || harvestData.length === 0) {
    return (
      <div className="border border-dashed rounded-lg p-6 text-center">
        <BarChart3 className="h-5 w-5 text-muted-foreground mb-2 mx-auto" />
        <p className="text-sm text-muted-foreground">
          No harvest records found for this branch.
        </p>
      </div>
    );
  }

  // Render function for each harvest item
  const renderHarvestItem = (index: number) => {
    const harvest = harvestData[index];
    const dateRange = harvest.date_range || { start: "N/A", end: "N/A" };
    const unitSummaries = harvest.unit_summaries || [];
    const hasVarianceData = harvest.actualAmountProcessed !== undefined;
    const isPositiveVariance = (harvest.variance ?? 0) >= 0;
    const isUnitPerformanceExpanded = showUnitPerformance[harvest.id] ?? true;

    return (
      <div className="border rounded-lg bg-card shadow-sm mb-3">
        {/* Header - Compact */}
        <div className="border-b p-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base">
                {formatDateRange(dateRange.start, dateRange.end)}
              </h3>
              <p className="text-xs text-muted-foreground font-mono">
                {harvest.month || "N/A"} • {harvest.aggregates_included || 0}{" "}
                agg • {harvest.sales_count || 0} sales •{" "}
                {harvest.units_count || 0} units
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xl font-bold text-green-600">
                ₱{(harvest.total || 0).toLocaleString()}
              </div>
              <button
                onClick={() => handleGeneratePDF(harvest)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Download PDF Report"
              >
                <FileDown className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-3">
          {/* Variance - More Compact */}
          {hasVarianceData && (
            <div className="mb-3 p-2 bg-muted/20 rounded-lg border text-xs">
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

          {/* Coin Summary - Tabular Format */}
          <div className="mb-3 p-3 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-sm text-muted-foreground">
                Coin Breakdown
              </span>
            </div>
            <CoinBreakdownTable
              coins_1={harvest.coins_1}
              coins_5={harvest.coins_5}
              coins_10={harvest.coins_10}
              coins_20={harvest.coins_20}
            />
          </div>

          {/* Revenue Share - Compact */}
          {harvest.branchSharePercentage > 0 && (
            <div className="mb-3 p-2 bg-muted/20 rounded-lg text-xs">
              <span className="font-medium text-muted-foreground mr-2">
                Revenue:
              </span>
              <span className="text-green-600 font-medium">
                Branch ({harvest.branchSharePercentage}%): ₱
                {(
                  (harvest.total || 0) *
                  (harvest.branchSharePercentage / 100)
                ).toLocaleString()}
              </span>
              <span className="text-muted-foreground/60 mx-2">•</span>
              <span className="text-muted-foreground">
                Company ({100 - harvest.branchSharePercentage}%): ₱
                {(
                  (harvest.total || 0) *
                  ((100 - harvest.branchSharePercentage) / 100)
                ).toLocaleString()}
              </span>
            </div>
          )}

          {/* Unit Summaries - Single Card with Plain Text */}
          {/* Unit Summaries - Single Card with Plain Text */}
          {unitSummaries.length > 0 && (
            <div className="border rounded-lg bg-muted/10 overflow-hidden">
              {" "}
              {/* Add overflow-hidden to container */}
              <button
                onClick={() => toggleUnitPerformance(harvest.id)}
                className="flex items-center justify-between w-full p-2 text-xs font-semibold hover:bg-muted/30 transition-colors rounded-t-lg"
              >
                <span>Unit Performance ({unitSummaries.length})</span>
                {isUnitPerformanceExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
              {isUnitPerformanceExpanded && (
                <div className="border-t overflow-x-auto">
                  {" "}
                  {/* Enable horizontal scrolling */}
                  <div className="min-w-[300px]">
                    {" "}
                    {/* Set minimum width */}
                    {unitSummaries.map((unit, idx) => (
                      <UnitBreakdown
                        key={`${unit.unitId}-${idx}`}
                        unit={unit}
                        unitAlias={getUnitAlias(unit.unitId)}
                        isExpanded={expandedUnits.has(unit.unitId)}
                        onToggle={() => toggleUnit(unit.unitId)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer - Minimal */}
          <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
            Last updated: {formatDate(harvest.last_harvest_date || "N/A")}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Virtuoso
      data={harvestData}
      totalCount={harvestData.length}
      itemContent={renderHarvestItem}
      style={{
        height: "600px",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
      className="[&::-webkit-scrollbar]:hidden"
    />
  );
});

HarvestDataDisplay.displayName = "HarvestDataDisplay";

const BranchHeader = React.memo(
  ({
    branchId,
    branch,
  }: {
    branchId: string;
    branch: BranchData | undefined;
  }) => {
    const [showMapModal, setShowMapModal] = useState(false);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
      if (event.key === "Escape") setShowMapModal(false);
    }, []);

    const handleClickOutside = useCallback((event: MouseEvent) => {
      const modal = document.querySelector("[data-map-modal]");
      const trigger = document.querySelector("[data-map-trigger]");
      if (
        modal &&
        !modal.contains(event.target as Node) &&
        trigger &&
        !trigger.contains(event.target as Node)
      ) {
        setShowMapModal(false);
      }
    }, []);

    useEffect(() => {
      if (showMapModal) {
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousedown", handleClickOutside);
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
      }
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("mousedown", handleClickOutside);
        document.body.style.overflow = "unset";
      };
    }, [showMapModal, handleKeyDown, handleClickOutside]);

    return (
      <>
        <div className="mb-4">
          {/* Back Button */}
          <Button asChild variant="ghost" className="mb-3" size="sm">
            <Link href="/branches">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Branches
            </Link>
          </Button>

          {/* Title - Compact */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold text-primary">
                {branch?.location || "Branch"}
              </h1>
            </div>
            <p className="text-muted-foreground text-xs font-mono">
              Monthly performance metrics and transaction summaries
            </p>
          </div>

          {/* FLEX CONTAINER — Units left, Map right */}
          <div className="flex flex-col lg:flex-row gap-3 items-stretch">
            {/* Units Status */}
            <div className="lg:flex-1">
              <BranchUnitsStatus branchId={branchId} />
            </div>

            {/* Map - Smaller */}
            <div className="lg:w-1/2 z-0">
              <button
                data-map-trigger
                onClick={() => setShowMapModal(true)}
                className="w-full h-40 rounded-lg border border-border overflow-hidden hover:shadow-lg transition-all bg-card hover:scale-[1.02]"
              >
                {branch?.latitude && branch?.longitude ? (
                  <div className="w-full h-full pointer-events-none">
                    <CompactMap
                      initialCoords={[branch.latitude, branch.longitude]}
                      showSearch={false}
                      showCoordinates={false}
                      className="h-full"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </button>
              <p className="text-xs text-muted-foreground text-center mt-1">
                Click to expand
              </p>
            </div>
          </div>
        </div>

        {/* Full Map Modal */}
        {showMapModal && branch && (
          <MapModal
            open={showMapModal}
            onClose={() => setShowMapModal(false)}
            branch={branch}
            data-map-modal
          />
        )}
      </>
    );
  }
);

BranchHeader.displayName = "BranchHeader";

const BranchPage = () => {
  const params = useParams();
  const branchId = params?.branchId;
  const { data: branches } = useBranches();
  const branch = branches?.find((b) => b.id === branchId);

  // Type guard: ensure branchId is a string
  if (!branchId || Array.isArray(branchId)) {
    return (
      <div className="space-y-3">
        <Card>
          <CardHeader>
            <CardTitle>Branch Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border border-destructive/20 bg-destructive/5 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-destructive" />
                <span className="font-semibold">Invalid Branch ID</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-8 mt-4 sm:px-1 lg:px-32">
      <BranchHeader branchId={branchId} branch={branch} />
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Harvest History</CardTitle>
        </CardHeader>
        <CardContent>
          <HarvestDataDisplay branchId={branchId} />
        </CardContent>
      </Card>
    </div>
  );
};

export default BranchPage;
