// ProtectedLayout.tsx
"use client";

import type React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { BranchesQueryProvider } from "@/providers/BranchesQueryProvider";
import { UserProvider, useUser } from "@/providers/UserProvider";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, isApproved } = useUser();

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/"); // not logged in
      else if (!isApproved) router.push("/sorry"); // pending/rejected
    }
  }, [user, isApproved, loading, router]);

  if (loading || !user || !isApproved) return null;

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-background">{children}</main>
    </>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <BranchesQueryProvider>
        <LayoutContent>{children}</LayoutContent>
      </BranchesQueryProvider>
    </UserProvider>
  );
}
