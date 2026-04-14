"use client";

import type React from "react";
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { BranchData } from "@/types/branch";
import {
  MapPin,
  User,
  Calendar,
  Monitor,
  Users,
  Coins,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  MoreVertical,
  Pencil,
  Map,
  Trash2,
  Loader2,
} from "lucide-react";
import { CardMenu } from "./CRUDS/card-menu";
import Link from "next/link";
import { useState as useLocalState } from "react";
import EditBranchModal from "./CRUDS/EditBranchModal";
import { MapModal } from "./Maps/MapModal";
import type { BranchInfo } from "@/hooks/use-branch-harvest";
import { HarvestPreviewModal } from "./Harvest/harvest-preview-modal";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BranchListJiraProps {
  branches: BranchData[];
  isAdmin?: boolean;
  selectedManager: string;
  selectedStatus: string;
  showArchived: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOrdinalSuffix(day: number) {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

function getNextHarvestDate(harvestDay: number) {
  const now = new Date();
  let harvestDate = new Date(now.getFullYear(), now.getMonth(), harvestDay);
  if (harvestDay < now.getDate())
    harvestDate = new Date(now.getFullYear(), now.getMonth() + 1, harvestDay);
  if (harvestDate.getDate() !== harvestDay)
    harvestDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return harvestDate;
}

function getDaysUntilHarvest(branch: BranchData): number {
  const nextHarvest = getNextHarvestDate(branch.harvest_day_of_month);
  return Math.ceil((nextHarvest.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function isRecentlyHarvested(branch: BranchData): boolean {
  if (!branch.last_harvest_date) return false;
  const lastHarvestDate = new Date(branch.last_harvest_date);
  if (isNaN(lastHarvestDate.getTime())) return false;
  const diffDays = Math.ceil(
    (Date.now() - lastHarvestDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDays >= 0 && diffDays <= 15;
}

function formatDate(date: Date | null | undefined) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function HarvestStatusBadge({ branch }: { branch: BranchData }) {
  const daysUntil = getDaysUntilHarvest(branch);
  const harvested = isRecentlyHarvested(branch);

  if (harvested) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
        Harvested
      </span>
    );
  }
  if (daysUntil === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-pulse" />
        Harvest today
      </span>
    );
  }
  if (daysUntil <= 3) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
        Due in {daysUntil}d
      </span>
    );
  }
  if (daysUntil <= 7) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
        In {daysUntil}d
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
      In {daysUntil}d
    </span>
  );
}

// ─── Group header row ─────────────────────────────────────────────────────────

function GroupHeader({
  label,
  count,
  expanded,
  onToggle,
}: {
  label: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <tr
      className="bg-muted/40 cursor-pointer select-none hover:bg-muted/60 transition-colors"
      onClick={onToggle}
    >
      <td colSpan={8} className="px-3 py-2">
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <span className="text-[11px] text-muted-foreground">· {count}</span>
        </div>
       </td>
     </tr>
  );
}

// ─── Individual row ───────────────────────────────────────────────────────────

function BranchRow({
  branch,
  isAdmin,
}: {
  branch: BranchData;
  isAdmin?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [isHarvestLoading, setIsHarvestLoading] = useState(false);

  const daysUntil = getDaysUntilHarvest(branch);
  const nextHarvest = getNextHarvestDate(branch.harvest_day_of_month);
  const nextHarvestStr = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(nextHarvest);

  const ordinal = getOrdinalSuffix(branch.harvest_day_of_month);
  const scheduleLabel = `${branch.harvest_day_of_month}${ordinal} of month`;

  const affiliateCount = branch.affiliates?.length || 0;

  const getBranchInfo = (): BranchInfo => ({
    branchName: branch.location,
    branchAddress: branch.address || "Address not specified",
    managerName: branch.branch_manager,
    contactNumber: branch.contact_number || "Contact not specified",
    sharePercentage: branch.share,
  });

  return (
    <>
      <tr className="border-b border-border/60 hover:bg-muted/30 transition-colors group/row">
        

        {/* Branch name */}
        <td className="px-3 py-2.5 min-w-[180px]">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "w-6 h-6 rounded flex items-center justify-center flex-shrink-0",
                branch.archived
                  ? "bg-muted"
                  : daysUntil === 0
                  ? "bg-red-100 dark:bg-red-900/30"
                  : daysUntil <= 3
                  ? "bg-amber-100 dark:bg-amber-900/30"
                  : "bg-blue-100 dark:bg-blue-900/30"
              )}
            >
              <MapPin
                className={cn(
                  "w-3.5 h-3.5",
                  branch.archived
                    ? "text-muted-foreground"
                    : daysUntil === 0
                    ? "text-red-600 dark:text-red-400"
                    : daysUntil <= 3
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-blue-600 dark:text-blue-400"
                )}
              />
            </div>
            <div className="min-w-0">
              <Link
                href={`/branches/${branch.id}`}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline block truncate max-w-[160px]"
                title={branch.location}
              >
                {branch.location}
              </Link>
              <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[160px]">
                {branch.id}
              </p>
            </div>
          </div>
        </td>

        {/* Manager */}
        <td className="px-3 py-2.5 min-w-[120px]">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground truncate max-w-[110px]">
              {branch.branch_manager}
            </span>
            {affiliateCount > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground border border-border flex-shrink-0">
                <Users className="w-2.5 h-2.5" />
                +{affiliateCount}
              </span>
            )}
          </div>
        </td>

        {/* Share */}
        <td className="px-3 py-2.5 text-center">
          <span className="text-xs font-medium text-foreground tabular-nums">
            {branch.share}%
          </span>
        </td>

        {/* Harvest schedule */}
        <td className="px-3 py-2.5">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-muted-foreground">{scheduleLabel}</span>
            <span className="text-[11px] text-foreground font-medium">
              Next: {nextHarvestStr}
            </span>
          </div>
        </td>

        {/* Last harvest */}
        <td className="px-3 py-2.5">
          <span className="text-[11px] text-muted-foreground">
            {branch.last_harvest_date
              ? formatDate(new Date(branch.last_harvest_date))
              : "Never"}
          </span>
        </td>

        {/* Status badge */}
        <td className="px-3 py-2.5">
          {branch.archived ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border">
              Archived
            </span>
          ) : (
            <HarvestStatusBadge branch={branch} />
          )}
        </td>

        {/* Actions */}
        <td className="px-3 py-2.5 text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="w-7 h-7 opacity-0 group-hover/row:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs">
              <DropdownMenuItem asChild>
                <Link href={`/branches/${branch.id}`}>
                  <Monitor className="w-3.5 h-3.5 mr-2" />
                  View performance
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setIsHarvestLoading(true);
                  setShowHarvestModal(true);
                }}
              >
                <Coins className="w-3.5 h-3.5 mr-2 text-yellow-600" />
                Harvest
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowMapModal(true)}>
                <Map className="w-3.5 h-3.5 mr-2" />
                View on map
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem onClick={() => setEditing(true)}>
                  <Pencil className="w-3.5 h-3.5 mr-2" />
                  Edit branch
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>

      {/* Modals */}
      {showMapModal && (
        <MapModal
          open={showMapModal}
          onClose={() => setShowMapModal(false)}
          branch={branch}
        />
      )}
      {editing && (
        <EditBranchModal
          open={editing}
          onClose={() => setEditing(false)}
          existingBranch={{
            ...branch,
            latitude: branch.latitude !== null ? branch.latitude : undefined,
            longitude: branch.longitude !== null ? branch.longitude : undefined,
          }}
        />
      )}
      <HarvestPreviewModal
        branchId={branch.id}
        branchInfo={getBranchInfo()}
        open={showHarvestModal}
        onClose={() => {
          setShowHarvestModal(false);
          setIsHarvestLoading(false);
        }}
      />
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BranchListJira({
  branches,
  isAdmin,
  selectedManager,
  selectedStatus,
  showArchived,
}: BranchListJiraProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    today: true,
    soon: true,
    upcoming: true,
    harvested: true,
    archived: false,
  });

  const toggleGroup = (key: string) =>
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  // Apply same filters as the card view
  const filtered = useMemo(() => {
    return branches.filter((branch) => {
      if (!showArchived && branch.archived) return false;
      if (selectedManager !== "all" && branch.branch_manager !== selectedManager) return false;
      if (selectedStatus !== "all" && !branch.archived) {
        const daysUntil = getDaysUntilHarvest(branch);
        if (selectedStatus === "ready") return daysUntil <= 3;
        if (selectedStatus === "harvested") return isRecentlyHarvested(branch);
        if (selectedStatus === "upcoming") return daysUntil > 3;
      }
      return true;
    });
  }, [branches, selectedManager, selectedStatus, showArchived]);

  // Split into groups
  const groups = useMemo(() => {
    const active = filtered.filter((b) => !b.archived);
    const archived = filtered.filter((b) => b.archived);

    return {
      today: active.filter((b) => getDaysUntilHarvest(b) === 0),
      soon: active.filter((b) => {
        const d = getDaysUntilHarvest(b);
        return d > 0 && d <= 7 && !isRecentlyHarvested(b);
      }),
      upcoming: active.filter((b) => getDaysUntilHarvest(b) > 7 && !isRecentlyHarvested(b)),
      harvested: active.filter((b) => isRecentlyHarvested(b)),
      archived,
    };
  }, [filtered]);

  const renderGroup = (
    key: string,
    label: string,
    items: BranchData[]
  ) => (
    <>
      <GroupHeader
        label={label}
        count={items.length}
        expanded={expandedGroups[key]}
        onToggle={() => toggleGroup(key)}
      />
      {expandedGroups[key] &&
        (items.length > 0 ? (
          items.map((branch) => (
            <BranchRow key={branch.id} branch={branch} isAdmin={isAdmin} />
          ))
        ) : (
          <tr>
            <td colSpan={8} className="px-3 py-4 text-center text-xs text-muted-foreground">
              No branches in this group.
            </td>
          </tr>
        ))}
    </>
  );

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              
              <th className="px-3 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                <div className="flex items-center gap-1 cursor-pointer hover:text-foreground">
                  Branch
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-3 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                Manager
              </th>
              <th className="px-3 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground text-center whitespace-nowrap">
                Share
              </th>
              <th className="px-3 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                <div className="flex items-center gap-1 cursor-pointer hover:text-foreground">
                  Harvest schedule
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-3 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                Last harvest
              </th>
              <th className="px-3 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                Status
              </th>
              <th className="px-3 py-2.5 w-10" />
            </tr>
          </thead>
          <tbody>
            {groups.today.length > 0 && renderGroup("today", "Harvest today", groups.today)}
            {groups.soon.length > 0 && renderGroup("soon", "Due soon (≤7 days)", groups.soon)}
            {groups.upcoming.length > 0 && renderGroup("upcoming", "Upcoming", groups.upcoming)}
            {groups.harvested.length > 0 && renderGroup("harvested", "Recently harvested", groups.harvested)}
            {showArchived && groups.archived.length > 0 && renderGroup("archived", "Archived", groups.archived)}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-12 text-center text-sm text-muted-foreground">
                  No branches match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table footer */}
      <div className="px-4 py-2.5 bg-muted/20 border-t border-border flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {filtered.filter((b) => !b.archived).length} active branch
          {filtered.filter((b) => !b.archived).length !== 1 ? "es" : ""}
          {showArchived && groups.archived.length > 0
            ? ` · ${groups.archived.length} archived`
            : ""}
        </span>
        
      </div>
    </div>
  );
}