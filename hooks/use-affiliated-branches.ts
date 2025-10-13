// hooks/use-affiliated-branches.ts
"use client";

import { useBranches } from "./use-branches-query";
import { useUser } from "@/providers/UserProvider";
import { useMemo } from "react";

export function useAffiliatedBranches() {
  const { user } = useUser();
  const { data: allBranches = [], isLoading, error } = useBranches();

  const { branches, userBranchCount } = useMemo(() => {
    if (user?.role === "admin") {
      return { 
        branches: allBranches, 
        userBranchCount: allBranches.length 
      };
    }
    
    const userBranches = allBranches.filter(branch => 
      branch.affiliates?.some(affiliate => 
        affiliate.toLowerCase() === user?.email?.toLowerCase()
      )
    );
    
    return { 
      branches: userBranches, 
      userBranchCount: userBranches.length 
    };
  }, [allBranches, user?.role, user?.email]);

  return {
    branches,
    isLoading,
    error,
    isAdmin: user?.role === "admin",
    userBranchCount,
    totalBranchCount: allBranches.length
  };
}