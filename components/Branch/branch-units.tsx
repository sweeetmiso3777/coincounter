"use client";

import { useUnits } from "@/hooks/use-units-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useUser } from "@/providers/UserProvider";

// Status indicator component
function StatusIndicator({
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

  if (status === "unknown") {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-gray-400" />
        <span className="text-xs text-muted-foreground">No data</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${
          status === "online" ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <span className="text-xs text-muted-foreground">
        {status === "online" ? "Online" : timeAgo || "Offline"}
      </span>
    </div>
  );
}

interface BranchUnitsStatusProps {
  branchId: string;
}

export function BranchUnitsStatus({ branchId }: BranchUnitsStatusProps) {
  const { user } = useUser();
  const { units, loading: unitsLoading, error: unitsError } = useUnits();
  const [statusData, setStatusData] = useState<
    Record<string, { status: "online" | "offline"; lastPing: string }>
  >({});
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const isPartner = user?.role === "partner";

  // Fetch healthcheck status with better error handling
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchStatus = async () => {
      try {
        setStatusError(null);

        // Use abort controller for timeout
        const timeoutId = setTimeout(() => {
          abortController.abort();
        }, 8000); // 8 second timeout

        const response = await fetch("/api/healthchecks-status", {
          signal: abortController.signal,
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        clearTimeout(timeoutId);

        // Check if response is OK
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Check content type
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Invalid response format");
        }

        const data = await response.json();

        if (isMounted) {
          setStatusData(data);
          setStatusError(null);
        }
      } catch (error) {
        if (isMounted) {
          if (error instanceof Error) {
            if (error.name === "AbortError") {
              setStatusError("Request timeout - status service unavailable");
            } else {
              setStatusError(`Status service error: ${error.message}`);
            }
          } else {
            setStatusError("Unable to load device status");
          }
          console.warn("Healthcheck status fetch failed:", error);
        }
      } finally {
        if (isMounted) {
          setStatusLoading(false);
        }
      }
    };

    fetchStatus();

    // Only set up interval if first fetch was successful
    const interval = setInterval(() => {
      if (!statusError) {
        fetchStatus();
      }
    }, 60000);

    return () => {
      isMounted = false;
      abortController.abort();
      clearInterval(interval);
    };
  }, [statusError, retryCount]);

  // Handle retry
  const handleRetry = () => {
    setStatusLoading(true);
    setStatusError(null);
    setRetryCount((prev) => prev + 1);
  };

  if (unitsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading units...</span>
      </div>
    );
  }

  if (unitsError) {
    return (
      <div className="text-center p-8 text-muted-foreground border rounded-lg">
        Failed to load units
      </div>
    );
  }

  // Filter units for this branch
  const branchUnits = units.filter((unit) => unit.branchId === branchId);

  if (branchUnits.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground border rounded-lg">
        No units assigned to this branch
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Branch Units</h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {branchUnits.length} unit{branchUnits.length !== 1 ? "s" : ""}
          </Badge>
          {statusError && (
            <Badge variant="destructive" className="text-xs">
              Status Offline
            </Badge>
          )}
        </div>
      </div> */}

      {/* Status Error Banner */}
      {statusError && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800 dark:text-yellow-400">
                {statusError}
              </span>
            </div>
            <button
              onClick={handleRetry}
              className="text-xs text-yellow-700 dark:text-yellow-300 hover:underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {branchUnits.map((unit) => {
          const unitStatus = statusData[unit.deviceId] || {
            status: "unknown" as const,
            lastPing: "",
          };

          // For partners, render as non-clickable
          if (isPartner) {
            return (
              <Card key={unit.deviceId} className="p-4 border cursor-default">
                <CardContent className="p-0 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Monitor className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-medium text-foreground truncate">
                        {unit.alias || "Unnamed Unit"}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-3">
                    <StatusIndicator
                      status={unitStatus.status}
                      lastPing={unitStatus.lastPing}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          }

          // For admin users, keep as clickable
          return (
            <Link
              key={unit.deviceId}
              href={`/units/${unit.deviceId}`}
              className="block transition-all hover:scale-[1.02]"
            >
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border">
                <CardContent className="p-0 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Monitor className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-medium text-foreground truncate">
                        {unit.alias || "Unnamed Unit"}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-3">
                    <StatusIndicator
                      status={unitStatus.status}
                      lastPing={unitStatus.lastPing}
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Loading state for status only */}
      {statusLoading && (
        <div className="text-center py-2">
          <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
          <span className="text-sm text-muted-foreground">
            Checking unit status...
          </span>
        </div>
      )}
    </div>
  );
}
