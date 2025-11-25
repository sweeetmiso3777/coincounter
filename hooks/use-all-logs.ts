import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp, where, doc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface DailySummary {
  dateId: string;
  generatedAt: Timestamp;
  
  // Totals
  totalRevenue: number;
  totalSales: number;
  totalActiveDevices: number;
  totalUnits: number;
  
  // Coin denomination totals
  coinDenomination: {
    coins_1: number;
    coins_5: number; 
    coins_10: number;
    coins_20: number;
    totalValue: number;
  };
  
  // Ranked device list by total coins (value)
  rankedDevices: Array<{
    deviceId: string;
    branchId: string;
    totalRevenue: number;
    salesCount: number;
    coins_1: number;
    coins_5: number;
    coins_10: number;
    coins_20: number;
    rank: number;
  }>;
  
  // Per unit coin denomination breakdown
  unitBreakdown: Array<{
    deviceId: string;
    branchId: string;
    coins_1: number;
    coins_5: number;
    coins_10: number;
    coins_20: number;
    total: number;
    salesCount: number;
  }>;
  
  // Branch summary
  branchSummary: Array<{
    branchId: string;
    totalRevenue: number;
    deviceCount: number;
    activeDeviceCount: number;
  }>;
}

export interface DailySummaryWithId extends DailySummary {
  id: string;
}

// Hook to get all daily summaries
export function useDailySummaries() {
  const [summaries, setSummaries] = useState<DailySummaryWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    
    try {
      // Query for all summary documents, sorted by date descending (newest first)
      const summariesQuery = query(
        collection(db, 'logs'),
        where('dateId', '>=', '2024-01-01'), // Adjust start date as needed
        orderBy('dateId', 'desc')
      );

      // Real-time listener
      const unsubscribe = onSnapshot(summariesQuery,
        (snapshot) => {
          const summariesData: DailySummaryWithId[] = snapshot.docs
            .filter(doc => doc.id.startsWith('summary-'))
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            } as DailySummaryWithId));
          
          setSummaries(summariesData);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching daily summaries:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      // Cleanup subscription
      return () => unsubscribe();
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  }, []);

  return { summaries, loading, error };
}

// Hook to get a specific daily summary by date
export function useDailySummary(dateId: string) {
  const [summary, setSummary] = useState<DailySummaryWithId | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!dateId) return;

    setLoading(true);
    
    try {
      const summaryRef = doc(db, 'logs', `summary-${dateId}`);
      
      const unsubscribe = onSnapshot(summaryRef,
        (doc) => {
          if (doc.exists()) {
            setSummary({
              id: doc.id,
              ...doc.data()
            } as DailySummaryWithId);
          } else {
            setSummary(null);
          }
          setLoading(false);
        },
        (err) => {
          console.error(`Error fetching summary for ${dateId}:`, err);
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  }, [dateId]);

  return { summary, loading, error };
}

// Hook to get summaries within a date range
export function useDailySummariesByDateRange(startDate: string, endDate: string) {
  const [summaries, setSummaries] = useState<DailySummaryWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!startDate || !endDate) return;

    setLoading(true);
    
    try {
      const summariesQuery = query(
        collection(db, 'logs'),
        where('dateId', '>=', startDate),
        where('dateId', '<=', endDate),
        orderBy('dateId', 'desc')
      );

      const unsubscribe = onSnapshot(summariesQuery,
        (snapshot) => {
          const summariesData: DailySummaryWithId[] = snapshot.docs
            .filter(doc => doc.id.startsWith('summary-'))
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            } as DailySummaryWithId));
          
          setSummaries(summariesData);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching summaries by date range:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  }, [startDate, endDate]);

  return { summaries, loading, error };
}

// Hook to get the latest daily summary
export function useLatestDailySummary() {
  const [summary, setSummary] = useState<DailySummaryWithId | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    
    try {
      const summariesQuery = query(
        collection(db, 'logs'),
        orderBy('dateId', 'desc'),
        where('dateId', '>=', '2024-01-01')
      );

      const unsubscribe = onSnapshot(summariesQuery,
        (snapshot) => {
          const latestSummary = snapshot.docs
            .filter(doc => doc.id.startsWith('summary-'))
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            } as DailySummaryWithId))[0] || null;
          
          setSummary(latestSummary);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching latest summary:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  }, []);

  return { summary, loading, error };
}

// Helper functions
export function getTopPerformingDevices(summary: DailySummary, count: number = 5) {
  return summary.rankedDevices.slice(0, count);
}

export function getBranchPerformance(summary: DailySummary, branchId: string) {
  return summary.branchSummary.find(branch => branch.branchId === branchId);
}

export function getDeviceBreakdown(summary: DailySummary, deviceId: string) {
  return summary.unitBreakdown.find(unit => unit.deviceId === deviceId);
}

export function calculateCoinPercentage(summary: DailySummary, coinType: keyof DailySummary['coinDenomination']) {
  const total = summary.coinDenomination.totalValue;
  if (total === 0) return 0;
  
  const coinValue = summary.coinDenomination[coinType] * 
    (coinType === 'coins_1' ? 1 : 
     coinType === 'coins_5' ? 5 : 
     coinType === 'coins_10' ? 10 : 20);
  
  return (coinValue / total) * 100;
}