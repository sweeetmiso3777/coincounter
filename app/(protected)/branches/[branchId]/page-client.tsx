"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Download,
  Users,
  Calendar,
  Percent,
  Coins,
  DollarSign,
  Layers,
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
import { MapModal } from "@/components/Branch/Maps/MapModal";
import CompactMap from "@/components/Branch/Maps/CompactMap";
import { BranchUnitsStatus } from "@/components/Branch/branch-units";
import {
  generateCompactBranchHarvestPDF,
  generateBranchHarvestPDF,
} from "@/lib/branch-reports";
import type { HarvestResult, BranchInfo } from "@/hooks/use-branch-harvest";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UnitSummary {
  unitId: string;
  total_amount?: number;
  aggregates_count?: number;
  total_sales?: number;
  coins_1?: number;
  coins_5?: number;
  coins_10?: number;
  coins_20?: number;
  date_range?: { start: string; end: string };
}

type TabId = "overview" | "harvests" | "units";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNextHarvestDate(harvestDay: number): Date {
  const now = new Date();
  let d = new Date(now.getFullYear(), now.getMonth(), harvestDay);
  if (harvestDay < now.getDate())
    d = new Date(now.getFullYear(), now.getMonth() + 1, harvestDay);
  if (d.getDate() !== harvestDay)
    d = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return d;
}

