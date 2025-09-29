"use client";

import { ReactNode, useState, useEffect } from "react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

// Async wrapper around localStorage for react-query persistence
const localStorageAsync = {
  getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key: string, value: string) =>
    Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
};

// Persister using localStorage
const asyncStoragePersister = createAsyncStoragePersister({
  storage: localStorageAsync,
});

// 3 days in ms
const THREE_DAYS = 1000 * 60 * 60 * 24 * 3;

// Shared QueryClient with 3-day cache
export const branchesQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: THREE_DAYS, // serve from cache for 3 days
      gcTime: THREE_DAYS, // garbage collect after 3 days
      refetchOnWindowFocus: false,
    },
  },
});

export function BranchesQueryProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    console.log(
      "%c[BranchesQueryProvider] Mounting provider...",
      "color: green; font-weight: bold;"
    );
    setReady(true);
  }, []);

  if (!ready) {
    console.log(
      "%c[BranchesQueryProvider] Skipping render until ready...",
      "color: gray;"
    );
    return null; // avoid hydration mismatch
  }

  return (
    <PersistQueryClientProvider
      client={branchesQueryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
