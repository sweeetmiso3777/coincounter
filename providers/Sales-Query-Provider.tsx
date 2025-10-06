"use client";

import { useState, useEffect, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a single QueryClient instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes in-memory cache
      refetchOnWindowFocus: false,
      retry: 2,
    },
    mutations: {
      retry: 1,
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Only render on client to avoid SSR issues
    setIsClient(true);
  }, []);

  if (!isClient) return <>{children}</>;

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && <LazyReactQueryDevtools />}
    </QueryClientProvider>
  );
}

// Lazy-load React Query Devtools in development only
const LazyReactQueryDevtools = () => {
  const [DevTools, setDevTools] = useState<React.ComponentType<{
    initialIsOpen?: boolean;
  }> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    import("@tanstack/react-query-devtools").then((module) => {
      setDevTools(() => module.ReactQueryDevtools);
    });
  }, []);

  if (!DevTools) return null;

  return <DevTools initialIsOpen={false} />;
};
