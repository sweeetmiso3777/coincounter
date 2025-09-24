"use client";

import { useQuery } from "@tanstack/react-query";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface BranchAggregateData {
  totalRevenue: number;
  totalTransactions: number;
  location: string;
  coinBreakdown: {
    peso1: number;
    peso5: number;
    peso10: number;
    peso20: number;
  };
}

interface UseBranchAggregatesReturn {
  data: BranchAggregateData | null;
  isLoading: boolean;
  isError: boolean;
  error: { message: string } | null;
}

export function useBranchAggregates(
  branchId: string
): UseBranchAggregatesReturn {
  const fetchBranchAggregates = async (): Promise<BranchAggregateData> => {
    console.log(
      "[v0] Fetching branch aggregates from Firebase for branch:",
      branchId
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
      console.log("[v0] No aggregate data found");
      return {
        totalRevenue: 0,
        totalTransactions: 0,
        location:
          branchData.location || branchData.name || `Branch ${branchId}`,
        coinBreakdown: {
          peso1: 0,
          peso5: 0,
          peso10: 0,
          peso20: 0,
        },
      };
    }

    const firstDoc = aggregatesSnapshot.docs[0];
    const aggregateData = firstDoc.data();

    console.log(
      "[v0] Processing document:",
      firstDoc.id,
      "data:",
      aggregateData
    );

    const coinData = aggregateData.coinBreakdown || {};

    return {
      totalRevenue: aggregateData.totalRevenue || 0,
      totalTransactions: aggregateData.totalTransactions || 0,
      location: branchData.location || branchData.name || `Branch ${branchId}`,
      coinBreakdown: {
        peso1: coinData.coins_1 || 0,
        peso5: coinData.coins_5 || 0,
        peso10: coinData.coins_10 || 0,
        peso20: coinData.coins_20 || 0,
      },
    };
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["branch-aggregates", branchId],
    queryFn: fetchBranchAggregates,
    enabled: !!branchId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  return {
    data: data || null,
    isLoading,
    isError,
    error: error ? { message: error.message } : null,
  };
}
