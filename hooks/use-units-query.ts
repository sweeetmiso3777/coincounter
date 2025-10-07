"use client";

import { useState, useEffect } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  deleteField,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Branch {
  id: string;
  branch_manager: string;
  created_at: any;
  harvest_day_of_month: number;
  location: string;
  share: number;
  totalUnits: number;
}

export interface Unit {
  deviceId: string;
  branch: string;
  branchId: string;
  alias: string;
  branchLocation: string; // 👈 ADD THIS - location is now directly on unit
}

export interface UnitsState {
  units: Unit[];
  loading: boolean;
  error: string | null;
  fromCache: boolean;
}

export function useUnits() {
  const [state, setState] = useState<UnitsState>({
    units: [],
    loading: true,
    error: null,
    fromCache: false,
  });

  const queryClient = useQueryClient();

  // real-time subscription for Units and Branches
  useEffect(() => {
    const unitsQuery = query(collection(db, "Units"), orderBy("branch"));
    const branchesQuery = query(collection(db, "Branches")); // Capital B

    let unsubscribeUnits: () => void;
    let unsubscribeBranches: () => void;

    const setupListeners = () => {
      unsubscribeUnits = onSnapshot(
        unitsQuery,
        (unitsSnapshot) => {
          unsubscribeBranches = onSnapshot(
            branchesQuery,
            (branchesSnapshot) => {
              const branchesMap = new Map();
              branchesSnapshot.docs.forEach((doc) => {
                const data = doc.data();
                branchesMap.set(doc.id, {
                  id: doc.id,
                  location: data.location,
                  branch_manager: data.branch_manager,
                  created_at: data.created_at,
                  harvest_day_of_month: data.harvest_day_of_month,
                  share: data.share,
                  totalUnits: data.totalUnits,
                } as Branch);
              });

              const unitsData: Unit[] = unitsSnapshot.docs.map((doc) => {
                const unitData = doc.data();
                const branchId = unitData.branchId || "";
                const branchData = branchesMap.get(branchId);

                return {
                  deviceId: doc.id,
                  branch: unitData.branch || "",
                  branchId: branchId,
                  alias: unitData.alias || "",
                  branchLocation: branchData?.location || "", // 👈 ADD THIS
                };
              });

              setState({
                units: unitsData,
                loading: false,
                error: null,
                fromCache: unitsSnapshot.metadata.fromCache || branchesSnapshot.metadata.fromCache,
              });

              queryClient.setQueryData(["units"], unitsData);
            },
            (branchesErr) => {
              console.error("Branches listener error:", branchesErr);
              // Even if branches fail, still return units without branch location
              const unitsData: Unit[] = unitsSnapshot.docs.map((doc) => {
                const unitData = doc.data();
                return {
                  deviceId: doc.id,
                  branch: unitData.branch || "",
                  branchId: unitData.branchId || "",
                  alias: unitData.alias || "",
                  branchLocation: "", // 👈 EMPTY IF BRANCHES FAIL
                };
              });

              setState({
                units: unitsData,
                loading: false,
                error: "Failed to fetch branch details, but units loaded.",
                fromCache: unitsSnapshot.metadata.fromCache,
              });

              queryClient.setQueryData(["units"], unitsData);
            }
          );
        },
        (unitsErr) => {
          console.error("Units listener error:", unitsErr);
          setState((prev) => ({
            ...prev,
            loading: false,
            error: "Failed to fetch units.",
          }));
        }
      );
    };

    setupListeners();

    return () => {
      unsubscribeUnits?.();
      unsubscribeBranches?.();
    };
  }, [queryClient]);

  // Helper to get branch location
  const getBranchLocation = async (branchId: string): Promise<string> => {
    if (!branchId) return "";
    try {
      const branchDoc = await getDoc(doc(db, "Branches", branchId));
      if (branchDoc.exists()) {
        return branchDoc.data().location || "";
      }
      return "";
    } catch (error) {
      console.error("Error fetching branch location:", error);
      return "";
    }
  };

  // mutation for assigning branch
  const assignUnit = useMutation({
    mutationFn: async ({
      deviceId,
      branchId,
    }: {
      deviceId: string;
      branchId: string;
    }) => {
      const ref = doc(db, "Units", deviceId);
      const branchLocation = await getBranchLocation(branchId);
      await updateDoc(ref, { branchId });
      return { branchLocation }; // 👈 RETURN LOCATION FOR OPTIMISTIC UPDATE
    },
    onSuccess: (_data, { deviceId, branchId }) => {
      // The real-time listener will update this automatically
    },
    onMutate: async ({ deviceId, branchId }) => {
      await queryClient.cancelQueries({ queryKey: ["units"] });
      const prev = queryClient.getQueryData<Unit[]>(["units"]) || [];
      
      // Optimistically update with branch location
      const branchLocation = await getBranchLocation(branchId);
      
      queryClient.setQueryData<Unit[]>(["units"], (old) =>
        old?.map((u) =>
          u.deviceId === deviceId 
            ? { ...u, branchId, branchLocation } 
            : u
        )
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["units"], ctx.prev);
      toast.error("Failed to assign unit.");
    },
  });

  // mutation for decommissioning branch (removing branchId)
  const decommissionUnit = useMutation({
    mutationFn: async ({ deviceId }: { deviceId: string }) => {
      const ref = doc(db, "Units", deviceId);
      await updateDoc(ref, { branchId: deleteField() });
    },
    onSuccess: (_data, { deviceId }) => {
      // Real-time listener will handle this
    },
    onMutate: async ({ deviceId }) => {
      await queryClient.cancelQueries({ queryKey: ["units"] });
      const prev = queryClient.getQueryData<Unit[]>(["units"]) || [];
      
      queryClient.setQueryData<Unit[]>(["units"], (old) =>
        old?.map((u) =>
          u.deviceId === deviceId 
            ? { ...u, branchId: "", branchLocation: "" } 
            : u
        )
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["units"], ctx.prev);
      toast.error("Failed to decommission unit.");
    },
  });

  // mutation for updating alias
  const updateAlias = useMutation({
    mutationFn: async ({ deviceId, alias }: { deviceId: string; alias: string }) => {
      const ref = doc(db, "Units", deviceId);
      await updateDoc(ref, { alias });
    },
    onSuccess: (_data, { deviceId, alias }) => {
      queryClient.setQueryData<Unit[]>(["units"], (old) =>
        old?.map((u) =>
          u.deviceId === deviceId ? { ...u, alias } : u
        )
      );
      toast.success("Alias updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update alias.");
    },
  });

  return {
    ...state,
    assignUnit,
    decommissionUnit,
    updateAlias, 
  };
}