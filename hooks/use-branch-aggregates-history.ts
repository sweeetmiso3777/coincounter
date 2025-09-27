"use client";

import { useQuery } from "@tanstack/react-query";
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AggregateDocument, BranchAggregateData, HistoricalAggregate } from "@/types/aggregates"; // Adjust path

interface UseBranchAggregatesHistoryReturn {
  data: HistoricalAggregate[]; // Array of historical aggregates (most recent first)
  isLoading: boolean;
  isError: boolean;
  error: { message: string } | null;
}

  export function useBranchAggregatesHistory(
    branchId: string,
    limitCount: number = 30
  ): UseBranchAggregatesHistoryReturn {
  const fetchBranchAggregatesHistory = async (): Promise<HistoricalAggregate[]> => {
    if (!branchId) throw new Error("Branch ID is required");
    const branchDoc = await getDoc(doc(db, "Branches", branchId));
    if (!branchDoc.exists()) throw new Error("Branch not found");
    const branchData = branchDoc.data() as { location?: string; name?: string };
    const location = branchData.location || branchData.name || `Branch ${branchId}`;
    const aggregatesCollection = collection(db, "Branches", branchId, "Aggregates");
    // Query for the most recent N aggregates by aggregateDate
    const aggregatesQuery = query(
      aggregatesCollection, 
      orderBy("aggregateDate", "desc"), 
      limit(limitCount)
    ); 
    const aggregatesSnapshot = await getDocs(aggregatesQuery);
    if (aggregatesSnapshot.empty) {
      return []; 
    }


    const history: HistoricalAggregate[] = aggregatesSnapshot.docs.map((doc) => {
      const aggregateData = doc.data() as AggregateDocument;
      const aggregateDate = aggregateData.aggregateDate.toDate(); // Convert Timestamp to Date
      const totalCoins = (aggregateData.coins_1 || 0) + (aggregateData.coins_5 || 0) + 
                         (aggregateData.coins_10 || 0) + (aggregateData.coins_20 || 0);

      return {
        date: aggregateDate.toLocaleDateString("en-US", { 
          year: "numeric", 
          month: "short", 
          day: "numeric" 
        }), // e.g., "Sep 26, 2025"
        totalRevenue: aggregateData.grandTotal || 0,
        totalTransactions: aggregateData.totalTransactions || 0,
        location,
        coinBreakdown: {
          peso1: aggregateData.coins_1 || 0,
          peso5: aggregateData.coins_5 || 0,
          peso10: aggregateData.coins_10 || 0,
          peso20: aggregateData.coins_20 || 0,
        },
        totalCoins,
      };
    });

    return history;
  };

  const { data, isLoading, isError, error } = useQuery<
    HistoricalAggregate[],
    Error
  >({
    queryKey: ["branch-aggregates-history", branchId, limitCount],
    queryFn: fetchBranchAggregatesHistory,
    enabled: !!branchId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  return {
    data: data ?? [],
    isLoading,
    isError,
    error: error ? { message: error.message } : null,
  };
}
