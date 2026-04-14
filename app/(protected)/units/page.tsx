"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UnitsPageCards } from "@/components/Unit/units-card";
import { UnitsPageCardsJira } from "@/components/Unit/units-card-jira";
import { ArrowLeft, Info, LayoutGrid, List } from "lucide-react";
import Link from "next/link";

// Note: metadata must stay in a separate server component (page.tsx).
// Move this client component to units-page-client.tsx and import it from page.tsx.

type ViewMode = "grid" | "list";

export default function UnitsPageClient() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  return (
    <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/branches">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Branches
            </Link>
          </Button>

          {/* Title row with view toggle */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-mono text-foreground">
                Device Management
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-muted-foreground font-mono text-sm">
                  Branch harvest only counts sales from assigned devices.
                </p>
                <div className="group relative">
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-md shadow-lg border w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                    When a Branch harvest happens, it scans all the units
                    assigned to it and only counts the daily sales documents
                    that contains its ID. Click the{" "}
                    <span className="text-blue-700 font-mono">View Details</span>{" "}
                    to know which daily sales are under which Branch.
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-popover" />
                  </div>
                </div>
              </div>
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-muted/40 self-start mt-1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  viewMode === "grid"
                    ? "bg-background text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Card view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Cards
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  viewMode === "list"
                    ? "bg-background text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="List view"
              >
                <List className="w-3.5 h-3.5" />
                List
              </button>
            </div>
          </div>
        </div>

        {/* View */}
        {viewMode === "grid" ? <UnitsPageCards /> : <UnitsPageCardsJira />}
      </div>
    </main>
  );
}

// cn helper — remove if you already import from @/lib/utils above
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}