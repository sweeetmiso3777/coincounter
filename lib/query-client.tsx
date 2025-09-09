"use client";

import type React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            retry: 3,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && <LazyReactQueryDevtools />}
    </QueryClientProvider>
  );
}

const LazyReactQueryDevtools = () => {
  const [DevTools, setDevTools] = useState<React.ComponentType<any> | null>(
    null
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    import("@tanstack/react-query-devtools").then((module) => {
      setDevTools(() => module.ReactQueryDevtools);
    });
  }, []);

  if (!DevTools) return null;

  return <DevTools initialIsOpen={false} />;
};
