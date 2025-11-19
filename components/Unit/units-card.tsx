"use client";

import { useEffect, useState } from "react";
import { useUnits } from "@/hooks/use-units-query";
import { useBranches } from "@/hooks/use-branches-query";
import { useSalesQuery } from "@/hooks/use-sales-query";
import { HarvestResult, useUnitHarvest } from "@/hooks/use-unit-harvest";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Monitor,
  MoreVertical,
  Pencil,
  Filter,
  CircleDollarSign,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { AssignBranchModal } from "./AssignUnitModal";
import { DecommissionModal } from "./DecommissionUnitModal";
import { SetUnitAlias } from "./SetUnitAlias";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UnitHarvestSummary } from "./UnitHarvestSummary";

// number animation
function AnimatedNumber({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.5, ease: "easeOut" });
    return controls.stop;
  }, [value, count]);

  return <motion.span>{rounded}</motion.span>;
}

// Status badge component
function StatusBadge({
  status,
  lastPing,
}: {
  status: "online" | "offline" | "unknown";
  lastPing?: string;
}) {
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

  const timeAgo = getTimeAgo(lastPing || "");

  // "Unknown" state (no ping data at all)
  if (status === "unknown") {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
          <span className="text-xs text-muted-foreground">No Data</span>
        </div>
      </div>
    );
  }

  // Online / Offline layout
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            status === "online" ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-xs text-muted-foreground">
          {status === "online" ? "Online" : timeAgo || "Offline"}
        </span>
      </div>
    </div>
  );
}

