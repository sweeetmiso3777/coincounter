"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useBranches } from "@/hooks/use-branches-query";

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
  const { updateBranch } = useBranches();
  const [branchManager, setBranchManager] = useState("");
  const [location, setLocation] = useState("");
  const [harvestDayOfMonth, setHarvestDayOfMonth] = useState("");
  const [share, setShare] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingBranch && open) {
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
      if (dayOfMonth < 1 || dayOfMonth > 31) {
        throw new Error("Day of month must be between 1 and 31");
      }

      await updateBranch.mutateAsync({
        id: existingBranch.id,
        data: {
          branch_manager: branchManager,
          location,
          harvest_day_of_month: dayOfMonth,
          share: Number(share),
        },
      });

      toast.success("Branch updated successfully!", {
        style: {
          background: "#dcfce7",
          border: "1px solid #bbf7d0",
          color: "#166534",
        },
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update branch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-b from-white/90 to-white/80 dark:from-gray-800/90 dark:to-gray-700/80 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-600 w-full max-w-md p-6 z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4 text-foreground drop-shadow-sm">
          Edit Branch
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">
              Branch ID
            </label>
            <input
              type="text"
              value={existingBranch.id}
              disabled
              className="mt-1 w-full border border-gray-300 rounded-lg p-2 bg-gray-100 dark:bg-gray-700 text-muted-foreground shadow-inner"
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
              className="mt-1 w-full border border-gray-300 rounded-lg p-2 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-inner transition-all"
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
              className="mt-1 w-full border border-gray-300 rounded-lg p-2 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-inner transition-all"
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
              className="mt-1 w-full border border-gray-300 rounded-lg p-2 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-inner transition-all"
            />
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
              className="mt-1 w-full border border-gray-300 rounded-lg p-2 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-inner transition-all"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 dark:bg-gray-700 text-foreground hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
