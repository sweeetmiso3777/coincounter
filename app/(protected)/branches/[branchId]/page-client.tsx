"use client";

import { useParams } from "next/navigation";
import { useBranchAggregatesHistory } from "@/hooks/use-branch-aggregates-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Activity, Calendar, BarChart3 } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import { AggregatesTable } from "@/components/Branch/aggregates-table";
import { useBranches } from "@/hooks/use-branches-query";
import { MapModal } from "@/components/Branch/MapModal";
import CompactMap from "@/components/Branch/CompactMap";
import { BranchUnitsStatus } from "@/components/Branch/branch-units";
import type { BranchData } from "@/hooks/use-branches-query";
import type { HistoricalAggregate } from "@/types/aggregates";

// ========== MOBILE CARDS ==========
function MobileAggregatesCards({
  data,
  location,
}: {
  data: HistoricalAggregate[];
  location: string;
}) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);

  const formatNumber = (num: number) =>
    new Intl.NumberFormat("en-PH").format(num);

  return (
    <div className="space-y-4 md:hidden">
      <div className="text-center mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Monthly Reports
        </h2>
        <p className="text-sm text-muted-foreground">{location}</p>
      </div>

      {data.map((aggregate, index) => (
        <Card
          key={index}
          className="shadow-sm hover:shadow-md transition-shadow"
        >
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base font-semibold">
                {aggregate.date}
              </CardTitle>
              <div className="text-right">
                <div className="text-lg font-bold text-primary">
                  {formatCurrency(aggregate.totalRevenue)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatNumber(aggregate.totalTransactions)} transactions
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Coin Breakdown */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">₱1 Coins:</span>
                  <span className="font-medium">
                    {formatNumber(aggregate.coinBreakdown.peso1)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">₱5 Coins:</span>
                  <span className="font-medium">
                    {formatNumber(aggregate.coinBreakdown.peso5)}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">₱10 Coins:</span>
                  <span className="font-medium">
                    {formatNumber(aggregate.coinBreakdown.peso10)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">₱20 Coins:</span>
                  <span className="font-medium">
                    {formatNumber(aggregate.coinBreakdown.peso20)}
                  </span>
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">
                  Total Coins
                </div>
                <div className="text-sm font-semibold">
                  {formatNumber(aggregate.totalCoins ?? 0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">
                  Avg. Transaction
                </div>
                <div className="text-sm font-semibold">
                  {aggregate.totalTransactions > 0
                    ? formatCurrency(
                        aggregate.totalRevenue / aggregate.totalTransactions
                      )
                    : formatCurrency(0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ========== BRANCH HEADER ==========
const BranchHeader = React.memo(
  ({
    branchId,
    location,
    branch,
  }: {
    branchId: string;
    location: string;
    branch: BranchData | undefined;
  }) => {
    const [showMapModal, setShowMapModal] = useState(false);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
      if (event.key === "Escape") setShowMapModal(false);
    }, []);

    const handleClickOutside = useCallback((event: MouseEvent) => {
      const modal = document.querySelector("[data-map-modal]");
      const trigger = document.querySelector("[data-map-trigger]");
      if (
        modal &&
        !modal.contains(event.target as Node) &&
        trigger &&
        !trigger.contains(event.target as Node)
      )
        setShowMapModal(false);
    }, []);

    useEffect(() => {
      if (showMapModal) {
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousedown", handleClickOutside);
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
      }
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("mousedown", handleClickOutside);
        document.body.style.overflow = "unset";
      };
    }, [showMapModal, handleKeyDown, handleClickOutside]);

    return (
      <>
        <div className="mb-8">
          {/* Back Button */}
          <Button asChild variant="ghost" className="mb-6">
            <Link href="/branches">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Branches
            </Link>
          </Button>

          {/* Title */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4 font-mono">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground text-balance">
                {location}
              </h1>
            </div>

            <p className="text-muted-foreground text-lg font-mono">
              Monthly performance metrics and transaction summaries
            </p>
          </div>

          {/* FLEX CONTAINER — Units left, Map right */}
          <div className="flex flex-col lg:flex-row gap-6 items-stretch">
            {/* Units Status */}
            <div className="lg:flex-1">
              <BranchUnitsStatus branchId={branchId} />
            </div>

            {/* Map */}
            <div className="lg:w-1/2 z-0">
              <button
                data-map-trigger
                onClick={() => setShowMapModal(true)}
                className="w-full h-64 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all bg-gray-50 dark:bg-gray-800 hover:scale-[1.02]"
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
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <MapPin className="h-8 w-8 text-gray-400" />
                    <span className="sr-only">No location data</span>
                  </div>
                )}
              </button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Click map to expand
              </p>
            </div>
          </div>
        </div>

        {/* Full Map Modal */}
        {showMapModal && branch && (
          <MapModal
            open={showMapModal}
            onClose={() => setShowMapModal(false)}
            branch={branch}
            data-map-modal
          />
        )}
      </>
    );
  }
);

BranchHeader.displayName = "BranchHeader";

// ========== MAIN PAGE ==========
function BranchPageClient() {
  const { branchId } = useParams<{ branchId: string }>();
  const { data: branches, isLoading: branchesLoading } = useBranches();
  const {
    data: historyData,
    isLoading: historyLoading,
    isError,
    error,
  } = useBranchAggregatesHistory(branchId as string, 30);

  const branch = branches?.find((b) => b.id === branchId);
  const branchLocation = branch?.location || `Branch ${branchId}`;

  // FIX: Ensure historyData is always treated as an array
  const safeHistoryData = Array.isArray(historyData) ? historyData : [];
  const location =
    safeHistoryData.length > 0 ? safeHistoryData[0].location : branchLocation;

  const isLoading = branchesLoading || historyLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-10 bg-muted rounded-md"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded-md"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError)
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <BranchHeader
            branchId={branchId as string}
            location={location}
            branch={branch}
          />
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="flex flex-col items-center py-16">
              <Activity className="h-8 w-8 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Error Loading Branch Data
              </h3>
              <p className="text-muted-foreground text-center mb-6">
                {error?.message}
              </p>
              <Button asChild variant="outline">
                <Link href="/branches">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Branches
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );

  // FIX: Use safeHistoryData here
  if (safeHistoryData.length === 0)
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <BranchHeader
            branchId={branchId as string}
            location={location}
            branch={branch}
          />
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-16">
              <BarChart3 className="h-8 w-8 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">
                No Monthly Data Available
              </h3>
              <p className="text-muted-foreground text-center mb-6">
                No monthly aggregates found for {branchLocation}.<br />
                Monthly reports are generated after harvest operations.
              </p>
              <Button asChild variant="outline">
                <Link href="/branches">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Branches
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <BranchHeader
          branchId={branchId as string}
          location={location}
          branch={branch}
        />

        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <span>
            Showing monthly aggregate data. Each row represents a full month of
            activity.
          </span>
        </div>

        {/* FIX: Pass safeHistoryData instead of historyData */}
        <MobileAggregatesCards data={safeHistoryData} location={location} />

        <div className="hidden md:block">
          <AggregatesTable data={safeHistoryData} location={location} />
        </div>
      </div>
    </div>
  );
}

export default BranchPageClient;