// Compact Mobile Status badge component
function MobileStatusBadge({
  status,
  lastPing,
}: {
  status: "online" | "offline" | "unknown";
  lastPing?: string;
}) {
  const getTimeAgo = (timestamp: string) => {
    if (!timestamp) return "";
    try {
      const now = new Date();
      const pingTime = new Date(timestamp);
      if (isNaN(pingTime.getTime())) return "";
      const diffMinutes = Math.floor(
        (now.getTime() - pingTime.getTime()) / (1000 * 60)
      );
      if (diffMinutes < 1) return "Now";
      if (diffMinutes < 60) return `${diffMinutes}m`;
      if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
      return `${Math.floor(diffMinutes / 1440)}d`;
    } catch {
      return "";
    }
  };

  const timeAgo = getTimeAgo(lastPing || "");

  if (status === "unknown") {
    return (
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-gray-400" />
        <span className="text-xs text-muted-foreground">-</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span
        className={`w-2 h-2 rounded-full ${
          status === "online" ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <span className="text-xs text-muted-foreground">
        {status === "online" ? "On" : timeAgo || "Off"}
      </span>
    </div>
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
                <span className="font-bold text-foreground">{unitAlias}</span>.
                All recent sales have already been harvested or there are no
                sales to harvest.
              </>
            ) : (
              <>
                Failed to harvest sales for{" "}
                <span className="font-bold text-foreground">{unitAlias}</span>:{" "}
                <span className="text-red-600">{error}</span>
              </>
            )}
          </p>
          <div className="flex justify-end">
            <Button
              onClick={onClose}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {isNoAggregatesError ? "Got it" : "Try Again"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to fetch healthcheck status
function useHealthcheckStatus() {
  const [statusData, setStatusData] = useState<
    Record<string, { status: "online" | "offline"; lastPing: string }>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setError(null);

        // Simple timeout approach
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 5000)
        );

        const fetchPromise = fetch("/api/healthchecks-status");

        const response = await Promise.race([fetchPromise, timeoutPromise]);

        // Rest of your existing response handling...
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          const text = await response.text();
          throw new Error("Server returned HTML page");
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setStatusData(data);
      } catch (error) {
        console.error("Failed to fetch healthcheck status:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load device status"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 31000);
    return () => clearInterval(interval);
  }, []);

  return { statusData, loading, error };
}

// Harvest Confirmation Dialog Component
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
            <span className="font-bold text-foreground">{unitAlias}</span>? This
            will mark all daily sales as harvested.
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

export function UnitsPageCards({
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

  const branchMap = new Map(branches.map((branch) => [branch.id, branch]));

  const [assignModalUnitId, setAssignModalUnitId] = useState<string | null>(
    null
  );
  const [decommissionModalUnitId, setDecommissionModalUnitId] = useState<
    string | null
  >(null);
  const [aliasModalUnitId, setAliasModalUnitId] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");

  const [confirmingHarvest, setConfirmingHarvest] = useState<string | null>(
    null
  );
  const [harvestResults, setHarvestResults] = useState<
    Record<string, HarvestResult>
  >({});
  const [showHarvestSummary, setShowHarvestSummary] = useState(false);
  const [currentHarvestDevice, setCurrentHarvestDevice] = useState<
    string | null
  >(null);
  const [harvestingDevice, setHarvestingDevice] = useState<string | null>(null);

  // Add state to track harvest errors
  const [harvestError, setHarvestError] = useState<{
    deviceId: string;
    error: string;
  } | null>(null);

  const handleHarvestConfirm = async () => {
    if (!confirmingHarvest) return;

    try {
      setHarvestingDevice(confirmingHarvest);
      const result = await harvestUnitAggregates(confirmingHarvest);

      setHarvestResults((prev) => ({
        ...prev,
        [confirmingHarvest]: result,
      }));

      setCurrentHarvestDevice(confirmingHarvest);
      setConfirmingHarvest(null);
      setShowHarvestSummary(true);
      setHarvestError(null); // Clear any previous errors
    } catch (error) {
      console.error("Harvest failed:", error);
      const unitAlias =
        units.find((u) => u.deviceId === confirmingHarvest)?.alias ||
        confirmingHarvest;
      setHarvestError({
        deviceId: confirmingHarvest,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
      setConfirmingHarvest(null);
    } finally {
      setHarvestingDevice(null);
    }
  };

  const handleCloseSummary = () => {
    setShowHarvestSummary(false);
    setCurrentHarvestDevice(null);
  };

  // Add function to close error dialog
  const handleCloseErrorDialog = () => {
    setHarvestError(null);
  };

  if (unitsLoading) return <p>Loading units...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  const unitsWithBranch = units.filter((u) => u.branchId);
  const unitsWithoutBranch = units.filter((u) => !u.branchId);

  const filteredUnitsWithBranch = filterByBranchId
    ? unitsWithBranch.filter((unit) => unit.branchId === filterByBranchId)
    : selectedBranch === "all"
    ? unitsWithBranch
    : unitsWithBranch.filter((unit) => unit.branchId === selectedBranch);

  const sortedBranches = [...branches].sort((a, b) =>
    a.location.localeCompare(b.location)
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main cards grid */}
      <div className="flex-1">
        {!hideFilters && (
          <div className="mb-6 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by Branch:</span>
            </div>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {sortedBranches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="ml-2">
              {filteredUnitsWithBranch.length} unit
              {filteredUnitsWithBranch.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        )}

        {/* Desktop Grid - Unchanged */}
        <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredUnitsWithBranch.map((unit) => {
            const branch = branchMap.get(unit.branchId);
            const branchLocation = branch?.location || "Unknown Location";

            const unitStatus = statusData[unit.deviceId] || {
              status: "unknown" as const,
              lastPing: "",
            };

            const totalToday = sales
              .filter((s) => s.deviceId === unit.deviceId)
              .reduce((sum, sale) => sum + (sale.total || 0), 0);

            const isHarvesting = harvestingDevice === unit.deviceId;

            return (
              <div key={unit.deviceId} className="relative group">
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative"
                >
                  <Card className="bg-card border shadow-sm hover:shadow-md transition aspect-square flex flex-col w-full relative">
                    <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-4">
                      {/* Status Indicator */}
                      <div className="absolute top-3 left-1/2 -translate-x-1/2">
                        {statusLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        ) : (
                          <StatusBadge
                            status={unitStatus.status}
                            lastPing={unitStatus.lastPing}
                          />
                        )}
                      </div>

                      <Monitor className="w-10 h-10 text-muted-foreground mb-2 mt-3" />

                      {/* Alias with pencil button */}
                      <div className="flex items-center gap-1 mb-1">
                        <CardTitle className="text-sm line-clamp-2">
                          {unit.alias || "No Alias Yet"}
                        </CardTitle>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-4 h-4 p-0"
                          onClick={() => setAliasModalUnitId(unit.deviceId)}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                      </div>

                      <CardDescription className="text-xs mb-1 truncate w-full">
                        {unit.deviceId}
                      </CardDescription>

                      <Link
                        href={`/branches/${branch?.id}`}
                        className="text-xs text-green-600 font-medium mb-2 line-clamp-2 hover:underline"
                      >
                        {branchLocation}
                      </Link>

                      {/* Simple total earned today */}
                      <div className="mt-auto pt-0 text-sm font-medium text-foreground">
                        <span className="block text-[10px] text-muted-foreground mb-0.5">
                          Total earned today
                        </span>
                        <span className="text-green-600">₱</span>
                        <span className="text-green-600 text-lg">
                          <AnimatedNumber value={totalToday} />
                        </span>
                      </div>

                      {/* Link to unit details */}
                      <Link
                        href={`/units/${unit.deviceId}`}
                        prefetch={true}
                        passHref
                      >
                        <Button
                          size="sm"
                          variant="link"
                          className="text-blue-500 p-0 h-auto text-xs mt-2"
                        >
                          View Details
                        </Button>
                      </Link>
                    </CardContent>

                    {/* Burger menu for mobile */}
                    <div className="absolute top-2 right-2 lg:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 p-0"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setConfirmingHarvest(unit.deviceId)}
                          >
                            <CircleDollarSign className="w-4 h-4 mr-2 text-yellow-600" />
                            Harvest
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setAssignModalUnitId(unit.deviceId)}
                          >
                            Assign
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setAssignModalUnitId(unit.deviceId)}
                          >
                            Reassign
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setDecommissionModalUnitId(unit.deviceId)
                            }
                            className="text-red-600"
                          >
                            Decommission
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                </motion.div>

                {/* Desktop hover actions */}
                <div className="hidden lg:flex absolute top-1/2 -right-20 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-col gap-2 z-50">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white/80 backdrop-blur-sm hover:bg-background text-foreground border-gray-300 px-3 py-1 text-xs flex items-center gap-1"
                    onClick={() => setConfirmingHarvest(unit.deviceId)}
                    disabled={isHarvesting}
                  >
                    {isHarvesting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CircleDollarSign className="w-3 h-3 text-yellow-600" />
                    )}
                    {isHarvesting ? "Harvesting..." : "Harvest"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white/80 backdrop-blur-sm hover:bg-background text-foreground border-gray-300 px-3 py-1 text-xs"
                    onClick={() => setAssignModalUnitId(unit.deviceId)}
                  >
                    Assign
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white/80 backdrop-blur-sm hover:bg-background text-foreground border-gray-300 px-3 py-1 text-xs"
                    onClick={() => setAssignModalUnitId(unit.deviceId)}
                  >
                    Reassign
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white/80 backdrop-blur-sm hover:bg-background text-red-600 border-gray-300 px-3 py-1 text-xs"
                    onClick={() => setDecommissionModalUnitId(unit.deviceId)}
                    disabled={decommissionUnit.isPending}
                  >
                    {decommissionUnit.isPending &&
                    decommissionUnit.variables?.deviceId === unit.deviceId ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        Processing...
                      </>
                    ) : (
                      "Decommission"
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Grid - Compact */}
        <div className="lg:hidden grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredUnitsWithBranch.map((unit) => {
            const branch = branchMap.get(unit.branchId);
            const branchLocation = branch?.location || "Unknown";

            const unitStatus = statusData[unit.deviceId] || {
              status: "unknown" as const,
              lastPing: "",
            };

            const totalToday = sales
              .filter((s) => s.deviceId === unit.deviceId)
              .reduce((sum, sale) => sum + (sale.total || 0), 0);

            const isHarvesting = harvestingDevice === unit.deviceId;

            return (
              <div key={unit.deviceId} className="relative">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Card className="bg-card border shadow-sm hover:shadow-md transition-all flex flex-col w-full aspect-square">
                    <CardContent className="flex-1 flex flex-col p-3">
                      {/* Header with Status and Menu */}
                      <div className="flex items-center justify-center mb-2">
                        {statusLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                        ) : (
                          <MobileStatusBadge
                            status={unitStatus.status}
                            lastPing={unitStatus.lastPing}
                          />
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-6 h-6 p-0"
                            >
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem
                              onClick={() =>
                                setConfirmingHarvest(unit.deviceId)
                              }
                              className="text-xs"
                            >
                              <CircleDollarSign className="w-3 h-3 mr-2 text-yellow-600" />
                              Harvest
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setAssignModalUnitId(unit.deviceId)
                              }
                              className="text-xs"
                            >
                              Reassign
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setAliasModalUnitId(unit.deviceId)}
                              className="text-xs"
                            >
                              <Pencil className="w-3 h-3 mr-2" />
                              Edit Alias
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setDecommissionModalUnitId(unit.deviceId)
                              }
                              className="text-red-600 text-xs"
                            >
                              Decommission
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Device Icon and Alias */}
                      <div className="flex flex-col items-center text-center flex-1 justify-center">
                        <Monitor className="w-6 h-6 text-muted-foreground mb-1" />

                        <div className="flex items-center gap-1 mb-1">
                          <CardTitle className="text-xs font-medium line-clamp-2 leading-tight">
                            {unit.alias || "No Alias"}
                          </CardTitle>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-3 h-3 p-0 min-h-0"
                            onClick={() => setAliasModalUnitId(unit.deviceId)}
                          >
                            <Pencil className="w-2 h-2" />
                          </Button>
                        </div>

                        <CardDescription className="text-[10px] text-muted-foreground mb-1 truncate w-full">
                          {unit.deviceId.slice(0, 8)}...
                        </CardDescription>

                        <Link
                          href={`/branches/${branch?.id}`}
                          className="text-xs text-green-600 font-medium mb-2 line-clamp-2 hover:underline"
                        >
                          {branchLocation}
                        </Link>
                      </div>

                      {/* Footer with Earnings and Action */}
                      <div className="mt-auto space-y-1">
                        <div className="text-xs font-medium text-foreground text-center">
                          <span className="text-green-600">₱</span>
                          <span className="text-green-600 text-xs">
                            <AnimatedNumber value={totalToday} />
                          </span>
                        </div>

                        <Link
                          href={`/units/${unit.deviceId}`}
                          passHref
                          className="block"
                        >
                          <Button
                            size="sm"
                            variant="link"
                            className="text-blue-500 p-0 h-auto text-[10px] w-full"
                          >
                            Details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Show message when no units match the filter */}
        {filteredUnitsWithBranch.length === 0 && unitsWithBranch.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No units found for the selected branch.
          </div>
        )}
      </div>

      {!hideUnassigned && unitsWithoutBranch.length > 0 && (
        <div className="lg:w-64 lg:sticky lg:top-20 h-fit">
          {/* Simple container with fixed height */}
          <div className="bg-background border rounded-lg flex flex-col max-h-[400px]">
            {" "}
            {/* Fixed height */}
            {/* Header */}
            <div className="p-3 border-b flex-shrink-0">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
                <div>
                  <h3 className="text-sm font-medium">Unassigned Units</h3>
                  <p className="text-xs text-muted-foreground">
                    {unitsWithoutBranch.length} pending
                  </p>
                </div>
              </div>
            </div>
            {/* Scrollable content - shows ~5 units, then scrolls */}
            <div className="flex-1 overflow-y-auto p-2">
              <div className="space-y-2">
                {unitsWithoutBranch.map((unit) => {
                  {
                    /* No slice - show all but scroll */
                  }
                  const unitStatus = statusData[unit.deviceId] || {
                    status: "unknown" as const,
                    lastPing: "",
                  };

                  return (
                    <div
                      key={unit.deviceId}
                      className="p-2 border rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 pt-0.5">
                          <div className="flex items-center gap-1.5">
                            <Monitor className="w-3 h-3 text-muted-foreground" />
                            {statusLoading ? (
                              <Loader2 className="w-1.5 h-1.5 animate-spin text-muted-foreground" />
                            ) : (
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${
                                  unitStatus.status === "online"
                                    ? "bg-green-500"
                                    : unitStatus.status === "offline"
                                    ? "bg-red-500"
                                    : "bg-yellow-500"
                                }`}
                              />
                            )}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <p className="text-xs font-medium truncate">
                              {unit.alias || "No Alias"}
                            </p>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-3 h-3 p-0 hover:bg-background"
                              onClick={() => setAliasModalUnitId(unit.deviceId)}
                            >
                              <Pencil className="w-2.5 h-2.5 text-muted-foreground" />
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate mb-2">
                            {unit.deviceId.slice(0, 10)}...
                          </p>
                          <Button
                            size="sm"
                            variant="default"
                            className="w-full text-xs h-7"
                            onClick={() => setAssignModalUnitId(unit.deviceId)}
                          >
                            Assign
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Footer */}
            <div className="p-2 border-t flex-shrink-0">
              <p className="text-[10px] text-muted-foreground text-center">
                Assign them to your branches
              </p>
            </div>
          </div>
        </div>
      )}

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

      {/* Harvest Confirmation Dialog */}
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

      {/* Harvest Summary Dialog */}
      {currentHarvestDevice && harvestResults[currentHarvestDevice] && (
        <UnitHarvestSummary
          open={showHarvestSummary}
          onClose={handleCloseSummary}
          result={harvestResults[currentHarvestDevice]}
          unitAlias={
            units.find((u) => u.deviceId === currentHarvestDevice)?.alias ||
            currentHarvestDevice
          }
        />
      )}

      {/* Harvest Error Dialog */}
      {harvestError && (
        <HarvestErrorDialog
          open={!!harvestError}
          onClose={handleCloseErrorDialog}
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
