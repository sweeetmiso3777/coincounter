"use client";

import { useBackupsQuery } from "@/hooks/use-backups-query";
import { BackupCard } from "@/components/backups-card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, RefreshCw, Database } from "lucide-react";

export default function BackupsPage() {
  const { data: backups, loading, error } = useBackupsQuery();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <h1 className="text-3xl font-bold text-foreground mt-4">
            Loading Backups
          </h1>
          <p className="text-muted-foreground mt-2">
            Fetching backup data from all devices...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-3xl font-bold text-foreground mt-4">
            Error Loading Backups
          </h1>
          <p className="text-muted-foreground mt-2">
            {error.message || "Failed to load backup data"}
          </p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Device Backups
            </h1>
            <p className="text-muted-foreground mt-2">
              Monitor backup data from all coin-operated devices
            </p>
          </div>
        </div>

        {backups.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No backup data found
              </h3>
              <p className="text-muted-foreground mb-6">
                Device backups will appear here once devices start uploading
                data.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Recent Backups ({backups.length})
            </h2>
            {backups.map((backup) => (
              <BackupCard key={backup.id} backup={backup} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
