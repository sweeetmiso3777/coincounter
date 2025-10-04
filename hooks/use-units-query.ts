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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Unit {
  deviceId: string;
  branch: string;
  branchId: string;
  alias: string;
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

  // real-time subscription
  useEffect(() => {
    const q = query(collection(db, "Units"), orderBy("branch"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const unitsData: Unit[] = snapshot.docs.map((doc) => ({
          deviceId: doc.id,
          branch: doc.data().branch || "",
          branchId: doc.data().branchId || "",
          alias: doc.data().alias || "",
        }));

        setState({
          units: unitsData,
          loading: false,
          error: null,
          fromCache: snapshot.metadata.fromCache,
        });

        queryClient.setQueryData(["units"], unitsData);
      },
      (err) => {
        console.error("Units listener error:", err);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to fetch units.",
        }));
      }
    );

    return () => unsubscribe();
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
      queryClient.setQueryData<Unit[]>(["units"], (old) =>
        old?.map((u) =>
          u.deviceId === deviceId ? { ...u, branchId } : u
        )
      );
      toast.success("Unit assigned successfully!");
    },
    onError: () => {
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
      queryClient.setQueryData<Unit[]>(["units"], (old) =>
        old?.map((u) =>
          u.deviceId === deviceId ? { ...u, branchId: "" } : u
        )
      );
      toast.success("Unit decommissioned successfully!");
    },
    onError: () => {
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
