"use client";

import { useEffect, useState } from "react";
import { useUnits } from "@/hooks/use-units-query";
import { useBranches } from "@/hooks/use-branches-query";
import { useSalesQuery } from "@/hooks/use-sales-query";
import { HarvestResult, useUnitHarvest } from "@/hooks/use-unit-harvest";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Monitor,
  MoreVertical,
  Pencil,
  CircleDollarSign,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { AssignBranchModal } from "./AssignUnitModal";
import { DecommissionModal } from "./DecommissionUnitModal";
import { SetUnitAlias } from "./SetUnitAlias";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UnitHarvestSummary } from "./UnitHarvestSummary";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type OnlineStatus = "online" | "offline" | "unknown";

// ─── Healthcheck hook ─────────────────────────────────────────────────────────

function useHealthcheckStatus() {
  const [statusData, setStatusData] = useState<
    Record<string, { status: "online" | "offline"; lastPing: string }>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 5000)
        );
        const fetchPromise = fetch("/api/healthchecks-status");
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setStatusData(data);
      } catch (error) {
        console.error("Failed to fetch healthcheck status:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 31000);
    return () => clearInterval(interval);
  }, []);

  return { statusData, loading };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status, lastPing }: { status: OnlineStatus; lastPing?: string }) {
  const getTimeAgo = (timestamp: string) => {
    if (!timestamp) return "";
    try {
      const now = new Date();
      const pingTime = new Date(timestamp);
      if (isNaN(pingTime.getTime())) return "";
      const diffMinutes = Math.floor(
        (now.getTime() - pingTime.getTime()) / (1000 * 60)
      );
      if (diffMinutes < 1) return "Just now";
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
      return `${Math.floor(diffMinutes / 1440)}d ago`;
    } catch {
      return "";
    }
  };

  if (status === "unknown") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
        No data
      </span>
    );
  }

  if (status === "online") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
        Online
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
      {getTimeAgo(lastPing || "") || "Offline"}
    </span>
  );
}

function HarvestStatusBadge({ harvested }: { harvested?: boolean }) {
  if (harvested === undefined) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  if (harvested) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700">
        Done
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-yellow-50 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700">
      Pending
    </span>
  );
}

