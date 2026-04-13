"use client";

import { BranchCard } from "./branch-card";
import { AddBranchCard } from "./CRUDS/add-branch-card";
import { useBranches } from "@/hooks/use-branches-query";
import { useUser } from "@/providers/UserProvider";
import { useState, useCallback, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import { BranchData } from "@/hooks/use-branches-query";
import { cn } from "@/lib/utils";

export function BranchPage() {
  const { user } = useUser();
  const { data: branches = [], isLoading, error } = useBranches();
  const [selectedManager, setSelectedManager] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [showSidebar, setShowSidebar] = useState<boolean>(false);

  const isAdmin = user?.role === "admin";

  // Extract unique managers - memoized
  const managers = useMemo(() => {
    return Array.from(
      new Set(branches.map((b) => b.branch_manager).filter(Boolean))
    ).sort();
  }, [branches]);

  // Calculate days until next harvest
  const getDaysUntilHarvest = useCallback((branch: BranchData): number => {
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
  }, []);

  // Check if branch is recently harvested
  const isRecentlyHarvested = useCallback((branch: BranchData): boolean => {
    if (!branch.last_harvest_date) return false;

    const lastHarvestDate = new Date(branch.last_harvest_date);
    if (isNaN(lastHarvestDate.getTime())) return false;

    const diffTime = Date.now() - lastHarvestDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  }, []);

  // Filter and sort branches - optimized
  const filteredBranches = useMemo(() => {
    return branches
      .filter((branch: BranchData) => {
        // Archive filter
        if (!showArchived && branch.archived) return false;

        // Manager filter
        if (selectedManager !== "all" && branch.branch_manager !== selectedManager) {
          return false;
        }

        // Status filter (skip for archived branches)
        if (selectedStatus !== "all" && !branch.archived) {
          const daysUntil = getDaysUntilHarvest(branch);

          if (selectedStatus === "ready") return daysUntil <= 3;
          if (selectedStatus === "harvested") return isRecentlyHarvested(branch);
          if (selectedStatus === "upcoming") return daysUntil > 3;
        }

        return true;
      })
      .sort((a: BranchData, b: BranchData) => {
        // Archived branches go to bottom
        if (a.archived && !b.archived) return 1;
        if (!a.archived && b.archived) return -1;

        // Archived branches sorted by manager
        if (a.archived && b.archived) {
          return a.branch_manager.localeCompare(b.branch_manager);
        }

        // Active branches sorted by days until harvest
        return getDaysUntilHarvest(a) - getDaysUntilHarvest(b);
      });
  }, [branches, selectedManager, selectedStatus, showArchived, getDaysUntilHarvest, isRecentlyHarvested]);

  // Calculate counts - memoized
  const branchCounts = useMemo(() => {
    const activeBranches = branches.filter((b: BranchData) => !b.archived);

    return {
      total: branches.length,
      active: activeBranches.length,
      archived: branches.length - activeBranches.length,
      filtered: filteredBranches.length,
    };
  }, [branches, filteredBranches]);

  // Active filter count - memoized
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedManager !== "all") count++;
    if (selectedStatus !== "all") count++;
    if (showArchived) count++;
    return count;
  }, [selectedManager, selectedStatus, showArchived]);

  // Clear all filters with useCallback
  const clearFilters = useCallback(() => {
    setSelectedManager("all");
    setSelectedStatus("all");
    setShowArchived(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setShowSidebar((prev) => !prev);
  }, []);

  if (isLoading) return <p className="p-4">Loading branches…</p>;
  if (error) return <p className="p-4 text-red-500">Failed to load branches</p>;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Branch Management
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Manage and monitor all your PISONET branches
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSidebar}
                className="lg:hidden gap-2"
              >
                <Filter className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
              {isAdmin && branches.length > 0 && <AddBranchCard />}
            </div>
          </div>

          {/* Branch Count Summary */}
          <div className="flex flex-wrap gap-3 sm:gap-4 mt-4 text-xs sm:text-sm text-muted-foreground">
            <span>Total: <span className="font-medium text-foreground">{branchCounts.total}</span></span>
            <span>Active: <span className="font-medium text-foreground">{branchCounts.active}</span></span>
            <span>Archived: <span className="font-medium text-foreground">{branchCounts.archived}</span></span>
          </div>
        </div>

        {/* Main Content Grid */}
        {filteredBranches.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="max-w-md mx-auto px-4">
              <h3 className="text-lg font-medium text-foreground mb-2">
                No branches found
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {branches.length === 0
                  ? "Get started by creating your first branch."
                  : "No branches match the selected filters."}
              </p>
              {isAdmin && branches.length === 0 && <AddBranchCard />}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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

      {/* Desktop Filter Sidebar */}
      <div className={cn(
        "hidden lg:block fixed right-0 top-0 h-screen bg-background border-l overflow-y-auto transition-all duration-300",
        showSidebar ? "w-72" : "w-0"
      )}>
        {showSidebar && (
          <FilterSidebar
            managers={managers}
            selectedManager={selectedManager}
            setSelectedManager={setSelectedManager}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            showArchived={showArchived}
            setShowArchived={setShowArchived}
            activeFilterCount={activeFilterCount}
            clearFilters={clearFilters}
            filteredCount={filteredBranches.length}
            totalCount={branches.length}
          />
        )}
      </div>

      {/* Desktop Sidebar Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={toggleSidebar}
        className="hidden lg:flex fixed right-0 top-67 z-40 h-9 w-9 rounded-l-lg border-r-0 transition-all duration-300"
        style={{
          right: showSidebar ? "288px" : "0px",
        }}
        title={showSidebar ? "Hide filters" : "Show filters"}
      >
        {showSidebar ? (
          <X className="h-4 w-4" />
        ) : (
          <Filter className="h-4 w-4" />
        )}
      </Button>

      {/* Mobile Filter Sidebar */}
      {showSidebar && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={toggleSidebar}
            role="button"
            tabIndex={0}
            aria-label="Close filters"
            onKeyDown={(e) => e.key === "Escape" && toggleSidebar()}
          />
          <div className="fixed right-0 top-0 bottom-0 w-72 bg-background z-50 overflow-y-auto shadow-lg">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background">
              <h3 className="font-medium">Filters</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <FilterSidebar
              managers={managers}
              selectedManager={selectedManager}
              setSelectedManager={setSelectedManager}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              showArchived={showArchived}
              setShowArchived={setShowArchived}
              activeFilterCount={activeFilterCount}
              clearFilters={clearFilters}
              filteredCount={filteredBranches.length}
              totalCount={branches.length}
              onClose={toggleSidebar}
            />
          </div>
        </>
      )}
    </div>
  );
}

