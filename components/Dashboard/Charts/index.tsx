"use client";

import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { useEnrichedSales } from "@/hooks/use-sales-alias";
import { TrendingUp, Coins } from "lucide-react";

// Define types for the tooltip
interface TooltipPayload {
  payload: {
    sales: number;
    cumulative: number;
    coins_1: number;
    coins_5: number;
    coins_10: number;
    coins_20: number;
  };
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  viewMode?: "total" | "coins";
}

function CompactTooltip({
  active,
  payload,
  label,
  viewMode,
}: CustomTooltipProps) {
  if (active && payload && payload.length) {
    if (viewMode === "total") {
      const { sales, cumulative } = payload[0].payload;
      return (
        <div className="bg-background border border-border px-2 py-1 rounded-md text-xs shadow-sm">
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-green-600">₱{cumulative.toLocaleString()}</p>
          <p className="text-muted-foreground text-[10px]">
            +₱{sales.toLocaleString()} this hour
          </p>
        </div>
      );
    } else {
      const { coins_1, coins_5, coins_10, coins_20 } = payload[0].payload;
      return (
        <div className="bg-background border border-border px-2 py-1 rounded-md text-xs shadow-sm">
          <p className="font-medium text-foreground mb-1">{label}</p>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[10px]">
                ₱1: ₱{coins_1.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[10px]">
                ₱5: ₱{coins_5.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-[10px]">
                ₱10: ₱{coins_10.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[10px]">
                ₱20: ₱{coins_20.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      );
    }
  }
  return null;
}

// Define types for sales data
interface Sale {
  timestamp?: string | Date | { seconds: number } | { toDate: () => Date };
  total?: number | string;
  coins_1?: number;
  coins_5?: number;
  coins_10?: number;
  coins_20?: number;
}

interface ChartDataItem {
  hour: string;
  sales: number;
  cumulative: number;
  coins_1: number;
  coins_5: number;
  coins_10: number;
  coins_20: number;
}

export function Charts() {
  const { data: sales = [] } = useEnrichedSales();
  const [viewMode, setViewMode] = useState<"total" | "coins">("total");

  const chartData = useMemo(() => {
    if (!sales.length) return [];

    const now = new Date();
    const hours = now.getHours() + 1;
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    let cumulative = 0;
    return Array.from({ length: hours }, (_, hour): ChartDataItem => {
      const hourStart = new Date(start);
      hourStart.setHours(hour);
      const hourEnd = new Date(start);
      hourEnd.setHours(hour + 1);

      const hourSales = sales.filter((s: Sale) => {
        const date = (() => {
          const ts = s.timestamp;
          if (!ts) return new Date(0);
          if (typeof ts === "string") return new Date(ts);
          if (ts instanceof Date) return ts;
          if (
            typeof ts === "object" &&
            "toDate" in ts &&
            typeof ts.toDate === "function"
          )
            return ts.toDate();
          if (
            typeof ts === "object" &&
            "seconds" in ts &&
            typeof ts.seconds === "number"
          )
            return new Date((ts as { seconds: number }).seconds * 1000);
          return new Date(0);
        })();

        return date >= hourStart && date < hourEnd;
      });

      const salesTotal = hourSales.reduce(
        (sum: number, s: Sale) => sum + Number(s.total ?? 0),
        0
      );

      const coins1Total = hourSales.reduce(
        (sum: number, s: Sale) => sum + Number(s.coins_1 ?? 0) * 1,
        0
      );

      const coins5Total = hourSales.reduce(
        (sum: number, s: Sale) => sum + Number(s.coins_5 ?? 0) * 5,
        0
      );

      const coins10Total = hourSales.reduce(
        (sum: number, s: Sale) => sum + Number(s.coins_10 ?? 0) * 10,
        0
      );

      const coins20Total = hourSales.reduce(
        (sum: number, s: Sale) => sum + Number(s.coins_20 ?? 0) * 20,
        0
      );

      cumulative += salesTotal;

      const hour12 = hour % 12 || 12;
      const ampm = hour < 12 ? "AM" : "PM";

      return {
        hour: `${hour12}${ampm}`,
        sales: salesTotal,
        cumulative,
        coins_1: coins1Total,
        coins_5: coins5Total,
        coins_10: coins10Total,
        coins_20: coins20Total,
      };
    });
  }, [sales]);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Toggle Buttons */}
      <div className="absolute top-0 right-2 z-10 flex items-center gap-1 bg-muted/50 rounded-md p-0.5">
        <button
          onClick={() => setViewMode("total")}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all ${
            viewMode === "total"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <TrendingUp className="h-3 w-3" />
          Total
        </button>
        <button
          onClick={() => setViewMode("coins")}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all ${
            viewMode === "coins"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Coins className="h-3 w-3" />
          Coins
        </button>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 25, right: 10, left: -10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            interval={Math.max(1, Math.floor(chartData.length / 6))}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            tickFormatter={(v: number) =>
              v >= 1000 ? `₱${(v / 1000).toFixed(0)}k` : `₱${v}`
            }
          />
          <Tooltip content={<CompactTooltip viewMode={viewMode} />} />

          {viewMode === "total" ? (
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#10b981" }}
              isAnimationActive={false}
            />
          ) : (
            <>
              <Line
                type="monotone"
                dataKey="coins_1"
                stroke="rgb(245, 158, 11)"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="coins_5"
                stroke="rgb(16, 185, 129)"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="coins_10"
                stroke="rgb(139, 92, 246)"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="coins_20"
                stroke="rgb(239, 68, 68)"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
                isAnimationActive={false}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