function HarvestConfirmationDialog({
  open,
  onClose,
  onConfirm,
  unitAlias,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  unitAlias: string;
  loading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <CircleDollarSign className="h-5 w-5 text-yellow-600" />
            Premature Harvest
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-foreground">
            Are you sure you want to harvest all recent sales for{" "}
            <span className="font-bold">{unitAlias}</span>? This will mark all
            daily sales as harvested.
          </p>
          <p className="text-sm text-foreground">
            Doing this means that the monthly harvest will not count the
            prematurely harvested sales.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={loading}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Harvesting...
                </>
              ) : (
                <>
                  <CircleDollarSign className="w-4 h-4 mr-2" />
                  Yes, Harvest
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HarvestErrorDialog({
  open,
  onClose,
  error,
  unitAlias,
}: {
  open: boolean;
  onClose: () => void;
  error: string;
  unitAlias: string;
}) {
  const isNoAggregatesError = error.includes("No unharvested aggregates found");
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            {isNoAggregatesError ? "Nothing to Harvest" : "Harvest Error"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-foreground">
            {isNoAggregatesError ? (
              <>
                No unharvested sales found for{" "}
                <span className="font-bold">{unitAlias}</span>. All recent sales
                have already been harvested or there are no sales to harvest.
              </>
            ) : (
              <>
                Failed to harvest sales for{" "}
                <span className="font-bold">{unitAlias}</span>:{" "}
                <span className="text-red-600">{error}</span>
              </>
            )}
          </p>
          <div className="flex justify-end">
            <Button onClick={onClose} className="bg-yellow-600 hover:bg-yellow-700">
              {isNoAggregatesError ? "Got it" : "Try Again"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Group row ────────────────────────────────────────────────────────────────

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
      <td colSpan={9} className="px-3 py-2">
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

// ─── Main component ───────────────────────────────────────────────────────────

export function UnitsPageCardsJira({
  filterByBranchId,
  hideFilters = false,
  hideUnassigned = false,
}: {
  filterByBranchId?: string;
  hideFilters?: boolean;
  hideUnassigned?: boolean;
} = {}) {
  const { units, loading: unitsLoading, error, decommissionUnit } = useUnits();
  const { data: branches = [] } = useBranches();
  const { data: sales = [] } = useSalesQuery();
  const { statusData, loading: statusLoading } = useHealthcheckStatus();
  const { harvestUnitAggregates, loading: harvestLoading } = useUnitHarvest();

  const branchMap = new Map(branches.map((b) => [b.id, b]));

  const [assignModalUnitId, setAssignModalUnitId] = useState<string | null>(null);
  const [decommissionModalUnitId, setDecommissionModalUnitId] = useState<string | null>(null);
  const [aliasModalUnitId, setAliasModalUnitId] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");

  const [confirmingHarvest, setConfirmingHarvest] = useState<string | null>(null);
  const [harvestResults, setHarvestResults] = useState<Record<string, HarvestResult>>({});
  const [showHarvestSummary, setShowHarvestSummary] = useState(false);
  const [currentHarvestDevice, setCurrentHarvestDevice] = useState<string | null>(null);
  const [harvestingDevice, setHarvestingDevice] = useState<string | null>(null);
  const [harvestError, setHarvestError] = useState<{ deviceId: string; error: string } | null>(null);

  // Group collapse state
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    online: true,
    offline: true,
    unassigned: true,
  });

  const toggleGroup = (key: string) =>
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleHarvestConfirm = async () => {
    if (!confirmingHarvest) return;
    try {
      setHarvestingDevice(confirmingHarvest);
      const result = await harvestUnitAggregates(confirmingHarvest);
      setHarvestResults((prev) => ({ ...prev, [confirmingHarvest]: result }));
      setCurrentHarvestDevice(confirmingHarvest);
      setConfirmingHarvest(null);
      setShowHarvestSummary(true);
      setHarvestError(null);
    } catch (error) {
      console.error("Harvest failed:", error);
      setHarvestError({
        deviceId: confirmingHarvest,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
      setConfirmingHarvest(null);
    } finally {
      setHarvestingDevice(null);
    }
  };

  if (unitsLoading)
    return (
      <div className="flex items-center gap-2 py-8 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading units...
      </div>
    );
  if (error) return <p className="text-red-500">{error}</p>;

  const unitsWithBranch = units.filter((u) => u.branchId);
  const unitsWithoutBranch = units.filter((u) => !u.branchId);

  const filteredUnitsWithBranch = filterByBranchId
    ? unitsWithBranch.filter((u) => u.branchId === filterByBranchId)
    : selectedBranch === "all"
    ? unitsWithBranch
    : unitsWithBranch.filter((u) => u.branchId === selectedBranch);

  const onlineUnits = filteredUnitsWithBranch.filter(
    (u) => (statusData[u.deviceId]?.status ?? "unknown") === "online"
  );
  const offlineUnits = filteredUnitsWithBranch.filter(
    (u) => (statusData[u.deviceId]?.status ?? "unknown") !== "online"
  );

  const sortedBranches = [...branches].sort((a, b) =>
    a.location.localeCompare(b.location)
  );

  // ── Row renderer ────────────────────────────────────────────────────────────

  const renderRow = (unit: typeof units[number], isUnassigned = false) => {
    const branch = branchMap.get(unit.branchId);
    const unitStatus = statusData[unit.deviceId] ?? { status: "unknown" as const, lastPing: "" };
    const totalToday = sales
      .filter((s) => s.deviceId === unit.deviceId)
      .reduce((sum, sale) => sum + (sale.total || 0), 0);
    const isHarvesting = harvestingDevice === unit.deviceId;

    return (
      <tr
        key={unit.deviceId}
        className="border-b border-border/60 hover:bg-muted/30 transition-colors group/row"
      >
        {/* Checkbox */}
        {/* <td className="px-3 py-2.5 w-8">
          <input
            type="checkbox"
            className="w-3.5 h-3.5 rounded border-border accent-blue-600"
          />
        </td> */}

        {/* Unit name + ID */}
        <td className="px-3 py-2.5 min-w-[160px]">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "w-6 h-6 rounded flex items-center justify-center flex-shrink-0",
                unitStatus.status === "online"
                  ? "bg-blue-100 dark:bg-blue-900/30"
                  : isUnassigned
                  ? "bg-yellow-100 dark:bg-yellow-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              )}
            >
              <Monitor
                className={cn(
                  "w-3.5 h-3.5",
                  unitStatus.status === "online"
                    ? "text-blue-600 dark:text-blue-400"
                    : isUnassigned
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-red-500 dark:text-red-400"
                )}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <Link
                  href={`/units/${unit.deviceId}`}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[120px]"
                >
                  {unit.alias || "No Alias"}
                </Link>
                <button
                  className="opacity-0 group-hover/row:opacity-100 transition-opacity"
                  onClick={() => setAliasModalUnitId(unit.deviceId)}
                >
                  <Pencil className="w-2.5 h-2.5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground truncate max-w-[130px]">
                {unit.deviceId}
              </p>
            </div>
          </div>
        </td>

        {/* Branch */}
        <td className="px-3 py-2.5">
          {isUnassigned ? (
            <span className="text-[11px] text-yellow-600 dark:text-yellow-400 font-medium">
              Unassigned
            </span>
          ) : branch ? (
            <Link
              href={`/branches/${branch.id}`}
              className="text-xs text-muted-foreground hover:text-green-600 hover:underline truncate max-w-[120px] block"
            >
              {branch.location}
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </td>

        {/* Online status */}
        <td className="px-3 py-2.5 text-center">
          {statusLoading ? (
            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground mx-auto" />
          ) : (
            <StatusBadge status={unitStatus.status as OnlineStatus} lastPing={unitStatus.lastPing} />
          )}
        </td>

        {/* Harvest status — placeholder, wire to your actual harvest state if available */}
        <td className="px-3 py-2.5 text-center">
          {isUnassigned ? (
            <span className="text-xs text-muted-foreground">—</span>
          ) : (
            <HarvestStatusBadge harvested={undefined} />
          )}
        </td>

        {/* Today's earnings */}
        <td className="px-3 py-2.5 text-right">
          <span
            className={cn(
              "text-xs font-medium tabular-nums",
              totalToday > 0
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-muted-foreground"
            )}
          >
            ₱{totalToday.toLocaleString()}
          </span>
        </td>

        {/* Last ping */}
        <td className="px-3 py-2.5">
          <span className="text-[11px] text-muted-foreground">
            {unitStatus.lastPing
              ? (() => {
                  const diffMinutes = Math.floor(
                    (Date.now() - new Date(unitStatus.lastPing).getTime()) / 60000
                  );
                  if (diffMinutes < 1) return "Just now";
                  if (diffMinutes < 60) return `${diffMinutes}m ago`;
                  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
                  return `${Math.floor(diffMinutes / 1440)}d ago`;
                })()
              : "—"}
          </span>
        </td>

        {/* Actions */}
        <td className="px-3 py-2.5 text-center">
          {isUnassigned ? (
            <Button
              size="sm"
              variant="outline"
              className="text-[11px] h-6 px-2 text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20"
              onClick={() => setAssignModalUnitId(unit.deviceId)}
            >
              Assign
            </Button>
          ) : (
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
                <DropdownMenuItem
                  onClick={() => setConfirmingHarvest(unit.deviceId)}
                  disabled={isHarvesting}
                >
                  <CircleDollarSign className="w-3.5 h-3.5 mr-2 text-yellow-600" />
                  {isHarvesting ? "Harvesting..." : "Harvest"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAliasModalUnitId(unit.deviceId)}>
                  <Pencil className="w-3.5 h-3.5 mr-2" />
                  Edit alias
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAssignModalUnitId(unit.deviceId)}>
                  Assign / Reassign
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDecommissionModalUnitId(unit.deviceId)}
                  className="text-red-600 focus:text-red-600"
                >
                  Decommission
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </td>
      </tr>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-0">
      {/* Unassigned banner */}
      {!hideUnassigned && unitsWithoutBranch.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-3 text-sm text-yellow-800 dark:text-yellow-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
          <span>
            <strong>{unitsWithoutBranch.length}</strong> unit
            {unitsWithoutBranch.length !== 1 ? "s are" : " is"} unassigned —
            assign them to a branch to begin tracking.
          </span>
        </div>
      )}

      {/* Toolbar */}
      {!hideFilters && branches.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pb-3">
          <span className="text-xs text-muted-foreground font-medium">Branch:</span>
          <button
            onClick={() => setSelectedBranch("all")}
            className={cn(
              "inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border transition-colors",
              selectedBranch === "all"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-background text-muted-foreground border-border hover:bg-muted"
            )}
          >
            All
            <span
              className={cn(
                "ml-1.5 px-1 rounded text-[10px]",
                selectedBranch === "all"
                  ? "bg-blue-500 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {unitsWithBranch.length}
            </span>
          </button>
          {sortedBranches.map((branch) => {
            const count = unitsWithBranch.filter(
              (u) => u.branchId === branch.id
            ).length;
            if (count === 0) return null;
            return (
              <button
                key={branch.id}
                onClick={() => setSelectedBranch(branch.id)}
                className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border transition-colors truncate max-w-[140px]",
                  selectedBranch === branch.id
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                )}
                title={branch.location}
              >
                <span className="truncate">{branch.location}</span>
                <span
                  className={cn(
                    "ml-1.5 px-1 rounded text-[10px] flex-shrink-0",
                    selectedBranch === branch.id
                      ? "bg-blue-500 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {/* <th className="px-3 py-2.5 w-8">
                  <input type="checkbox" className="w-3.5 h-3.5 rounded border-border accent-blue-600" />
                </th> */}
                <th className="px-3 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-foreground">
                    Unit
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-3 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  Branch
                </th>
                <th className="px-3 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground text-center whitespace-nowrap">
                  Status
                </th>
                <th className="px-3 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground text-center whitespace-nowrap">
                  Harvest
                </th>
                <th className="px-3 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1 cursor-pointer hover:text-foreground">
                    Today&apos;s earnings
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-3 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  Last ping
                </th>
                <th className="px-3 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody>
              {/* Online group */}
              <GroupHeader
                label="Online"
                count={onlineUnits.length}
                expanded={expandedGroups.online}
                onToggle={() => toggleGroup("online")}
              />
              {expandedGroups.online &&
                (onlineUnits.length > 0 ? (
                  onlineUnits.map((u) => renderRow(u))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-3 py-4 text-center text-xs text-muted-foreground">
                      No online units.
                    </td>
                  </tr>
                ))}

              {/* Offline group */}
              <GroupHeader
                label="Offline"
                count={offlineUnits.length}
                expanded={expandedGroups.offline}
                onToggle={() => toggleGroup("offline")}
              />
              {expandedGroups.offline &&
                (offlineUnits.length > 0 ? (
                  offlineUnits.map((u) => renderRow(u))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-3 py-4 text-center text-xs text-muted-foreground">
                      No offline units.
                    </td>
                  </tr>
                ))}

              {/* Unassigned group */}
              {!hideUnassigned && unitsWithoutBranch.length > 0 && (
                <>
                  <GroupHeader
                    label="Unassigned"
                    count={unitsWithoutBranch.length}
                    expanded={expandedGroups.unassigned}
                    onToggle={() => toggleGroup("unassigned")}
                  />
                  {expandedGroups.unassigned &&
                    unitsWithoutBranch.map((u) => renderRow(u, true))}
                </>
              )}

              {/* Empty state */}
              {filteredUnitsWithBranch.length === 0 && unitsWithBranch.length > 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No units found for the selected branch.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="px-4 py-2.5 bg-muted/20 border-t border-border flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {filteredUnitsWithBranch.length} assigned unit
            {filteredUnitsWithBranch.length !== 1 ? "s" : ""}
            {!hideUnassigned && unitsWithoutBranch.length > 0 &&
              ` · ${unitsWithoutBranch.length} unassigned`}
          </span>
          <span className="text-[11px] text-muted-foreground">
            Summary generated at{" "}
            <strong className="text-foreground">11:49 PM</strong> daily
          </span>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {assignModalUnitId && (
          <AssignBranchModal
            deviceId={assignModalUnitId}
            onClose={() => setAssignModalUnitId(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {decommissionModalUnitId && (
          <DecommissionModal
            deviceId={decommissionModalUnitId}
            onClose={() => setDecommissionModalUnitId(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {aliasModalUnitId && (
          <SetUnitAlias
            deviceId={aliasModalUnitId}
            onClose={() => setAliasModalUnitId(null)}
          />
        )}
      </AnimatePresence>

      {confirmingHarvest && (
        <HarvestConfirmationDialog
          open={!!confirmingHarvest}
          onClose={() => setConfirmingHarvest(null)}
          onConfirm={handleHarvestConfirm}
          unitAlias={
            units.find((u) => u.deviceId === confirmingHarvest)?.alias ||
            confirmingHarvest
          }
          loading={!!harvestingDevice}
        />
      )}

      {currentHarvestDevice && harvestResults[currentHarvestDevice] && (
        <UnitHarvestSummary
          open={showHarvestSummary}
          onClose={() => {
            setShowHarvestSummary(false);
            setCurrentHarvestDevice(null);
          }}
          result={harvestResults[currentHarvestDevice]}
          unitAlias={
            units.find((u) => u.deviceId === currentHarvestDevice)?.alias ||
            currentHarvestDevice
          }
        />
      )}

      {harvestError && (
        <HarvestErrorDialog
          open={!!harvestError}
          onClose={() => setHarvestError(null)}
          error={harvestError.error}
          unitAlias={
            units.find((u) => u.deviceId === harvestError.deviceId)?.alias ||
            harvestError.deviceId
          }
        />
      )}
    </div>
  );
}