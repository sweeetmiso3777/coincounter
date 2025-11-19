"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MapPin,
  Activity,
  BarChart3,
  Users,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import { useAffiliatedBranches } from "@/hooks/use-affiliated-branches";
import { MapModal } from "@/components/Branch/Maps/MapModal";
import CompactMap from "@/components/Branch/Maps/CompactMap";
import { BranchUnitsStatus } from "@/components/Branch/branch-units";
import type { BranchData } from "@/hooks/use-branches-query";
import { useBranchHarvestData } from "@/hooks/use-branch-harvest-data";
import { useUnits } from "@/hooks/use-units-query";
import { Background } from "@/components/Background";

// ========== DATE FORMATTING FUNCTION ==========
const formatDate = (dateString: string): string => {
  if (!dateString || dateString === "N/A") return "N/A";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
};

const formatDateRange = (start: string, end: string): string => {
  const formattedStart = formatDate(start);
  const formattedEnd = formatDate(end);
  return `${formattedStart} To ${formattedEnd}`;
};

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
          <div className="font-semibold text-foreground">Coin</div>
          <div className="font-semibold text-foreground text-right">Qty</div>
          <div className="font-semibold text-foreground text-right">Value</div>
          <div className="font-semibold text-foreground text-right">Total</div>
          <div className="font-semibold text-foreground text-right">%</div>

          {/* 1 Peso */}
          <div>₱1</div>
          <div className="text-right">
            {coinValues.coins_1.toLocaleString()}
          </div>
          <div className="text-right">₱1</div>
          <div className="text-right">
            ₱{coinTotals.coins_1.toLocaleString()}
          </div>
          <div className="text-right text-foreground">
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
          <div className="text-right text-foreground">
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
          <div className="text-right text-foreground">
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
          <div className="text-right text-foreground">
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
        <div className="font-semibold text-foreground">Coin Type</div>
        <div className="font-semibold text-foreground text-right">Quantity</div>
        <div className="font-semibold text-foreground text-right">
          Total Value
        </div>
        <div className="font-semibold text-foreground text-right">
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
          <div className="text-right text-foreground">
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
          <div className="text-right text-foreground">
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
          <div className="text-right text-foreground">
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
          <div className="text-right text-foreground">
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

// ========== PARTNER BRANCH HEADER ==========
const PartnerBranchHeader = React.memo(
  ({
    branchId,
    location,
    branch,
  }: {
    branchId: string;
    location: string;
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
      )
        setShowMapModal(false);
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
        <div className="mb-6 relative z-10">
          {/* Back Button */}
          <Button asChild variant="ghost" className="mb-4" size="sm">
            <Link href="/partner">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Partner Dashboard
            </Link>
          </Button>
          {/* Title */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2 font-mono">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground text-balance">
                  {location}
                </h1>
                {branch && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-600">
                        Your Share: {branch.share}% • Owner Share:{" "}
                        {100 - branch.share}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-foreground" />
                      <span className="text-foreground">
                        Managed by: {branch.branch_manager}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <p className="text-foreground text-sm font-mono">
              Your affiliate branch performance and earnings summary
            </p>
          </div>
          {/* FLEX CONTAINER — Units left, Map right */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch">
            {/* Units Status */}
            <div className="lg:flex-1">
              <BranchUnitsStatus branchId={branchId} />
            </div>

            {/* Map */}
            <div className="lg:w-1/2 relative z-0">
              <button
                data-map-trigger
                onClick={() => setShowMapModal(true)}
                className="w-full h-48 rounded-lg border border-border overflow-hidden hover:shadow-lg transition-all bg-card hover:scale-[1.02] relative z-0"
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
                    <MapPin className="h-6 w-6 text-foreground" />
                    <span className="sr-only">No location data</span>
                  </div>
                )}
              </button>
              <p className="text-xs text-foreground text-center mt-1">
                Click map to expand
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

PartnerBranchHeader.displayName = "PartnerBranchHeader";

// ========== UNIT BREAKDOWN COMPONENT ==========
interface UnitSummary {
  unitId: string;
  aggregates_count: number;
  total_sales: number;
  total_amount: number;
  coins_1: number;
  coins_5: number;
  coins_10: number;
  coins_20: number;
  date_range: {
    start: string;
    end: string;
  };
}

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
    <div className="border rounded-xl bg-card">
      {/* Unit Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <div>
            <span className="font-medium text-sm">{unitAlias}</span>
            <span className="text-xs text-foreground ml-2 font-mono">
              ({unit.unitId})
            </span>
          </div>
          <span className="text-sm font-bold text-green-600">
            ₱{(unit.total_amount || 0).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-foreground">
          <span>{unit.aggregates_count || 0} aggregates</span>
          <span>{unit.total_sales || 0} sales</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 border-t">
          {/* Coin Breakdown using tabular format */}
          <div className="mt-3 p-2 bg-muted/20 rounded-lg">
            <CoinBreakdownTable
              coins_1={unit.coins_1}
              coins_5={unit.coins_5}
              coins_10={unit.coins_10}
              coins_20={unit.coins_20}
              compact={true}
            />
          </div>

          {/* Date Range */}
          <div className="mt-2 text-xs text-foreground text-center">
            {formatDateRange(unitDateRange.start, unitDateRange.end)}
          </div>
        </div>
      )}
    </div>
  );
};

