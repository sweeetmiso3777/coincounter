"use client";

import React, { useMemo } from "react";
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

// Define types for the tooltip
interface TooltipPayload {
  payload: {
    sales: number;
    cumulative: number;
  };
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CompactTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
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
  }
  return null;
}

// Define types for sales data
interface Sale {
  timestamp?: string | Date | { seconds: number } | { toDate: () => Date };
  total?: number | string;
}

interface ChartDataItem {
  hour: string;
  sales: number;
  cumulative: number;
}

export function Charts() {
  const { data: sales = [] } = useEnrichedSales();

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
      cumulative += salesTotal;

      const hour12 = hour % 12 || 12;
      const ampm = hour < 12 ? "AM" : "PM";

      return {
        hour: `${hour12}${ampm}`,
        sales: salesTotal,
        cumulative,
      };
    });
  }, [sales]);

  return (
    <div className="relative w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
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
          <Tooltip content={<CompactTooltip />} />
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#10b981" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
