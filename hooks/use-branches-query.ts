"use client";

import { useQuery } from "@tanstack/react-query";
import { collection, doc, getDocs, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface BranchData {
  id: string;
  branch_manager: string;
  location: string;
  harvest_day_of_month: number;
  created_at: Date;
  share: number;
  totalUnits: number;
}

// fetch all branches
async function fetchBranches(): Promise<BranchData[]> {
  const snapshot = await getDocs(collection(db, "Branches"));
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      branch_manager: data.branch_manager,
      location: data.location,
      harvest_day_of_month: data.harvest_day_of_month,
      created_at: data.created_at instanceof Timestamp ? data.created_at.toDate() : new Date(),
      share: data.share ?? 0,
      totalUnits: data.totalUnits ?? 0,
    };
  });
}

// fetch single branch
async function fetchBranch(branchId: string): Promise<BranchData | null> {
  const branchRef = doc(db, "Branches", branchId);
  const branchSnap = await getDoc(branchRef);
  if (!branchSnap.exists()) return null;

  const data = branchSnap.data();
  return {
    id: branchSnap.id,
    branch_manager: data.branch_manager,
    location: data.location,
    harvest_day_of_month: data.harvest_day_of_month,
    created_at: data.created_at instanceof Timestamp ? data.created_at.toDate() : new Date(),
    share: data.share ?? 0,
    totalUnits: data.totalUnits ?? 0,
  };
}

// React Query hooks
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
