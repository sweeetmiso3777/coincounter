"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useUnitAggregates } from "@/hooks/use-unit-aggregates";
import {
  Calendar,
  DollarSign,
  Activity,
  Coins,
  ArrowLeft,
  TrendingUp,
  Wallet,
  ArrowRight,
  MapPin,
  CheckCircle,
  Circle,
  Scissors,
  Trophy,
  BarChart3,
  PieChart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { Badge } from "@/components/ui/badge";

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

// Updated metrics calculation function
const calculateMetrics = (data: UnitAggregate[]) => {
  if (!data.length) return null;

  const grandTotal = data.reduce((sum, agg) => sum + agg.total, 0);
  const totalSales = data.reduce((sum, agg) => sum + agg.sales_count, 0);
  const uniqueDays = new Set(
    data.map((agg) => new Date(agg.timestamp).toLocaleDateString())
  ).size;

  // Average Daily Revenue
  const averageDailyRevenue = grandTotal / uniqueDays;

  // Peak Day - now tracking both value and date
  let peakDayValue = 0;
  let peakDayDate = "";

  data.forEach((agg) => {
    if (agg.total > peakDayValue) {
      peakDayValue = agg.total;
      peakDayDate = new Date(agg.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  });

  // Coin Distribution
  const totalCoins1 = data.reduce((sum, agg) => sum + agg.coins_1, 0);
  const totalCoins5 = data.reduce((sum, agg) => sum + agg.coins_5, 0);
  const totalCoins10 = data.reduce((sum, agg) => sum + agg.coins_10, 0);
  const totalCoins20 = data.reduce((sum, agg) => sum + agg.coins_20, 0);

  const totalCoins = totalCoins1 + totalCoins5 + totalCoins10 + totalCoins20;

  const coinDistribution = {
    coins1: totalCoins > 0 ? (totalCoins1 / totalCoins) * 100 : 0,
    coins5: totalCoins > 0 ? (totalCoins5 / totalCoins) * 100 : 0,
    coins10: totalCoins > 0 ? (totalCoins10 / totalCoins) * 100 : 0,
    coins20: totalCoins > 0 ? (totalCoins20 / totalCoins) * 100 : 0,
  };

  return {
    grandTotal,
    totalSales,
    uniqueDays,
    averageDailyRevenue,
    peakDayValue,
    peakDayDate,
    coinDistribution,
  };
};

const UnitHeader = ({
  deviceId,
  alias,
  branchId,
  branchLocation,
}: {
  deviceId: string;
  alias?: string;
  branchId?: string;
  branchLocation?: string;
}) => (
  <div className="mb-6">
    <div className="flex justify-between items-center mb-3">
      <Button asChild variant="ghost" size="sm">
        <Link href="/units">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Units
        </Link>
      </Button>

      <Button asChild variant="ghost" size="sm">
        <Link href="/real-time">
          Go to Real-Time
          <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
      </Button>
    </div>

    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 bg-secondary/10 rounded-lg">
        <Activity className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold text-foreground truncate">
          {alias || deviceId}
        </h1>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {alias && alias !== deviceId && (
            <span className="text-xs text-muted-foreground">
              Device ID: {deviceId}
            </span>
          )}
          {branchLocation && (
            <>
              {alias && alias !== deviceId && (
                <span className="text-muted-foreground">•</span>
              )}
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <Badge variant="secondary" className="text-xs">
                  {branchLocation}
                </Badge>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
);

const MetricsCards = ({
  data,
  currentBranchId,
  branchMap,
}: {
  data: UnitAggregate[];
  currentBranchId?: string;
  branchMap: Record<string, string>;
}) => {
  const metrics = useMemo(() => calculateMetrics(data), [data]);

  if (!metrics) return null;

  const currentBranchLocation = currentBranchId
    ? branchMap[currentBranchId]
    : null;

  const allSameBranch = data.every((agg) => agg.branchId === currentBranchId);

  return (
    <div className="space-y-4">
      {/* Branch Info Card */}
      {currentBranchLocation && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-blue-800 dark:text-blue-300 truncate">
                  {currentBranchLocation}
                </p>
                {currentBranchId && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                    ID: {currentBranchId}
                  </p>
                )}
              </div>
            </div>
            {!allSameBranch && (
              <Badge variant="outline" className="text-xs mt-1">
                Multiple Locations
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Summary Card */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-3 w-3 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  Total Earnings
                </span>
              </div>
              <p className="text-lg font-bold text-green-700 dark:text-green-400">
                ₱<AnimatedNumber value={metrics.grandTotal} decimals={2} />
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                {metrics.totalSales}{" "}
                {metrics.totalSales === 1 ? "Transaction" : "Transactions"}
              </p>
              <p className="text-xs text-muted-foreground">
                {metrics.uniqueDays} {metrics.uniqueDays === 1 ? "day" : "days"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Metrics Grid - Only 3 cards now */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* Average Daily Revenue */}
        <Card className="border-border/50 bg-card">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Avg Daily
              </span>
            </div>
            <p className="text-lg font-bold text-foreground">
              ₱{metrics.averageDailyRevenue.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {/* Peak Day */}
        <Card className="border-border/50 bg-card">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-foreground">
                Peak Day
              </span>
            </div>
            <p className="text-lg font-bold text-foreground">
              ₱{metrics.peakDayValue.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.peakDayDate}
            </p>
          </CardContent>
        </Card>

        {/* Coin Distribution Summary */}
        <Card className="border-border/50 bg-card">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium text-foreground">
                Coin Distribution
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">₱1:</span>
                <span className="font-semibold">
                  {metrics.coinDistribution.coins1.toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">₱5:</span>
                <span className="font-semibold">
                  {metrics.coinDistribution.coins5.toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">₱10:</span>
                <span className="font-semibold">
                  {metrics.coinDistribution.coins10.toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">₱20:</span>
                <span className="font-semibold">
                  {metrics.coinDistribution.coins20.toFixed(0)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const UnitAggregatesTable = ({
  data,
  currentBranchId,
  branchMap,
}: {
  data: UnitAggregate[];
  currentBranchId?: string;
  branchMap: Record<string, string>;
}) => {
  const allSameBranch = data.every((agg) => agg.branchId === currentBranchId);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Calculate pagination
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = data.slice(startIndex, startIndex + itemsPerPage);

  // Pagination controls
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPrevious = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="space-y-3 mt-6">
      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100 rounded-md text-xs text-center">
        Summary Today will be generated at exactly 11:49 PM
      </div>

      {/* Pagination Info */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-
          {Math.min(startIndex + itemsPerPage, data.length)} of {data.length}{" "}
          days
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevious}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                // Show pages around current page
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(pageNum)}
                    className="h-8 w-8 p-0 text-xs"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto border rounded-lg bg-card">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 border-b text-xs font-medium text-foreground min-w-[100px]">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span>Date</span>
                </div>
              </th>
              {!allSameBranch && (
                <th className="p-2 border-b text-xs font-medium text-foreground min-w-[120px]">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <span>Location</span>
                  </div>
                </th>
              )}
              <th className="p-2 border-b text-xs font-medium text-foreground text-center min-w-[70px]">
                <div className="flex flex-col items-center gap-0.5">
                  <Coins className="w-3 h-3 text-muted-foreground" />
                  <span>₱1</span>
                </div>
              </th>
              <th className="p-2 border-b text-xs font-medium text-foreground text-center min-w-[70px]">
                <div className="flex flex-col items-center gap-0.5">
                  <Coins className="w-3 h-3 text-muted-foreground" />
                  <span>₱5</span>
                </div>
              </th>
              <th className="p-2 border-b text-xs font-medium text-foreground text-center min-w-[70px]">
                <div className="flex flex-col items-center gap-0.5">
                  <Coins className="w-3 h-3 text-muted-foreground" />
                  <span>₱10</span>
                </div>
              </th>
              <th className="p-2 border-b text-xs font-medium text-foreground text-center min-w-[70px]">
                <div className="flex flex-col items-center gap-0.5">
                  <Coins className="w-3 h-3 text-muted-foreground" />
                  <span>₱20</span>
                </div>
              </th>
              <th className="p-2 border-b text-xs font-medium text-foreground text-center min-w-[80px]">
                <div className="flex flex-col items-center gap-0.5">
                  <TrendingUp className="w-3 h-3 text-muted-foreground" />
                  <span>Txns</span>
                </div>
              </th>
              <th className="p-2 border-b text-xs font-medium text-foreground text-center min-w-[90px]">
                <div className="flex flex-col items-center gap-0.5">
                  <DollarSign className="w-3 h-3 text-muted-foreground" />
                  <span>Amount</span>
                </div>
              </th>
              <th className="p-2 border-b text-xs font-medium text-foreground text-center min-w-[80px]">
                <div className="flex flex-col items-center gap-0.5">
                  <CheckCircle className="w-3 h-3 text-muted-foreground" />
                  <span>Status</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((agg) => {
              const branchLocation = branchMap[agg.branchId] || agg.branchId;
              const isHarvested = agg.harvested;
              const isPartial = agg.isPartial;

              let bgClass = "";
              let borderClass = "";
              let textColorClass = "text-foreground";

              if (isPartial) {
                bgClass =
                  "bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/60 dark:hover:bg-yellow-800/60";
                borderClass =
                  "border-l-2 border-l-yellow-600 dark:border-l-yellow-500";
                textColorClass = "text-yellow-900 dark:text-yellow-100";
              } else if (isHarvested) {
                bgClass =
                  "bg-green-100 hover:bg-green-200 dark:bg-green-900/60 dark:hover:bg-green-800/60";
                borderClass =
                  "border-l-2 border-l-green-600 dark:border-l-green-500";
                textColorClass = "text-green-900 dark:text-green-100";
              }

              return (
                <tr
                  key={agg.id}
                  className={`hover:bg-muted/30 transition-colors ${bgClass} ${borderClass}`}
                >
                  <td className={`p-2 border-b text-xs ${textColorClass}`}>
                    {new Date(agg.timestamp).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  {!allSameBranch && (
                    <td className={`p-2 border-b text-xs ${textColorClass}`}>
                      {branchLocation}
                    </td>
                  )}
                  <td
                    className={`p-2 border-b text-xs text-center ${textColorClass}`}
                  >
                    {agg.coins_1}
                  </td>
                  <td
                    className={`p-2 border-b text-xs text-center ${textColorClass}`}
                  >
                    {agg.coins_5}
                  </td>
                  <td
                    className={`p-2 border-b text-xs text-center ${textColorClass}`}
                  >
                    {agg.coins_10}
                  </td>
                  <td
                    className={`p-2 border-b text-xs text-center ${textColorClass}`}
                  >
                    {agg.coins_20}
                  </td>
                  <td
                    className={`p-2 border-b text-xs text-center ${textColorClass}`}
                  >
                    {agg.sales_count}
                  </td>
                  <td
                    className={`p-2 border-b text-xs font-semibold text-center ${
                      isPartial
                        ? "text-yellow-800 dark:text-yellow-200"
                        : isHarvested
                        ? "text-green-800 dark:text-green-200"
                        : "text-green-700 dark:text-green-400"
                    }`}
                  >
                    ₱{agg.total.toFixed(2)}
                  </td>
                  <td className="p-2 border-b text-center">
                    {isPartial ? (
                      <Badge
                        variant="default"
                        className="bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600 text-xs px-1 py-0 h-5"
                      >
                        <Scissors className="w-2 h-2 mr-1" />
                        Cutoff
                      </Badge>
                    ) : isHarvested ? (
                      <Badge
                        variant="default"
                        className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-xs px-1 py-0 h-5"
                      >
                        <CheckCircle className="w-2 h-2 mr-1" />
                        Done
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground text-xs px-1 py-0 h-5"
                      >
                        <Circle className="w-2 h-2 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Version */}
      <div className="md:hidden space-y-2">
        {currentData.map((agg) => {
          const branchLocation = branchMap[agg.branchId] || agg.branchId;
          const showBranch = !allSameBranch || agg.branchId !== currentBranchId;
          const isHarvested = agg.harvested;
          const isPartial = agg.isPartial;

          let borderClass = "border-muted/20";
          let bgClass = "";
          let textColorClass = "text-foreground";
          let mutedTextColorClass = "text-muted-foreground";

          if (isPartial) {
            borderClass = "border-yellow-400 dark:border-yellow-500";
            bgClass = "bg-yellow-100 dark:bg-yellow-900/60";
            textColorClass = "text-yellow-900 dark:text-yellow-100";
            mutedTextColorClass = "text-yellow-700 dark:text-yellow-300";
          } else if (isHarvested) {
            borderClass = "border-green-400 dark:border-green-500";
            bgClass = "bg-green-100 dark:bg-green-900/60";
            textColorClass = "text-green-900 dark:text-green-100";
            mutedTextColorClass = "text-green-700 dark:text-green-300";
          }

          return (
            <Card
              key={agg.id}
              className={`border transition-colors ${borderClass} ${bgClass}`}
            >
              <CardContent className="p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <span className={`text-xs block ${mutedTextColorClass}`}>
                      {new Date(agg.timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {showBranch && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {branchLocation}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-sm font-semibold ${
                        isPartial
                          ? "text-yellow-800 dark:text-yellow-200"
                          : isHarvested
                          ? "text-green-800 dark:text-green-200"
                          : "text-green-700 dark:text-green-400"
                      }`}
                    >
                      ₱{agg.total.toFixed(2)}
                    </span>
                    {isPartial ? (
                      <Badge
                        variant="default"
                        className="bg-yellow-600 text-xs dark:bg-yellow-700 px-1 py-0 h-4"
                      >
                        <Scissors className="w-2 h-2 mr-0.5" />
                        Cutoff
                      </Badge>
                    ) : isHarvested ? (
                      <Badge
                        variant="default"
                        className="bg-green-600 text-xs dark:bg-green-700 px-1 py-0 h-4"
                      >
                        <CheckCircle className="w-2 h-2 mr-0.5" />
                        Done
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs px-1 py-0 h-4"
                      >
                        <Circle className="w-2 h-2 mr-0.5" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1 text-xs">
                  <div className="flex flex-col items-center p-1 bg-muted/20 rounded">
                    <span className={`text-xs ${mutedTextColorClass}`}>₱1</span>
                    <span className={`font-medium ${textColorClass}`}>
                      {agg.coins_1}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-1 bg-muted/20 rounded">
                    <span className={`text-xs ${mutedTextColorClass}`}>₱5</span>
                    <span className={`font-medium ${textColorClass}`}>
                      {agg.coins_5}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-1 bg-muted/20 rounded">
                    <span className={`text-xs ${mutedTextColorClass}`}>
                      ₱10
                    </span>
                    <span className={`font-medium ${textColorClass}`}>
                      {agg.coins_10}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-1 bg-muted/20 rounded">
                    <span className={`text-xs ${mutedTextColorClass}`}>
                      ₱20
                    </span>
                    <span className={`font-medium ${textColorClass}`}>
                      {agg.coins_20}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <span className={`text-xs ${mutedTextColorClass}`}>
                    Transactions:{" "}
                    <span className={`font-medium ${textColorClass}`}>
                      {agg.sales_count}
                    </span>
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevious}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="text-sm text-muted-foreground mx-4">
            Page {currentPage} of {totalPages}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={goToNext}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

function UnitPageClient() {
  const { unitId } = useParams<{ unitId: string }>();

  // Use the hook directly with the deviceId from params
  const {
    aggregates,
    loading: aggLoading,
    unitInfo,
    branchMap,
  } = useUnitAggregates(unitId);

  // Get current branch info
  const currentBranchId = unitInfo?.branchId || aggregates?.[0]?.branchId;
  const currentBranchLocation = currentBranchId
    ? branchMap[currentBranchId]
    : null;

  if (aggLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!aggregates || aggregates.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <UnitHeader
            deviceId={unitId}
            alias={unitInfo?.alias}
            branchId={currentBranchId}
            branchLocation={currentBranchLocation || undefined}
          />
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-3 bg-muted rounded-full mb-3">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                No Data Available
              </h3>
              <p className="text-muted-foreground text-center text-sm">
                No transaction data available yet.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <UnitHeader
          deviceId={unitId}
          alias={unitInfo?.alias}
          branchId={currentBranchId}
          branchLocation={currentBranchLocation || undefined}
        />

        <MetricsCards
          data={aggregates}
          currentBranchId={currentBranchId}
          branchMap={branchMap}
        />

        <UnitAggregatesTable
          data={aggregates}
          currentBranchId={currentBranchId}
          branchMap={branchMap}
        />
      </div>
    </div>
  );
}

export default UnitPageClient;
