"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Activity, Calendar } from "lucide-react";
import { AggregatesTable } from "@/components/Branch/aggregates-table";
import { useBranches } from "@/hooks/use-branches-query";
import { useBranchAggregatesHistory } from "@/hooks/use-branch-aggregates-history";
import React from "react";

interface BranchDetailsModalProps {
  branchId: string;
  open: boolean;
  onClose: () => void;
}

const BranchHeader = React.memo(
  ({
    branchId,
    location,
    onClose,
  }: {
    branchId: string;
    location: string;
    onClose?: () => void;
  }) => (
    <div className="mb-8 flex items-center justify-between">
      <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground">
        <div className="p-2 bg-secondary/10 rounded-lg">
          <MapPin className="h-6 w-6 text-primary" />
        </div>
        {location}
      </h1>
      {onClose && (
        <Button onClick={onClose} variant="ghost">
          Close
        </Button>
      )}
    </div>
  )
);
BranchHeader.displayName = "BranchHeader";

export default function BranchDetailsModalPage({
  branchId,
  open,
  onClose,
}: BranchDetailsModalProps) {
  const { data: branches } = useBranches();
  const branch = branches?.find((b) => b.id === branchId);
  const branchLocation = branch?.location || `Branch ${branchId}`;

  const {
    data: historyData = [],
    isLoading: historyLoading,
    isError,
    error,
  } = useBranchAggregatesHistory(branchId, 30);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center overflow-auto py-10 px-4"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-6xl rounded-lg shadow-lg p-6 border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <BranchHeader
          branchId={branchId}
          location={branchLocation}
          onClose={onClose}
        />

        {historyLoading && (
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        )}

        {isError && (
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
              <Button onClick={onClose} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </CardContent>
          </Card>
        )}

        {!historyLoading && !isError && historyData.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-muted rounded-full mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Data Available
              </h3>
              <p className="text-muted-foreground text-center mb-6">
                No aggregates found for {branchLocation}.
              </p>
              <Button onClick={onClose} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </CardContent>
          </Card>
        )}

        {!historyLoading && !isError && historyData.length > 0 && (
          <div className="overflow-x-auto">
            <AggregatesTable data={historyData} location={branchLocation} />
          </div>
        )}
      </div>
    </div>
  );
}
