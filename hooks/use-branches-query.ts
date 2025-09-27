"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collection, doc, getDocs, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface BranchData {
  id: string;
  branch_manager: string;
  location: string;
  harvest_day_of_month: number;
  created_at: Date;
  share: number;
  totalUnits: number; // totalUnits
}

// fetch all branches with totalUnits
async function fetchBranches(): Promise<BranchData[]> {
  const branchesSnapshot = await getDocs(collection(db, "Branches"));

  const branches: BranchData[] = await Promise.all(
    branchesSnapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      
      const totalUnits = data.totalUnits ?? 0;
      return {
        id: docSnap.id,
        branch_manager: data.branch_manager,
        location: data.location,
        harvest_day_of_month: data.harvest_day_of_month,
        created_at: data.created_at?.toDate?.() ?? new Date(),
        share: data.share ?? 0,
        totalUnits,
      };
    })
  );

  return branches;
}

// single branch fetch
async function fetchBranch(branchId: string): Promise<BranchData | null> {
  const branchRef = doc(db, "Branches", branchId);
  const branchSnap = await getDoc(branchRef);

  if (!branchSnap.exists()) return null;

  const data = branchSnap.data();
  const totalUnits = data.totalUnits ?? 0;

  return {
    id: branchSnap.id,
    branch_manager: data.branch_manager,
    location: data.location,
    harvest_day_of_month: data.harvest_day_of_month,
    created_at: data.created_at?.toDate?.() ?? new Date(),
    share: data.share ?? 0,
    totalUnits,
  };
}

// TanStack Query hook
export function useBranches() {
  return useQuery<BranchData[]>({
    queryKey: ["branches"],
    queryFn: fetchBranches,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBranch(branchId: string) {
  return useQuery<BranchData | null>({
    queryKey: ["branch", branchId],
    queryFn: () => fetchBranch(branchId),
    enabled: !!branchId,
  });
}
