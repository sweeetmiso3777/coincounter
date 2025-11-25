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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { BranchData } from "@/hooks/use-branches-query"; // Import the proper type

export function BranchPage() {
  const { user } = useUser();
  const { data: branches = [], isLoading, error } = useBranches();
  const [selectedManager, setSelectedManager] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showArchived, setShowArchived] = useState<boolean>(false);

  const isAdmin = user?.role === "admin";

  // Extract unique managers (only from active branches unless showing archived)
  const managers = useMemo(() => {
    const branchesToUse = showArchived
      ? branches
      : branches.filter((b) => !b.archived);
    const uniqueManagers = Array.from(
      new Set(branchesToUse.map((b) => b.branch_manager).filter(Boolean))
    );
    return uniqueManagers.sort();
  }, [branches, showArchived]);

  // Calculate days until next harvest for a branch
  const getDaysUntilHarvest = (branch: BranchData): number => {
    const now = new Date();

    // Calculate next harvest date
    let harvestDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      branch.harvest_day_of_month
    );

    // If harvest day has passed this month, move to next month
    if (branch.harvest_day_of_month < now.getDate()) {
      harvestDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        branch.harvest_day_of_month
      );
    }

    // Handle cases where the harvest day doesn't exist in the month (e.g., Feb 30)
    if (harvestDate.getDate() !== branch.harvest_day_of_month) {
      harvestDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const daysUntil = Math.ceil(
      (harvestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysUntil;
  };

  // Filter and sort branches
  const filteredBranches = useMemo(() => {
    const filtered = branches.filter((branch: BranchData) => {
      // Filter by Archived status
      if (!showArchived && branch.archived) {
        return false;
      }

      // Filter by Manager
      if (
        selectedManager !== "all" &&
        branch.branch_manager !== selectedManager
      ) {
        return false;
      }

      // Filter by Status (only apply to non-archived branches)
      if (selectedStatus !== "all" && !branch.archived) {
        const daysUntil = getDaysUntilHarvest(branch);

        // Check if harvested recently
        let isHarvested = false;
        if (branch.last_harvest_date) {
          const lastHarvestDate = new Date(branch.last_harvest_date);
          if (!isNaN(lastHarvestDate.getTime())) {
            const diffTime = Date.now() - lastHarvestDate.getTime();
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

    // Sort by upcoming harvest (closest harvest first)
    return filtered.sort((a: BranchData, b: BranchData) => {
      // Archived branches go to the bottom
      if (a.archived && !b.archived) return 1;
      if (!a.archived && b.archived) return -1;

      // If both are archived, sort by creation date or name
      if (a.archived && b.archived) {
        return a.branch_manager.localeCompare(b.branch_manager);
      }

      // For active branches, sort by days until harvest
      const daysUntilA = getDaysUntilHarvest(a);
      const daysUntilB = getDaysUntilHarvest(b);

      return daysUntilA - daysUntilB;
    });
  }, [branches, selectedManager, selectedStatus, showArchived]);

  // Calculate counts for display
  const branchCounts = useMemo(() => {
    const activeBranches = branches.filter((b: BranchData) => !b.archived);
    const archivedBranches = branches.filter((b: BranchData) => b.archived);

    return {
      total: branches.length,
      active: activeBranches.length,
      archived: archivedBranches.length,
      filtered: filteredBranches.length,
    };
  }, [branches, filteredBranches]);

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

          {/* Branch Count Summary */}
          <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
            <span>Total: {branchCounts.total}</span>
            <span>Active: {branchCounts.active}</span>
            <span>Archived: {branchCounts.archived}</span>
          </div>
        </div>

        {/* Filters */}
        <div>
          <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-6">
            <h2 className="text-xl font-mono text-foreground whitespace-nowrap">
              {selectedManager !== "all" ||
              selectedStatus !== "all" ||
              showArchived
                ? `Filtered Branches (${filteredBranches.length})`
                : `Active Branches (${branchCounts.active})`}
            </h2>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Show Archived Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-archived"
                  checked={showArchived}
                  onCheckedChange={(checked: boolean) =>
                    setShowArchived(checked)
                  }
                />
                <Label
                  htmlFor="show-archived"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Show Archived
                </Label>
              </div>

              <div className="flex flex-row items-center gap-2">
                <Select
                  value={selectedManager}
                  onValueChange={(value: string) => setSelectedManager(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Managers</SelectItem>
                    {managers.map((manager: string) => (
                      <SelectItem key={manager} value={manager}>
                        {manager}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedStatus}
                  onValueChange={(value: string) => setSelectedStatus(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="ready">Ready for Harvest</SelectItem>
                    <SelectItem value="harvested">
                      Harvested Recently
                    </SelectItem>
                    <SelectItem value="upcoming">Upcoming Harvest</SelectItem>
                  </SelectContent>
                </Select>

                {isAdmin && branches.length > 0 && <AddBranchCard />}
              </div>
            </div>
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
                    : showArchived
                    ? "No archived branches match the selected filters."
                    : "No active branches match the selected filters."}
                </p>
                {isAdmin && branches.length === 0 && <AddBranchCard />}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBranches.map((branch: BranchData) => (
                <BranchCard
                  key={branch.id}
                  branch={branch}
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
