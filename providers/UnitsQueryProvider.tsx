"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import { Unit, useUnits } from "@/hooks/use-units-query";
import {
  useUnitsAggregates,
  UnitWithAggregates,
} from "@/hooks/use-unit-aggregates";

interface UnitsContextValue {
  units: Unit[];
  loading: boolean;
  error: string | null;
  fromCache: boolean; // <-- exposed now
  getAggregates: (deviceId: string) => Promise<UnitWithAggregates>;
}

const UnitsContext = createContext<UnitsContextValue | undefined>(undefined);

export function UnitsQueryProvider({ children }: { children: ReactNode }) {
  const { units, loading, error, fromCache } = useUnits(); // <-- fromCache added
  const { fetchAggregates } = useUnitsAggregates();

  const getAggregates = useCallback(
    async (deviceId: string): Promise<UnitWithAggregates> => {
      const unit = units.find((u) => u.deviceId === deviceId);
      if (!unit) {
        throw new Error(`Unit with deviceId "${deviceId}" not found`);
      }

      const aggregates = await fetchAggregates(deviceId);
      return {
        ...unit,
        aggregates,
      };
    },
    [units, fetchAggregates]
  );

  const value: UnitsContextValue = {
    units,
    loading,
    error,
    fromCache, // <-- included here
    getAggregates,
  };

  return (
    <UnitsContext.Provider value={value}>{children}</UnitsContext.Provider>
  );
}

export function useUnitsContext() {
  const context = useContext(UnitsContext);
  if (!context) {
    throw new Error("useUnitsContext must be used within a UnitsQueryProvider");
  }
  return context;
}
