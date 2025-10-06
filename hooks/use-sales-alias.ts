"use client";

import { useSalesQuery } from "./use-sales-query";
import { useUnits } from "./use-units-query";
import type { SalesDocument } from "@/types/sales";

export function useEnrichedSales() {
  const salesQuery = useSalesQuery();
  const unitsQuery = useUnits();

  // Create a lookup map for device aliases (this is the "deduplication" of device info)
  const deviceAliasMap = new Map();
  if (unitsQuery.units) {
    unitsQuery.units.forEach(unit => {
      if (unit.deviceId && unit.alias?.trim()) {
        deviceAliasMap.set(unit.deviceId, unit.alias.trim());
      }
    });
  }

  // Keep ALL sales records, just enrich them with aliases
  const enrichedSales = salesQuery.data ? salesQuery.data.map(sale => ({
    ...sale,
    alias: deviceAliasMap.get(sale.deviceId) || "Alias" // Fallback if not found
  })) : [];

  return {
    // Pass through all React Query properties from salesQuery
    ...salesQuery,
    // Override data with enriched version
    data: enrichedSales,
    // Also expose units loading state if needed
    isUnitsLoading: unitsQuery.loading
  };
}