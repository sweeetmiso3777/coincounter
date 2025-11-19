// components/Branch/branch-page.tsx
"use client";

import { BranchCard } from "./branch-card";
import { AddBranchCard } from "./CRUDS/add-branch-card";
import { useBranches } from "@/hooks/use-branches-query";
import { useUser } from "@/providers/UserProvider";
import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function BranchPage() {
  const { user } = useUser();
  const { data: branches = [], isLoading, error } = useBranches();
  const [selectedManager, setSelectedManager] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const isAdmin = user?.role === "admin";

  // Extract unique managers
  const managers = useMemo(() => {
    const uniqueManagers = Array.from(
      new Set(branches.map((b) => b.branch_manager).filter(Boolean))
    );
    return uniqueManagers.sort();
  }, [branches]);

  // Filter branches
  const filteredBranches = useMemo(() => {
    return branches.filter((branch) => {
      // Filter by Manager
      if (selectedManager !== "all" && branch.branch_manager !== selectedManager) {
        return false;
      }

      // Filter by Status
      if (selectedStatus !== "all") {
        const now = new Date();
        
        // Calculate days until next harvest
        let harvestDate = new Date(now.getFullYear(), now.getMonth(), branch.harvest_day_of_month);
        if (branch.harvest_day_of_month < now.getDate()) {
          harvestDate = new Date(now.getFullYear(), now.getMonth() + 1, branch.harvest_day_of_month);
        }
        if (harvestDate.getDate() !== branch.harvest_day_of_month) {
             harvestDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }
        const daysUntil = Math.ceil((harvestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Check if harvested recently
        let isHarvested = false;
        if (branch.last_harvest_date) {
          const lastHarvestDate = new Date(branch.last_harvest_date);
          if (!isNaN(lastHarvestDate.getTime())) {
             const diffTime = now.getTime() - lastHarvestDate.getTime();
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
             isHarvested = diffDays > 0 && diffDays <= 30;
          }
        }

        if (selectedStatus === "ready") {
          return daysUntil <= 3;
        } else if (selectedStatus === "harvested") {
          return isHarvested;
        } else if (selectedStatus === "upcoming") {
          return daysUntil > 3;
        }
      }

      return true;
    });
  }, [branches, selectedManager, selectedStatus]);

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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="w-full sm:w-[200px]">
            <Select value={selectedManager} onValueChange={setSelectedManager}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Managers</SelectItem>
                {managers.map((manager) => (
                  <SelectItem key={manager} value={manager}>
                    {manager}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-[200px]">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ready">Ready for Harvest</SelectItem>
                <SelectItem value="harvested">Harvested Recently</SelectItem>
                <SelectItem value="upcoming">Upcoming Harvest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Branches Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-mono text-foreground">
              {selectedManager !== "all" || selectedStatus !== "all" 
                ? `Filtered Branches (${filteredBranches.length})`
                : `All Branches (${branches.length})`}
            </h2>
            {isAdmin && branches.length > 0 && <AddBranchCard />}
          </div>

          {filteredBranches.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No branches found
                </h3>
                <p className="text-muted-foreground mb-6">
                  {branches.length === 0 
                    ? "Get started by creating your first branch to track harvests and manage operations."
                    : "No branches match the selected filters."}
                </p>
                {isAdmin && branches.length === 0 && <AddBranchCard />}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBranches.map((branch) => (
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
