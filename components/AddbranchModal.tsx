"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { createBranchWithId } from "@/hooks/useBranches"; // ✅ your helper
import { Timestamp } from "firebase/firestore";

interface AddBranchModalProps {
  open: boolean;
  onEdit?: () => void;
  onClose: () => void;
  existingBranch?: {
    id: string;
    branch_manager: string;
    location: string;
    date_of_harvest: Timestamp | Date | string; // could be Date | string | Firestore timestamp
    share: number;
  };
}

export default function AddBranchModal({
  open,
  onClose,
  existingBranch,
}: AddBranchModalProps) {
  const [branchId, setBranchId] = useState("");
  const [branchManager, setBranchManager] = useState("");
  const [location, setLocation] = useState("");
  const [dateOfHarvest, setDateOfHarvest] = useState("");
  const [share, setShare] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Autofill if editing
  useEffect(() => {
    if (existingBranch) {
      setBranchId(existingBranch.id);
      setBranchManager(existingBranch.branch_manager);
      setLocation(existingBranch.location);

      // Convert date into YYYY-MM-DD string for input
      if (existingBranch.date_of_harvest) {
        let date: Date;

        if (existingBranch.date_of_harvest instanceof Timestamp) {
          date = existingBranch.date_of_harvest.toDate();
        } else if (existingBranch.date_of_harvest instanceof Date) {
          date = existingBranch.date_of_harvest;
        } else {
          date = new Date(existingBranch.date_of_harvest);
        }

        setDateOfHarvest(date.toISOString().split("T")[0]);
      } else {
        setDateOfHarvest("");
      }

      setShare(existingBranch.share.toString());
    } else {
      // Reset if adding new
      setBranchId("");
      setBranchManager("");
      setLocation("");
      setDateOfHarvest("");
      setShare("");
    }
  }, [existingBranch, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!branchId.trim()) throw new Error("Branch ID is required");

      await createBranchWithId(branchId.trim(), {
        branch_manager: branchManager,
        location,
        date_of_harvest: new Date(dateOfHarvest), // ✅ safe conversion
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
          {existingBranch ? "Edit Branch" : "Add New Branch"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Branch ID */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Branch ID
            </label>
            <input
              type="text"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              required
              disabled={!!existingBranch} // 🔹 prevent editing ID if editing
              className="mt-1 w-full border border-input rounded-md p-2 bg-background text-foreground disabled:bg-muted disabled:text-muted-foreground"
              placeholder="e.g. branch001"
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
              Date of Harvest
            </label>
            <input
              type="date"
              value={dateOfHarvest}
              onChange={(e) => setDateOfHarvest(e.target.value)}
              required
              className="mt-1 w-full border border-input rounded-md p-2 bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Share (%)
            </label>
            <input
              type="number"
              value={share}
              onChange={(e) => setShare(e.target.value)}
              required
              className="mt-1 w-full border border-input rounded-md p-2 bg-background text-foreground"
            />
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
              {loading ? "Saving..." : existingBranch ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
