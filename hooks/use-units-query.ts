"use client";

import { useState, useEffect } from "react";
import { collection, doc, onSnapshot, query, orderBy, updateDoc, deleteField } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Branch {
  id: string;
  branch_manager: string;
  created_at: Date;
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
  branchLocation: string;
}

export interface UnitsState {
  units: Unit[];
  loading: boolean;
  error: string | null;
  fromCache: boolean;
}

const listenerRefCount = { count: 0 };
let activeListener: (() => void) | null = null;

export function useUnits() {
  const queryClient = useQueryClient();
  
  // Get initial state from React Query cache if available
  const cachedUnits = queryClient.getQueryData<Unit[]>(["units"]);
  const [state, setState] = useState<UnitsState>({
    units: cachedUnits || [],
    loading: !cachedUnits,
    error: null,
    fromCache: !!cachedUnits,
  });

  // Sync local state with React Query cache
  useEffect(() => {
    // Subscribe to React Query cache changes
    const unsubscribe = queryClient.getQueryCache().subscribe((cacheEvent) => {
      if (cacheEvent?.query.queryKey[0] === "units") {
        const currentData = queryClient.getQueryData<Unit[]>(["units"]);
        if (currentData) {
          setState(prev => ({
            ...prev,
            units: currentData,
            fromCache: true, // Mark as from cache when updated by mutations
          }));
        }
      }
    });

    return unsubscribe;
  }, [queryClient]);

  useEffect(() => {
    listenerRefCount.count++;
    console.log(`[useUnits] Ref count: ${listenerRefCount.count}`);

    if (listenerRefCount.count === 1) {
      console.log(`[useUnits] Setting up SINGLE listener (first component)`);

      const unitsQuery = query(collection(db, "Units"), orderBy("branch"));

      const unsubscribeUnits = onSnapshot(
        unitsQuery,
        (unitsSnapshot) => {
          const unitsData: Unit[] = unitsSnapshot.docs.map((doc) => {
            const unitData = doc.data();
            return {
              deviceId: doc.id,
              branch: unitData.branch || "",
              branchId: unitData.branchId || "",
              alias: unitData.alias || "",
              branchLocation: "", // Will be populated by components using useBranches()
            };
          });

          setState({
            units: unitsData,
            loading: false,
            error: null,
            fromCache: unitsSnapshot.metadata.fromCache,
          });

          queryClient.setQueryData(["units"], unitsData);
        },
        (unitsErr) => {
          console.error("Units listener error:", unitsErr);
          setState((prev) => ({
            ...prev,
            loading: false,
            error: "Failed to fetch units.",
          }));
        },
      );

      activeListener = unsubscribeUnits;
    } else {
      // For subsequent components, use the current cache
      const currentCache = queryClient.getQueryData<Unit[]>(["units"]);
      if (currentCache) {
        setState({
          units: currentCache,
          loading: false,
          error: null,
          fromCache: true,
        });
      }
    }

    return () => {
      listenerRefCount.count--;
      console.log(`[useUnits] Ref count: ${listenerRefCount.count} (after unmount)`);

      if (listenerRefCount.count === 0 && activeListener) {
        console.log(`[useUnits] Cleaning up listener (last component unmounted)`);
        activeListener();
        activeListener = null;
      }
    };
  }, [queryClient]);

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
      await updateDoc(ref, { branchId });
    },
    onSuccess: (_data, { deviceId, branchId }) => {
      toast.success("Unit assigned successfully!");
    },
    onMutate: async ({ deviceId, branchId }) => {
      await queryClient.cancelQueries({ queryKey: ["units"] });
      const prev = queryClient.getQueryData<Unit[]>(["units"]) || [];

      queryClient.setQueryData<Unit[]>(["units"], (old) =>
        old?.map((u) => (u.deviceId === deviceId ? { ...u, branchId, branchLocation: "" } : u)),
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
      toast.success("Unit decommissioned successfully!");
    },
    onMutate: async ({ deviceId }) => {
      await queryClient.cancelQueries({ queryKey: ["units"] });
      const prev = queryClient.getQueryData<Unit[]>(["units"]) || [];

      queryClient.setQueryData<Unit[]>(["units"], (old) =>
        old?.map((u) => (u.deviceId === deviceId ? { ...u, branchId: "", branchLocation: "" } : u)),
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
    // Check if alias already exists (case-insensitive)
    const currentUnits = queryClient.getQueryData<Unit[]>(["units"]) || [];
    const existingUnit = currentUnits.find(
      (unit) => 
        unit.deviceId !== deviceId && 
        unit.alias?.toLowerCase() === alias.toLowerCase().trim()
    );
    
    if (existingUnit) {
      throw new Error(`Alias "${alias}" is already in use by another unit.`);
    }

    const ref = doc(db, "Units", deviceId);
    await updateDoc(ref, { alias: alias.trim() });
  },
  onSuccess: (_data, { deviceId, alias }) => {
    toast.success("Alias updated successfully!");
  },
  onMutate: async ({ deviceId, alias }) => {
    await queryClient.cancelQueries({ queryKey: ["units"] });
    const prev = queryClient.getQueryData<Unit[]>(["units"]) || [];

    // Also validate in onMutate for immediate feedback
    const existingUnit = prev.find(
      (unit) => 
        unit.deviceId !== deviceId && 
        unit.alias?.toLowerCase() === alias.toLowerCase().trim()
    );
    
    if (existingUnit) {
      throw new Error(`Alias "${alias}" is already in use by another unit.`);
    }

    queryClient.setQueryData<Unit[]>(["units"], (old) =>
      old?.map((u) => (u.deviceId === deviceId ? { ...u, alias: alias.trim() } : u)),
    );
    return { prev };
  },
  onError: (err, _vars, ctx) => {
    if (ctx?.prev) queryClient.setQueryData(["units"], ctx.prev);
    
    if (err instanceof Error) {
      toast.error(err.message);
    } else {
      toast.error("Failed to update alias.");
    }
  },
});

  return {
    ...state,
    assignUnit,
    decommissionUnit,
    updateAlias,
  };
}