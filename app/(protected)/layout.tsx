"use client";

import type React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { BranchesQueryProvider } from "@/providers/BranchesQueryProvider";
import { UserProvider, useUser } from "@/providers/UserProvider";
import { UnitsQueryProvider } from "@/providers/UnitsQueryProvider";
import { Providers } from "@/providers/Sales-Query-Provider";
import "leaflet/dist/leaflet.css";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, isApproved } = useUser();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/"); // not logged in
      } else if (!isApproved) {
        router.push("/sorry"); // pending/rejected
      } else if (user.role === "partner") {
        router.push("/partner"); // approved partner
      }
    }
  }, [user, isApproved, loading, router]);

  if (loading || !user || !isApproved || user.role === "partner") return null;

  return (
    <div className="h-screen flex flex-col [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <Nav />
      <main className="flex-1 bg-background overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {children}
      </main>
    </div>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <Providers>
        <BranchesQueryProvider>
          <UnitsQueryProvider>
            <LayoutContent>{children}</LayoutContent>
          </UnitsQueryProvider>
        </BranchesQueryProvider>
      </Providers>
    </UserProvider>
  );
}
