"use client";

import { useQuery } from "@tanstack/react-query";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useState } from "react";

interface BranchAggregateData {
  totalRevenue: number;
  totalTransactions: number;
  timeRange: {
    earliest: Date;
    latest: Date;
  };
  coinBreakdown: {
    coins_1: number;
    coins_5: number;
    coins_10: number;
    coins_20: number;
  };
  location: string;
}

interface UseBranchAggregatesReturn {
  data: BranchAggregateData | null;
  isLoading: boolean;
  isError: boolean;
  error: { message: string } | null;
  timePeriod: string;
  setTimePeriod: (period: string) => void;
}

export function useBranchAggregates(
  branchId: string
): UseBranchAggregatesReturn {
  const [timePeriod, setTimePeriod] = useState("30d");

  const fetchBranchAggregates = async (): Promise<BranchAggregateData> => {
    console.log(
      "[v0] Fetching branch aggregates from Firebase for branch:",
      branchId,
      "period:",
      timePeriod
    );

    if (!branchId) {
      throw new Error("Branch ID is required");
    }

    const branchDoc = await getDoc(doc(db, "Branches", branchId));

    if (!branchDoc.exists()) {
      throw new Error("Branch not found");
    }

    const branchData = branchDoc.data();

    const aggregatesCollection = collection(
      db,
      "Branches",
      branchId,
      "Aggregates"
    );
    const aggregatesSnapshot = await getDocs(aggregatesCollection);

    if (aggregatesSnapshot.empty) {
      throw new Error("No aggregate data found for this branch");
    }

    const days = timePeriod === "1d" ? 1 : timePeriod === "7d" ? 7 : 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let totalRevenue = 0;
    let totalTransactions = 0;
    const combinedCoinBreakdown = {
      coins_1: 0,
      coins_5: 0,
      coins_10: 0,
      coins_20: 0,
    };
    let earliestTime: Date | null = null;
    let latestTime: Date | null = null;

    aggregatesSnapshot.docs.forEach((doc) => {
      const aggregateData = doc.data();

      // For now, include all aggregates (you can add date filtering here if needed)
      totalRevenue += aggregateData.totalRevenue || 0;
      totalTransactions += aggregateData.totalTransactions || 0;

      // Sum coin breakdown
      if (aggregateData.coinBreakdown) {
        combinedCoinBreakdown.coins_1 +=
          aggregateData.coinBreakdown.coins_1 || 0;
        combinedCoinBreakdown.coins_5 +=
          aggregateData.coinBreakdown.coins_5 || 0;
        combinedCoinBreakdown.coins_10 +=
          aggregateData.coinBreakdown.coins_10 || 0;
        combinedCoinBreakdown.coins_20 +=
          aggregateData.coinBreakdown.coins_20 || 0;
      }

      // Track time range
      if (aggregateData.timeRange) {
        const docEarliest =
          aggregateData.timeRange.earliest?.toDate?.() ||
          aggregateData.timeRange.earliest;
        const docLatest =
          aggregateData.timeRange.latest?.toDate?.() ||
          aggregateData.timeRange.latest;

        if (!earliestTime || (docEarliest && docEarliest < earliestTime)) {
          earliestTime = docEarliest;
        }
        if (!latestTime || (docLatest && docLatest > latestTime)) {
          latestTime = docLatest;
        }
      }
    });

    console.log(
      "[v0] Successfully fetched fresh data from Firebase - Revenue:",
      totalRevenue,
      "Transactions:",
      totalTransactions
    );

    return {
      totalRevenue,
      totalTransactions,
      timeRange: {
        earliest: earliestTime || new Date(),
        latest: latestTime || new Date(),
      },
      coinBreakdown: combinedCoinBreakdown,
      location: branchData.location || branchData.name || `Branch ${branchId}`,
    };
  };

  const { data, isLoading, isError, error, isFetching, isStale } = useQuery({
    queryKey: ["branch-aggregates", branchId, timePeriod],
    queryFn: fetchBranchAggregates,
    enabled: !!branchId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60, // 1 hour,
    meta: {
      onSuccess: () => {
        if (!isFetching && data) {
          console.log(
            "[v0] Data loaded from cache/local storage for branch:",
            branchId,
            "period:",
            timePeriod
          );
        }
      },
    },
  });

  if (data && !isLoading && !isFetching) {
    console.log(
      "[v0] Using cached data for branch:",
      branchId,
      "- Data is",
      isStale ? "stale but usable" : "fresh"
    );
  }

  if (isLoading) {
    console.log(
      "[v0] Initial loading for branch:",
      branchId,
      "period:",
      timePeriod
    );
  }

  if (isFetching && data) {
    console.log(
      "[v0] Background refetch in progress while showing cached data"
    );
  }

  return {
    data: data || null,
    isLoading,
    isError,
    error: error ? { message: error.message } : null,
    timePeriod,
    setTimePeriod,
  };
}
