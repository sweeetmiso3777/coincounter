"use client";

import { useUnits } from "@/hooks/use-units-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useUser } from "@/providers/UserProvider"; // Add this import

// Status indicator component (unchanged)
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
  const { user } = useUser(); // Add this to check user role
  const { units, loading: unitsLoading, error: unitsError } = useUnits();
  const [statusData, setStatusData] = useState<
    Record<string, { status: "online" | "offline"; lastPing: string }>
  >({});
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Check if user is a partner
  const isPartner = user?.role === "partner";

  // Fetch healthcheck status every 31 seconds
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setStatusError(null);

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
        setStatusError(
          error instanceof Error
            ? error.message
            : "Unable to load device status"
        );
      } finally {
        setStatusLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 31000);
    return () => clearInterval(interval);
  }, []);

  if (unitsLoading || statusLoading) {
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Branch Units</h2>
        <Badge variant="secondary" className="text-sm">
          {branchUnits.length} unit{branchUnits.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {branchUnits.map((unit) => {
          const unitStatus = statusData[unit.deviceId] || {
            status: "unknown" as const,
            lastPing: "",
          };

          // For partners, render as non-clickable
          if (isPartner) {
            return (
              <Card
                key={unit.deviceId}
                className="p-4 border cursor-default" // Changed to cursor-default
              >
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
    </div>
  );
}
