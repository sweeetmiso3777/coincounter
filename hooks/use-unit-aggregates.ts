"use client";

import { useState, useCallback } from "react";
import { collection, getDocs, query, orderBy, limit, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useQueryClient } from "@tanstack/react-query";

export interface Aggregate {
  id: string;
  coins_1: number;
  coins_5: number;
  coins_10: number;
  coins_20: number;
  sales_count: number;
  total: number;
  timestamp: Date;
}

export interface UnitWithAggregates {
  deviceId: string;
  branch: string;
  branchId: string;
  alias: string;
  aggregates: Aggregate[];
}

export interface AggregatesState {
  aggregates: Aggregate[];
  loading: boolean;
  error: string | null;
}


// aggregates Only

export function useUnitsAggregates() {
  const [state, setState] = useState<AggregatesState>({
    aggregates: [],
    loading: false,
    error: null,
  });

  const queryClient = useQueryClient();

  // Fetch aggregates for a specific unit
  const fetchAggregates = useCallback(async (deviceId: string): Promise<Aggregate[]> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const aggregatesCol = collection(db, "Units", deviceId, "aggregates");
      const q = query(aggregatesCol, orderBy("timestamp", "desc"), limit(30));
      const snapshot = await getDocs(q);

      const aggregates = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp:
            data.timestamp instanceof Timestamp
              ? data.timestamp.toDate()
              : data.timestamp,
        } as Aggregate;
      });


      setState({ aggregates, loading: false, error: null });
      queryClient.setQueryData(["aggregates", deviceId], aggregates);
      
      return aggregates;
    } catch (err) {
      const errorMessage = `Failed to fetch aggregates for ${deviceId}`;
      console.error(` ${errorMessage}:`, err);
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      
      throw new Error(errorMessage);
    }
  }, [queryClient]);


  const clearAggregates = useCallback(() => {
    setState({ aggregates: [], loading: false, error: null });
  }, []);

  return {
    ...state,
    fetchAggregates,
    clearAggregates,
  };
}


export function useUnitAggregates(deviceId: string | null) {
  const { aggregates, loading, error, fetchAggregates, clearAggregates } = useUnitsAggregates();

  // Auto-fetch when deviceId changes
  const fetchForUnit = useCallback(async () => {
    if (!deviceId) {
      clearAggregates();
      return;
    }
    await fetchAggregates(deviceId);
  }, [deviceId, fetchAggregates, clearAggregates]);

  return {
    aggregates,
    loading,
    error,
    fetchAggregates: fetchForUnit,
    clearAggregates,
  };
}