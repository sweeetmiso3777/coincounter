// components/Branch/partner-branch-card.tsx
"use client";

import { motion } from "framer-motion";
import type { BranchData } from "@/types/branch";
import {
  MapPin,
  User,
  TrendingUp,
  Calendar,
  DollarSign,
  Clock,
  Users,
} from "lucide-react";
import Link from "next/link";

interface PartnerBranchCardProps {
  branch: BranchData; // Use the original BranchData type with Date objects
}

// Simple color theme for partner cards
const partnerTheme = {
  primaryLight: "bg-red-50 dark:bg-red-950/30",
  primaryBorder: "border-red-50 dark:border-red-800",
  primaryHover: "hover:bg-red-100 dark:hover:red-900/40",
  icon: "text-red-500",
  accent: "text-red-600 dark:text-red-400",
};

export function PartnerBranchCard({ branch }: PartnerBranchCardProps) {
  const formatDate = (date: Date | null | undefined) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime()))
      return "Never";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const formatHarvestSchedule = (harvestDay: number) => {
    const now = new Date();
    let harvestDate = new Date(now.getFullYear(), now.getMonth(), harvestDay);
    if (harvestDay < now.getDate())
      harvestDate = new Date(now.getFullYear(), now.getMonth() + 1, harvestDay);
    if (harvestDate.getDate() !== harvestDay)
      harvestDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
    }).format(harvestDate);
  };

  const harvestInfo = formatHarvestSchedule(branch.harvest_day_of_month);

  return (
    <motion.div
      className="relative group"
      whileHover={{ scale: 1.02, y: -2 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Main Card Container */}
      <div
        className={`bg-card rounded-lg border ${partnerTheme.primaryBorder} shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden w-full`}
      >
        <div className="flex flex-col h-full p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <MapPin className={`h-5 w-5 ${partnerTheme.icon}`} />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {branch.location}
                </h3>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <User className={`h-4 w-4 ${partnerTheme.icon}`} />
                <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {branch.branch_manager}
                </span>
              </div>
            </div>
          </div>

          {/* Share Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-4 w-4 ${partnerTheme.icon}`} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Your Share:
              </span>
            </div>
            <span
              className={`inline-flex items-center rounded-full ${partnerTheme.primaryLight} px-2.5 py-0.5 text-xs font-semibold ${partnerTheme.accent}`}
            >
              {branch.share}%
            </span>
          </div>

          {/* Body Content */}
          <div className="space-y-3 flex-1">
            {/* Last Harvest Date */}
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-2">
                <DollarSign className={`h-4 w-4 ${partnerTheme.icon}`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Last Harvest:
                </span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {formatDate(branch.last_harvest_date)}
              </span>
            </div>

            {/* Next Harvest */}
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-2">
                <Calendar className={`h-4 w-4 ${partnerTheme.icon}`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Next Harvest:
                </span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {harvestInfo}
              </span>
            </div>

            {/* Total Units */}
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-2">
                <Users className={`h-4 w-4 ${partnerTheme.icon}`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Units:
                </span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {branch.totalUnits || 0}
              </span>
            </div>
          </div>

          {/* Footer - View Details */}
          <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
            <Link
              href={`/partner/${branch.id}`}
              className="flex items-center justify-between group"
            >
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                View Details
              </span>
              <motion.div
                animate={{ x: [0, 2, 0] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1 }}
              >
                <Clock className={`h-4 w-4 ${partnerTheme.icon}`} />
              </motion.div>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
