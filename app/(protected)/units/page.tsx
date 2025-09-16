"use client";
import { UnitsTable } from "@/components/units-table";
import { useUnitsWithBranch } from "@/hooks/use-units-query";
import { Loader2 } from "lucide-react";

function UnitsPage() {
  const { data: units, isLoading, error } = useUnitsWithBranch();

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <h1 className="text-3xl font-bold text-foreground mt-4">
            Loading Units
          </h1>
          <p className="text-muted-foreground mt-2">
            Please wait while we load your units...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600">
            Error Loading Units
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            {error instanceof Error ? error.message : "Failed to load units"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Units Management</h1>
          <p className="text-muted-foreground">
            Manage your coin-operated units and track their performance
          </p>
        </div>

        <UnitsTable data={units || []} />
      </div>
    </div>
  );
}

export default UnitsPage;
