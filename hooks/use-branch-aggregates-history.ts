"use client";

import { useQuery } from "@tanstack/react-query";
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface MonthlyAggregate {
  month: string; // "YYYY-MM"
  coins_1: number;
  coins_5: number;
  coins_10: number;
  coins_20: number;
  sales_count: number;
  total: number;
  branchId: string;
  last_updated?: string | null;
  last_harvest_date?: string;
  aggregates_included: number;
  units_count: number;
}

interface HistoricalAggregate {
  date: string; // Formatted as "Sep 2023", "Oct 2023", etc.
  totalRevenue: number;
  totalTransactions: number;
  location: string;
  coinBreakdown: {
    peso1: number;
    peso5: number;
    peso10: number;
    peso20: number;
  };
  totalCoins: number;
  monthKey: string; // Original "YYYY-MM" for sorting
}

interface UseBranchAggregatesHistoryReturn {
  data: HistoricalAggregate[];
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

    // FIXED: Use correct collection path (lowercase 'aggregates')
    const aggregatesCollection = collection(db, "Branches", branchId, "aggregates");
    
    // Query for the most recent N aggregates by month (descending)
    const aggregatesQuery = query(
      aggregatesCollection, 
      orderBy("month", "desc"), // FIXED: Use 'month' field instead of 'aggregateDate'
      limit(limitCount)
    );
    
    const aggregatesSnapshot = await getDocs(aggregatesQuery);
    
    if (aggregatesSnapshot.empty) {
      return []; 
    }

    const history: HistoricalAggregate[] = aggregatesSnapshot.docs.map((doc) => {
      const aggregateData = doc.data() as MonthlyAggregate;
      
      // Parse the month string (YYYY-MM) into a display format
      const [year, month] = aggregateData.month.split('-');
      const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      
      const totalCoins = (aggregateData.coins_1 || 0) + (aggregateData.coins_5 || 0) + 
                         (aggregateData.coins_10 || 0) + (aggregateData.coins_20 || 0);

      return {
        date: monthDate.toLocaleDateString("en-US", { 
          year: "numeric", 
          month: "short" 
        }), // e.g., "Sep 2025" (no day since it's monthly)
        totalRevenue: aggregateData.total || 0, // FIXED: Use 'total' instead of 'grandTotal'
        totalTransactions: aggregateData.sales_count || 0, // FIXED: Use 'sales_count' instead of 'totalTransactions'
        location,
        coinBreakdown: {
          peso1: aggregateData.coins_1 || 0,
          peso5: aggregateData.coins_5 || 0,
          peso10: aggregateData.coins_10 || 0,
          peso20: aggregateData.coins_20 || 0,
        },
        totalCoins,
        monthKey: aggregateData.month, // Keep original for internal use if needed
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