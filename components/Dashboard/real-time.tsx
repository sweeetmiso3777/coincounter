"use client";

import React, { useMemo } from "react";
import { useEnrichedSales } from "@/hooks/use-sales-alias";
import { Loader2, AlertCircle, Monitor } from "lucide-react";
import Link from "next/link";
import { Virtuoso } from "react-virtuoso";
import type { Timestamp } from "firebase/firestore";

interface SaleWithAlias {
  id: string;
  deviceId: string;
  alias: string;
  total: number;
  timestamp:
    | Timestamp
    | Date
    | string
    | { seconds: number; nanoseconds?: number };
  time: string;
}

export function RealTimeDashboard() {
  const { data: sales = [], isLoading, error, isError } = useEnrichedSales();

  // Process individual sales with aliases, sorted by timestamp
  const individualSales = useMemo((): SaleWithAlias[] => {
    if (!sales || !Array.isArray(sales)) return [];

    type TimestampFormat =
      | Timestamp
      | Date
      | string
      | { seconds: number; nanoseconds?: number };

    // Helper to safely convert various timestamp formats to a JavaScript Date object
    const getDateFromTimestamp = (timestamp: TimestampFormat): Date | null => {
      if (!timestamp) return null;

      // Firestore Timestamp object with a toDate method
      if (
        typeof timestamp === "object" &&
        "toDate" in timestamp &&
        typeof (timestamp as Timestamp).toDate === "function"
      ) {
        return (timestamp as Timestamp).toDate();
      }

      // Plain object from serialized data (e.g., from an API)
      if (
        typeof timestamp === "object" &&
        "seconds" in timestamp &&
        typeof timestamp.seconds === "number"
      ) {
        const ts = timestamp as { seconds: number; nanoseconds?: number };
        return new Date(ts.seconds * 1000 + (ts.nanoseconds || 0) / 1000000);
      }

      // JavaScript Date object
      if (timestamp instanceof Date) {
        return timestamp;
      }

      // String timestamp
      if (typeof timestamp === "string") {
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? null : date;
      }

      return null;
    };

    return sales
      .filter((sale) => sale && typeof sale === "object")
      .map((sale, index) => {
        const date = getDateFromTimestamp(sale.timestamp);

        return {
          id: sale.id || `sale-${index}`,
          deviceId: sale.deviceId || "unknown",
          alias: sale.alias?.trim() || `PC${index + 1}`,
          total: Math.max(0, Number(sale.total) || 0),
          timestamp: sale.timestamp || new Date(),
          time: date
            ? date.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
            : "Unknown",
        };
      })
      .sort((a, b) => {
        const timeA = getDateFromTimestamp(a.timestamp)?.getTime() || 0;
        const timeB = getDateFromTimestamp(b.timestamp)?.getTime() || 0;
        return timeB - timeA; // Most recent first
      });
  }, [sales]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center h-full flex items-center justify-center text-amber-600">
        <AlertCircle className="h-5 w-5 mr-1" />
        <span className="text-sm">Error loading sales data</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      {individualSales.length === 0 ? (
        <div className="text-center text-muted-foreground text-sm h-full flex items-center justify-center">
          Currently no sales
        </div>
      ) : (
        <Virtuoso
          data={individualSales}
          totalCount={individualSales.length}
          itemContent={(index, sale) => (
            <Link
              href={`/units/${sale.deviceId}`}
              className="flex items-center justify-between text-sm group hover:bg-muted/30 px-3 py-2 rounded transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Monitor className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                <span className="text-foreground font-medium truncate">
                  {sale.alias}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-muted-foreground font-medium">
                  {sale.time}
                </span>
                <span className="font-bold text-green-600">
                  ₱{sale.total.toLocaleString()}
                </span>
              </div>
            </Link>
          )}
          className="virtuoso-scrollbar"
          style={{ height: "100%" }}
        />
      )}
    </div>
  );
}
