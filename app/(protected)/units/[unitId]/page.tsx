"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useUnitAggregates } from "@/hooks/use-unit-aggregates";
import {
  ArrowLeft,
  Activity,
  MapPin,
  Calendar,
  Clock,
  Trophy,
  Wallet,
  Coins,
  TrendingUp,
  DollarSign,
  CheckCircle,
  Circle,
  Scissors,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Download,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UnitAggregate {
  id: string;
  total: number;
  sales_count: number;
  coins_1: number;
  coins_5: number;
  coins_10: number;
  coins_20: number;
  branchId: string;
  timestamp: string | Date;
  harvested: boolean;
  isPartial?: boolean;
  partialHarvestTime?: string;
}

type TabId = "overview" | "transactions" | "analytics";

// ─── Animated Number ──────────────────────────────────────────────────────────

function AnimatedNumber({
  value,
  decimals = 0,
}: {
  value: number;
  decimals?: number;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) =>
    decimals > 0 ? Number(latest.toFixed(decimals)) : Math.round(latest)
  );
  const formatted = useTransform(rounded, (num) =>
    num.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );

  useEffect(() => {
    const controls = animate(count, value, { duration: 2.5, ease: "easeOut" });
    return controls.stop;
  }, [value, count, decimals]);

  return <motion.span>{formatted}</motion.span>;
}

// ─── Metrics helpers ──────────────────────────────────────────────────────────

