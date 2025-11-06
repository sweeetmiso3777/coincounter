"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
} from "recharts";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEnrichedSales } from "@/hooks/use-sales-alias";
import { SalesCard } from "@/components/real-time/sales-card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Coins,
  ChevronLeft,
  ChevronRight,
  Monitor,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Virtuoso } from "react-virtuoso";

// Types for the chart data
interface ChartDataItem {
  hour: string;
  hour24: number;
  sales: number;
  hourNumber: number;
  cumulative: number;
}

// Type for the tooltip payload
interface TooltipPayloadItem {
  value: number;
  payload: {
    sales: number;
    cumulative: number;
  };
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

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

  // Format the number with commas
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

// Custom Tooltip Component
const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-green-600">
          Cumulative: ₱{payload[0].value.toLocaleString()}
        </p>
        <p className="text-blue-600 text-sm">
          Hourly Sales: ₱{payload[0].payload.sales.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export function RealTimePage() {
  const {
    data: sales = [],
    isLoading,
    error,
    isError,
    refetch,
  } = useEnrichedSales();

  const [statsView, setStatsView] = useState<"coins" | "units">("coins");
  const [unitsPage, setUnitsPage] = useState(0);
  const UNITS_PER_PAGE = 6;

  // Process data for the chart - group by hour with 12-hour format
  const chartData = useMemo((): ChartDataItem[] => {
    if (!sales.length) return [];

    const now = new Date();
    const currentHour = now.getHours();

    // Only show hours up to the current hour + 1 (to include current hour properly)
    const hoursToShow = currentHour + 1;

    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);

    const hourlyData = Array.from({ length: hoursToShow }, (_, hour) => {
      const hourStart = new Date(todayStart);
      hourStart.setHours(hour);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hour + 1);

      const hourSales = sales.filter((sale) => {
        let saleDate: Date;

        // Handle Firestore timestamp parsing
        const timestamp = sale.timestamp;
        if (
          timestamp &&
          typeof timestamp === "object" &&
          "seconds" in timestamp
        ) {
          saleDate = new Date(
            (timestamp as { seconds: number }).seconds * 1000
          );
        } else if (
          timestamp &&
          typeof timestamp !== "string" &&
          typeof (timestamp as { toDate?: () => Date }).toDate === "function"
        ) {
          saleDate = (timestamp as unknown as { toDate: () => Date }).toDate();
        } else if (timestamp instanceof Date) {
          saleDate = timestamp;
        } else if (typeof timestamp === "string") {
          saleDate = new Date(timestamp);
        } else {
          return false;
        }
        return saleDate >= hourStart && saleDate < hourEnd;
      });

      const hourlyTotal = hourSales.reduce(
        (sum, sale) => sum + Number(sale.total ?? 0),
        0
      );

      // Convert to 12-hour format with AM/PM
      const hour12 = hour % 12 || 12;
      const ampm = hour < 12 ? "AM" : "PM";
      const hourLabel =
        hour === 0 ? "12 AM" : hour === 12 ? "12 PM" : `${hour12} ${ampm}`;

      return {
        hour: hourLabel,
        hour24: hour,
        sales: hourlyTotal,
        hourNumber: hour,
        cumulative: 0, // Will be calculated below
      };
    });

    // Calculate cumulative sales for progress line
    let cumulativeSales = 0;
    return hourlyData.map((data) => {
      cumulativeSales += data.sales;
      return {
        ...data,
        cumulative: cumulativeSales,
      };
    });
  }, [sales]);

  // Reload button refetches today's sales
  const handleReloadSales = () => {
    refetch();
  };

