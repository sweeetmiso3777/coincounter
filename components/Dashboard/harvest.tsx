"use client";

import React from "react";
import { useBranches } from "@/hooks/use-branches-query";
import { Calendar1, User, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function UpcomingHarvests() {
  const { data: branches = [], isLoading, error } = useBranches();

  // Calculate upcoming harvests (next 30 days)
  const upcomingHarvests = branches
    .map((branch) => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Create harvest date for current month
      let harvestDate = new Date(
        currentYear,
        currentMonth,
        branch.harvest_day_of_month
      );

      // If harvest day has passed this month, use next month
      if (harvestDate < now) {
        harvestDate = new Date(
          currentYear,
          currentMonth + 1,
          branch.harvest_day_of_month
        );
      }

      const daysUntil = Math.ceil(
        (harvestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        ...branch,
        nextHarvest: harvestDate,
        daysUntil,
        displayText:
          daysUntil === 0
            ? "Today"
            : daysUntil === 1
            ? "1d"
            : daysUntil <= 7
            ? `${daysUntil}d`
            : daysUntil <= 30
            ? `${Math.ceil(daysUntil / 7)}w`
            : null,
      };
    })
    .filter((branch) => branch.displayText && branch.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 3); // Exactly 3 cards

  
  // Calculate recent harvests (based on last_harvest_date)
  const recentHarvests = branches
    .filter((branch) => branch.last_harvest_date)
    .map((branch) => {
      const now = new Date();
      // Ensure we have a valid date object
      const harvestDate = new Date(branch.last_harvest_date!);

      const daysAgo = Math.floor(
        (now.getTime() - harvestDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        ...branch,
        lastHarvest: harvestDate,
        daysAgo,
        displayText:
          daysAgo === 0
            ? "Today"
            : daysAgo === 1
            ? "1d"
            : daysAgo <= 7
            ? `${daysAgo}d`
            : daysAgo <= 30
            ? `${Math.ceil(daysAgo / 7)}w`
            : `${Math.floor(daysAgo / 30)}mo`,
      };
    })
    .filter((branch) => branch.daysAgo >= 0) // Show all past harvests, or maybe limit to recent? 
    
    .sort((a, b) => a.daysAgo - b.daysAgo) // Ascending: 0 days ago (today) comes before 10 days ago
    .slice(0, 3); // Exactly 3 cards

  if (isLoading) {
    return (
      <div className="col-span-1 lg:col-span-1 bg-card rounded-2xl p-4 flex flex-col gap-3 border">
        <div className="bg-muted/50 rounded-lg p-3 text-center flex items-center justify-center h-16">
          <span className="text-sm">Loading...</span>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center flex items-center justify-center h-16">
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-1 lg:col-span-1 bg-card rounded-2xl p-4 flex flex-col gap-3 border">
        <div className="bg-muted/50 rounded-lg p-3 text-center flex items-center justify-center h-16">
          <span className="text-sm text-red-500">Error loading</span>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center flex items-center justify-center h-16">
          <span className="text-sm text-red-500">Error loading</span>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-1 lg:col-span-1 bg-card rounded-2xl p-4 flex flex-col gap-4 ">
      {/* Upcoming Harvests */}
      <div className="flex-1 flex flex-col">
        <h3 className="text-sm font-medium text-foreground mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Calendar1 className="w-3 h-3" />
            Upcoming Harvest
          </span>
          <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
            {upcomingHarvests.length}
          </span>
        </h3>
        <div className="space-y-1.5">
          {upcomingHarvests.map((branch) => (
            <Link
              key={`upcoming-${branch.id}`}
              href={`/branches/${branch.id}`}
              className="block bg-muted/30 rounded-lg p-2 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="font-medium text-foreground text-xs truncate flex-1">
                      {branch.location}
                    </div>
                    <div className="flex items-center gap-0.5 text-muted-foreground">
                      <User className="w-2.5 h-2.5" />
                      <span className="text-xs truncate max-w-16">
                        {branch.branch_manager}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-xs font-muted-foreground">in</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-xs font-medium min-w-8 text-center ${
                      branch.daysUntil === 0
                        ? "bg-green-100 text-green-800"
                        : branch.daysUntil <= 3
                        ? "bg-orange-100 text-orange-800"
                        : branch.daysUntil <= 7
                        ? "bg-blue-100 text-blue-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {branch.displayText}
                  </span>
                  <ArrowRight className="w-2.5 h-2.5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                </div>
              </div>
            </Link>
          ))}
          {upcomingHarvests.length === 0 && (
            <div className="bg-muted/30 rounded-lg p-3 text-center h-16 flex items-center justify-center">
              <div className="text-xs text-muted-foreground">
                No upcoming harvests
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Harvests */}
      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="text-sm font-medium text-foreground mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Calendar1 className="w-3 h-3" />
            Recently Harvested
          </span>
          <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
            {recentHarvests.length}
          </span>
        </h3>
        <div className="space-y-1.5">
          {recentHarvests.map((branch) => (
            <Link
              key={`recent-${branch.id}`}
              href={`/branch/${branch.id}`}
              className="block bg-muted/30 rounded-lg p-2 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="font-medium text-foreground text-xs truncate flex-1">
                      {branch.location}
                    </div>
                    <div className="flex items-center gap-0.5 text-muted-foreground">
                      <User className="w-2.5 h-2.5" />
                      <span className="text-xs truncate max-w-16">
                        {branch.branch_manager}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-xs font-medium min-w-8 text-center ${
                      branch.daysAgo === 0
                        ? "bg-green-100 text-green-800"
                        : branch.daysAgo <= 3
                        ? "bg-orange-100 text-orange-800"
                        : branch.daysAgo <= 7
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {branch.displayText}
                  </span>
                  <ArrowRight className="w-2.5 h-2.5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                </div>
              </div>
            </Link>
          ))}
          {recentHarvests.length === 0 && (
            <div className="bg-muted/30 rounded-lg p-3 text-center h-16 flex items-center justify-center">
              <div className="text-xs text-muted-foreground">
                No recent harvests
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
