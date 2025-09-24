"use client";

import { motion } from "framer-motion";
import type { BranchData } from "@/types/branch";
import {
  CalendarDays,
  User,
  TrendingUp,
  Calendar,
  Monitor,
  ChevronRight,
} from "lucide-react";
import { CardMenu } from "./card-menu";
import Link from "next/link";

interface BranchCardProps {
  branch: BranchData;
  totalUnits: number;
}

export function BranchCard({ branch, totalUnits }: BranchCardProps) {
  // ---------- Date Helpers ----------
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);

  const getOrdinalSuffix = (day: number) => {
    if (day >= 11 && day <= 13) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const getNextHarvestDate = (harvestDay: number) => {
    const now = new Date();
    let harvestDate = new Date(now.getFullYear(), now.getMonth(), harvestDay);
    if (harvestDay < now.getDate())
      harvestDate = new Date(now.getFullYear(), now.getMonth() + 1, harvestDay);
    if (harvestDate.getDate() !== harvestDay)
      harvestDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return harvestDate;
  };

  const formatHarvestSchedule = (harvestDay: number) => {
    const nextHarvest = getNextHarvestDate(harvestDay);
    const ordinal = getOrdinalSuffix(harvestDay);
    return {
      schedule: `${harvestDay}${ordinal} day of every month`,
      nextDate: new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(nextHarvest),
      shortDate: new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
      }).format(nextHarvest),
      isThisMonth: nextHarvest.getMonth() === new Date().getMonth(),
      daysUntil: Math.ceil(
        (nextHarvest.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
    };
  };

  const harvestInfo = formatHarvestSchedule(branch.harvest_day_of_month);

  // ---------- JSX ----------
  return (
    <motion.div
      className="bg-card rounded-lg border border-border shadow-sm cursor-pointer"
      whileHover={{ scale: 1.02, boxShadow: "0 8px 20px rgba(0,0,0,0.12)" }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-6 h-full flex flex-col min-h-[280px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-foreground truncate mb-1">
              {branch.location}
            </h3>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground truncate">
                {branch.branch_manager}
              </span>
            </div>
          </div>
          <CardMenu branchId={branch.id} branchData={branch} />
        </div>

        {/* Body */}
        <div className="flex-1 space-y-3 mt-4">
          {/* Share */}
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-sm font-medium text-foreground">Share:</span>
            <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/20 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:text-green-400">
              {branch.share}%
            </span>
          </div>

          {/* Info rows */}
          <div className="space-y-3 pt-2 border-t border-border">
            {/* Total Units */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-purple-500 flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">
                  Total Units:
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {totalUnits}
              </span>
            </div>

            {/* Created */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">
                  Created:
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatDate(branch.created_at)}
              </span>
            </div>

            {/* Harvest */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">
                  Harvest:
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {harvestInfo.shortDate}
              </span>
            </div>

            {/* Next */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">
                  Next:
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium ${
                    harvestInfo.isThisMonth
                      ? "text-green-600 dark:text-green-400"
                      : "text-blue-600 dark:text-blue-400"
                  }`}
                >
                  {harvestInfo.nextDate}
                </span>
                {harvestInfo.daysUntil <= 7 && harvestInfo.daysUntil > 0 && (
                  <span className="text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400 px-1.5 py-0.5 rounded">
                    {harvestInfo.daysUntil}d
                  </span>
                )}
                {harvestInfo.daysUntil === 0 && (
                  <span className="text-xs bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 px-1.5 py-0.5 rounded">
                    Today!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Branch ID row */}
          <motion.div
            className="pt-2 pb-2 border-t border-border flex justify-between items-center px-3 rounded group"
            whileHover={{ scale: 1.03 }}
          >
            <span className="text-xs font-mono text-muted-foreground">
              {branch.id}
            </span>
            <Link
              href={`/branches/${branch.id}`}
              prefetch={true}
              className="text-xs text-blue-500 flex items-center"
            >
              <motion.div
                animate={{ x: [0, 2, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <ChevronRight />
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
