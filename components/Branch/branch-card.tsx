// components/Branch/branch-card.tsx
"use client";

import type React from "react";

import { motion } from "framer-motion";
import type { BranchData } from "@/types/branch";
import {
  CalendarDays,
  User,
  TrendingUp,
  Calendar,
  Monitor,
  ChevronRight,
  MapPin,
  Users,
  DollarSign,
  AlertTriangle,
  Clock,
  FileText,
} from "lucide-react";
import { CardMenu } from "./card-menu";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import EditBranchModal from "./EditBranchModal";
import { MapModal } from "./MapModal";
import {
  useBranchHarvest,
  type HarvestResult,
  type BranchInfo,
} from "@/hooks/use-branch-harvest";
import { toast } from "sonner";
import { SuccessModalContent } from "./success-modal-content";

interface BranchCardProps {
  branch: BranchData;
  totalUnits: number;
  onSelect?: () => void;
}

// Color themes for different cards
const cardThemes = [
  {
    primary: "blue",
    primaryLight: "bg-blue-50 dark:bg-blue-950/30",
    primaryBorder: "border-blue-200 dark:border-blue-800",
    primaryHover: "hover:bg-blue-100 dark:hover:bg-blue-900/40",
    icon: "text-blue-500",
    accent: "text-blue-600 dark:text-blue-400",
    folderColor: "bg-blue-500",
  },
  {
    primary: "green",
    primaryLight: "bg-green-50 dark:bg-green-950/30",
    primaryBorder: "border-green-200 dark:border-green-800",
    primaryHover: "hover:bg-green-100 dark:hover:bg-green-900/40",
    icon: "text-green-500",
    accent: "text-green-600 dark:text-green-400",
    folderColor: "bg-green-500",
  },
  {
    primary: "purple",
    primaryLight: "bg-purple-50 dark:bg-purple-950/30",
    primaryBorder: "border-purple-200 dark:border-purple-800",
    primaryHover: "hover:bg-purple-100 dark:hover:bg-purple-900/40",
    icon: "text-purple-500",
    accent: "text-purple-600 dark:text-purple-400",
    folderColor: "bg-purple-500",
  },
  {
    primary: "amber",
    primaryLight: "bg-amber-50 dark:bg-amber-950/30",
    primaryBorder: "border-amber-200 dark:border-amber-800",
    primaryHover: "hover:bg-amber-100 dark:hover:bg-amber-900/40",
    icon: "text-amber-500",
    accent: "text-amber-600 dark:text-amber-400",
    folderColor: "bg-amber-500",
  },
  {
    primary: "indigo",
    primaryLight: "bg-indigo-50 dark:bg-indigo-950/30",
    primaryBorder: "border-indigo-200 dark:border-indigo-800",
    primaryHover: "hover:bg-indigo-100 dark:hover:bg-indigo-900/40",
    icon: "text-indigo-500",
    accent: "text-indigo-600 dark:text-indigo-400",
    folderColor: "bg-indigo-500",
  },
  {
    primary: "rose",
    primaryLight: "bg-rose-50 dark:bg-rose-950/30",
    primaryBorder: "border-rose-200 dark:border-rose-800",
    primaryHover: "hover:bg-rose-100 dark:hover:bg-rose-900/40",
    icon: "text-rose-500",
    accent: "text-rose-600 dark:text-rose-400",
    folderColor: "bg-rose-500",
  },
  {
    primary: "emerald",
    primaryLight: "bg-emerald-50 dark:bg-emerald-950/30",
    primaryBorder: "border-emerald-200 dark:border-emerald-800",
    primaryHover: "hover:bg-emerald-100 dark:hover:bg-emerald-900/40",
    icon: "text-emerald-500",
    accent: "text-emerald-600 dark:text-emerald-400",
    folderColor: "bg-emerald-500",
  },
  {
    primary: "cyan",
    primaryLight: "bg-cyan-50 dark:bg-cyan-950/30",
    primaryBorder: "border-cyan-200 dark:border-cyan-800",
    primaryHover: "hover:bg-cyan-100 dark:hover:bg-cyan-900/40",
    icon: "text-cyan-500",
    accent: "text-cyan-600 dark:text-cyan-400",
    folderColor: "bg-cyan-500",
  },
];

