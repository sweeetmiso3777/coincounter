"use client"

import { useSalesQuery } from "./use-sales-query"
import { useUnits } from "./use-units-query"
import { useBranches } from "./use-branches-query"


// Global ref counting for enriched sales


export function useEnrichedSales() {
  const salesQuery = useSalesQuery()
  const unitsQuery = useUnits()
  const branchesQuery = useBranches()
  
  
  
  const isLoading = salesQuery.isLoading || unitsQuery.loading || branchesQuery.isLoading
  const isError = salesQuery.isError || unitsQuery.error || branchesQuery.isError

  const deviceAliasMap = new Map<string, string>()
  const deviceBranchIdMap = new Map<string, string>()
  const branchLocationMap = new Map<string, string>()

  if (isLoading) {
    return {
      ...salesQuery,
      data: undefined,
      isLoading: true,
      isUnitsLoading: unitsQuery.loading,
      isBranchesLoading: branchesQuery.isLoading,
    }
  }

  if (isError) {
    return {
      ...salesQuery,
      data: undefined,
      isError: true,
      error: salesQuery.error || unitsQuery.error || branchesQuery.error,
    }
  }

  // Map units to their aliases and branchIds
  if (unitsQuery.units) {
    unitsQuery.units.forEach((unit) => {
      if (unit.deviceId) {
        if (unit.alias?.trim()) {
          deviceAliasMap.set(unit.deviceId, unit.alias.trim())
        }
        if (unit.branchId?.trim()) {
          deviceBranchIdMap.set(unit.deviceId, unit.branchId.trim())
        }
      }
    })
  }

  // Map branches to their locations
  if (branchesQuery.data) {
    branchesQuery.data.forEach((branch) => {
      if (branch.id && branch.location) {
        branchLocationMap.set(branch.id, branch.location)
      }
    })
  }

  const enrichedSales = salesQuery.data
    ? salesQuery.data.map((sale) => {
        const branchId = deviceBranchIdMap.get(sale.deviceId)
        const branchLocation = branchId ? branchLocationMap.get(branchId) : undefined

        return {
          ...sale,
          alias: deviceAliasMap.get(sale.deviceId) || "Alias", // Fallback if not found
          branchLocation: branchLocation || "No Branch", // Fallback if not found
        }
      })
    : []

  // Cleanup on unmount
  


  return {
    // Pass through all React Query properties from salesQuery
    ...salesQuery,
    // Override data with enriched version
    data: enrichedSales,
    // Also expose units and branches loading states if needed
    isUnitsLoading: unitsQuery.loading,
    isBranchesLoading: branchesQuery.isLoading,
  }
}