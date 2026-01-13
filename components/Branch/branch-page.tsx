// components/Branch/branch-page.tsx
"use client";

import { BranchCard } from "./branch-card";
import { AddBranchCard } from "./CRUDS/add-branch-card";
import { useBranches } from "@/hooks/use-branches-query";
import { useUser } from "@/providers/UserProvider";
import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import { BranchData } from "@/hooks/use-branches-query";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function BranchPage() {
  const { user } = useUser();
  const { data: branches = [], isLoading, error } = useBranches();
  const [selectedManager, setSelectedManager] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [showSidebar, setShowSidebar] = useState<boolean>(false);

  const isAdmin = user?.role === "admin";

  // Extract unique managers
  const managers = useMemo(() => {
    const uniqueManagers = Array.from(
      new Set(branches.map((b) => b.branch_manager).filter(Boolean))
    );
    return uniqueManagers.sort();
  }, [branches]);

  // Calculate days until next harvest
  const getDaysUntilHarvest = (branch: BranchData): number => {
    const now = new Date();
    let harvestDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      branch.harvest_day_of_month
    );

    if (branch.harvest_day_of_month < now.getDate()) {
      harvestDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        branch.harvest_day_of_month
      );
    }

    if (harvestDate.getDate() !== branch.harvest_day_of_month) {
      harvestDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return Math.ceil(
      (harvestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  // Filter and sort branches
  const filteredBranches = useMemo(() => {
    const filtered = branches.filter((branch: BranchData) => {
      if (!showArchived && branch.archived) return false;

      if (
        selectedManager !== "all" &&
        branch.branch_manager !== selectedManager
      ) {
        return false;
      }

      if (selectedStatus !== "all" && !branch.archived) {
        const daysUntil = getDaysUntilHarvest(branch);
        let isHarvested = false;

        if (branch.last_harvest_date) {
          const lastHarvestDate = new Date(branch.last_harvest_date);
          if (!isNaN(lastHarvestDate.getTime())) {
            const diffTime = Date.now() - lastHarvestDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            isHarvested = diffDays > 0 && diffDays <= 30;
          }
        }

        if (selectedStatus === "ready") return daysUntil <= 3;
        if (selectedStatus === "harvested") return isHarvested;
        if (selectedStatus === "upcoming") return daysUntil > 3;
      }

      return true;
    });

    return filtered.sort((a: BranchData, b: BranchData) => {
      if (a.archived && !b.archived) return 1;
      if (!a.archived && b.archived) return -1;

      if (a.archived && b.archived) {
        return a.branch_manager.localeCompare(b.branch_manager);
      }

      const daysUntilA = getDaysUntilHarvest(a);
      const daysUntilB = getDaysUntilHarvest(b);
      return daysUntilA - daysUntilB;
    });
  }, [branches, selectedManager, selectedStatus, showArchived]);

  // Calculate counts
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

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedManager !== "all") count++;
    if (selectedStatus !== "all") count++;
    if (showArchived) count++;
    return count;
  }, [selectedManager, selectedStatus, showArchived]);

  // Clear all filters
  const clearFilters = () => {
    setSelectedManager("all");
    setSelectedStatus("all");
    setShowArchived(false);
  };

  if (isLoading) return <p className="p-4">Loading branches…</p>;
  if (error) return <p className="p-4 text-red-500">Failed to load branches</p>;

  return (
    <div className="min-h-screen bg-background relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl text-foreground">
                Branch Management Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage and monitor all your PISONET branches
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile Filter Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden"
              >
                <Filter className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
              {isAdmin && branches.length > 0 && <AddBranchCard />}
            </div>
          </div>

          {/* Branch Count Summary */}
          <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
            <span>Total: {branchCounts.total}</span>
            <span>Active: {branchCounts.active}</span>
            <span>Archived: {branchCounts.archived}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative">
          {/* Floating Sidebar Toggle (Desktop) - RIGHT SIDE */}
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => setShowSidebar(!showSidebar)}
            className={cn(
              "fixed right-4 top-50 z-30 bg-background border rounded-l-lg shadow-sm hover:shadow-md transition-all duration-200",
              "flex items-center justify-center w-10 h-10",
              showSidebar && "shadow-md"
            )}
          >
            <Filter className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <div className="absolute -top-1 -right-1">
                <Badge className="h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                  {activeFilterCount}
                </Badge>
              </div>
            )}
          </motion.button>

          {/* Content Grid - NO SHIFTING */}
          <div>
            {filteredBranches.length === 0 ? (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No branches found
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {branches.length === 0
                      ? "Get started by creating your first branch."
                      : "No branches match the selected filters."}
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

      {/* Floating Sidebar - RIGHT SIDE */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed right-0 top-40 z-20 w-64",
              "bg-background/95 backdrop-blur-sm border-l border rounded-l-lg shadow-xl",
              "mx-4 my-4"
            )}
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Filters</h3>
                <div className="flex items-center gap-2">
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-6 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSidebar(false)}
                    className="h-6 w-6"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Archived Toggle */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="show-archived"
                    checked={showArchived}
                    onCheckedChange={(checked: boolean) =>
                      setShowArchived(checked)
                    }
                  />
                  <Label
                    htmlFor="show-archived"
                    className="text-sm cursor-pointer"
                  >
                    Show Archived
                  </Label>
                </div>
              </div>

              {/* Manager Filter */}
              <div className="space-y-2 mb-4">
                <Label className="text-xs font-medium text-muted-foreground">
                  Manager
                </Label>
                <div className="space-y-1">
                  <Button
                    variant={selectedManager === "all" ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start text-xs h-7"
                    onClick={() => setSelectedManager("all")}
                  >
                    All Managers
                  </Button>
                  {managers.slice(0, 5).map((manager: string) => (
                    <Button
                      key={manager}
                      variant={
                        selectedManager === manager ? "default" : "ghost"
                      }
                      size="sm"
                      className="w-full justify-start text-xs h-7"
                      onClick={() => setSelectedManager(manager)}
                    >
                      <span className="truncate">{manager}</span>
                    </Button>
                  ))}
                  {managers.length > 5 && (
                    <div className="text-xs text-muted-foreground text-center pt-1">
                      +{managers.length - 5} more
                    </div>
                  )}
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Status
                </Label>
                <div className="space-y-1">
                  {[
                    { value: "all", label: "All" },
                    { value: "ready", label: "Ready" },
                    { value: "harvested", label: "Harvested" },
                    { value: "upcoming", label: "Upcoming" },
                  ].map(({ value, label }) => (
                    <Button
                      key={value}
                      variant={selectedStatus === value ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start text-xs h-7"
                      onClick={() => setSelectedStatus(value)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Active Filter Badges */}
              {activeFilterCount > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex flex-wrap gap-1">
                    {selectedManager !== "all" && (
                      <Badge variant="secondary" className="text-[10px]">
                        {selectedManager}
                      </Badge>
                    )}
                    {selectedStatus !== "all" && (
                      <Badge variant="secondary" className="text-[10px]">
                        {selectedStatus}
                      </Badge>
                    )}
                    {showArchived && (
                      <Badge variant="secondary" className="text-[10px]">
                        Archived
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Result Count */}
              <div className="mt-4 text-xs text-muted-foreground">
                Showing {filteredBranches.length} of {branches.length} branches
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSidebar(false)}
            className="fixed inset-0 bg-black/20 z-10 lg:hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