const calculateMetrics = (data: UnitAggregate[]) => {
  if (!data.length) return null;

  const grandTotal = data.reduce((sum, a) => sum + a.total, 0);
  const totalSales = data.reduce((sum, a) => sum + a.sales_count, 0);
  const uniqueDays = new Set(
    data.map((a) => new Date(a.timestamp).toLocaleDateString())
  ).size;
  const averageDailyRevenue = grandTotal / uniqueDays;

  let peakDayValue = 0;
  let peakDayDate = "";
  data.forEach((a) => {
    if (a.total > peakDayValue) {
      peakDayValue = a.total;
      peakDayDate = new Date(a.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  });

  const totalCoins1 = data.reduce((s, a) => s + a.coins_1, 0);
  const totalCoins5 = data.reduce((s, a) => s + a.coins_5, 0);
  const totalCoins10 = data.reduce((s, a) => s + a.coins_10, 0);
  const totalCoins20 = data.reduce((s, a) => s + a.coins_20, 0);
  const totalCoins = totalCoins1 + totalCoins5 + totalCoins10 + totalCoins20;

  const harvestedDays = data.filter((a) => a.harvested && !a.isPartial).length;
  const cutoffDays = data.filter((a) => a.isPartial).length;
  const pendingDays = data.filter((a) => !a.harvested && !a.isPartial).length;

  // Monthly breakdown
  const monthMap: Record<
    string,
    { total: number; days: number; key: string }
  > = {};
  data.forEach((a) => {
    const d = new Date(a.timestamp);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = d.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    if (!monthMap[key]) monthMap[key] = { total: 0, days: 0, key: label };
    monthMap[key].total += a.total;
    monthMap[key].days += 1;
  });

  return {
    grandTotal,
    totalSales,
    uniqueDays,
    averageDailyRevenue,
    peakDayValue,
    peakDayDate,
    totalCoins1,
    totalCoins5,
    totalCoins10,
    totalCoins20,
    totalCoins,
    harvestedDays,
    cutoffDays,
    pendingDays,
    coinPct: {
      c1: totalCoins > 0 ? (totalCoins1 / totalCoins) * 100 : 0,
      c5: totalCoins > 0 ? (totalCoins5 / totalCoins) * 100 : 0,
      c10: totalCoins > 0 ? (totalCoins10 / totalCoins) * 100 : 0,
      c20: totalCoins > 0 ? (totalCoins20 / totalCoins) * 100 : 0,
    },
    monthlyBreakdown: Object.values(monthMap).reverse(),
  };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg bg-muted/50 p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
        {label}
      </p>
      <p className={cn("text-2xl font-medium leading-none", accent)}>{value}</p>
      {sub && (
        <p className="text-[11px] text-muted-foreground mt-1.5">{sub}</p>
      )}
    </div>
  );
}

function CoinBar({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{label}</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function StatusBadge({
  harvested,
  isPartial,
}: {
  harvested: boolean;
  isPartial?: boolean;
}) {
  if (isPartial) {
    return (
      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-700 text-[11px] px-2 py-0 h-5 font-medium gap-1">
        <Scissors className="w-2.5 h-2.5" />
        Cutoff
      </Badge>
    );
  }
  if (harvested) {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 text-[11px] px-2 py-0 h-5 font-medium gap-1">
        <CheckCircle className="w-2.5 h-2.5" />
        Done
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="text-[11px] px-2 py-0 h-5 font-medium gap-1 text-muted-foreground"
    >
      <Circle className="w-2.5 h-2.5" />
      Pending
    </Badge>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function TabOverview({
  data,
  metrics,
}: {
  data: UnitAggregate[];
  metrics: NonNullable<ReturnType<typeof calculateMetrics>>;
}) {
  const pendingCount = data.filter((a) => !a.harvested && !a.isPartial).length;

  return (
    <div className="p-5 space-y-5">
      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Total earnings"
          value={
            <span className="text-blue-600 dark:text-blue-400">
              ₱<AnimatedNumber value={metrics.grandTotal} decimals={2} />
            </span>
          }
          sub={`Across ${metrics.uniqueDays} days`}
        />
        <MetricCard
          label="Total transactions"
          value={<AnimatedNumber value={metrics.totalSales} />}
          sub={`~${Math.round(metrics.totalSales / metrics.uniqueDays)} txns/day avg`}
        />
        <MetricCard
          label="Avg daily revenue"
          value={`₱${metrics.averageDailyRevenue.toFixed(2)}`}
          sub={`Based on ${metrics.uniqueDays} active days`}
        />
        <MetricCard
          label="Peak day"
          value={`₱${metrics.peakDayValue.toFixed(2)}`}
          sub={metrics.peakDayDate}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Coin distribution */}
        <div className="rounded-lg bg-muted/30 border border-border/50 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-4">
            Coin breakdown
          </p>
          <CoinBar
            label="₱1 coins"
            pct={metrics.coinPct.c1}
            color="#2563eb"
          />
          <CoinBar
            label="₱5 coins"
            pct={metrics.coinPct.c5}
            color="#059669"
          />
          <CoinBar
            label="₱10 coins"
            pct={metrics.coinPct.c10}
            color="#d97706"
          />
          <CoinBar
            label="₱20 coins"
            pct={metrics.coinPct.c20}
            color="#dc2626"
          />
        </div>

        {/* Key insights */}
        <div className="rounded-lg bg-muted/30 border border-border/50 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-3">
            Key insights
          </p>
          <div className="space-y-0 divide-y divide-border/50">
            {pendingCount > 0 && (
              <div className="flex items-start gap-3 py-3">
                <div className="w-7 h-7 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-600 dark:text-amber-400 text-xs font-bold">!</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">
                    {pendingCount} pending harvest{pendingCount !== 1 ? "s" : ""}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Awaiting coin collection.
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 py-3">
              <div className="w-7 h-7 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Coins className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">
                  ₱1 coins dominant at {metrics.coinPct.c1.toFixed(0)}%
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Consider more frequent coin resets.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 py-3">
              <div className="w-7 h-7 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">
                  Peak: ₱{metrics.peakDayValue.toFixed(2)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Best single-day total on {metrics.peakDayDate}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Transactions ────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 15;

function TabTransactions({
  data,
  currentBranchId,
  branchMap,
}: {
  data: UnitAggregate[];
  currentBranchId?: string;
  branchMap: Record<string, string>;
}) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const allSameBranch = data.every((a) => a.branchId === currentBranchId);

  const filtered = useMemo(() => {
    if (!statusFilter) return data;
    return data.filter((a) => {
      if (statusFilter === "done") return a.harvested && !a.isPartial;
      if (statusFilter === "cutoff") return a.isPartial;
      if (statusFilter === "pending") return !a.harvested && !a.isPartial;
      return true;
    });
  }, [data, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * ITEMS_PER_PAGE;
  const slice = filtered.slice(start, start + ITEMS_PER_PAGE);

  const handleFilter = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1
  );

  return (
    <div className="p-5 space-y-4">
      {/* Notice */}
      <div className="flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <span className="text-xs text-amber-800 dark:text-amber-300">
          Today&apos;s summary will be generated at exactly <strong>11:49 PM</strong>
        </span>
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => handleFilter(e.target.value)}
            className="text-xs border border-border rounded-md px-2.5 py-1.5 bg-background text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            <option value="done">Done</option>
            <option value="pending">Pending</option>
            <option value="cutoff">Cutoff</option>
          </select>
        </div>
        <span className="text-xs text-muted-foreground">
          Showing {start + 1}–{Math.min(start + ITEMS_PER_PAGE, filtered.length)} of{" "}
          {filtered.length} records
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block border border-border rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Date
              </th>
              {!allSameBranch && (
                <th className="px-3 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  Location
                </th>
              )}
              <th className="px-3 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-center">
                ₱1
              </th>
              <th className="px-3 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-center">
                ₱5
              </th>
              <th className="px-3 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-center">
                ₱10
              </th>
              <th className="px-3 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-center">
                ₱20
              </th>
              <th className="px-3 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-center">
                Txns
              </th>
              <th className="px-3 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-right">
                Amount
              </th>
              <th className="px-3 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-center">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {slice.map((agg) => {
              const branchLocation = branchMap[agg.branchId] || agg.branchId;
              return (
                <tr
                  key={agg.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-3 py-2.5">
                    <p className="text-xs text-foreground">
                      {new Date(agg.timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(agg.timestamp).toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </p>
                  </td>
                  {!allSameBranch && (
                    <td className="px-3 py-2.5 text-xs text-foreground">
                      {branchLocation}
                    </td>
                  )}
                  <td className="px-3 py-2.5 text-xs text-center text-foreground">
                    {agg.coins_1}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-center text-foreground">
                    {agg.coins_5}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-center text-foreground">
                    {agg.coins_10}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-center text-foreground">
                    {agg.coins_20}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-center text-foreground">
                    {agg.sales_count}
                  </td>
                  <td className="px-3 py-2.5 text-xs font-medium text-right text-emerald-700 dark:text-emerald-400">
                    ₱{agg.total.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <StatusBadge
                      harvested={agg.harvested}
                      isPartial={agg.isPartial}
                    />
                  </td>
                </tr>
              );
            })}
            {slice.length === 0 && (
              <tr>
                <td
                  colSpan={allSameBranch ? 8 : 9}
                  className="px-3 py-8 text-center text-sm text-muted-foreground"
                >
                  No records match the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {slice.map((agg) => {
          const branchLocation = branchMap[agg.branchId] || agg.branchId;
          const showBranch = !allSameBranch;
          return (
            <div
              key={agg.id}
              className="border border-border rounded-lg p-3 bg-card space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-foreground font-medium">
                    {new Date(agg.timestamp).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      weekday: "short",
                    })}
                  </p>
                  {showBranch && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {branchLocation}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    ₱{agg.total.toFixed(2)}
                  </span>
                  <StatusBadge
                    harvested={agg.harvested}
                    isPartial={agg.isPartial}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: "₱1", val: agg.coins_1 },
                  { label: "₱5", val: agg.coins_5 },
                  { label: "₱10", val: agg.coins_10 },
                  { label: "₱20", val: agg.coins_20 },
                ].map(({ label, val }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center p-1.5 bg-muted/40 rounded"
                  >
                    <span className="text-[10px] text-muted-foreground">
                      {label}
                    </span>
                    <span className="text-xs font-medium">{val}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground text-center">
                {agg.sales_count} transaction{agg.sales_count !== 1 ? "s" : ""}
              </p>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            Page {safePage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={safePage === 1}
              className="w-7 h-7 flex items-center justify-center border border-border rounded text-xs disabled:opacity-40 hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {pageNums.map((n, i) => {
              const prev = pageNums[i - 1];
              const showEllipsis = prev !== undefined && n - prev > 1;
              return (
                <React.Fragment key={n}>
                  {showEllipsis && (
                    <span className="px-1 text-xs text-muted-foreground">…</span>
                  )}
                  <button
                    onClick={() => setPage(n)}
                    className={cn(
                      "w-7 h-7 flex items-center justify-center border rounded text-xs transition-colors",
                      n === safePage
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    {n}
                  </button>
                </React.Fragment>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={safePage === totalPages}
              className="w-7 h-7 flex items-center justify-center border border-border rounded text-xs disabled:opacity-40 hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Analytics ───────────────────────────────────────────────────────────

function TabAnalytics({
  metrics,
}: {
  metrics: NonNullable<ReturnType<typeof calculateMetrics>>;
}) {
  const harvestRate =
    metrics.uniqueDays > 0
      ? ((metrics.harvestedDays / metrics.uniqueDays) * 100).toFixed(0)
      : "0";

  return (
    <div className="p-5 space-y-5">
      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetricCard
          label="Harvest rate"
          value={`${harvestRate}%`}
          accent="text-emerald-600 dark:text-emerald-400"
          sub={`${metrics.harvestedDays} of ${metrics.uniqueDays} days collected`}
        />
        <MetricCard
          label="Cutoff events"
          value={metrics.cutoffDays}
          accent="text-amber-600 dark:text-amber-400"
          sub="Partial harvest days"
        />
        <MetricCard
          label="Pending"
          value={metrics.pendingDays}
          accent="text-muted-foreground"
          sub="Awaiting collection"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monthly breakdown */}
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <div className="px-4 py-3 bg-muted/40 border-b border-border/50">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Monthly breakdown
            </p>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50">
                <th className="px-4 py-2 text-left text-[11px] font-medium text-muted-foreground">
                  Month
                </th>
                <th className="px-4 py-2 text-right text-[11px] font-medium text-muted-foreground">
                  Revenue
                </th>
                <th className="px-4 py-2 text-right text-[11px] font-medium text-muted-foreground">
                  Days
                </th>
                <th className="px-4 py-2 text-right text-[11px] font-medium text-muted-foreground">
                  Daily avg
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {metrics.monthlyBreakdown.map((m) => (
                <tr key={m.key} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 text-foreground">{m.key}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-emerald-700 dark:text-emerald-400">
                    ₱{m.total.toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">
                    {m.days}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">
                    ₱{(m.total / m.days).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Coin value contribution */}
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <div className="px-4 py-3 bg-muted/40 border-b border-border/50">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Coin value contribution
            </p>
          </div>
          <div className="divide-y divide-border/40">
            {[
              {
                label: `₱1 × ${metrics.totalCoins1} coins`,
                value: metrics.totalCoins1 * 1,
              },
              {
                label: `₱5 × ${metrics.totalCoins5} coins`,
                value: metrics.totalCoins5 * 5,
              },
              {
                label: `₱10 × ${metrics.totalCoins10} coins`,
                value: metrics.totalCoins10 * 10,
              },
              {
                label: `₱20 × ${metrics.totalCoins20} coins`,
                value: metrics.totalCoins20 * 20,
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-medium text-foreground">
                  ₱{value.toFixed(2)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/40">
              <span className="text-xs font-medium text-foreground">Total</span>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                ₱{metrics.grandTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "transactions", label: "Transactions", icon: DollarSign },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
];

function UnitPageClient() {
  const { unitId } = useParams<{ unitId: string }>();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const {
    aggregates,
    loading: aggLoading,
    unitInfo,
    branchMap,
  } = useUnitAggregates(unitId);

  const currentBranchId = unitInfo?.branchId || aggregates?.[0]?.branchId;
  const currentBranchLocation = currentBranchId
    ? branchMap[currentBranchId]
    : null;

  const metrics = useMemo(
    () => calculateMetrics(aggregates ?? []),
    [aggregates]
  );

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (aggLoading) {
    return (
      <div className="min-h-screen bg-muted/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-48" />
            <div className="h-28 bg-muted rounded-lg" />
            <div className="h-10 bg-muted rounded-lg" />
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!aggregates || aggregates.length === 0) {
    return (
      <div className="min-h-screen bg-muted/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
            <Link href="/units" className="text-blue-600 hover:underline">
              Units
            </Link>
            <span>/</span>
            <span className="text-foreground">{unitInfo?.alias || unitId}</span>
          </div>
          <div className="rounded-lg border border-dashed border-border bg-card p-16 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium text-foreground mb-1">
              No data available
            </h3>
            <p className="text-xs text-muted-foreground">
              No transaction data has been recorded yet for this unit.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const pendingCount =
    aggregates.filter((a) => !a.harvested && !a.isPartial).length;

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-muted/20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/units" className="text-blue-600 hover:underline">
            Units
          </Link>
          <span>/</span>
          {currentBranchLocation && (
            <>
              <span>{currentBranchLocation}</span>
              <span>/</span>
            </>
          )}
          <span className="text-foreground">
            {unitInfo?.alias || unitId}
          </span>
        </div>

        {/* Page header card */}
        <div className="rounded-lg bg-card border border-border p-4 md:p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            {/* Left: identity */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-semibold text-foreground truncate leading-tight">
                  {unitInfo?.alias || unitId}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {unitInfo?.alias && unitInfo.alias !== unitId && (
                    <span className="text-[11px] text-muted-foreground">
                      ID: {unitId}
                    </span>
                  )}
                  {currentBranchLocation && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {currentBranchLocation}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Active
              </span>
              {/* <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Export
              </Button> */}
              <Button asChild variant="ghost" size="sm" className="text-xs h-8 gap-1.5">
                <Link href="/real-time">
                  <ArrowRight className="w-3.5 h-3.5" />
                  Real-Time
                </Link>
              </Button>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Summary at <strong className="text-foreground">11:49 PM</strong>
            </div>
            {metrics && (
              <>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Trophy className="w-3 h-3" />
                  Peak{" "}
                  <strong className="text-foreground">
                    ₱{metrics.peakDayValue.toFixed(2)}
                  </strong>{" "}
                  on {metrics.peakDayDate}
                </div>
                {pendingCount > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                    {pendingCount} pending harvest{pendingCount !== 1 ? "s" : ""}
                  </div>
                )}
              </>
            )}
            <Button asChild variant="ghost" size="sm" className="text-xs h-6 px-0 ml-auto">
              <Link href="/units">
                <ArrowLeft className="w-3 h-3 mr-1" />
                Back to units
              </Link>
            </Button>
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

          {/* Tab panels */}
          {activeTab === "overview" && metrics && (
            <TabOverview data={aggregates} metrics={metrics} />
          )}
          {activeTab === "transactions" && (
            <TabTransactions
              data={aggregates}
              currentBranchId={currentBranchId}
              branchMap={branchMap}
            />
          )}
          {activeTab === "analytics" && metrics && (
            <TabAnalytics metrics={metrics} />
          )}
        </div>
      </div>
    </div>
  );
}

export default UnitPageClient;