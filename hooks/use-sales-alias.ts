"use client";

import { useSalesQuery } from "./use-sales-query";
import { useUnits } from "./use-units-query"; // Make sure this path matches your actual file
import type { SalesDocument } from "@/types/sales";

export function useEnrichedSales() {
  const salesQuery = useSalesQuery();
  const unitsQuery = useUnits();

  // Simple deduplication - keep first occurrence of each deviceId
  const uniqueSales = salesQuery.data ? deduplicateSales(salesQuery.data) : [];

  // Merge with unit aliases
  const enrichedSales = uniqueSales.map(sale => ({
    ...sale,
    alias: getAliasForDevice(sale.deviceId, unitsQuery.units)
  }));

  return {
    // Pass through all React Query properties from salesQuery
    ...salesQuery,
    // Override data with enriched version
    data: enrichedSales,
    // Also expose units loading state if needed
    isUnitsLoading: unitsQuery.loading
  };
}

// Simple deduplication - keeps the first occurrence of each deviceId
function deduplicateSales(sales: SalesDocument[]): SalesDocument[] {
  const seen = new Set();
  return sales.filter(sale => {
    if (seen.has(sale.deviceId)) {
      console.log(`Filtering out duplicate deviceId: ${sale.deviceId}`);
      return false;
    }
    seen.add(sale.deviceId);
    return true;
  });
}

// Fast lookup for aliases
function getAliasForDevice(deviceId: string, units: any[]): string {
  const unit = units.find(u => u.deviceId === deviceId);
  
  if (!unit) {
    console.warn(`No unit found for deviceId: ${deviceId}`);
    return "Alias"; // Fallback as per your SalesCard
  }
  
  if (!unit.alias || unit.alias.trim() === "") {
    console.warn(`Unit found but no alias for deviceId: ${deviceId}`);
    return "Alias"; // Fallback as per your SalesCard
  }
  
  return unit.alias;
}