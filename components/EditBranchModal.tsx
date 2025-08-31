"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { updateBranch } from "@/hooks/useBranches";

interface EditBranchModalProps {
  open: boolean;
  onClose: () => void;
  existingBranch: {
    id: string;
    branch_manager: string;
    location: string;
    harvest_day_of_month: number;
    share: number;
  };
}

export default function EditBranchModal({
  open,
  onClose,
  existingBranch,
}: EditBranchModalProps) {
  const [branchManager, setBranchManager] = useState("");
  const [location, setLocation] = useState("");
  const [harvestDayOfMonth, setHarvestDayOfMonth] = useState("");
  const [share, setShare] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Autofill values when editing
  useEffect(() => {
    if (existingBranch) {
      setBranchManager(existingBranch.branch_manager);
      setLocation(existingBranch.location);
      setHarvestDayOfMonth(existingBranch.harvest_day_of_month.toString());
      setShare(existingBranch.share.toString());
    }
  }, [existingBranch, open]);

  if (!open || !existingBranch) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const dayOfMonth = Number(harvestDayOfMonth);

      // Validate day of month
      if (dayOfMonth < 1 || dayOfMonth > 31) {
        throw new Error("Day of month must be between 1 and 31");
      }

      await updateBranch(existingBranch.id, {
        branch_manager: branchManager,
        location,
        harvest_day_of_month: dayOfMonth,
        share: Number(share),
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save branch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-md p-6 border border-border">
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          Edit Branch
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Branch ID (locked) */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Branch ID
            </label>
            <input
              type="text"
              value={existingBranch.id}
              disabled
              className="mt-1 w-full border border-input rounded-md p-2 bg-muted text-muted-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Branch Manager
            </label>
            <input
              type="text"
              value={branchManager}
              onChange={(e) => setBranchManager(e.target.value)}
              required
              className="mt-1 w-full border border-input rounded-md p-2 bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="mt-1 w-full border border-input rounded-md p-2 bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Harvest Day of Month
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={harvestDayOfMonth}
              onChange={(e) => setHarvestDayOfMonth(e.target.value)}
              required
              className="mt-1 w-full border border-input rounded-md p-2 bg-background text-foreground"
              placeholder="Enter day (1-31)"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Day of the month when harvest occurs (e.g., 15 for the 15th of
              every month)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Share (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={share}
              onChange={(e) => setShare(e.target.value)}
              required
              className="mt-1 w-full border border-input rounded-md p-2 bg-background text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              The precentage of the total harvest allocated to this branch
              (0-100%)
            </p>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
