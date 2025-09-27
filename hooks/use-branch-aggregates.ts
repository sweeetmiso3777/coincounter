"use client";

import { useQuery } from "@tanstack/react-query";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface BranchAggregateData {
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

export function useBranchAggregates(branchId: string): UseBranchAggregatesReturn {
  const fetchBranchAggregates = async (): Promise<BranchAggregateData> => {
    if (!branchId) throw new Error("Branch ID is required");

    const branchDoc = await getDoc(doc(db, "Branches", branchId));
    if (!branchDoc.exists()) throw new Error("Branch not found");

    const branchData = branchDoc.data() as { location?: string; name?: string };

    const aggregatesCollection = collection(db, "Branches", branchId, "Aggregates");
    const aggregatesSnapshot = await getDocs(aggregatesCollection);

    if (aggregatesSnapshot.empty) {
      return {
        totalRevenue: 0,
        totalTransactions: 0,
        location: branchData.location || branchData.name || `Branch ${branchId}`,
        coinBreakdown: { peso1: 0, peso5: 0, peso10: 0, peso20: 0 },
      };
    }

    // Pick the most recent aggregate (assuming ID = YYYY-MM-DD)
    const latestDoc = aggregatesSnapshot.docs.reduce((prev, curr) =>
      prev.id > curr.id ? prev : curr
    );

    const aggregateData = latestDoc.data() as {
      grandTotal?: number;
      totalTransactions?: number;
      coins_1?: number;
      coins_5?: number;
      coins_10?: number;
      coins_20?: number;
    };

    return {
      totalRevenue: aggregateData.grandTotal || 0,
      totalTransactions: aggregateData.totalTransactions || 0,
      location: branchData.location || branchData.name || `Branch ${branchId}`,
      coinBreakdown: {
        peso1: aggregateData.coins_1 || 0,
        peso5: aggregateData.coins_5 || 0,
        peso10: aggregateData.coins_10 || 0,
        peso20: aggregateData.coins_20 || 0,
      },
    };
  };

  const { data, isLoading, isError, error } = useQuery<
    BranchAggregateData,
    Error
  >({
    queryKey: ["branch-aggregates", branchId],
    queryFn: fetchBranchAggregates,
    enabled: !!branchId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });

  return {
    data: data ?? null,
    isLoading,
    isError,
    error: error ? { message: error.message } : null,
  };
}