// Helper function to get consistent color based on branch ID
const getCardTheme = (branchId: string) => {
  const hash = branchId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return cardThemes[hash % cardThemes.length];
};

export function BranchCard({ branch, totalUnits, onSelect }: BranchCardProps) {
  const [editing, setEditing] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showAffiliateTooltip, setShowAffiliateTooltip] = useState(false);
  const [showBackdateModal, setShowBackdateModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [backdateValue, setBackdateValue] = useState("");
  const [pendingHarvestType, setPendingHarvestType] = useState<
    "today" | "backdate"
  >("today");
  const [harvestResult, setHarvestResult] = useState<HarvestResult | null>(
    null
  );
  const [generatePDF, setGeneratePDF] = useState(true);
  const [actualAmountProcessed, setActualAmountProcessed] =
    useState<string>("");
  const { harvestToday, harvestBackdate, isHarvesting, generateHarvestReport } =
    useBranchHarvest();

  const theme = getCardTheme(branch.id);

  const formatDate = (date: Date | null | undefined) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime()))
      return "Invalid date";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
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

  // Check if last harvest date has passed and is within 30 days
  const isHarvested = () => {
    if (!branch.last_harvest_date) return false;

    try {
      const lastHarvestDate = new Date(branch.last_harvest_date);

      // Check if the date is valid
      if (isNaN(lastHarvestDate.getTime())) {
        console.error("Invalid last_harvest_date:", branch.last_harvest_date);
        return false;
      }

      const today = new Date();

      // Reset time parts for accurate date comparison
      const lastHarvest = new Date(
        lastHarvestDate.getFullYear(),
        lastHarvestDate.getMonth(),
        lastHarvestDate.getDate()
      );
      const currentDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      // Calculate difference in days
      const diffTime = currentDate.getTime() - lastHarvest.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Show harvested watermark only if harvested within last 30 days
      return diffDays > 0 && diffDays <= 30;
    } catch (error) {
      console.error("Error checking harvest date:", error);
      return false;
    }
  };

  const handleHarvestToday = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingHarvestType("today");
    setShowConfirmationModal(true);
  };

  const handleBackdateHarvest = async (e: FormEvent) => {
    e.preventDefault();
    setPendingHarvestType("backdate");
    setShowConfirmationModal(true);
  };

  const executeHarvest = async () => {
    try {
      let result;

      const actualAmount = actualAmountProcessed
        ? Number.parseFloat(actualAmountProcessed)
        : undefined;

      if (pendingHarvestType === "today") {
        result = await harvestToday(
          branch.id,
          getBranchInfo(),
          generatePDF,
          actualAmount
        );
      } else {
        result = await harvestBackdate(
          branch.id,
          backdateValue,
          getBranchInfo(),
          generatePDF,
          actualAmount
        );
        setShowBackdateModal(false);
        setBackdateValue("");
      }

      setHarvestResult(result);
      setShowConfirmationModal(false);
      setActualAmountProcessed("");
      setShowSuccessModal(true);

      toast.success(
        `Harvested ${
          result.summary.aggregatesHarvested
        } aggregates. Total: ₱${result.summary.totalAmount.toFixed(2)}`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Harvest failed";
      toast.error(errorMessage);
      setShowConfirmationModal(false);
    }
  };

  const getBranchInfo = (): BranchInfo => {
    return {
      branchName: branch.location,
      branchAddress: branch.address || "Address not specified",
      managerName: branch.branch_manager,
      contactNumber: branch.contact_number || "Contact not specified",
      sharePercentage: branch.share,
    };
  };

  const handleExportPDF = (compact = false) => {
    if (!harvestResult) return;

    try {
      generateHarvestReport(harvestResult, getBranchInfo(), { compact });
      toast.success("PDF report generated successfully");
      setShowSuccessModal(false);
    } catch (error) {
      toast.error("Failed to generate PDF report");
    }
  };

  const harvestInfo = formatHarvestSchedule(branch.harvest_day_of_month);
  const affiliateCount = branch.affiliates?.length || 0;

  const getHarvestConfirmationMessage = () => {
    if (pendingHarvestType === "today") {
      return {
        title: "Harvest Today?",
        description:
          "This will collect all unharvested aggregates up to yesterday's date and update the monthly totals.",
        icon: <DollarSign className="h-6 w-6 text-amber-500" />,
        buttonText: "Yes, Harvest Now",
        buttonColor: "bg-amber-600 hover:bg-amber-700",
      };
    } else {
      return {
        title: "Late Harvest?",
        description: `This will collect aggregates for ${backdateValue}. Use this if you forgot to harvest on the scheduled date.`,
        icon: <Clock className="h-6 w-6 text-blue-500" />,
        buttonText: "Yes, Process Late Harvest",
        buttonColor: "bg-blue-600 hover:bg-blue-700",
      };
    }
  };

  // Handle card click for map selection
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect?.();
  };

  // Handle map pin click specifically
  const handleMapPinClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMapModal(true);
  };

  return (
    <>
      <motion.div
        className="relative group"
        whileHover={{ scale: 1.02, y: -2 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        {/* Folded Corner Effect */}
        <div className="absolute top-0 right-0 w-8 h-8 z-20 overflow-hidden">
          <div
            className={`absolute top-0 right-0 w-8 h-8 ${theme.folderColor} transform rotate-45 translate-x-4 -translate-y-4 shadow-lg`}
          />
        </div>

        {/* Main Card Container */}
        <div
          className={`bg-card rounded-lg border ${theme.primaryBorder} shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden w-full relative`}
          onClick={handleCardClick}
        >
          {/* Harvested Watermark */}
          {isHarvested() && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="text-red-200 dark:text-white-800/40 text-4xl font-bold rotate-[-45deg] opacity-25 select-none tracking-widest">
                HARVESTED
              </div>
            </div>
          )}

          <div
            className={`flex flex-col h-full p-4 ${
              isHarvested() ? "relative z-20" : ""
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <button
                  onClick={handleMapPinClick}
                  className="flex items-center gap-2 text-left w-full group"
                >
                  <MapPin
                    className={`h-5 w-5 ${theme.icon} group-hover:${theme.accent} transition-colors flex-shrink-0`}
                  />
                  <h3
                    className={`text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:${theme.accent} transition-colors`}
                  >
                    {branch.location}
                  </h3>
                </button>
                <div className="flex items-center gap-2 mt-1">
                  <User className={`h-4 w-4 ${theme.icon} flex-shrink-0`} />
                  <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {branch.branch_manager}
                  </span>

                  {/* Affiliate Count */}
                  {affiliateCount > 0 && (
                    <div className="relative">
                      <button
                        onMouseEnter={() => setShowAffiliateTooltip(true)}
                        onMouseLeave={() => setShowAffiliateTooltip(false)}
                        className={`flex items-center gap-1 ${theme.primaryLight} ${theme.accent} px-2 py-1 rounded-full text-xs font-medium ${theme.primaryHover} transition-colors`}
                      >
                        <Users className="h-3 w-3" />+{affiliateCount}
                      </button>

                      {/* Affiliate Tooltip */}
                      {showAffiliateTooltip && (
                        <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[200px]">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className={`h-4 w-4 ${theme.icon}`} />
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              Affiliates ({affiliateCount})
                            </span>
                          </div>
                          <div className="space-y-1">
                            {branch.affiliates?.map((affiliate, index) => (
                              <div
                                key={index}
                                className="text-xs text-gray-600 dark:text-gray-400 py-1 px-2 bg-gray-50 dark:bg-gray-700/50 rounded"
                              >
                                {affiliate}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
                <TrendingUp className={`h-4 w-4 ${theme.icon} flex-shrink-0`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Share:
                </span>
              </div>
              <span
                className={`inline-flex items-center rounded-full ${theme.primaryLight} px-2.5 py-0.5 text-xs font-semibold ${theme.accent}`}
              >
                {branch.share}%
              </span>
            </div>

            {/* Body Content */}
            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-between p-2 bg-card border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <Link
                  href={`/branches/${branch.id}`}
                  prefetch={true}
                  className="flex items-center justify-between w-full group"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <Monitor
                      className={`h-4 w-4 ${theme.icon} flex-shrink-0`}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      See Performance
                    </span>
                  </div>
                  <ChevronRight className={`h-4 w-4 ${theme.icon}`} />
                </Link>
              </div>

              {/* Last Harvest Date */}
              <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-2">
                  <CalendarDays
                    className={`h-4 w-4 ${theme.icon} flex-shrink-0`}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Last Harvest:
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {branch.last_harvest_date
                    ? formatDate(new Date(branch.last_harvest_date))
                    : "Never"}
                </span>
              </div>

              {/* Harvest Info */}
              <div className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Calendar
                      className={`h-4 w-4 ${theme.icon} flex-shrink-0`}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Harvest:
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {harvestInfo.shortDate}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
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
                          : theme.accent
                      }`}
                    >
                      {harvestInfo.nextDate}
                    </span>
                    {harvestInfo.daysUntil <= 7 &&
                      harvestInfo.daysUntil > 0 && (
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

                <div className="flex items-center gap-2 justify-between">
                  <button
                    onClick={handleHarvestToday}
                    disabled={isHarvesting}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${theme.accent} ${theme.primaryLight} ${theme.primaryHover} transition-colors disabled:opacity-50 ${theme.primaryBorder}`}
                    title="Harvest Today"
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    Harvest
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowBackdateModal(true);
                    }}
                    disabled={isHarvesting}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${theme.accent} ${theme.primaryLight} ${theme.primaryHover} transition-colors disabled:opacity-50 ${theme.primaryBorder}`}
                    title="Late Harvest"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Custom Harvest
                  </button>
                </div>
              </div>
            </div>

            {/* Footer - Branch ID */}
            <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
              <Link
                href={`/branches/${branch.id}`}
                prefetch={true}
                className="flex items-center justify-between group"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate">
                  ID: {branch.id}
                </span>
                <motion.div
                  animate={{ x: [0, 2, 0] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1 }}
                >
                  <ChevronRight className={`h-4 w-4 ${theme.icon}`} />
                </motion.div>
              </Link>
            </div>
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

      {/* Backdate Modal */}
      {showBackdateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Late Harvest
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Use this if you forgot to harvest on the scheduled date. Select
              the date you want to harvest up to.
            </p>
            <form onSubmit={handleBackdateHarvest}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Harvest Date
                </label>
                <input
                  type="date"
                  value={backdateValue}
                  onChange={(e) => setBackdateValue(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowBackdateModal(false);
                    setBackdateValue("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isHarvesting || !backdateValue}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {getHarvestConfirmationMessage().title}
              </h3>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {getHarvestConfirmationMessage().description}
            </p>

            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Actual Amount Processed (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  ₱
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={actualAmountProcessed}
                  onChange={(e) => setActualAmountProcessed(e.target.value)}
                  placeholder="Enter physical cash collected"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Enter the actual physical cash amount collected to track
                variance between expected and actual revenue.
              </p>
            </div>

            {/* PDF Export Option */}
            <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generatePDF}
                  onChange={(e) => setGeneratePDF(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Generate PDF Report
                  </span>
                </div>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-7">
                Automatically download a detailed harvest report after
                completion
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowConfirmationModal(false);
                  setActualAmountProcessed("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeHarvest}
                disabled={isHarvesting}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                  getHarvestConfirmationMessage().buttonColor
                }`}
              >
                {isHarvesting
                  ? "Processing..."
                  : getHarvestConfirmationMessage().buttonText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal with PDF Export Options */}
      {showSuccessModal && harvestResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Harvest Complete!
              </h3>
            </div>

            <SuccessModalContent
              harvestResult={harvestResult}
              onExportPDF={handleExportPDF}
              onClose={() => setShowSuccessModal(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