  // Stats - filter for today's sales only
  const todaySales = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    return sales.filter((sale) => {
      let saleDate: Date;
      const timestamp = sale.timestamp;

      if (
        timestamp &&
        typeof timestamp === "object" &&
        "seconds" in timestamp
      ) {
        saleDate = new Date((timestamp as { seconds: number }).seconds * 1000);
      } else if (
        timestamp &&
        typeof timestamp !== "string" &&
        typeof (timestamp as { toDate?: () => Date }).toDate === "function"
      ) {
        saleDate = (timestamp as unknown as { toDate: () => Date }).toDate();
      } else if (timestamp instanceof Date) {
        saleDate = timestamp;
      } else if (typeof timestamp === "string") {
        saleDate = new Date(timestamp);
      } else {
        return false;
      }

      return saleDate >= todayStart && saleDate <= todayEnd;
    });
  }, [sales]);

  // Calculate unit totals
  const unitTotals = useMemo(() => {
    const totalsMap = new Map<
      string,
      { deviceId: string; total: number; transactions: number }
    >();

    todaySales.forEach((sale) => {
      const deviceId = sale.deviceId || "Unknown";
      const existing = totalsMap.get(deviceId);

      if (existing) {
        existing.total += Number(sale.total ?? 0);
        existing.transactions += 1;
      } else {
        totalsMap.set(deviceId, {
          deviceId,
          total: Number(sale.total ?? 0),
          transactions: 1,
        });
      }
    });

    // Sort by total descending
    return Array.from(totalsMap.values()).sort((a, b) => b.total - a.total);
  }, [todaySales]);

  const totalPages = Math.ceil(unitTotals.length / UNITS_PER_PAGE);
  const paginatedUnits = unitTotals.slice(
    unitsPage * UNITS_PER_PAGE,
    (unitsPage + 1) * UNITS_PER_PAGE
  );

  const totalSales = todaySales.reduce(
    (sum, sale) => sum + Number(sale.total ?? 0),
    0
  );
  const totalTransactions = todaySales.length;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <h1 className="text-3xl font-bold text-foreground mt-4">
            Loading Real-Time Sales
          </h1>
          <p className="text-muted-foreground mt-2">
            Fetching sales data from all units...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-3xl font-bold text-foreground mt-4">
            Error Loading Sales Data
          </h1>
          <p className="text-muted-foreground mt-2">
            {error instanceof Error
              ? error.message
              : "Failed to load sales data"}
          </p>
          <Button onClick={handleReloadSales} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h1 className="text-3xl font-mono text-foreground">
              Real-Time Sales
            </h1>
            <p className="font-mono text-muted-foreground mt-2">
              Monitor sales across all coin-operated units
            </p>
          </div>
        </div>

        {/* Chart and Stats Row */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          {/* Chart - Takes 70% width */}
          <div className="lg:w-[70%] bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground">
                Sales Progress Today
              </h2>
              <div className="text-sm text-muted-foreground">
                Total: ₱<AnimatedNumber value={totalSales} />
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 12 }}
                    interval={Math.max(1, Math.floor(chartData.length / 6))}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value: number) => {
                      if (value >= 1000) {
                        return `₱${(value / 1000).toFixed(0)}k`;
                      }
                      return `₱${value}`;
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 3 }}
                    activeDot={{ r: 5, fill: "#059669" }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stats Cards - Takes 30% width with fixed height */}
          <div className="lg:w-[30%] h-[330px] flex flex-col">
            {/* View Switcher */}
            <div className="flex gap-1 mb-3 bg-muted p-1 rounded-lg">
              <button
                onClick={() => {
                  setStatsView("coins");
                  setUnitsPage(0);
                }}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  statsView === "coins"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Coins className="h-4 w-4 inline mr-1" />
                Coins
              </button>
              <button
                onClick={() => {
                  setStatsView("units");
                  setUnitsPage(0);
                }}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  statsView === "units"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Monitor className="h-4 w-4 inline mr-1" />
                Units
              </button>
            </div>

            {/* Stats Content with fixed height */}
            <div className="flex-1">
              {statsView === "coins" ? (
                <div className="grid grid-cols-2 gap-[2px]">
                  {/* Total Sales */}
                  <div className="flex flex-col border-l-2 border-current pl-2">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-muted-foreground">
                        Total Sales
                      </span>
                    </div>
                    <div className="text-xl font-extrabold text-green-600">
                      ₱<AnimatedNumber value={totalSales} />
                    </div>
                    <p className="text-xs text-muted-foreground">Today</p>
                  </div>

                  {/* Transactions */}
                  <div className="flex flex-col border-l-2 border-current pl-2">
                    <div className="flex items-center gap-1">
                      <Coins className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-muted-foreground">
                        Transactions
                      </span>
                    </div>
                    <div className="text-xl font-extrabold text-blue-600">
                      <AnimatedNumber value={totalTransactions} />
                    </div>
                    <p className="text-xs text-muted-foreground">Today</p>
                  </div>

                  {/* ₱1 */}
                  <div className="flex flex-col border-l-2 border-current pl-2">
                    <div className="flex items-center gap-1">
                      <Coins className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-muted-foreground">₱1</span>
                    </div>
                    <div className="text-lg font-bold text-gray-600">
                      <AnimatedNumber
                        value={todaySales.reduce(
                          (sum, s) => sum + (s.coins_1 ?? 0),
                          0
                        )}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">coins</p>
                  </div>

                  {/* ₱5 */}
                  <div className="flex flex-col border-l-2 border-current pl-2">
                    <div className="flex items-center gap-1">
                      <Coins className="h-4 w-4 text-purple-500" />
                      <span className="text-sm text-muted-foreground">₱5</span>
                    </div>
                    <div className="text-lg font-bold text-purple-600">
                      <AnimatedNumber
                        value={todaySales.reduce(
                          (sum, s) => sum + (s.coins_5 ?? 0),
                          0
                        )}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">coins</p>
                  </div>

                  {/* ₱10 */}
                  <div className="flex flex-col border-l-2 border-current pl-2">
                    <div className="flex items-center gap-1">
                      <Coins className="h-4 w-4 text-amber-500" />
                      <span className="text-sm text-muted-foreground">₱10</span>
                    </div>
                    <div className="text-lg font-bold text-amber-600">
                      <AnimatedNumber
                        value={todaySales.reduce(
                          (sum, s) => sum + (s.coins_10 ?? 0),
                          0
                        )}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">coins</p>
                  </div>

                  {/* ₱20 */}
                  <div className="flex flex-col border-l-2 border-current pl-2">
                    <div className="flex items-center gap-1">
                      <Coins className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-muted-foreground">₱20</span>
                    </div>
                    <div className="text-lg font-bold text-green-700">
                      <AnimatedNumber
                        value={todaySales.reduce(
                          (sum, s) => sum + (s.coins_20 ?? 0),
                          0
                        )}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">coins</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  {/* Units Grid - Fixed 3x2 layout */}
                  <div className="grid grid-cols-2 gap-2 flex-1">
                    {paginatedUnits.map((unit) => (
                      <div
                        key={unit.deviceId}
                        className="bg-card border border-border rounded-lg p-2 hover:border-primary/50 transition-colors flex flex-col justify-between"
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <Monitor className="h-3 w-3 text-primary flex-shrink-0" />
                          <span className="font-mono text-xs font-medium text-foreground truncate">
                            {unit.deviceId}
                          </span>
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          ₱<AnimatedNumber value={unit.total} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {unit.transactions} txns
                        </span>
                      </div>
                    ))}
                    {/* Fill empty slots if less than 6 units on current page */}
                    {Array.from({
                      length: UNITS_PER_PAGE - paginatedUnits.length,
                    }).map((_, i) => (
                      <div key={`empty-${i}`} className="invisible" />
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUnitsPage((p) => Math.max(0, p - 1))}
                        disabled={unitsPage === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {unitsPage + 1} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setUnitsPage((p) => Math.min(totalPages - 1, p + 1))
                        }
                        disabled={unitsPage === totalPages - 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {unitTotals.length === 0 && (
                    <div className="text-center py-8">
                      <Monitor className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No unit data available
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sales List */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Recent Sales ({todaySales.length})
          </h2>

          {todaySales.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No sales data found
                </h3>
                <p className="text-muted-foreground mb-6">
                  Sales transactions will appear here once units start
                  generating revenue.
                </p>
                <Button onClick={handleReloadSales} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" /> Reload Sales Data
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="relative rounded-sm border border-border px-1"
              style={{ height: "calc(100vh - 18rem)" }}
            >
              <Virtuoso
                data={todaySales}
                totalCount={todaySales.length}
                itemContent={(index, sale) => (
                  <div key={`${sale.deviceId}-${sale.id}`} className="p-1">
                    <SalesCard sale={sale} />
                  </div>
                )}
                overscan={5}
                className="scrollbar-hide"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
