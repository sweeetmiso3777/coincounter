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
} from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import { useBranchHarvestData } from "@/hooks/use-branch-harvest-data";
import { useUnits } from "@/hooks/use-units-query";
import { BranchData, useBranches } from "@/hooks/use-branches-query";
import { formatDateRange, formatDate } from "@/lib/date-utils";
import { MapModal } from "@/components/Branch/MapModal";
import CompactMap from "@/components/Branch/CompactMap";
import { BranchUnitsStatus } from "@/components/Branch/branch-units";

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
            ₱{(unit.total_amount || 0).toFixed(2)}
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

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t">
          {/* Coin Breakdown */}
          <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
            <div className="text-center p-2 bg-muted rounded-lg">
              <div className="font-bold">{unit.coins_1 || 0}</div>
              <div className="text-foreground">₱1</div>
              <div className="text-green-600 font-medium">
                ₱{(unit.coins_1 || 0).toFixed(2)}
              </div>
            </div>
            <div className="text-center p-2 bg-muted rounded-lg">
              <div className="font-bold">{unit.coins_5 || 0}</div>
              <div className="text-foreground">₱5</div>
              <div className="text-green-600 font-medium">
                ₱{((unit.coins_5 || 0) * 5).toFixed(2)}
              </div>
            </div>
            <div className="text-center p-2 bg-muted rounded-lg">
              <div className="font-bold">{unit.coins_10 || 0}</div>
              <div className="text-foreground">₱10</div>
              <div className="text-green-600 font-medium">
                ₱{((unit.coins_10 || 0) * 10).toFixed(2)}
              </div>
            </div>
            <div className="text-center p-2 bg-muted rounded-lg">
              <div className="font-bold">{unit.coins_20 || 0}</div>
              <div className="text-foreground">₱20</div>
              <div className="text-green-600 font-medium">
                ₱{((unit.coins_20 || 0) * 20).toFixed(2)}
              </div>
            </div>
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
const HarvestDataDisplay = React.memo(({ branchId }: { branchId: string }) => {
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
      <div className="space-y-3">
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
      <div className="border border-destructive/20 bg-destructive/5 rounded-xl p-6">
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
      <div className="border border-dashed rounded-xl p-8 text-center">
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
    <div className="space-y-4">
      {harvestData.map((harvest) => {
        const dateRange = harvest.date_range || { start: "N/A", end: "N/A" };
        const unitSummaries = harvest.unit_summaries || [];
        const hasVarianceData = harvest.actualAmountProcessed !== undefined;
        const isPositiveVariance = (harvest.variance ?? 0) >= 0;

        return (
          <div key={harvest.id} className="border rounded-xl bg-card shadow-sm">
            {/* Header */}
            <div className="border-b p-4 bg-muted/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="font-bold text-lg text-foreground">
                    {formatDateRange(dateRange.start, dateRange.end)}
                  </h3>
                  <p className="text-sm text-foreground font-mono">
                    {harvest.month || "N/A"} •{" "}
                    {harvest.aggregates_included || 0} aggregates
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    ₱{harvest.total?.toFixed(2) || "0.00"}
                  </div>
                  <div className="text-sm text-foreground">
                    {harvest.sales_count || 0} sales
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4">
              {hasVarianceData && (
                <div className="mb-4 p-4 bg-muted/30 rounded-xl border-2 border-dashed">
                  <div className="flex items-center gap-2 mb-3">
                    {isPositiveVariance ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                    <h4 className="font-semibold text-sm">Variance Analysis</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div className="p-3 bg-card rounded-lg border">
                      <div className="text-xs text-foreground mb-1">
                        Expected Amount
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        ₱{harvest.total?.toFixed(2) || "0.00"}
                      </div>
                    </div>
                    <div className="p-3 bg-card rounded-lg border">
                      <div className="text-xs text-foreground mb-1">
                        Actual Amount
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        ₱{harvest.actualAmountProcessed?.toFixed(2) || "0.00"}
                      </div>
                    </div>
                    <div className="p-3 bg-card rounded-lg border">
                      <div className="text-xs text-foreground mb-1">
                        Variance
                      </div>
                      <div
                        className={`text-lg font-bold ${
                          isPositiveVariance ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isPositiveVariance ? "+" : ""}₱
                        {harvest.variance?.toFixed(2) || "0.00"}
                      </div>
                      <div
                        className={`text-xs ${
                          isPositiveVariance ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        ({isPositiveVariance ? "+" : ""}
                        {harvest.variancePercentage?.toFixed(2) || "0.00"}%)
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Stats - Compact */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div className="text-center p-3 bg-muted rounded-xl">
                  <div className="text-2xl font-bold text-foreground">
                    {harvest.coins_1 || 0}
                  </div>
                  <div className="text-xs text-foreground">₱1 Coins</div>
                  <div className="text-xs text-green-600 font-medium">
                    ₱{(harvest.coins_1 || 0).toFixed(2)}
                  </div>
                </div>
                <div className="text-center p-3 bg-muted rounded-xl">
                  <div className="text-2xl font-bold text-foreground">
                    {harvest.coins_5 || 0}
                  </div>
                  <div className="text-xs text-foreground">₱5 Coins</div>
                  <div className="text-xs text-green-600 font-medium">
                    ₱{((harvest.coins_5 || 0) * 5).toFixed(2)}
                  </div>
                </div>
                <div className="text-center p-3 bg-muted rounded-xl">
                  <div className="text-2xl font-bold text-foreground">
                    {harvest.coins_10 || 0}
                  </div>
                  <div className="text-xs text-foreground">₱10 Coins</div>
                  <div className="text-xs text-green-600 font-medium">
                    ₱{((harvest.coins_10 || 0) * 10).toFixed(2)}
                  </div>
                </div>
                <div className="text-center p-3 bg-muted rounded-xl">
                  <div className="text-2xl font-bold text-foreground">
                    {harvest.coins_20 || 0}
                  </div>
                  <div className="text-xs text-foreground">₱20 Coins</div>
                  <div className="text-xs text-green-600 font-medium">
                    ₱{((harvest.coins_20 || 0) * 20).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Revenue Share - Compact */}
              {harvest.branchSharePercentage > 0 && (
                <div className="mb-4 p-3 bg-muted rounded-xl border">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm">
                    <span className="font-medium text-green-700">
                      Revenue Share
                    </span>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                      <span className="text-green-600">
                        Branch ({harvest.branchSharePercentage}%): ₱
                        {(
                          (harvest.total || 0) *
                          (harvest.branchSharePercentage / 100)
                        ).toFixed(2)}
                      </span>
                      <span className="text-foreground">
                        Company ({100 - harvest.branchSharePercentage}%): ₱
                        {(
                          (harvest.total || 0) *
                          ((100 - harvest.branchSharePercentage) / 100)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Unit Summaries - Collapsible */}
              {unitSummaries.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowUnitPerformance(!showUnitPerformance)}
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
                  Last updated: {formatDate(harvest.last_harvest_date || "N/A")}
                </span>
                <span>Units: {harvest.units_count || 0}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
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
        <div className="mb-6">
          {/* Back Button */}
          <Button asChild variant="ghost" className="mb-4" size="sm">
            <Link href="/branches">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Branches
            </Link>
          </Button>

          {/* Title */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2 font-mono">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground text-balance">
                {branch?.location || "Branch"}
              </h1>
            </div>
            <p className="text-foreground text-sm font-mono">
              Monthly performance metrics and transaction summaries
            </p>
          </div>

          {/* FLEX CONTAINER — Units left, Map right */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch">
            {/* Units Status */}
            <div className="lg:flex-1">
              <BranchUnitsStatus branchId={branchId} />
            </div>

            {/* Map */}
            <div className="lg:w-1/2 z-0">
              <button
                data-map-trigger
                onClick={() => setShowMapModal(true)}
                className="w-full h-48 rounded-lg border border-border overflow-hidden hover:shadow-lg transition-all bg-card hover:scale-[1.02]"
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

BranchHeader.displayName = "BranchHeader";

const BranchPage = () => {
  const params = useParams();
  const branchId = params?.branchId;
  const { data: branches } = useBranches();
  const branch = branches?.find((b) => b.id === branchId);

  // Type guard: ensure branchId is a string
  if (!branchId || Array.isArray(branchId)) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Branch Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border border-destructive/20 bg-destructive/5 rounded-xl p-6">
              <div className="flex flex-col items-center text-center">
                <Activity className="h-6 w-6 text-destructive mb-2" />
                <h3 className="text-base font-semibold mb-1">
                  Invalid Branch ID
                </h3>
                <p className="text-foreground text-sm">
                  The branch ID is missing or invalid.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-16 mt-7 sm:px-24 lg:px-50">
      <BranchHeader branchId={branchId} branch={branch} />
      <Card>
        <CardHeader>
          <CardTitle>Harvest History</CardTitle>
        </CardHeader>
        <CardContent>
          <HarvestDataDisplay branchId={branchId} />
        </CardContent>
      </Card>
    </div>
  );
};

export default BranchPage;
