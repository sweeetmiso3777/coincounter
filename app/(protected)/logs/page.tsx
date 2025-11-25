"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Coins,
  Package,
  BarChart3,
  MapPin,
  User,
  AlertTriangle,
} from "lucide-react";
import { useDailySummaries, DailySummaryWithId } from "@/hooks/use-all-logs";
import { useBranches, BranchData } from "@/hooks/use-branches-query";
import { useUnits, Unit } from "@/hooks/use-units-query";

export default function Page(): React.JSX.Element {
  const { summaries, loading, error } = useDailySummaries();
  const { data: branches = [] } = useBranches();
  const { units } = useUnits();
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  // Create a branch map for quick lookups
  const branchMap = useMemo(() => {
    const map = new Map<string, BranchData>();
    branches.forEach((branch) => {
      map.set(branch.id, branch);
    });
    return map;
  }, [branches]);

  // Create a units map for quick lookups
  const unitsMap = useMemo(() => {
    const map = new Map<string, Unit>();
    units.forEach((unit) => {
      map.set(unit.deviceId, unit);
    });
    return map;
  }, [units]);

  function formatShortDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  const toggleDay = (dateId: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dateId)) {
      newExpanded.delete(dateId);
    } else {
      newExpanded.add(dateId);
    }
    setExpandedDays(newExpanded);
  };

  // Helper to get branch info
  const getBranchInfo = (branchId: string) => {
    return (
      branchMap.get(branchId) || {
        id: branchId,
        location: branchId,
        branch_manager: "Unknown",
        share: 0,
      }
    );
  };

  // Helper to get device alias
  const getDeviceAlias = (deviceId: string) => {
    const unit = unitsMap.get(deviceId);
    return unit?.alias || deviceId;
  };

  // Helper to get devices with no sales for a specific day
  const getMissingDevices = (summary: DailySummaryWithId) => {
    const activeDeviceIds = new Set(
      summary.unitBreakdown.map((unit) => unit.deviceId)
    );
    const missingDevices = units.filter(
      (unit) => !activeDeviceIds.has(unit.deviceId)
    );

    return missingDevices.map((device) => ({
      ...device,
      branchInfo: getBranchInfo(device.branchId),
    }));
  };

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: 24,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Daily Summaries</h1>
          <p style={{ color: "#6b7280" }}>Loading daily reports...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: 24,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Daily Summaries</h1>
          <p style={{ color: "#dc2626" }}>Error: {error.message}</p>
        </div>
      </main>
    );
  }

  if (!summaries || summaries.length === 0) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: 24,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Daily Summaries</h1>
          <p style={{ color: "#6b7280", marginBottom: 20 }}>
            Consolidated daily performance reports.
          </p>

          <div
            style={{
              borderRadius: 8,
              border: "1px dashed #e5e7eb",
              padding: 24,
              textAlign: "center",
              background: "#ffffff",
            }}
          >
            <p style={{ color: "#9ca3af", margin: 0 }}>
              No daily summaries available yet.
            </p>
            <small
              style={{ display: "block", marginTop: 12, color: "#9ca3af" }}
            >
              Daily summaries will appear here after the aggregation process
              runs.
            </small>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Daily Summaries</h1>
        <p style={{ color: "#6b7280", marginBottom: 20 }}>
          Consolidated daily performance reports.
        </p>

        <div className="space-y-2">
          {summaries.map((summary, index) => {
            const isExpanded = expandedDays.has(summary.dateId);
            const isLastDay = index === summaries.length - 1;
            const missingDevices = getMissingDevices(summary);

            return (
              <div key={summary.id} className="relative">
                {/* Day Header */}
                <div
                  className="flex items-center justify-between p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => toggleDay(summary.dateId)}
                >
                  <div className="flex items-center gap-3">
                    {/* Vertical line connector */}
                    {!isLastDay && (
                      <div className="absolute left-4 top-12 w-px h-6 bg-border -z-10" />
                    )}
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <div>
                      <span className="font-medium text-foreground">
                        {formatShortDate(summary.dateId)}
                      </span>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />₱
                          {summary.totalRevenue.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {summary.totalSales} sales
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          {summary.totalActiveDevices}/{summary.totalUnits}{" "}
                          devices
                        </span>
                        {missingDevices.length > 0 && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <AlertTriangle className="h-3 w-3" />
                            {missingDevices.length} offline
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-muted-foreground">
                      {summary.coinDenomination.totalValue.toLocaleString()}{" "}
                      coins
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="mt-2 ml-6 border-l border-border pl-4 space-y-3">
                    {/* Totals Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="p-2 border rounded-lg bg-card">
                        <div className="text-xs text-muted-foreground">
                          Total Revenue
                        </div>
                        <div className="font-semibold text-green-600">
                          ₱{summary.totalRevenue.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-2 border rounded-lg bg-card">
                        <div className="text-xs text-muted-foreground">
                          Total Sales
                        </div>
                        <div className="font-semibold text-purple-600">
                          {summary.totalSales}
                        </div>
                      </div>
                      <div className="p-2 border rounded-lg bg-card">
                        <div className="text-xs text-muted-foreground">
                          Active Devices
                        </div>
                        <div className="font-semibold text-blue-600">
                          {summary.totalActiveDevices}/{summary.totalUnits}
                        </div>
                      </div>
                      <div className="p-2 border rounded-lg bg-card">
                        <div className="text-xs text-muted-foreground">
                          Coin Value
                        </div>
                        <div className="font-semibold text-amber-600">
                          ₱
                          {summary.coinDenomination.totalValue.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Missing Devices */}
                    {missingDevices.length > 0 && (
                      <div className="border rounded-lg bg-amber-50 border-amber-200 p-3">
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-amber-700">
                          <AlertTriangle className="h-4 w-4" />
                          Devices With No Sales ({missingDevices.length})
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {missingDevices.map((device) => (
                            <div
                              key={device.deviceId}
                              className="flex items-center justify-between text-xs py-1 border-b border-amber-200 last:border-b-0"
                            >
                              <div className="flex-1">
                                <a
                                  href={`/units/${device.deviceId}`}
                                  className="font-medium text-amber-800 hover:text-amber-900 hover:underline transition-colors"
                                >
                                  {device.alias || device.deviceId}
                                </a>
                                <div className="flex items-center gap-2 text-amber-600">
                                  <span className="text-xs font-mono bg-amber-100 px-1 rounded">
                                    {device.deviceId}
                                  </span>
                                  <a
                                    href={`/branches/${device.branchId}`}
                                    className="hover:text-amber-700 hover:underline transition-colors"
                                  >
                                    {device.branchInfo.location}
                                  </a>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-amber-700">
                                  ₱0
                                </div>
                                <div className="text-amber-600">0 sales</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-amber-600 mt-2">
                          These devices are registered but recorded no sales for
                          this day.
                        </p>
                      </div>
                    )}

                    {/* Coin Breakdown */}
                    <div className="border rounded-lg bg-card p-3">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-blue-600">
                        <Coins className="h-4 w-4" />
                        Coin Denomination
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <div className="text-muted-foreground">₱1 Coins</div>
                          <div className="font-semibold text-gray-600">
                            {summary.coinDenomination.coins_1.toLocaleString()}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            ₱
                            {(
                              summary.coinDenomination.coins_1 * 1
                            ).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">₱5 Coins</div>
                          <div className="font-semibold text-purple-600">
                            {summary.coinDenomination.coins_5.toLocaleString()}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            ₱
                            {(
                              summary.coinDenomination.coins_5 * 5
                            ).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">₱10 Coins</div>
                          <div className="font-semibold text-amber-600">
                            {summary.coinDenomination.coins_10.toLocaleString()}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            ₱
                            {(
                              summary.coinDenomination.coins_10 * 10
                            ).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">₱20 Coins</div>
                          <div className="font-semibold text-green-600">
                            {summary.coinDenomination.coins_20.toLocaleString()}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            ₱
                            {(
                              summary.coinDenomination.coins_20 * 20
                            ).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Top Performers */}
                    {summary.rankedDevices.length > 0 && (
                      <div className="border rounded-lg bg-card p-3">
                        <h4 className="text-sm font-medium mb-2 text-blue-600">
                          Top Performing Devices
                        </h4>
                        <div className="space-y-2">
                          {summary.rankedDevices.slice(0, 5).map((device) => {
                            const branchInfo = getBranchInfo(device.branchId);
                            const deviceAlias = getDeviceAlias(device.deviceId);
                            return (
                              <div
                                key={device.deviceId}
                                className="flex items-center justify-between text-xs py-1"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 flex items-center justify-center bg-blue-600 text-white rounded-full text-xs">
                                    {device.rank}
                                  </span>
                                  <div>
                                    <a
                                      href={`/units/${device.deviceId}`}
                                      className="font-medium text-foreground hover:text-blue-600 hover:underline transition-colors"
                                    >
                                      {deviceAlias}
                                    </a>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <span className="text-xs font-mono bg-muted px-1 rounded">
                                        {device.deviceId}
                                      </span>
                                      <MapPin className="h-3 w-3" />
                                      <a
                                        href={`/branches/${device.branchId}`}
                                        className="hover:text-blue-600 hover:underline transition-colors"
                                      >
                                        {branchInfo.location}
                                      </a>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-green-600">
                                    ₱{device.totalRevenue.toLocaleString()}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {device.salesCount} sales
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Branch Summary */}
                    {summary.branchSummary.length > 0 && (
                      <div className="border rounded-lg bg-card p-3">
                        <h4 className="text-sm font-medium mb-2 text-blue-600">
                          Branch Performance
                        </h4>
                        <div className="space-y-2">
                          {summary.branchSummary.map((branch) => {
                            const branchInfo = getBranchInfo(branch.branchId);
                            return (
                              <div
                                key={branch.branchId}
                                className="flex items-center justify-between text-xs py-1"
                              >
                                <div>
                                  <a
                                    href={`/branches/${branch.branchId}`}
                                    className="font-medium text-foreground hover:text-blue-600 hover:underline transition-colors"
                                  >
                                    {branchInfo.location}
                                  </a>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    <span>{branchInfo.branch_manager}</span>
                                    {branchInfo.share > 0 && (
                                      <span className="ml-2 text-purple-600">
                                        ({branchInfo.share}% share)
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-green-600">
                                    ₱{branch.totalRevenue.toLocaleString()}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {branch.activeDeviceCount}/
                                    {branch.deviceCount} devices
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Unit Breakdown */}
                    {summary.unitBreakdown.length > 0 && (
                      <div className="border rounded-lg bg-card p-3">
                        <h4 className="text-sm font-medium mb-2 text-blue-600">
                          All Devices Breakdown
                        </h4>
                        <div className="space-y-1 max-h-60 overflow-y-auto">
                          {summary.unitBreakdown.map((unit) => {
                            const branchInfo = getBranchInfo(unit.branchId);
                            const deviceAlias = getDeviceAlias(unit.deviceId);
                            return (
                              <div
                                key={unit.deviceId}
                                className="flex items-center justify-between text-xs py-1 border-b last:border-b-0"
                              >
                                <div className="flex-1">
                                  <a
                                    href={`/units/${unit.deviceId}`}
                                    className="font-medium text-foreground hover:text-blue-600 hover:underline transition-colors"
                                  >
                                    {deviceAlias}
                                  </a>
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <span className="text-xs font-mono bg-muted px-1 rounded">
                                      {unit.deviceId}
                                    </span>
                                    <a
                                      href={`/branches/${unit.branchId}`}
                                      className="hover:text-blue-600 hover:underline transition-colors"
                                    >
                                      {branchInfo.location}
                                    </a>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-green-600">
                                    ₱{unit.total.toLocaleString()}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {unit.salesCount} sales
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
