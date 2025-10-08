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
  SquareArrowOutUpRight,
  MapPin,
} from "lucide-react";
import { CardMenu } from "./card-menu";
import Link from "next/link";
import { useState } from "react";
import EditBranchModal from "./EditBranchModal";
import { MapModal } from "./MapModal";

interface BranchCardProps {
  branch: BranchData;
  totalUnits: number;
}

export function BranchCard({ branch }: BranchCardProps) {
  const [editing, setEditing] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  const formatDate = (date: Date | null | undefined) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime()))
      return "Invalid date";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

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

  return (
    <>
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden w-full"
        whileHover={{ scale: 1.02 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        <div className="flex flex-col h-full p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <button
                onClick={() => setShowMapModal(true)}
                className="flex items-center gap-2 text-left w-full group"
              >
                <MapPin className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">
                  {branch.location}
                </h3>
              </button>
              <div className="flex items-center gap-2 mt-1">
                <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {branch.branch_manager}
                </span>
              </div>
            </div>
            <CardMenu
              branchId={branch.id}
              branchData={branch}
              onEdit={() => setEditing(true)}
            />
          </div>

          {/* Share Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Share:
              </span>
            </div>
            <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:text-green-400">
              {branch.share}%
            </span>
          </div>

          {/* Body Content */}
          <div className="space-y-3 flex-1">
            <Link
              href="/units"
              className="block rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-purple-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    See Units
                  </span>
                </div>
                <SquareArrowOutUpRight className="h-4 w-4 text-gray-400" />
              </div>
            </Link>

            {/* Created Date */}
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Created:
                </span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {formatDate(branch.created_at)}
              </span>
            </div>

            {/* Harvest Info */}
            <Link
              href={`/harvest`}
              className="block p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Harvest:
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {harvestInfo.shortDate}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                    <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 px-1.5 py-0.5 rounded">
                      {harvestInfo.daysUntil}d
                    </span>
                  )}
                  {harvestInfo.daysUntil === 0 && (
                    <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 px-1.5 py-0.5 rounded">
                      Today!
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </div>

          {/* Footer - Branch ID */}
          <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
            <Link
              href={`/branches/${branch.id}`}
              prefetch={true}
              className="flex items-center justify-between group"
            >
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate">
                ID: {branch.id}
              </span>
              <motion.div
                animate={{ x: [0, 2, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      {showMapModal && (
        <MapModal
          open={showMapModal}
          onClose={() => setShowMapModal(false)}
          branch={branch}
        />
      )}

      {editing && (
        <EditBranchModal
          open={editing}
          onClose={() => setEditing(false)}
          existingBranch={{
            ...branch,
            latitude: branch.latitude !== null ? branch.latitude : undefined,
            longitude: branch.longitude !== null ? branch.longitude : undefined,
          }}
        />
      )}
    </>
  );
}
