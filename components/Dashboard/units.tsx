"use client";

import { useUnits } from "@/hooks/use-units-query";
import { Loader2, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { useSalesQuery } from "@/hooks/use-sales-query";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";

function AnimatedNumber({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.5, ease: "easeOut" });
    return controls.stop;
  }, [value, count]);

  return <motion.span>{rounded}</motion.span>;
}

interface DeviceStatus {
  status: "online" | "offline";
  lastPing: string;
}

interface StatusData {
  [deviceId: string]: DeviceStatus;
}

interface Sale {
  deviceId: string;
  total: number;
}

// Create a minimal interface for what we actually use
interface UnitStatusInfo {
  deviceId: string;
  alias?: string;
}

export function OnlineDevicesDashboard() {
  const { units, loading: unitsLoading, error: unitsError } = useUnits();
  const { data: sales = [], isLoading: salesLoading } = useSalesQuery();

  const [statusData, setStatusData] = useState<StatusData>({});
  const [statusLoading, setStatusLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showOffline, setShowOffline] = useState(false);

  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/healthchecks-status");
        if (response.ok) {
          const data: StatusData = await response.json();
          setStatusData(data);
        }
      } catch (error) {
        console.error("Failed to fetch healthcheck status:", error);
      } finally {
        setStatusLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const getUnitStatus = (unit: UnitStatusInfo) => {
    const healthcheck =
      statusData[unit.deviceId] || statusData[unit.deviceId.toLowerCase()];

    // Find the index by deviceId instead of using indexOf with object comparison
    const unitIndex = units.findIndex((u) => u.deviceId === unit.deviceId);
    const displayIndex = unitIndex !== -1 ? unitIndex + 1 : units.length + 1;

    return {
      alias: unit.alias || `PC${displayIndex}`,
      status: healthcheck?.status || "unknown",
    };
  };

  if (unitsLoading || statusLoading || salesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      </div>
    );
  }

  if (unitsError) {
    return (
      <div className="text-center h-full flex items-center justify-center text-amber-600">
        <span className="text-sm">Error</span>
      </div>
    );
  }

  const filteredUnits = units.filter((unit) => {
    const { status } = getUnitStatus(unit);
    return showOffline ? true : status === "online";
  });

  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const currentUnits = filteredUnits.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(filteredUnits.length / ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Device Status</h3>
        <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showOffline}
            onChange={(e) => {
              setShowOffline(e.target.checked);
              setPage(1);
            }}
            className="accent-blue-500"
          />
          Show offline
        </label>
      </div>

      {/* Device Grid */}
      <div className="flex-grow grid grid-cols-4 gap-2">
        {currentUnits.map((unit) => {
          const { alias, status } = getUnitStatus(unit);
          const totalToday = (sales as Sale[])
            .filter((s) => s.deviceId === unit.deviceId)
            .reduce((sum, sale) => sum + (sale.total || 0), 0);

          return (
            <div
              key={unit.deviceId}
              className="flex flex-col items-center justify-center p-2 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
            >
              <Monitor
                className={`h-4 w-4 mb-1 ${
                  status === "online" ? "text-green-500" : "text-red-500"
                }`}
              />
              <span className="text-[10px] font-medium text-foreground text-center truncate w-full">
                {alias}
              </span>
              <div className="text-[10px] font-medium text-green-500 text-center">
                ₱<AnimatedNumber value={totalToday} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-2">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="text-xs px-2 py-1 rounded-md border hover:bg-muted/50 disabled:opacity-40"
        >
          Prev
        </button>
        <span className="text-xs text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="text-xs px-2 py-1 rounded-md border hover:bg-muted/50 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
