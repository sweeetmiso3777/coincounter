"use client";

import React, { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useSalesQuery } from "@/hooks/use-sales-query";
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

  useEffect(() => {
    const controls = animate(count, value, { duration: 2.5, ease: "easeOut" });
    return controls.stop;
  }, [value, count, decimals]);

  return <motion.span>{rounded}</motion.span>;
}

export function RealTimePage() {
  const {
    data: sales = [],
    isLoading,
    error,
    isError,
    refetch,
  } = useSalesQuery();

  // Reload button refetches today's sales
  const handleReloadSales = () => {
    refetch();
  };

  // Stats
  const totalSales = sales.reduce(
    (sum, sale) => sum + Number(sale.total ?? 0),
    0
  );
  const totalTransactions = sales.length;
  const averageTransaction =
    totalTransactions > 0 ? totalSales / totalTransactions : 0;

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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[2px] mb-4">
          <div className="flex flex-col border-l-2 border-current pl-2">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Total Sales</span>
            </div>
            <div className="text-xl font-bold text-foreground">
              ₱<AnimatedNumber value={totalSales} />
            </div>
            <p className="text-xs text-muted-foreground">Within This Day</p>
          </div>

          <div className="flex flex-col border-l-2 border-current pl-2">
            <div className="flex items-center gap-1">
              <Coins className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">
                Transactions
              </span>
            </div>
            <div className="text-xl font-bold text-foreground">
              <AnimatedNumber value={totalTransactions} />
            </div>
            <p className="text-xs text-muted-foreground">
              Total transactions Within This Day
            </p>
          </div>

          <div className="flex flex-col border-l-2 border-current pl-2">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">
                Average Sale
              </span>
            </div>
            <div className="text-xl font-bold text-foreground">
              ₱<AnimatedNumber value={averageTransaction} decimals={2} />
            </div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </div>
        </div>

        {/* Sales List */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Recent Sales ({sales.length})
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
          {sales.length === 0 ? (
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
                data={sales}
                totalCount={sales.length}
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