// Filter Sidebar Component - Extracted for cleanliness
interface FilterSidebarProps {
  managers: string[];
  selectedManager: string;
  setSelectedManager: (manager: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  showArchived: boolean;
  setShowArchived: (show: boolean) => void;
  activeFilterCount: number;
  clearFilters: () => void;
  filteredCount: number;
  totalCount: number;
  onClose?: () => void;
}

function FilterSidebar({
  managers,
  selectedManager,
  setSelectedManager,
  selectedStatus,
  setSelectedStatus,
  showArchived,
  setShowArchived,
  activeFilterCount,
  clearFilters,
  filteredCount,
  totalCount,
  onClose,
}: FilterSidebarProps) {
  return (
    <div className="p-4 space-y-6">
      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="w-full text-xs h-8"
        >
          Clear All Filters ({activeFilterCount})
        </Button>
      )}

      {/* Archived Toggle */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          View
        </Label>
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-archived"
            checked={showArchived}
            onCheckedChange={(checked: boolean) => setShowArchived(checked)}
          />
          <Label htmlFor="show-archived" className="text-sm cursor-pointer font-normal">
            Show Archived
          </Label>
        </div>
      </div>

      {/* Manager Filter */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Manager
        </Label>
        <div className="space-y-1.5">
          <Button
            variant={selectedManager === "all" ? "default" : "ghost"}
            size="sm"
            className="w-full justify-start text-xs h-8"
            onClick={() => {
              setSelectedManager("all");
              onClose?.();
            }}
          >
            All Managers
          </Button>
          {managers.map((manager: string) => (
            <Button
              key={manager}
              variant={selectedManager === manager ? "default" : "ghost"}
              size="sm"
              className="w-full justify-start text-xs h-8 truncate"
              onClick={() => {
                setSelectedManager(manager);
                onClose?.();
              }}
            >
              {manager}
            </Button>
          ))}
        </div>
      </div>

      {/* Status Filter */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Status
        </Label>
        <div className="space-y-1.5">
          {[
            { value: "all", label: "All Status" },
            { value: "ready", label: "Ready to Harvest" },
            { value: "harvested", label: "Recently Harvested" },
            { value: "upcoming", label: "Upcoming" },
          ].map(({ value, label }) => (
            <Button
              key={value}
              variant={selectedStatus === value ? "default" : "ghost"}
              size="sm"
              className="w-full justify-start text-xs h-8"
              onClick={() => {
                setSelectedStatus(value);
                onClose?.();
              }}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Result Count */}
      <div className="pt-4 border-t text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{filteredCount}</span> of{" "}
        <span className="font-medium text-foreground">{totalCount}</span> branches
      </div>
    </div>
  );
}