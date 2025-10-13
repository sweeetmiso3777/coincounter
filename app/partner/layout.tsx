// app/partner/layout.tsx
"use client";

import React from "react";
import { BranchesQueryProvider } from "@/providers/BranchesQueryProvider";
import Lightning from "@/components/Lightning";

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BranchesQueryProvider>
      <div className="min-h-screen flex items-center justify-center bg-background text-white font-sans p-6 overflow-auto">
        <main className="w-full max-w-4xl">{children}</main>
      </div>
    </BranchesQueryProvider>
  );
}
