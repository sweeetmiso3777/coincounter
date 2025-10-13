// components/Branch/branch-page.tsx
"use client";

import { BranchCard } from "./branch-card";
import { AddBranchCard } from "./add-branch-card";
import { useBranches } from "@/hooks/use-branches-query";
import { useUser } from "@/providers/UserProvider";

export function BranchPage() {
  const { user } = useUser();
  const { data: branches = [], isLoading, error } = useBranches();

  const isAdmin = user?.role === "admin";

  if (isLoading) return <p className="p-4">Loading branches…</p>;
  if (error) return <p className="p-4 text-red-500">Failed to load branches</p>;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl text-foreground">
            Branch Management Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage and monitor all your PISONET branches
          </p>
        </div>

        {/* Branches Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-mono text-foreground">
              All Branches ({branches.length})
            </h2>
            {isAdmin && branches.length > 0 && <AddBranchCard />}
          </div>

          {branches.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No branches found
                </h3>
                <p className="text-muted-foreground mb-6">
                  Get started by creating your first branch to track harvests
                  and manage operations.
                </p>
                {isAdmin && <AddBranchCard />}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {branches.map((branch) => (
                <BranchCard
                  key={branch.id}
                  branch={branch} // Just pass the branch directly
                  totalUnits={branch.totalUnits || 0}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
