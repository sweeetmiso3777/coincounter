"use client";

import React, { useEffect, useRef, useState } from "react";
import { Virtuoso } from "react-virtuoso";
import { useBranches } from "@/hooks/use-branches-query";
import { Calendar1, HandCoins, User } from "lucide-react";
import FullCalendarComponent from "@/components/FullCalendarComponent";

export default function CalendarWithSidebarPage() {
  const { data: branches = [], isLoading, error } = useBranches();
  const [selectedBranch, setSelectedBranch] = useState<string>("all");

  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const [calendarHeight, setCalendarHeight] = useState<number>(600);

  useEffect(() => {
    const updateHeight = () => {
      if (calendarContainerRef.current) {
        const availableHeight = window.innerHeight - 200;
        setCalendarHeight(Math.min(availableHeight, 800));
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const colors: string[] = [
    "#f87171",
    "#34d399",
    "#60a5fa",
    "#fbbf24",
    "#a78bfa",
    "#f472b6",
    "#22d3ee",
  ];

  interface BranchWithHarvest {
    id: string;
    branch_manager: string;
    location: string;
    harvest_day_of_month: number;
    share: number;
    totalUnits: number;
    color: string;
  }

  const branchesWithHarvests: BranchWithHarvest[] = branches.map(
    (b, index) => ({
      ...b,
      color: colors[index % colors.length],
    })
  );

  // Generate events for previous 2, current, next 3 years
  const events = branchesWithHarvests
    .filter((b) => selectedBranch === "all" || b.id === selectedBranch)
    .flatMap((branch) => {
      const now = new Date();
      const startYear = now.getFullYear() - 2;
      const endYear = now.getFullYear() + 3;
      const branchEvents = [];

      for (let year = startYear; year <= endYear; year++) {
        for (let month = 0; month < 12; month++) {
          branchEvents.push({
            location: branch.location,
            manager: branch.branch_manager,
            share: branch.share,
            start: new Date(year, month, branch.harvest_day_of_month),
            color: branch.color,
            allDay: true,
          });
        }
      }

      return branchEvents;
    });

  if (isLoading) return <p className="p-4">Loading branches…</p>;
  if (error) return <p className="p-4 text-red-500">Failed to load branches</p>;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-mono text-foreground">
            See Upcoming Harvests
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor all branch harvests and upcoming schedules
          </p>
        </div>

        <div className="flex gap-6 flex-col lg:flex-row min-h-0 bg-background">
          {/* Sidebar */}
          <div
            className="w-full lg:w-70 flex-shrink-0 lg:order-1 bg-background "
            style={{ height: `${calendarHeight}px`, minHeight: "400px" }}
          >
            <div className="bg-background rounded-lg shadow-sm border h-full flex flex-col">
              <div className="p-4 flex-shrink-0 bg-background">
                <h2 className="text-lg font-bold text-foreground">
                  Branch Harvests
                </h2>
              </div>
              <div className="flex-1 min-h-0 px-4 overflow-hidden">
                <Virtuoso
                  style={{ height: "100%" }}
                  data={branchesWithHarvests}
                  itemContent={(index, branch) => {
                    const {
                      id,
                      location,
                      branch_manager,
                      color,
                      harvest_day_of_month,
                      share,
                      totalUnits,
                    } = branch;
                    return (
                      <div
                        key={id}
                        className="border rounded-lg p-3 bg-card shadow-sm relative transform transition hover:scale-[1.01] mb-4"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <h3 className="font-semibold text-foreground text-sm">
                            {location}
                          </h3>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2 space-y-1">
                          <div className="flex items-center gap-1 bg-foreground/5 w-max px-1.5 py-0.5 rounded">
                            <User className="w-3 h-3" />
                            <span>{branch_manager}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar1 className="w-3 h-3" />
                            <span className="text-blue-600 font-medium">
                              Harvest Day: {harvest_day_of_month} every month
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <HandCoins className="w-3 h-3" />
                            <span className="text-green-600 font-medium">
                              Share: {share}% | Units: {totalUnits}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
              </div>
              <div className="p-4 border-t flex-shrink-0 bg-card rounded-b-lg shadow-sm cursor-pointer">
                <h3 className="font-medium text-foreground mb-2 text-sm cursor-pointer">
                  Filter by Branch
                </h3>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-background text-sm text-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm cursor-pointer"
                >
                  <option value="all">All Branches</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.location}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="flex-1" ref={calendarContainerRef}>
            <FullCalendarComponent events={events} height={calendarHeight} />
          </div>
        </div>
      </div>
    </div>
  );
}
