// components/Branch/partner-branch-detail-card.tsx
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
  BarChart3,
  Coins,
  CalendarDays,
} from "lucide-react";

interface PartnerBranchDetailCardProps {
  branch: BranchData & {
    last_harvest_date?: string | null;
    totalUnits?: number;
  };
}

export function PartnerBranchDetailCard({
  branch,
}: PartnerBranchDetailCardProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);

  const formatDate = (date: Date | null | undefined) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime()))
      return "Never";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
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

  const nextHarvest = getNextHarvestDate(branch.harvest_day_of_month);
  const daysUntilHarvest = Math.ceil(
    (nextHarvest.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  // Mock data for partner-specific metrics (you can replace with real data)
  const partnerMetrics = {
    estimatedMonthlyEarnings:
      (branch.totalUnits || 0) * 5000 * (branch.share / 100), // Mock calculation
    lastPayout: "2024-01-15",
    totalPayouts: 12500,
    performance: "excellent" as const,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-card backdrop-blur rounded-2xl border border-white/10 shadow-xl overflow-hidden z-40">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-8 border-b border-white/10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <MapPin className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {branch.location}
              </h1>
              <p className="text-white/70 flex items-center gap-2 mt-1">
                <User className="h-4 w-4" />
                Managed by {branch.branch_manager}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-6 w-6 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Your Share</h3>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {branch.share}%
              </p>
              <p className="text-sm text-white/70 mt-1">Revenue share</p>
            </div>

            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-6 w-6 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">
                  Total Units
                </h3>
              </div>
              <p className="text-2xl font-bold text-blue-400">
                {branch.totalUnits || 0}
              </p>
              <p className="text-sm text-white/70 mt-1">Active machines</p>
            </div>

            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="h-6 w-6 text-amber-400" />
                <h3 className="text-lg font-semibold text-white">
                  Last Harvest
                </h3>
              </div>
              <p className="text-lg font-bold text-amber-400">
                {branch.last_harvest_date
                  ? formatDate(new Date(branch.last_harvest_date))
                  : "Never"}
              </p>
              <p className="text-sm text-white/70 mt-1">Latest collection</p>
            </div>

            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="h-6 w-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">
                  Next Harvest
                </h3>
              </div>
              <p className="text-lg font-bold text-purple-400">
                {formatDate(nextHarvest)}
              </p>
              <p className="text-sm text-white/70 mt-1">
                {daysUntilHarvest > 0
                  ? `In ${daysUntilHarvest} days`
                  : "Today!"}
              </p>
            </div>
          </div>

          {/* Detailed Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Branch Information */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Branch Information
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white/70">Harvest Day</span>
                  <span className="text-white font-medium">
                    {branch.harvest_day_of_month}th of each month
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white/70">Location Coordinates</span>
                  <span className="text-white font-medium">
                    {branch.latitude && branch.longitude
                      ? `${branch.latitude.toFixed(
                          4
                        )}, ${branch.longitude.toFixed(4)}`
                      : "Not set"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-white/70">Branch ID</span>
                  <span className="text-white font-mono text-sm">
                    {branch.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Partner Earnings */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Your Earnings
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white/70">Estimated Monthly</span>
                  <span className="text-green-400 font-bold">
                    {formatCurrency(partnerMetrics.estimatedMonthlyEarnings)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white/70">Last Payout</span>
                  <span className="text-white font-medium">
                    {formatDate(new Date(partnerMetrics.lastPayout))}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-white/70">Total Paid</span>
                  <span className="text-blue-400 font-bold">
                    {formatCurrency(partnerMetrics.totalPayouts)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Status */}
          <div className="mt-8 bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Performance Status
            </h3>
            <div className="flex items-center gap-4">
              <div
                className={`px-4 py-2 rounded-full ${
                  partnerMetrics.performance === "excellent"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                }`}
              >
                {partnerMetrics.performance === "excellent"
                  ? "Excellent"
                  : "Good"}
              </div>
              <p className="text-white/70">
                Your branch is performing{" "}
                {partnerMetrics.performance === "excellent" ? "above" : "at"}{" "}
                expectations
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
