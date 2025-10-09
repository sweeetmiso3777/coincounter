"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { MapPin, User, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useUser } from "@/providers/UserProvider";
import { useBranches } from "@/hooks/use-branches-query";

// Dynamically import the map with no SSR
const CompactMap = dynamic(() => import("@/components/Branch/CompactMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

interface UserData {
  id: string;
  email: string;
  role: string;
  status: string;
  approvedAt: any;
}

interface AddBranchModalProps {
  open: boolean;
  onEdit?: () => void;
  onClose: () => void;
  existingBranch?: {
    id: string;
    branch_manager: string;
    location: string;
    harvest_day_of_month: number;
    share: number;
    latitude?: number;
    longitude?: number;
    affiliates?: string[];
  };
}

export default function AddBranchModal({
  open,
  onClose,
  existingBranch,
}: AddBranchModalProps) {
  const { user: currentUser } = useUser();
  const { createBranch } = useBranches();

  const [branchManager, setBranchManager] = useState("");
  const [location, setLocation] = useState("");
  const [harvestDayOfMonth, setHarvestDayOfMonth] = useState("");
  const [share, setShare] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [affiliates, setAffiliates] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);

  // Fetch approved users for affiliates selection
  useEffect(() => {
    const fetchApprovedUsers = async () => {
      if (!open) return;

      setUsersLoading(true);
      try {
        const usersQuery = query(
          collection(db, "users"),
          where("status", "==", "approved")
        );
        const querySnapshot = await getDocs(usersQuery);
        const users: UserData[] = [];

        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          users.push({
            id: doc.id,
            email: userData.email,
            role: userData.role,
            status: userData.status,
            approvedAt: userData.approvedAt,
          });
        });

        setAvailableUsers(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
      } finally {
        setUsersLoading(false);
      }
    };

    fetchApprovedUsers();
  }, [open]);

  useEffect(() => {
    if (existingBranch) {
      setBranchManager(existingBranch.branch_manager);
      setLocation(existingBranch.location);
      setHarvestDayOfMonth(existingBranch.harvest_day_of_month.toString());
      setShare(existingBranch.share.toString());
      setLatitude(existingBranch.latitude?.toString() || "");
      setLongitude(existingBranch.longitude?.toString() || "");
      setAffiliates(existingBranch.affiliates || []);
    } else {
      setBranchManager("");
      setLocation("");
      setHarvestDayOfMonth("");
      setShare("");
      setLatitude("");
      setLongitude("");
      setAffiliates([]);
    }
    setShowMap(false);
  }, [existingBranch, open]);

  const handleLocationSelect = (coords: [number, number]) => {
    setLatitude(coords[0].toFixed(6));
    setLongitude(coords[1].toFixed(6));
  };

  const handleUseThisLocation = () => {
    if (latitude && longitude) {
      setShowMap(false);
      toast.success("Location selected!", {
        description: `Coordinates: ${latitude}, ${longitude}`,
      });
    }
  };

  const handleAddAffiliate = (email: string) => {
    if (!affiliates.includes(email)) {
      setAffiliates([...affiliates, email]);
    }
  };

  const handleRemoveAffiliate = (email: string) => {
    setAffiliates(affiliates.filter((affiliate) => affiliate !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const dayOfMonth = Number(harvestDayOfMonth);

      if (dayOfMonth < 1 || dayOfMonth > 31) {
        throw new Error("Day of month must be between 1 and 31");
      }

      // Prepare branch data
      const branchData = {
        branch_manager: branchManager,
        location,
        harvest_day_of_month: dayOfMonth,
        share: Number(share),
        totalUnits: 0,
        ...(latitude &&
          longitude && {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
          }),
        ...(affiliates.length > 0 && { affiliates }),
      };

      // Generate a unique ID for the new branch
      const branchId = `branch_${Date.now()}`;

      // Use the createBranch mutation from the hook
      await createBranch.mutateAsync({
        id: branchId,
        data: branchData,
      });

      // Reset form
      setBranchManager("");
      setLocation("");
      setHarvestDayOfMonth("");
      setShare("");
      setLatitude("");
      setLongitude("");
      setAffiliates([]);
      setShowMap(false);

      toast.success("Branch has been added successfully!", {
        style: {
          background: "#dcfce7",
          border: "1px solid #bbf7d0",
          color: "#166534",
        },
        description: `Manager: ${branchManager}, Location: ${location}, Harvest Day: ${dayOfMonth}, Share: ${share}%`,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save branch");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-white/90 to-white/80 dark:from-gray-800/90 dark:to-gray-700/80 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-600 w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 text-foreground drop-shadow-sm">
          {existingBranch ? "Edit Branch" : "Add New Branch"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">
              Branch Manager
            </label>
            <input
              type="text"
              value={branchManager}
              onChange={(e) => setBranchManager(e.target.value)}
              required
              className="mt-1 w-full border border-gray-300 rounded-lg p-2 bg-white shadow-inner dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 text-foreground transition-all"
              placeholder="Enter manager name"
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
              className="mt-1 w-full border border-gray-300 rounded-lg p-2 bg-white shadow-inner dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 text-foreground transition-all"
              placeholder="Enter branch location"
            />
          </div>

          {/* Affiliates Section */}
          <div className="border-t pt-4 mt-2">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-5 w-5 text-purple-500" />
              <label className="block text-sm font-medium text-foreground">
                Affiliates (Optional)
              </label>
            </div>

            {usersLoading ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Loading users...
                </p>
              </div>
            ) : (
              <>
                {/* Selected Affiliates */}
                {affiliates.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-foreground mb-2">
                      Selected Affiliates:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {affiliates.map((email) => (
                        <div
                          key={email}
                          className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full text-xs"
                        >
                          {email}
                          <button
                            type="button"
                            onClick={() => handleRemoveAffiliate(email)}
                            className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Users Dropdown */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-2">
                    Add Affiliate:
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddAffiliate(e.target.value);
                        e.target.value = ""; // Reset selection
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg p-2 bg-white shadow-inner dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-400 text-foreground transition-all text-sm"
                  >
                    <option value="">Select a user...</option>
                    {availableUsers
                      .filter((user) => !affiliates.includes(user.email))
                      .map((user) => (
                        <option key={user.id} value={user.email}>
                          {user.email} ({user.role})
                        </option>
                      ))}
                  </select>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Optional: Add approved users as affiliates to this branch
                </p>
              </>
            )}
          </div>

          {/* Geolocation Section */}
          <div className="border-t pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                <label className="block text-sm font-medium text-foreground">
                  Add a Geolocation!
                </label>
              </div>
              {!showMap && (
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Open Map
                </button>
              )}
            </div>

            {showMap ? (
              <div className="space-y-3">
                <CompactMap
                  onLocationSelect={handleLocationSelect}
                  initialCoords={
                    latitude && longitude
                      ? [parseFloat(latitude), parseFloat(longitude)]
                      : undefined
                  }
                  className="mb-2"
                />

                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Selected Coordinates
                    </p>
                    <p className="text-xs font-mono text-blue-600 dark:text-blue-300">
                      {latitude && longitude
                        ? `Lat: ${latitude}, Lng: ${longitude}`
                        : "Click on map to select location"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleUseThisLocation}
                    disabled={!latitude || !longitude}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Use This Location
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3">
                  Optional: Add coordinates to enable map view for this branch
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="mt-1 w-full border border-gray-300 rounded-lg p-2 bg-white shadow-inner dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 text-foreground transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="mt-1 w-full border border-gray-300 rounded-lg p-2 bg-white shadow-inner dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 text-foreground transition-all text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Or click &quot;Open Map&quot; to select location visually
                </p>
              </>
            )}
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
              className="mt-1 w-full border border-gray-300 rounded-lg p-2 bg-white shadow-inner dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 text-foreground transition-all"
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
              className="mt-1 w-full border border-gray-300 rounded-lg p-2 bg-white shadow-inner dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 text-foreground transition-all"
              placeholder="Enter share percentage"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-foreground hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || createBranch.isPending}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading || createBranch.isPending
                ? "Saving..."
                : existingBranch
                ? "Update"
                : "Add Branch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
