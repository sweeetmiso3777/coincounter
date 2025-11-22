"use client";

import Calendar from "@/components/Dashboard/calendar";
import { Charts } from "@/components/Dashboard/Charts";
import UpcomingHarvests from "@/components/Dashboard/harvest";
import { RealTimeDashboard } from "@/components/Dashboard/real-time";
import { OnlineDevicesDashboard } from "@/components/Dashboard/units";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BranchRanking } from "@/components/Dashboard/branch-ranking";

export default function DashboardLayout() {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 text-foreground relative">
      {/* Floating Navigation Notch */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50">
        <button
          onClick={() => setCurrentPage((prev) => (prev === 1 ? 2 : 1))}
          className="bg-card border-y border-l border-border shadow-sm rounded-l-lg py-6 pl-0.5 pr-0 hover:bg-accent/50 transition-all duration-300 group"
          title={currentPage === 1 ? "Next Page" : "Previous Page"}
        >
          {currentPage === 1 ? (
            <ChevronRight className="w-4 h-4 text-muted-foreground/70 group-hover:text-foreground" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-muted-foreground/70 group-hover:text-foreground" />
          )}
        </button>
      </div>

      {currentPage === 1 ? (
        /* Main Grid Section - Responsive */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Big Line Chart - Full width on mobile, 3/4 on desktop */}
          <div className="col-span-1 lg:col-span-3 bg-card rounded-2xl p-4 h-48 block items-center justify-center border">
            <div className="flex-shrink-0 ml-2">
              <span className="text-sm font-medium text-foreground">
                Todays Sale Growth
              </span>
            </div>
            <Charts />
          </div>

          {/* Real Time Page - Full width on mobile, 1/4 on desktop */}
          <div className="bg-card rounded-2xl border p-4 flex flex-col h-48">
            <div className="flex-shrink-0 mb-2">
              <span className="text-sm font-medium text-foreground">
                Real Time Sales
              </span>
            </div>
            <div className="flex-1 min-h-0 z-0">
              <RealTimeDashboard />
            </div>
            <Link
              href="/real-time"
              className="text-xs text-blue-600 hover:text-blue-700 hover:underline transition-colors text-center"
            >
              Go to Real-Time Page →
            </Link>
          </div>

          {/* Calendar - Full width on mobile, 2/4 on desktop */}
          <div className="col-span-1 lg:col-span-2 bg-card rounded-2xl p-1 border flex flex-col">
            <Calendar />
          </div>

          {/* Small boxes container - Full width on mobile, stacked on desktop */}
          <div className="col-span-1 lg:col-span-1 bg-card rounded-2xl p-4 flex flex-col gap-3 border">
            <UpcomingHarvests />
          </div>

          {/* Bottom row - Stack on mobile, grid on desktop */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-card rounded-2xl border p-4 flex flex-col h-80 md:h-100">
            <div className="flex-shrink-0 mb-2">
              <span className="text-sm font-medium text-foreground">
                Online Devices
              </span>
            </div>
            <div className="flex-1 min-h-0 z-0">
              <OnlineDevicesDashboard />
            </div>
            <Link
              href="/units"
              className="text-xs text-blue-600 hover:text-blue-700 hover:underline transition-colors text-center"
            >
              View all devices →
            </Link>
          </div>
        </div>
      ) : (
        /* Page 2 - Branch Ranking */
        <div className="h-full">
          <BranchRanking />
        </div>
      )}

      {/* Bottom Full-Width Section */}
    </div>
  );
}
