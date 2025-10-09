"use client";

import { useParams } from "next/navigation";
import { useBranchAggregatesHistory } from "@/hooks/use-branch-aggregates-history";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Activity, Calendar } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import { AggregatesTable } from "@/components/Branch/aggregates-table";
import { useBranches } from "@/hooks/use-branches-query";
import { MapModal } from "@/components/Branch/MapModal";
import CompactMap from "@/components/Branch/CompactMap";

const BranchHeader = React.memo(
  ({
    branchId,
    location,
    branch,
  }: {
    branchId: string;
    location: string;
    branch: any;
  }) => {
    const [showMapModal, setShowMapModal] = useState(false);

    // Handle ESC key press
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowMapModal(false);
      }
    }, []);

    // Handle click outside modal
    const handleClickOutside = useCallback((event: MouseEvent) => {
      const modal = document.querySelector("[data-map-modal]");
      const trigger = document.querySelector("[data-map-trigger]");

      if (
        modal &&
        !modal.contains(event.target as Node) &&
        trigger &&
        !trigger.contains(event.target as Node)
      ) {
        setShowMapModal(false);
      }
    }, []);

    useEffect(() => {
      if (showMapModal) {
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousedown", handleClickOutside);
        document.body.style.overflow = "hidden"; // Prevent scrolling when modal is open
      } else {
        document.body.style.overflow = "unset";
      }

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("mousedown", handleClickOutside);
        document.body.style.overflow = "unset";
      };
    }, [showMapModal, handleKeyDown, handleClickOutside]);

    return (
      <>
        <div className="mb-8 flex items-start justify-between gap-6">
          {/* Left side - current content */}
          <div className="flex-1">
            <Button asChild variant="ghost" className="mb-4">
              <Link href="/branches">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Branches
              </Link>
            </Button>

            <div className="flex items-center gap-3 mb-4 font-mono">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground text-balance">
                {location}
              </h1>
            </div>

            <p className="text-muted-foreground text-lg font-mono">
              Historical performance metrics and transaction data
            </p>
          </div>

          {/* Right side - Always visible map preview (2x size) */}
          <div className="flex flex-col items-end gap-2 z-10">
            <button
              data-map-trigger
              onClick={() => setShowMapModal(true)}
              className="w-100 h-50 flex-shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all bg-gray-50 dark:bg-gray-800 hover:scale-105"
            >
              {branch?.latitude && branch?.longitude ? (
                <div className="w-full h-full pointer-events-none">
                  <CompactMap
                    initialCoords={[branch.latitude, branch.longitude]}
                    showSearch={false}
                    showCoordinates={false}
                    className="h-full"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                  <MapPin className="h-8 w-8 text-gray-400" />
                  <span className="sr-only">No location data</span>
                </div>
              )}
            </button>
            <p className="text-xs text-muted-foreground">Click map to expand</p>
          </div>
        </div>

        {/* Full Map Modal */}
        {showMapModal && branch && (
          <MapModal
            open={showMapModal}
            onClose={() => setShowMapModal(false)}
            branch={branch}
            data-map-modal
          />
        )}
      </>
    );
  }
);

BranchHeader.displayName = "BranchHeader";

function BranchPageClient() {
  const { branchId } = useParams<{ branchId: string }>();

  // Get branches data to find the location name
  const { data: branches, isLoading: branchesLoading } = useBranches();

  const {
    data: historyData,
    isLoading: historyLoading,
    isError,
    error,
  } = useBranchAggregatesHistory(branchId as string, 30);

  // Find the branch location from the branches list
  const branch = branches?.find((b) => b.id === branchId);
  const branchLocation = branch?.location || `Branch ${branchId}`;

  // Use location from history data if available, otherwise fall back to branches list
  const location =
    historyData.length > 0 ? historyData[0].location : branchLocation;

  const isLoading = branchesLoading || historyLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="space-y-2">
              <div className="h-10 bg-muted rounded-md"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-muted rounded-md">
                    <div className="h-4 bg-muted-foreground/20 rounded w-20"></div>
                    <div className="h-4 bg-muted-foreground/20 rounded flex-1"></div>
                    <div className="h-4 bg-muted-foreground/20 rounded w-24"></div>
                    {[...Array(6)].map((_, j) => (
                      <div
                        key={j}
                        className="h-4 bg-muted-foreground/20 rounded w-20"
                      ></div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BranchHeader
            branchId={branchId as string}
            location={location}
            branch={branch}
          />
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-destructive/10 rounded-full mb-4">
                <Activity className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Error Loading Branch Data
              </h3>
              <p className="text-muted-foreground text-center mb-6">
                {error?.message}
              </p>
              <Button asChild variant="outline">
                <Link href="/branches">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Branches
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (historyData.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BranchHeader
            branchId={branchId as string}
            location={location}
            branch={branch}
          />
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-muted rounded-full mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Data Available
              </h3>
              <p className="text-muted-foreground text-center mb-6">
                No aggregates found for {branchLocation}. Check back later or
                verify branch operations.
              </p>
              <Button asChild variant="outline">
                <Link href="/branches">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Branches
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BranchHeader
          branchId={branchId as string}
          location={location}
          branch={branch}
        />
        <AggregatesTable data={historyData} location={location} />
      </div>
    </div>
  );
}

export default BranchPageClient;