// ─── Coin Breakdown ───────────────────────────────────────────────────────────

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
  const rows = [
    { label: compact ? "₱1" : "₱1 Coins", qty: coins_1, val: 1 },
    { label: compact ? "₱5" : "₱5 Coins", qty: coins_5, val: 5 },
    { label: compact ? "₱10" : "₱10 Coins", qty: coins_10, val: 10 },
    { label: compact ? "₱20" : "₱20 Coins", qty: coins_20, val: 20 },
  ];
  const grandTotal = rows.reduce((s, r) => s + r.qty * r.val, 0);

  if (compact) {
    return (
      <div className="font-mono text-xs">
        <div className="grid grid-cols-5 gap-1 mb-1">
          {["Coin", "Qty", "Val", "Total", "%"].map((h) => (
            <div
              key={h}
              className={cn(
                "text-[10px] font-medium text-muted-foreground",
                h !== "Coin" && "text-right"
              )}
            >
              {h}
            </div>
          ))}
        </div>
        {rows.map((r) => {
          const total = r.qty * r.val;
          const pct = grandTotal > 0 ? ((total / grandTotal) * 100).toFixed(1) : "0";
          return (
            <div key={r.label} className="grid grid-cols-5 gap-1">
              <div>{r.label}</div>
              <div className="text-right">{r.qty.toLocaleString()}</div>
              <div className="text-right">₱{r.val}</div>
              <div className="text-right">₱{total.toLocaleString()}</div>
              <div className="text-right text-muted-foreground">{pct}%</div>
            </div>
          );
        })}
        <div className="grid grid-cols-5 gap-1 border-t mt-1 pt-1 font-semibold">
          <div className="col-span-3 text-muted-foreground">Total</div>
          <div className="col-span-2 text-right text-emerald-600 dark:text-emerald-400">
            ₱{grandTotal.toLocaleString()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <table className="w-full text-xs font-mono">
      <thead>
        <tr className="border-b border-border/50">
          {["Coin type", "Quantity", "Total value", "Share"].map((h) => (
            <th
              key={h}
              className={cn(
                "pb-1.5 text-[11px] font-medium text-muted-foreground",
                h !== "Coin type" && "text-right"
              )}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border/30">
        {rows.map((r) => {
          const total = r.qty * r.val;
          const pct = grandTotal > 0 ? ((total / grandTotal) * 100).toFixed(1) : "0";
          return (
            <tr key={r.label}>
              <td className="py-1.5">{r.label}</td>
              <td className="py-1.5 text-right">{r.qty.toLocaleString()}</td>
              <td className="py-1.5 text-right">₱{total.toLocaleString()}</td>
              <td className="py-1.5 text-right text-muted-foreground">{pct}%</td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr className="border-t border-border font-semibold">
          <td colSpan={2} className="pt-1.5">Grand total</td>
          <td className="pt-1.5 text-right text-emerald-600 dark:text-emerald-400">
            ₱{grandTotal.toLocaleString()}
          </td>
          <td className="pt-1.5 text-right">100%</td>
        </tr>
      </tfoot>
    </table>
  );
};

// ─── Unit breakdown row ───────────────────────────────────────────────────────

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
  const dateRange = unit.date_range || { start: "N/A", end: "N/A" };
  return (
    <div className="border-b border-border/40 last:border-b-0">
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
          <span className="text-xs font-medium text-foreground truncate">{unitAlias}</span>
          <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">
            {unit.unitId}
          </span>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 ml-1">
            ₱{(unit.total_amount || 0).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            {unit.aggregates_count || 0} sums · {unit.total_sales || 0} sales
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </div>
      </div>
      {isExpanded && (
        <div className="px-3 pb-3 pl-8 space-y-2">
          <CoinBreakdownTable
            coins_1={unit.coins_1}
            coins_5={unit.coins_5}
            coins_10={unit.coins_10}
            coins_20={unit.coins_20}
            compact
          />
          <p className="text-[11px] text-muted-foreground">
            {formatDateRange(dateRange.start, dateRange.end)}
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Export dropdown ──────────────────────────────────────────────────────────

const ExportDropdown = ({
  onCompact,
  onDetailed,
}: {
  onCompact: () => void;
  onDetailed: () => void;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-border rounded-md hover:bg-muted transition-colors"
      >
        <FileDown className="w-3.5 h-3.5" />
        Export
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-lg shadow-lg z-10 min-w-[140px] py-1">
          <button
            onClick={() => { onCompact(); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center gap-2 transition-colors"
          >
            <Download className="w-3 h-3" />
            Compact PDF
          </button>
          <button
            onClick={() => { onDetailed(); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center gap-2 transition-colors"
          >
            <FileDown className="w-3 h-3" />
            Detailed PDF
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Harvest card ─────────────────────────────────────────────────────────────

const HarvestCard = ({
  harvest,
  getUnitAlias,
  onExportCompact,
  onExportDetailed,
}: {
  harvest: HarvestData;
  getUnitAlias: (id: string) => string;
  onExportCompact: () => void;
  onExportDetailed: () => void;
}) => {
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [showUnits, setShowUnits] = useState(true);

  const dateRange = harvest.date_range || { start: "N/A", end: "N/A" };
  const unitSummaries = harvest.unit_summaries || [];
  const hasVariance = harvest.actualAmountProcessed !== undefined;
  const positiveVariance = (harvest.variance ?? 0) >= 0;

  const toggleUnit = (id: string) =>
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden mb-3">

      {/* Card header */}
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border bg-muted/30">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">
            {formatDateRange(dateRange.start, dateRange.end)}
          </p>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            {harvest.month || "N/A"} &middot; {harvest.aggregates_included || 0} summaries &middot;{" "}
            {harvest.sales_count || 0} sales &middot; {harvest.units_count || 0} units
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
            ₱{(harvest.total || 0).toLocaleString()}
          </span>
          <ExportDropdown onCompact={onExportCompact} onDetailed={onExportDetailed} />
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* Variance row */}
        {hasVariance && (
          <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2 text-xs flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                Expected <span className="font-medium text-foreground">₱{(harvest.total || 0).toLocaleString()}</span>
              </span>
              <span className="text-muted-foreground">
                Actual <span className="font-medium text-blue-600 dark:text-blue-400">₱{(harvest.actualAmountProcessed || 0).toLocaleString()}</span>
              </span>
            </div>
            <div className={cn(
              "flex items-center gap-1 font-semibold",
              positiveVariance ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            )}>
              {positiveVariance
                ? <TrendingUp className="w-3.5 h-3.5" />
                : <TrendingDown className="w-3.5 h-3.5" />}
              {positiveVariance ? "+" : ""}₱{(harvest.variance || 0).toLocaleString()}
              <span className="font-normal text-[11px]">
                ({positiveVariance ? "+" : ""}{harvest.variancePercentage?.toFixed(2) || "0.00"}%)
              </span>
            </div>
          </div>
        )}

        {/* Coin breakdown */}
        <div className="rounded-md border border-border overflow-hidden">
          <div className="px-3 py-2 bg-muted/30 border-b border-border">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Coin breakdown
            </p>
          </div>
          <div className="p-3">
            <CoinBreakdownTable
              coins_1={harvest.coins_1}
              coins_5={harvest.coins_5}
              coins_10={harvest.coins_10}
              coins_20={harvest.coins_20}
            />
          </div>
        </div>

        {/* Revenue share */}
        {harvest.branchSharePercentage > 0 && (
          <div className="rounded-md border border-border bg-muted/20 px-3 py-2.5 text-xs flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-muted-foreground font-medium">Revenue split</span>
            <span className="text-foreground">
              Branch ({harvest.branchSharePercentage}%) —{" "}
              <strong>₱{((harvest.total || 0) * (harvest.branchSharePercentage / 100)).toLocaleString()}</strong>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400">
              Your share ({100 - harvest.branchSharePercentage}%) —{" "}
              <strong>₱{((harvest.total || 0) * ((100 - harvest.branchSharePercentage) / 100)).toLocaleString()}</strong>
            </span>
          </div>
        )}

        {/* Unit performance */}
        {unitSummaries.length > 0 && (
          <div className="rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setShowUnits((v) => !v)}
              className="flex items-center justify-between w-full px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors border-b border-border"
            >
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Unit performance ({unitSummaries.length})
              </span>
              {showUnits
                ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
            {showUnits && (
              <div>
                {unitSummaries.map((unit, i) => (
                  <UnitBreakdown
                    key={`${unit.unitId}-${i}`}
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
        <p className="text-[11px] text-muted-foreground">
          Last updated: {formatDate(harvest.last_harvest_date || "N/A")}
        </p>
      </div>
    </div>
  );
};

// ─── Harvest history tab ──────────────────────────────────────────────────────

const HarvestDataDisplay = React.memo(({ branchId }: { branchId: string }) => {
  const { data: harvestData, isLoading, error } = useBranchHarvestData(branchId);
  const { units } = useUnits();
  const { data: branches } = useBranches();
  const branch = branches?.find((b) => b.id === branchId);

  const getUnitAlias = (deviceId: string) => {
    const unit = units.find((u) => u.deviceId === deviceId);
    return unit?.alias || deviceId;
  };

  const convertToHarvestResult = (harvest: HarvestData): HarvestResult => {
    const determineHarvestMode = (): "normal" | "include_today" | "backdate" => {
      const today = new Date().toISOString().split("T")[0];
      const harvestDate = harvest.last_harvest_date || harvest.date_range?.end || "";
      if (harvestDate === today) return "include_today";
      if (harvest.date_range?.start && harvest.date_range?.start !== "Beginning") {
        const diff = Math.floor(
          (new Date(harvestDate).getTime() - new Date(harvest.date_range.start).getTime()) /
            86400000
        );
        if (diff < 0) return "backdate";
      }
      return "normal";
    };

    return {
      success: true,
      branchId,
      harvestDate: harvest.date_range?.end || harvest.last_harvest_date || new Date().toISOString().split("T")[0],
      previousHarvestDate: harvest.date_range?.start === "Beginning" ? null : harvest.date_range?.start || null,
      harvestMode: determineHarvestMode(),
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
        last_harvest_date: harvest.last_harvest_date || harvest.date_range?.end || "",
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

  const handlePDF = (harvest: HarvestData, format: "compact" | "detailed") => {
    const result = convertToHarvestResult(harvest);
    const branchInfo: BranchInfo = {
      branchName: harvest.location || branch?.location || `Branch ${branchId}`,
      managerName: harvest.branch_manager || branch?.branch_manager || "N/A",
      branchAddress: harvest.location || branch?.location || "N/A",
      contactNumber: "N/A",
      sharePercentage: harvest.branchSharePercentage || 0,
    };
    if (format === "detailed") {
      const hasDetailed = harvest.unitAggregates && Object.keys(harvest.unitAggregates).length > 0;
      generateBranchHarvestPDF(result, branchInfo, hasDetailed);
    } else {
      generateCompactBranchHarvestPDF(result, branchInfo);
    }
  };

  if (isLoading) {
    return (
      <div className="p-5 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5">
        <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
          <Activity className="w-4 h-4 flex-shrink-0" />
          <span><strong>Error:</strong> {error}</span>
        </div>
      </div>
    );
  }

  if (!harvestData || harvestData.length === 0) {
    return (
      <div className="p-5">
        <div className="rounded-lg border border-dashed border-border p-12 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No harvest records</p>
          <p className="text-xs text-muted-foreground">No harvest history found for this branch.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5">
      <Virtuoso
        data={harvestData}
        totalCount={harvestData.length}
        itemContent={(_, harvest) => (
          <HarvestCard
            harvest={harvest}
            getUnitAlias={getUnitAlias}
            onExportCompact={() => handlePDF(harvest, "compact")}
            onExportDetailed={() => handlePDF(harvest, "detailed")}
          />
        )}
        style={{ height: 600, scrollbarWidth: "none", msOverflowStyle: "none" }}
        className="[&::-webkit-scrollbar]:hidden"
      />
    </div>
  );
});

HarvestDataDisplay.displayName = "HarvestDataDisplay";

// ─── Overview tab ─────────────────────────────────────────────────────────────

const TabOverview = ({
  branchId,
  branch,
}: {
  branchId: string;
  branch: BranchData | undefined;
}) => {
  const [showMapModal, setShowMapModal] = useState(false);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setShowMapModal(false);
  }, []);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    const modal = document.querySelector("[data-map-modal]");
    const trigger = document.querySelector("[data-map-trigger]");
    if (
      modal &&
      !modal.contains(e.target as Node) &&
      trigger &&
      !trigger.contains(e.target as Node)
    ) {
      setShowMapModal(false);
    }
  }, []);

  useEffect(() => {
    if (showMapModal) {
      document.addEventListener("keydown", handleKey);
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [showMapModal, handleKey, handleClickOutside]);

  const harvestDate = branch?.harvest_day_of_month
    ? getNextHarvestDate(branch.harvest_day_of_month)
    : null;
  const affiliateCount = branch?.affiliates?.length || 0;

  return (
    <div className="p-5 space-y-5">
      {/* Info grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
            Branch manager
          </p>
          <p className="text-sm font-medium text-foreground">
            {branch?.branch_manager || "—"}
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
            Next harvest
          </p>
          <p className="text-sm font-medium text-foreground">
            {harvestDate ? formatDate(harvestDate) : "—"}
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
            Your share
          </p>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {branch?.share ? `${branch.share}%` : "—"}
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
            Affiliates
          </p>
          <p className="text-sm font-medium text-foreground">{affiliateCount}</p>
        </div>
      </div>

      {/* Affiliates */}
      {branch?.affiliates && branch.affiliates.length > 0 && (
        <div className="rounded-lg border border-border/50 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-3">
            Affiliates
          </p>
          <div className="flex flex-wrap gap-1.5">
            {branch.affiliates.map((a, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2.5 py-1 rounded bg-muted text-xs text-muted-foreground"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Units + Map side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <div className="px-4 py-3 bg-muted/30 border-b border-border">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Unit status
            </p>
          </div>
          <div className="p-3">
            <BranchUnitsStatus branchId={branchId} />
          </div>
        </div>

        <div className="rounded-lg border border-border/50 overflow-hidden">
          <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Location
            </p>
            <button
              data-map-trigger
              onClick={() => setShowMapModal(true)}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
            >
              Expand map
            </button>
          </div>
          <button
            data-map-trigger
            onClick={() => setShowMapModal(true)}
            className="w-full h-52 block relative hover:opacity-90 transition-opacity z-0"
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
                <MapPin className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
          </button>
        </div>
      </div>

      {showMapModal && branch && (
        <MapModal
          open={showMapModal}
          onClose={() => setShowMapModal(false)}
          branch={branch}
          data-map-modal
        />
      )}
    </div>
  );
};

// ─── Units tab ────────────────────────────────────────────────────────────────

const TabUnits = ({ branchId }: { branchId: string }) => (
  <div className="p-5">
    <BranchUnitsStatus branchId={branchId} />
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "harvests", label: "Harvest history", icon: Layers },
  { id: "units", label: "Units", icon: Activity },
];

const BranchPage = () => {
  const params = useParams();
  const branchId = params?.branchId;
  const { data: branches } = useBranches();
  const branch = branches?.find((b) => b.id === branchId);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Invalid branch id guard
  if (!branchId || Array.isArray(branchId)) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
          <Activity className="w-4 h-4 flex-shrink-0" />
          <span><strong>Invalid branch ID.</strong> Please go back and select a valid branch.</span>
        </div>
      </div>
    );
  }

  const harvestDate = branch?.harvest_day_of_month
    ? getNextHarvestDate(branch.harvest_day_of_month)
    : null;

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/branches" className="text-blue-600 hover:underline">
            Branches
          </Link>
          <span>/</span>
          <span className="text-foreground">{branch?.location || branchId}</span>
        </div>

        {/* Page header card */}
        <div className="rounded-lg bg-card border border-border p-4 md:p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            {/* Identity */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-semibold text-foreground truncate leading-tight">
                  {branch?.location || "Branch"}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    ID: {branchId}
                  </span>
                  {branch?.branch_manager && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-[11px] text-muted-foreground">
                        {branch.branch_manager}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {branch?.share && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                  <Percent className="w-3 h-3" />
                  Your share: {branch.share}%
                </span>
              )}
              <Button asChild variant="ghost" size="sm" className="text-xs h-8 gap-1.5">
                <Link href="/branches">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </Link>
              </Button>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border flex-wrap">
            {harvestDate && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                Next harvest:{" "}
                <strong className="text-foreground">{formatDate(harvestDate)}</strong>
              </div>
            )}
            {(branch?.affiliates?.length ?? 0) > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="w-3 h-3" />
                {branch!.affiliates!.length} affiliate
                {branch!.affiliates!.length !== 1 ? "s" : ""}
              </div>
            )}
            <p className="text-xs text-muted-foreground ml-auto">
              Monthly performance metrics &amp; transaction summaries
            </p>
          </div>
        </div>

        {/* Tabs + content */}
        <div className="rounded-lg bg-card border border-border overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-border px-1 bg-card">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 -mb-px transition-colors",
                  activeTab === id
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {/* <Icon className="w-3.5 h-3.5" /> */}
                {label}
              </button>
            ))}
          </div>

          {/* Panels */}
          {activeTab === "overview" && (
            <TabOverview branchId={branchId} branch={branch} />
          )}
          {activeTab === "harvests" && (
            <HarvestDataDisplay branchId={branchId} />
          )}
          {activeTab === "units" && (
            <TabUnits branchId={branchId} />
          )}
        </div>
      </div>
    </div>
  );
};

export default BranchPage;