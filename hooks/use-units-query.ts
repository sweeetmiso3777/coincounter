"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchUnitsWithBranch } from "@/lib/units-api"

export const unitsKeys = {
  all: ["units"] as const,
  lists: () => [...unitsKeys.all, "list"] as const,
  withBranch: () => [...unitsKeys.all, "withBranch"] as const,
}

export function useUnitsWithBranch() {
  return useQuery({
    queryKey: unitsKeys.withBranch(), // Using lists() instead of withBranch() to match branches pattern
    queryFn: fetchUnitsWithBranch,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}
