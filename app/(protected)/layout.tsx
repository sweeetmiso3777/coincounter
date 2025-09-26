"use client";

import type React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { Providers } from "@/components/real-time/Sales-Query-Provider";
import { useUsers } from "@/hooks/use-users";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, isApproved } = useUsers();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/"); // not logged in → redirect to login
      } else if (!isApproved) {
        router.push("/sorry"); // logged in but pending → redirect
      }
    }
  }, [user, isApproved, loading, router]);

  if (loading || !user || !isApproved) {
    return null; // show nothing while redirecting
  }

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-background">
        <Providers>{children}</Providers>
      </main>
    </>
  );
}