// ========== HARVEST DATA DISPLAY ==========
const HarvestDataDisplay = React.memo(
  ({ branchId, branchShare }: { branchId: string; branchShare: number }) => {
    const {
      data: harvestData,
      isLoading,
      error,
    } = useBranchHarvestData(branchId);

    const { units } = useUnits();
    const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
    const [showUnitPerformance, setShowUnitPerformance] = useState(true);

    const toggleUnit = (unitId: string) => {
      const newExpanded = new Set(expandedUnits);
      if (newExpanded.has(unitId)) {
        newExpanded.delete(unitId);
      } else {
        newExpanded.add(unitId);
      }
      setExpandedUnits(newExpanded);
    };

    // Get unit alias from deviceId
    const getUnitAlias = (deviceId: string) => {
      const unit = units.find((u) => u.deviceId === deviceId);
      return unit?.alias || deviceId;
    };

    if (isLoading) {
      return (
        <div className="space-y-3 relative z-10">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="animate-pulse bg-muted rounded-xl p-4">
              <div className="h-5 bg-muted/50 rounded w-1/4 mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted/50 rounded w-3/4"></div>
                <div className="h-4 bg-muted/50 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="border border-destructive/20 bg-destructive/5 rounded-xl p-6 relative z-10">
          <div className="flex flex-col items-center text-center">
            <Activity className="h-6 w-6 text-destructive mb-2" />
            <h3 className="text-base font-semibold mb-1">Error Loading Data</h3>
            <p className="text-foreground text-sm">{error}</p>
          </div>
        </div>
      );
    }

    if (!harvestData || harvestData.length === 0) {
      return (
        <div className="border border-dashed rounded-xl p-8 text-center relative z-10">
          <BarChart3 className="h-6 w-6 text-foreground mb-2 mx-auto" />
          <h3 className="text-base font-semibold mb-1">
            No Harvest Data Available
          </h3>
          <p className="text-foreground text-sm">
            No harvest records found for this branch.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4 relative z-10">
        {harvestData.map((harvest) => {
          const dateRange = harvest.date_range || { start: "N/A", end: "N/A" };
          const unitSummaries = harvest.unit_summaries || [];
          const totalRevenue = harvest.total || 0;

          const partnerEarnings = totalRevenue * (branchShare / 100);
          const ownerEarnings = totalRevenue * ((100 - branchShare) / 100);

          const hasVarianceData = harvest.actualAmountProcessed !== undefined;
          const isPositiveVariance = (harvest.variance ?? 0) >= 0;

          return (
            <div
              key={harvest.id}
              className="border rounded-xl bg-card shadow-sm"
            >
              {/* Header */}
              <div className="border-b p-4 bg-muted/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-lg text-foreground">
                      {formatDateRange(dateRange.start, dateRange.end)}
                    </h3>
                    <p className="text-sm text-foreground font-mono">
                      {harvest.month || "N/A"} •{" "}
                      {harvest.aggregates_included || 0} aggregates •{" "}
                      {harvest.sales_count || 0} sales •{" "}
                      {harvest.units_count || 0} units
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      ₱{totalRevenue.toLocaleString()}
                    </div>
                    <div className="text-sm text-foreground">Total Revenue</div>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {hasVarianceData && (
                  <div className="mb-4 p-3 bg-muted/20 rounded-xl border text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-foreground">
                          Expected: ₱{totalRevenue.toLocaleString()}
                        </span>
                        <span className="text-blue-600 font-medium">
                          Actual: ₱
                          {(
                            harvest.actualAmountProcessed || 0
                          ).toLocaleString()}
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
                            isPositiveVariance
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {isPositiveVariance ? "+" : ""}₱
                          {(harvest.variance || 0).toLocaleString()}
                        </span>
                        <span
                          className={`${
                            isPositiveVariance
                              ? "text-green-600"
                              : "text-red-600"
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
                <div className="mb-4 p-3 bg-muted/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-sm text-foreground">
                      Coin Breakdown
                    </span>
                  </div>
                  <CoinBreakdownTable
                    coins_1={harvest.coins_1}
                    coins_5={harvest.coins_5}
                    coins_10={harvest.coins_10}
                    coins_20={harvest.coins_20}
                    compact={true}
                  />
                </div>

                <div className="mb-4 grid grid-cols-2 gap-2">
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="text-xs font-medium text-green-700 mb-1">
                      Your Earnings
                    </div>
                    <div className="flex items-baseline gap-1">
                      <div className="text-xl font-bold text-green-600">
                        ₱{partnerEarnings.toLocaleString()}
                      </div>
                      <span className="text-xs text-green-600">
                        ({branchShare}%)
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="text-xs font-medium text-blue-700 mb-1">
                      Owner Share
                    </div>
                    <div className="flex items-baseline gap-1">
                      <div className="text-xl font-bold text-blue-600">
                        ₱{ownerEarnings.toLocaleString()}
                      </div>
                      <span className="text-xs text-blue-600">
                        ({100 - branchShare}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Unit Summaries - Collapsible */}
                {unitSummaries.length > 0 && (
                  <div>
                    <button
                      onClick={() =>
                        setShowUnitPerformance(!showUnitPerformance)
                      }
                      className="flex items-center gap-2 text-sm font-semibold mb-3 text-foreground hover:text-foreground transition-colors"
                    >
                      {showUnitPerformance ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      Unit Performance ({unitSummaries.length} units)
                    </button>

                    {showUnitPerformance && (
                      <div className="space-y-2">
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
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="mt-4 pt-3 border-t text-xs text-foreground flex justify-between">
                  <span>
                    Last updated:{" "}
                    {formatDate(harvest.last_harvest_date || "N/A")}
                  </span>
                  <span>Units: {harvest.units_count || 0}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);

HarvestDataDisplay.displayName = "HarvestDataDisplay";

// ========== MAIN PARTNER PAGE ==========
function PartnerBranchDetailPage() {
  const { partnerId } = useParams<{ partnerId: string }>();
  const { branches, isLoading: branchesLoading } = useAffiliatedBranches();

  const branch = branches?.find((b) => b.id === partnerId);
  const branchLocation = branch?.location || `Branch ${partnerId}`;

  const isLoading = branchesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-6 animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/4"></div>
          <div className="h-8 bg-muted rounded-md"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 bg-muted rounded-md"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!branch)
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <PartnerBranchHeader
            branchId={partnerId as string}
            location={branchLocation}
            branch={branch}
          />
          <div className="border border-destructive/20 bg-destructive/5 rounded-xl p-8 text-center">
            <Activity className="h-8 w-8 text-destructive mb-3 mx-auto" />
            <h3 className="text-lg font-semibold mb-2">Branch Not Found</h3>
            <p className="text-foreground text-sm mb-4">
              You do not have access to this branch or it does not exist.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/partner">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Partner Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen relative">
      {/* Background - placed at the very bottom */}
      <div className="absolute inset-0 z-0">
        <Background />
      </div>

      {/* Content - with higher z-index */}
      <div className="relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <PartnerBranchHeader
            branchId={partnerId as string}
            location={branchLocation}
            branch={branch}
          />
          <HarvestDataDisplay
            branchId={partnerId as string}
            branchShare={branch.share}
          />
        </div>
      </div>
    </div>
  );
}

export default PartnerBranchDetailPage;
