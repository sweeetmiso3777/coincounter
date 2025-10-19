"use client"

import type React from "react"

import { motion } from "framer-motion"
import type { BranchData } from "@/types/branch"
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
} from "lucide-react"
import { CardMenu } from "./CRUDS/card-menu"
import Link from "next/link"
import { useState } from "react"
import EditBranchModal from "./CRUDS/EditBranchModal"
import { MapModal } from "./Maps/MapModal"
import type { BranchInfo } from "@/hooks/use-branch-harvest"
import { HarvestPreviewModal } from "./Harvest/harvest-preview-modal"

interface BranchCardProps {
  branch: BranchData
  totalUnits: number
  onSelect?: () => void
}

// Color themes for different cards
const cardThemes = [
  {
    primary: "lime",
    primaryLight: "bg-lime-50 dark:bg-lime-950/30",
    primaryBorder: "border-lime-200 dark:border-lime-800",
    primaryHover: "hover:bg-lime-100 dark:hover:bg-lime-900/40",
    icon: "text-lime-500",
    accent: "text-lime-600 dark:text-lime-400",
    folderColor: "bg-lime-500",
  },
]

// Helper function to get consistent color based on branch ID
const getCardTheme = (branchId: string) => {
  const hash = branchId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return cardThemes[hash % cardThemes.length]
}

export function BranchCard({ branch, totalUnits, onSelect }: BranchCardProps) {
  const [editing, setEditing] = useState(false)
  const [showMapModal, setShowMapModal] = useState(false)
  const [showAffiliateTooltip, setShowAffiliateTooltip] = useState(false)
  const [showHarvestModal, setShowHarvestModal] = useState(false)
  const [isHarvestLoading, setIsHarvestLoading] = useState(false)

  const theme = getCardTheme(branch.id)

  const formatDate = (date: Date | null | undefined) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return "Invalid date"
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  const getOrdinalSuffix = (day: number) => {
    if (day >= 11 && day <= 13) return "th"
    switch (day % 10) {
      case 1:
        return "st"
      case 2:
        return "nd"
      case 3:
        return "rd"
      default:
        return "th"
    }
  }

  const getNextHarvestDate = (harvestDay: number) => {
    const now = new Date()
    let harvestDate = new Date(now.getFullYear(), now.getMonth(), harvestDay)
    if (harvestDay < now.getDate()) harvestDate = new Date(now.getFullYear(), now.getMonth() + 1, harvestDay)
    if (harvestDate.getDate() !== harvestDay) harvestDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return harvestDate
  }

  const formatHarvestSchedule = (harvestDay: number) => {
    const nextHarvest = getNextHarvestDate(harvestDay)
    const ordinal = getOrdinalSuffix(harvestDay)
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
      daysUntil: Math.ceil((nextHarvest.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    }
  }

  const isHarvested = () => {
    if (!branch.last_harvest_date) return false

    try {
      const lastHarvestDate = new Date(branch.last_harvest_date)

      if (isNaN(lastHarvestDate.getTime())) {
        console.error("Invalid last_harvest_date:", branch.last_harvest_date)
        return false
      }

      const today = new Date()

      const lastHarvest = new Date(lastHarvestDate.getFullYear(), lastHarvestDate.getMonth(), lastHarvestDate.getDate())
      const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())

      const diffTime = currentDate.getTime() - lastHarvest.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      return diffDays > 0 && diffDays <= 30
    } catch (error) {
      console.error("Error checking harvest date:", error)
      return false
    }
  }

  const handleHarvestClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsHarvestLoading(true)
    setShowHarvestModal(true)
  }

  const getBranchInfo = (): BranchInfo => {
    return {
      branchName: branch.location,
      branchAddress: branch.address || "Address not specified",
      managerName: branch.branch_manager,
      contactNumber: branch.contact_number || "Contact not specified",
      sharePercentage: branch.share,
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    window.location.href = `/branches/${branch.id}`
  }

  const handleMapPinClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowMapModal(true)
  }

  const harvestInfo = formatHarvestSchedule(branch.harvest_day_of_month)
  const affiliateCount = branch.affiliates?.length || 0

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
        >
          {/* Harvested Watermark */}
          {isHarvested() && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="text-red-200 dark:text-white-800/40 text-4xl font-bold rotate-[-45deg] opacity-25 select-none tracking-widest">
                HARVESTED
              </div>
            </div>
          )}

          <div className={`flex flex-col h-full p-4 ${isHarvested() ? "relative z-20" : ""}`} onClick={handleCardClick}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <button onClick={handleMapPinClick} className="flex items-center gap-2 text-left w-full group">
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
                  <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{branch.branch_manager}</span>

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
              <CardMenu branchId={branch.id} branchData={branch} onEdit={() => setEditing(true)} />
            </div>

            {/* Share Info */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className={`h-4 w-4 ${theme.icon} flex-shrink-0`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Share:</span>
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
                    <Monitor className={`h-4 w-4 ${theme.icon} flex-shrink-0`} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">See Performance</span>
                  </div>
                  <ChevronRight className={`h-4 w-4 ${theme.icon}`} />
                </Link>
              </div>

              {/* Last Harvest Date */}
              <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className={`h-4 w-4 ${theme.icon} flex-shrink-0`} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Harvest:</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {branch.last_harvest_date ? formatDate(new Date(branch.last_harvest_date)) : "Never"}
                </span>
              </div>

              {/* Harvest Info */}
              <div className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Calendar className={`h-4 w-4 ${theme.icon} flex-shrink-0`} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Harvest:</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{harvestInfo.shortDate}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Next:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        harvestInfo.isThisMonth ? "text-green-600 dark:text-green-400" : theme.accent
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

                <div className="flex items-center gap-2 justify-center">
                  <button
                    onClick={handleHarvestClick}
                    disabled={isHarvestLoading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium ${theme.accent} ${theme.primaryLight} ${theme.primaryHover} transition-colors ${theme.primaryBorder} w-full justify-center ${
                      isHarvestLoading ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                    title="Harvest"
                  >
                    <DollarSign className="h-4 w-4" />
                    {isHarvestLoading ? "Loading..." : "Harvest"}
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
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate">ID: {branch.id}</span>
                <motion.div animate={{ x: [0, 2, 0] }} transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1 }}>
                  <ChevronRight className={`h-4 w-4 ${theme.icon}`} />
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      {showMapModal && <MapModal open={showMapModal} onClose={() => setShowMapModal(false)} branch={branch} />}

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

      <HarvestPreviewModal
        branchId={branch.id}
        branchInfo={getBranchInfo()}
        open={showHarvestModal}
        onClose={() => {
          setShowHarvestModal(false)
          setIsHarvestLoading(false)
        }}
      />
    </>
  )
}
