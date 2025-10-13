"use client";

import React, { useEffect, useMemo } from "react";
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

          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <Button
              onClick={handleReloadSales}
              variant="outline"
              className="bg-transparent"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Reload
            </Button>
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
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stats Cards - Takes 30% width */}
          <div className="lg:w-[30%] grid grid-cols-2 gap-[2px]">
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
        </div>

        {/* Sales List */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Recent Sales ({todaySales.length})
          </h2>
          <div className="flex items-center justify-end gap-2 mb-2">
            <Button variant="outline" size="sm">
              Today
            </Button>
            <Button variant="outline" size="sm">
              Yesterday
            </Button>
            <Button variant="outline" size="sm">
              7 Days
            </Button>
            <Button variant="outline" size="sm">
              1 Month
            </Button>
          </div>
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
