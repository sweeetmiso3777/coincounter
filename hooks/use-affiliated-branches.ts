// hooks/use-affiliated-branches.ts
"use client";

import { useBranches } from "./use-branches-query";
import { useUser } from "@/providers/UserProvider";

export function useAffiliatedBranches() {
  const { user } = useUser();
  const { data: allBranches = [], isLoading, error } = useBranches();

  // Filter branches based on user role and affiliation
  const branches = user?.role === "admin" 
    ? allBranches 
    : allBranches.filter(branch => 
        branch.affiliates?.some(affiliate => 
          affiliate.toLowerCase() === user?.email?.toLowerCase()
        )
      );

  return {
    branches,
    isLoading,
    error,
    isAdmin: user?.role === "admin"
  };
}