"use client";

import { Charts } from "@/components/Dashboard/Charts";
import { RealTimeDashboard } from "@/components/Dashboard/real-time";
import { OnlineDevicesDashboard } from "@/components/Dashboard/units";
import Link from "next/link";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 text-foreground">
      {/* Main Grid Section - Responsive */}
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
        <div className="col-span-1 lg:col-span-2 bg-card rounded-2xl p-4 h-64 md:h-80 flex items-center justify-center border">
          <span className="text-sm md:text-base">Calendar</span>
        </div>

        {/* Small boxes container - Full width on mobile, stacked on desktop */}
        <div className="col-span-1 lg:col-span-1 bg-card rounded-2xl p-4 flex flex-col gap-3 border">
          <div className="bg-muted/50 rounded-xl p-4 text-center flex-1 flex items-center justify-center">
            <span className="text-sm">Upcoming harvest</span>
          </div>
          <div className="bg-muted/50 rounded-xl p-4 text-center flex-1 flex items-center justify-center">
            <span className="text-sm">Recent harvested</span>
          </div>
        </div>

        {/* Bottom row - Stack on mobile, grid on desktop */}
        <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-card rounded-2xl border p-4 flex flex-col h-64 md:h-80">
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
        <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-card rounded-2xl p-4 flex items-center justify-center border">
          <span className="text-sm md:text-base">Logs and notifications</span>
        </div>
        <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-card rounded-2xl p-4 flex items-center justify-center border">
          <span className="text-sm md:text-base text-center px-2">
            Overall system summary / activity feed / analytics log
          </span>
        </div>
        <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-card rounded-2xl p-4 flex items-center justify-center border">
          <span className="text-sm md:text-base">New device</span>
        </div>
      </div>

      {/* Bottom Full-Width Section */}
    </div>
  );
}
