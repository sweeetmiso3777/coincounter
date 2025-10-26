"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import React, { useEffect, useRef } from "react";
import { useUnitAggregates } from "@/hooks/use-unit-aggregates";
import { useUnitsContext } from "@/providers/UnitsQueryProvider";
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
  <div className="mb-8">
    <div className="flex justify-between items-center mb-4">
      <Button asChild variant="ghost">
        <Link href="/units">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Units
        </Link>
      </Button>

      <Button asChild variant="ghost">
        <Link href="/real-time">
          Back to Real-Time
          <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
      </Button>
    </div>

    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-secondary/10 rounded-lg">
        <Activity className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-foreground text-balance">
          {alias || deviceId}
        </h1>
        {branchLocation && (
          <div className="flex items-center gap-2 mt-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary" className="text-sm">
              {branchLocation}
            </Badge>
          </div>
        )}
      </div>
    </div>
    <p className="text-muted-foreground text-lg">
      Transaction history and earnings overview
    </p>
  </div>
);

const UnitAggregatesTable = ({
  data,
  currentBranchId,
  branchMap,
}: {
  data: UnitAggregate[];
  currentBranchId?: string;
  branchMap: Record<string, string>;
}) => {
  const grandTotal = data.reduce((sum, agg) => sum + agg.total, 0);
  const totalSales = data.reduce((sum, agg) => sum + agg.sales_count, 0);
  const uniqueDays = new Set(
    data.map((agg) => new Date(agg.timestamp).toLocaleDateString())
  ).size;

  const currentBranchLocation = currentBranchId
    ? branchMap[currentBranchId]
    : null;

  const allSameBranch = data.every((agg) => agg.branchId === currentBranchId);

  return (
    <div className="space-y-4">
      <div className="mb-4 p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100 rounded-md text-sm text-center">
        Summary Today will be generated at exactly 11:49 PM
      </div>

      {currentBranchLocation && (
        <Card className="border-blue-300/10 bg-card dark:bg-card/10 dark:border-blue-300">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    {currentBranchLocation}
                  </span>
                  {currentBranchId && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 block">
                      Branch ID: {currentBranchId}
                    </span>
                  )}
                </div>
              </div>
              {!allSameBranch && (
                <Badge variant="outline" className="text-xs">
                  Multiple Locations
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-blue-300 bg-card/10 ">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Total Earnings
            </h2>
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            ₱<AnimatedNumber value={grandTotal} decimals={2} />
          </p>

          <p className="text-sm text-muted-foreground mt-1">
            From {totalSales}{" "}
            {totalSales === 1 ? "transaction" : "transactions"} across{" "}
            {uniqueDays} {uniqueDays === 1 ? "day" : "days"}
          </p>
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto border rounded-lg bg-card border-blue-300">
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 border-b text-sm font-medium text-foreground min-w-[120px]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Date</span>
                </div>
              </th>
              {!allSameBranch && (
                <th className="p-3 border-b text-sm font-medium text-foreground min-w-[150px]">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>Location</span>
                  </div>
                </th>
              )}
              <th className="p-3 border-b text-sm font-medium text-foreground text-center min-w-[90px]">
                <div className="flex flex-col items-center gap-1">
                  <Coins className="w-4 h-4 text-muted-foreground" />
                  <span>₱1</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Coins
                  </span>
                </div>
              </th>
              <th className="p-3 border-b text-sm font-medium text-foreground text-center min-w-[90px]">
                <div className="flex flex-col items-center gap-1">
                  <Coins className="w-4 h-4 text-muted-foreground" />
                  <span>₱5</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Coins
                  </span>
                </div>
              </th>
              <th className="p-3 border-b text-sm font-medium text-foreground text-center min-w-[90px]">
                <div className="flex flex-col items-center gap-1">
                  <Coins className="w-4 h-4 text-muted-foreground" />
                  <span>₱10</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Coins
                  </span>
                </div>
              </th>
              <th className="p-3 border-b text-sm font-medium text-foreground text-center min-w-[90px]">
                <div className="flex flex-col items-center gap-1">
                  <Coins className="w-4 h-4 text-muted-foreground" />
                  <span>₱20</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Coins
                  </span>
                </div>
              </th>
              <th className="p-3 border-b text-sm font-medium text-foreground text-center min-w-[100px]">
                <div className="flex flex-col items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span>Transactions</span>
                </div>
              </th>
              <th className="p-3 border-b text-sm font-medium text-foreground text-center min-w-[120px]">
                <div className="flex flex-col items-center gap-1">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span>Amount</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Earned
                  </span>
                </div>
              </th>
              <th className="p-3 border-b text-sm font-medium text-foreground text-center min-w-[100px]">
                <div className="flex flex-col items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-muted-foreground" />
                  <span>Status</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((agg) => {
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
                  "border-l-4 border-l-yellow-600 dark:border-l-yellow-500";
                textColorClass = "text-yellow-900 dark:text-yellow-100";
              } else if (isHarvested) {
                bgClass =
                  "bg-green-100 hover:bg-green-200 dark:bg-green-900/60 dark:hover:bg-green-800/60";
                borderClass =
                  "border-l-4 border-l-green-600 dark:border-l-green-500";
                textColorClass = "text-green-900 dark:text-green-100";
              }

              return (
                <tr
                  key={agg.id}
                  className={`hover:bg-muted/30 transition-colors ${bgClass} ${borderClass}`}
                >
                  <td className={`p-3 border-b text-sm ${textColorClass}`}>
                    {new Date(agg.timestamp).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  {!allSameBranch && (
                    <td className={`p-3 border-b text-sm ${textColorClass}`}>
                      {branchLocation}
                    </td>
                  )}
                  <td
                    className={`p-3 border-b text-sm text-center ${textColorClass}`}
                  >
                    {agg.coins_1}
                  </td>
                  <td
                    className={`p-3 border-b text-sm text-center ${textColorClass}`}
                  >
                    {agg.coins_5}
                  </td>
                  <td
                    className={`p-3 border-b text-sm text-center ${textColorClass}`}
                  >
                    {agg.coins_10}
                  </td>
                  <td
                    className={`p-3 border-b text-sm text-center ${textColorClass}`}
                  >
                    {agg.coins_20}
                  </td>
                  <td
                    className={`p-3 border-b text-sm text-center ${textColorClass}`}
                  >
                    {agg.sales_count}
                  </td>
                  <td
                    className={`p-3 border-b text-sm font-semibold text-center ${
                      isPartial
                        ? "text-yellow-800 dark:text-yellow-200"
                        : isHarvested
                        ? "text-green-800 dark:text-green-200"
                        : "text-green-700 dark:text-green-400"
                    }`}
                  >
                    ₱{agg.total.toFixed(2)}
                  </td>
                  <td className="p-3 border-b text-center">
                    {isPartial ? (
                      <Badge
                        variant="default"
                        className="bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600"
                      >
                        <Scissors className="w-3 h-3 mr-1" />
                        Harvest Cutoff
                      </Badge>
                    ) : isHarvested ? (
                      <Badge
                        variant="default"
                        className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Harvested
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        <Circle className="w-3 h-3 mr-1" />
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
      <div className="md:hidden space-y-4">
        {data.map((agg) => {
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
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-sm block ${mutedTextColorClass}`}>
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
                        className="bg-yellow-600 text-xs dark:bg-yellow-700"
                      >
                        <Scissors className="w-3 h-3 mr-1" />
                        Cutoff
                      </Badge>
                    ) : isHarvested ? (
                      <Badge
                        variant="default"
                        className="bg-green-600 text-xs dark:bg-green-700"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Harvested
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <Circle className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex flex-col items-center p-2 bg-muted/20 rounded">
                    <span className={`text-xs ${mutedTextColorClass}`}>₱1</span>
                    <span className={`font-medium ${textColorClass}`}>
                      {agg.coins_1}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-muted/20 rounded">
                    <span className={`text-xs ${mutedTextColorClass}`}>₱5</span>
                    <span className={`font-medium ${textColorClass}`}>
                      {agg.coins_5}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-muted/20 rounded">
                    <span className={`text-xs ${mutedTextColorClass}`}>
                      ₱10
                    </span>
                    <span className={`font-medium ${textColorClass}`}>
                      {agg.coins_10}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-muted/20 rounded">
                    <span className={`text-xs ${mutedTextColorClass}`}>
                      ₱20
                    </span>
                    <span className={`font-medium ${textColorClass}`}>
                      {agg.coins_20}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-muted/20 rounded col-span-2">
                    <span className={`text-xs ${mutedTextColorClass}`}>
                      Transactions
                    </span>
                    <span className={`font-medium ${textColorClass}`}>
                      {agg.sales_count}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

function UnitPageClient() {
  const { unitId } = useParams<{ unitId: string }>();
  const { units, loading: unitsLoading, error: unitsError } = useUnitsContext();
  const unit = units.find((u) => u.deviceId === unitId);

  const {
    aggregates,
    loading: aggLoading,
    fetchAggregates,
    branchMap,
  } = useUnitAggregates(unitId);

  const hasFetchedRef = useRef(false);

  // Only fetch once when unitId is available
  useEffect(() => {
    if (unitId && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchAggregates();
    }
  }, [unitId]); // Remove fetchAggregates from dependencies!

  // Reset when unitId changes
  useEffect(() => {
    return () => {
      hasFetchedRef.current = false;
    };
  }, [unitId]);

  const currentBranchId = unit?.branchId || aggregates?.[0]?.branchId;
  const currentBranchLocation = currentBranchId
    ? branchMap[currentBranchId]
    : null;

  if (unitsLoading || aggLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (unitsError || !unit) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <UnitHeader
            deviceId={unitId}
            alias={unit?.alias}
            branchId={currentBranchId}
            branchLocation={currentBranchLocation || undefined}
          />
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-destructive/10 rounded-full mb-4">
                <Activity className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Error Loading Unit Data
              </h3>
              <p className="text-muted-foreground text-center">
                Unit not found or failed to load data.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!aggregates || aggregates.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <UnitHeader
            deviceId={unitId}
            alias={unit.alias}
            branchId={currentBranchId}
            branchLocation={currentBranchLocation || undefined}
          />
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-muted rounded-full mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Data Available
              </h3>
              <p className="text-muted-foreground text-center">
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UnitHeader
          deviceId={unitId}
          alias={unit.alias}
          branchId={currentBranchId}
          branchLocation={currentBranchLocation || undefined}
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
