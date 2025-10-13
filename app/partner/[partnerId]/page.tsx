// app/partner/[partnerId]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useBranchAggregatesHistory } from "@/hooks/use-branch-aggregates-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MapPin,
  Activity,
  Calendar,
  BarChart3,
  DollarSign,
  Users,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import { useAffiliatedBranches } from "@/hooks/use-affiliated-branches";
import { MapModal } from "@/components/Branch/MapModal";
import CompactMap from "@/components/Branch/CompactMap";
import { BranchUnitsStatus } from "@/components/Branch/branch-units";
import type { BranchData } from "@/hooks/use-branches-query";
import type { HistoricalAggregate } from "@/types/aggregates";

interface PartnerBranchCardProps {
  branch: {
    id: string;
    location: string;
    last_harvest_date?: Date | null;
    // ... other properties
  };
}

// ========== MOBILE CARDS ==========
function PartnerMobileAggregatesCards({
  data,
  location,
  branchShare,
}: {
  data: HistoricalAggregate[];
  location: string;
  branchShare: number;
}) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);

  const formatNumber = (num: number) =>
    new Intl.NumberFormat("en-PH").format(num);

  const calculatePartnerEarnings = (totalRevenue: number) => {
    return totalRevenue * (branchShare / 100);
  };

  return (
    <div className="space-y-4 md:hidden z-40 overflow-hidden">
      <div className="text-center mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Monthly Reports
        </h2>
        <p className="text-sm text-muted-foreground">{location}</p>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
          Your Share: {branchShare}%
        </p>
      </div>

      {data.map((aggregate, index) => {
        const partnerEarnings = calculatePartnerEarnings(
          aggregate.totalRevenue
        );

        return (
          <Card
            key={index}
            className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-blue-500 z-50 overflow-auto"
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
              {/* Partner Earnings */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      Your Earnings:
                    </span>
                  </div>
                  <span className="text-lg font-bold text-blue-700 dark:text-blue-400">
                    {formatCurrency(partnerEarnings)}
                  </span>
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Based on your {branchShare}% share
                </div>
              </div>

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
        );
      })}
    </div>
  );
}

// ========== PARTNER BRANCH HEADER ==========
const PartnerBranchHeader = React.memo(
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
            <Link href="/partner">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Partner Dashboard
            </Link>
          </Button>

          {/* Title */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground text-balance">
                  {location}
                </h1>
                {branch && (
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Your Share: {branch.share}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-muted-foreground">
                        Managed by: {branch.branch_manager}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="text-muted-foreground text-lg">
              Your affiliate branch performance and earnings summary
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

PartnerBranchHeader.displayName = "PartnerBranchHeader";

// ========== PARTNER AGGREGATES TABLE ==========
function PartnerAggregatesTable({
  data,
  location,
  branchShare,
}: {
  data: HistoricalAggregate[];
  location: string;
  branchShare: number;
}) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);

  const formatNumber = (num: number) =>
    new Intl.NumberFormat("en-PH").format(num);

  const calculatePartnerEarnings = (totalRevenue: number) => {
    return totalRevenue * (branchShare / 100);
  };

  return (
    <div className="w-full overflow-hidden">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-foreground">
          Monthly Performance
        </h2>
        <p className="text-muted-foreground">
          {location} • Your Share:{" "}
          <span className="text-blue-600 font-semibold">{branchShare}%</span>
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-4 font-semibold">Month</th>
              <th className="text-right p-4 font-semibold">Total Revenue</th>
              <th className="text-right p-4 font-semibold">Your Earnings</th>
              <th className="text-right p-4 font-semibold">Transactions</th>
              <th className="text-right p-4 font-semibold">Total Coins</th>
              <th className="text-right p-4 font-semibold">Avg. Transaction</th>
            </tr>
          </thead>
          <tbody>
            {data.map((aggregate, index) => {
              const partnerEarnings = calculatePartnerEarnings(
                aggregate.totalRevenue
              );
              const avgTransaction =
                aggregate.totalTransactions > 0
                  ? aggregate.totalRevenue / aggregate.totalTransactions
                  : 0;

              return (
                <tr
                  key={index}
                  className="border-t hover:bg-muted/30 transition-colors"
                >
                  <td className="p-4 font-medium">{aggregate.date}</td>
                  <td className="p-4 text-right font-semibold">
                    {formatCurrency(aggregate.totalRevenue)}
                  </td>
                  <td className="p-4 text-right">
                    <div className="font-bold text-blue-700 dark:text-blue-400">
                      {formatCurrency(partnerEarnings)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {branchShare}% share
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    {formatNumber(aggregate.totalTransactions)}
                  </td>
                  <td className="p-4 text-right">
                    {formatNumber(aggregate.totalCoins ?? 0)}
                  </td>
                  <td className="p-4 text-right">
                    {formatCurrency(avgTransaction)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ========== MAIN PARTNER PAGE ==========
function PartnerBranchDetailPage() {
  const { partnerId } = useParams<{ partnerId: string }>();
  const { branches, isLoading: branchesLoading } = useAffiliatedBranches();
  const {
    data: historyData,
    isLoading: historyLoading,
    isError,
    error,
  } = useBranchAggregatesHistory(partnerId as string, 30);

  const branch = branches?.find((b) => b.id === partnerId);
  const branchLocation = branch?.location || `Branch ${partnerId}`;
  const location =
    historyData.length > 0 ? historyData[0].location : branchLocation;

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
          <PartnerBranchHeader
            branchId={partnerId as string}
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
                <Link href="/partner">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Partner
                  Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );

  if (!branch)
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-4">Branch Not Found</h2>
            <p className="text-muted-foreground mb-6">
              You do not have access to this branch or it does not exist.
            </p>
            <Button asChild>
              <Link href="/partner">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Partner Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );

  if (historyData.length === 0)
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <PartnerBranchHeader
            branchId={partnerId as string}
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
                <Link href="/partner">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Partner
                  Dashboard
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
        <PartnerBranchHeader
          branchId={partnerId as string}
          location={location}
          branch={branch}
        />

        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <span>
            Showing your monthly earnings data. Your share:{" "}
            <strong>{branch.share}%</strong> of total revenue.
          </span>
        </div>

        <PartnerMobileAggregatesCards
          data={historyData}
          location={location}
          branchShare={branch.share}
        />

        <div className="hidden md:block">
          <PartnerAggregatesTable
            data={historyData}
            location={location}
            branchShare={branch.share}
          />
        </div>
      </div>
    </div>
  );
}

export default PartnerBranchDetailPage;
