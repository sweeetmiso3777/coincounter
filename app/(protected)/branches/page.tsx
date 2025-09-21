"use client";

import { BranchPage, Branch } from "@/components/Branch/branch-page";
import { useBranches } from "@/hooks/use-branches-query";

export default function BranchesPage() {
  const { data: branches = [], isLoading, error } = useBranches();

  if (isLoading) return <main className="p-4">Loading branches…</main>;
  if (error)
    return <main className="p-4 text-red-500">Failed to load branches</main>;

  return (
    <main className="min-h-screen bg-background">
      <BranchPage branches={branches as Branch[]} />
    </main>
  );
}
