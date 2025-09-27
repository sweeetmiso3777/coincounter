"use client";

import { useState, useEffect, ReactNode } from "react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

const localStorageAsync = {
  getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key: string, value: string) =>
    Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
};

const asyncStoragePersister = createAsyncStoragePersister({
  storage: localStorageAsync,
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // cache never considered stale
      gcTime: 1000 * 60 * 60 * 24 * 30, // garbage collect after 30 days
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // make sure localStorage is available on client
    setIsReady(true);
  }, []);

  if (!isReady) return null;

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
