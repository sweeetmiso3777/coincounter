"use client";

import { useParams } from "next/navigation";
import { useBranchAggregates } from "@/hooks/use-branch-aggregates";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Activity, Calendar } from "lucide-react";
import Link from "next/link";
import React from "react";
import { AggregatesCard } from "@/components/Branch/aggregates-card";

const BranchHeader = React.memo(
  ({ branchId, location }: { branchId: string; location?: string }) => (
    <div className="mb-8">
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/branches">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Branches
        </Link>
      </Button>

      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-secondary/10 rounded-lg">
          <MapPin className="h-6 w-6 text-secondary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground text-balance">
          {location || `Branch ${branchId}`}
        </h1>
      </div>

      <p className="text-muted-foreground text-lg">
        Real-time performance metrics and transaction data
      </p>
    </div>
  )
);

BranchHeader.displayName = "BranchHeader";

function BranchPageClient() {
  const { branchId } = useParams<{ branchId: string }>();
  const { data, isLoading, isError, error } = useBranchAggregates(branchId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-muted rounded-full mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Data Available
              </h3>
              <p className="text-muted-foreground text-center mb-6">
                No aggregates found for this branch. Check back later or verify
                branch operations.
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BranchHeader branchId={branchId} location={data?.location} />

        <AggregatesCard data={data} />
      </div>
    </div>
  );
}

export default BranchPageClient;
