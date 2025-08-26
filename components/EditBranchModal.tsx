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
    date_of_harvest: any;
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
  const [dateOfHarvest, setDateOfHarvest] = useState("");
  const [share, setShare] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  //  Pre-fill values when editing
  useEffect(() => {
    if (existingBranch) {
      setBranchManager(existingBranch.branch_manager);
      setLocation(existingBranch.location);

      if (existingBranch.date_of_harvest) {
        let date: Date;

        if (existingBranch.date_of_harvest.toDate) {
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
    }
  }, [existingBranch, open]);

  if (!open || !existingBranch) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateBranch(existingBranch.id, {
        branch_manager: branchManager,
        location,
        date_of_harvest: new Date(dateOfHarvest),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">Edit Branch</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Branch ID (locked) */}
          <div>
            <label className="block text-sm font-medium">Branch ID</label>
            <input
              type="text"
              value={existingBranch.id}
              disabled
              className="mt-1 w-full border rounded-md p-2 bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Branch Manager</label>
            <input
              type="text"
              value={branchManager}
              onChange={(e) => setBranchManager(e.target.value)}
              required
              className="mt-1 w-full border rounded-md p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="mt-1 w-full border rounded-md p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Date of Harvest</label>
            <input
              type="date"
              value={dateOfHarvest}
              onChange={(e) => setDateOfHarvest(e.target.value)}
              required
              className="mt-1 w-full border rounded-md p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Share (%)</label>
            <input
              type="number"
              value={share}
              onChange={(e) => setShare(e.target.value)}
              required
              className="mt-1 w-full border rounded-md p-2"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md bg-blue-600 text-white"
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
