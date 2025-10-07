"use client";

import { useSalesQuery } from "./use-sales-query";
import { useUnits } from "./use-units-query";
import type { SalesDocument } from "@/types/sales";

export function useEnrichedSales() {
  const salesQuery = useSalesQuery();
  const unitsQuery = useUnits();

  // Create lookup maps for device aliases and branch locations
  const deviceAliasMap = new Map();
  const deviceBranchLocationMap = new Map();
  
  if (unitsQuery.units) {
    unitsQuery.units.forEach(unit => {
      if (unit.deviceId) {
        // Set alias if available
        if (unit.alias?.trim()) {
          deviceAliasMap.set(unit.deviceId, unit.alias.trim());
        }
        // Set branch location if available
        if (unit.branchLocation?.trim()) {
          deviceBranchLocationMap.set(unit.deviceId, unit.branchLocation.trim());
        }
      }
    });
  }

  // Keep ALL sales records, just enrich them with aliases and branch locations
  const enrichedSales = salesQuery.data ? salesQuery.data.map(sale => ({
    ...sale,
    alias: deviceAliasMap.get(sale.deviceId) || "Alias", // Fallback if not found
    branchLocation: deviceBranchLocationMap.get(sale.deviceId) || "No Branch" // Fallback if not found
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