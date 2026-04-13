"use client";

import { useState, useMemo } from "react";
import { useAllBranchesHarvestData } from "@/hooks/use-all-branches-harvest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  CalendarIcon,
  TrendingUp,
  Building,
  AlertCircle,
  Coins,
  ArrowRight,
} from "lucide-react";
import { BranchDetailsModal } from "./branch-details-modal";

type FilterType = "all" | "30days" | "7days" | "thisMonth";

// Helper function to safely handle errors
const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error)
    return String(error.message);
  return "Failed to load branch data";
};

// Interface definitions remain the same
interface ProcessedBranchData {
  id: string;
  name: string;
  manager: string;
  total: number;
  actualTotal: number;
  harvestCount: number;
  coins_1: number;
  coins_5: number;
  coins_10: number;
  coins_20: number;
  dateRange: {
    start: string;
    end: string;
  } | null;
  branchId?: string;
}

interface SelectedBranchData {
  id: string;
  name: string;
  manager: string;
  location: string;
  totalHarvest: number;
  harvestCount: number;
  sharePercentage?: number;
  harvestDay?: number;
  affiliates?: string[];
}

const EMPTY_DATA = {
  chartData: [],
  dateRange: null,
  totalCoins: {
    coins_1: 0,
    coins_5: 0,
    coins_10: 0,
    coins_20: 0,
    totalValue: 0,
  },
  performanceMetrics: {
    totalHarvests: 0,
  },
};

export function BranchRanking() {
  const { data, isLoading, error } = useAllBranchesHarvestData();
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedBranch, setSelectedBranch] = useState<SelectedBranchData | null>(null);

  const openBranchModal = (branchData: ProcessedBranchData) => {
    const selectedBranchData: SelectedBranchData = {
      id: branchData.id || branchData.branchId || branchData.name,
      name: branchData.name,
      manager: branchData.manager,
      location: branchData.name,
      totalHarvest: branchData.actualTotal,
      harvestCount: branchData.harvestCount,
      sharePercentage: 60,
      harvestDay: 15,
    };
    setSelectedBranch(selectedBranchData);
  };

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return EMPTY_DATA;

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    let totalCoins1 = 0;
    let totalCoins5 = 0;
    let totalCoins10 = 0;
    let totalCoins20 = 0;

    const processedData: ProcessedBranchData[] = data
      .map((branch) => {
        const filteredHarvests = branch.harvests.filter((harvest) => {
          if (!harvest.last_harvest_date) return false;
          const harvestDate = new Date(harvest.last_harvest_date);
          
          if (!minDate || harvestDate < minDate) minDate = harvestDate;
          if (!maxDate || harvestDate > maxDate) maxDate = harvestDate;

          switch (filter) {
            case "30days": return harvestDate >= thirtyDaysAgo;
            case "7days": return harvestDate >= sevenDaysAgo;
            case "thisMonth": return harvestDate >= startOfMonth;
            case "all": default: return true;
          }
        });

        const filteredTotal = filteredHarvests.reduce((sum, h) => sum + (h.total || 0), 0);
        const filteredCoins1 = filteredHarvests.reduce((sum, h) => sum + (h.coins_1 || 0), 0);
        const filteredCoins5 = filteredHarvests.reduce((sum, h) => sum + (h.coins_5 || 0), 0);
        const filteredCoins10 = filteredHarvests.reduce((sum, h) => sum + (h.coins_10 || 0), 0);
        const filteredCoins20 = filteredHarvests.reduce((sum, h) => sum + (h.coins_20 || 0), 0);

        totalCoins1 += filteredCoins1;
        totalCoins5 += filteredCoins5;
        totalCoins10 += filteredCoins10;
        totalCoins20 += filteredCoins20;

        return {
          id: branch.branchId,
          name: branch.branchName,
          manager: branch.branchManager,
          total: filteredTotal,
          actualTotal: filteredTotal,
          harvestCount: filteredHarvests.length,
          coins_1: filteredCoins1,
          coins_5: filteredCoins5,
          coins_10: filteredCoins10,
          coins_20: filteredCoins20,
          dateRange: filteredHarvests.length > 0
            ? {
                start: filteredHarvests[filteredHarvests.length - 1].date_range?.start || "Beginning",
                end: filteredHarvests[0].date_range?.end || "Unknown",
              }
            : null,
          branchId: branch.branchId,
        };
      })
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total);

    const totalValue = totalCoins1 * 1 + totalCoins5 * 5 + totalCoins10 * 10 + totalCoins20 * 20;
    const totalHarvests = processedData.reduce((sum, branch) => sum + branch.harvestCount, 0);

    return {
      chartData: processedData,
      dateRange: minDate && maxDate ? { start: minDate, end: maxDate } : null,
      totalCoins: { coins_1: totalCoins1, coins_5: totalCoins5, coins_10: totalCoins10, coins_20: totalCoins20, totalValue },
      performanceMetrics: { totalHarvests },
    };
  }, [data, filter]);

  const {
    chartData: branchList,
    dateRange: filteredDateRange,
    totalCoins: coinTotals,
    performanceMetrics,
  } = filteredData || EMPTY_DATA;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <h1 className="text-3xl font-mono text-foreground mt-4">Loading Data</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-3xl font-mono text-foreground mb-2">Error Loading Data</h1>
          <p className="text-muted-foreground">{getErrorMessage(error)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Branch Performance</h1>
            <p className="text-sm text-muted-foreground mt-1">
              All active branches and harvest metrics
            </p>
          </div>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-md">
              <CalendarIcon className="h-4 w-4" />
              {filteredDateRange ? (
                <span>{formatDate(filteredDateRange.start)} - {formatDate(filteredDateRange.end)}</span>
              ) : (
                <span>No data in this range</span>
              )}
            </div>
            <Select value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
              <SelectTrigger className="w-[160px] bg-background">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* High-level Jira-style Summary Top Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center">
              <div className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-500" /> Total Revenue
              </div>
              <div className="text-2xl font-bold text-foreground">₱{coinTotals.totalValue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center">
              <div className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                <Building className="h-4 w-4 text-blue-500" /> Active Branches
              </div>
              <div className="text-2xl font-bold text-foreground">{branchList.length}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center">
              <div className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                <Coins className="h-4 w-4 text-purple-500" /> Total Harvests
              </div>
              <div className="text-2xl font-bold text-foreground">{performanceMetrics.totalHarvests}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm bg-muted/20">
            <CardContent className="p-4 flex flex-col justify-center space-y-1">
               <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Coin Breakdown</div>
               <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">₱1:</span> <span>{coinTotals.coins_1.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">₱5:</span> <span>{coinTotals.coins_5.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">₱10:</span> <span>{coinTotals.coins_10.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">₱20:</span> <span>{coinTotals.coins_20.toLocaleString()}</span></div>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Jira-Style List / Queue */}
        <Card className="shadow-sm border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Rank</th>
                  <th className="px-4 py-3 font-medium">Branch Summary</th>
                  <th className="px-4 py-3 font-medium">Manager</th>
                  <th className="px-4 py-3 font-medium">Harvests</th>
                  <th className="px-4 py-3 font-medium text-right">₱1</th>
                  <th className="px-4 py-3 font-medium text-right">₱5</th>
                  <th className="px-4 py-3 font-medium text-right">₱10</th>
                  <th className="px-4 py-3 font-medium text-right">₱20</th>
                  <th className="px-4 py-3 font-medium text-right">Total Revenue</th>
                  <th className="px-4 py-3 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {branchList.length > 0 ? (
                  branchList.map((branch, index) => (
                    <tr 
                      key={branch.id} 
                      onClick={() => openBranchModal(branch)}
                      className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-4 text-muted-foreground">
                        #{index + 1}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {branch.name}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                             {branch.manager.charAt(0)}
                           </div>
                           <span className="text-foreground">{branch.manager}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                         <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            {branch.harvestCount} logs
                         </span>
                      </td>
                      <td className="px-4 py-4 text-right text-muted-foreground">{branch.coins_1.toLocaleString()}</td>
                      <td className="px-4 py-4 text-right text-muted-foreground">{branch.coins_5.toLocaleString()}</td>
                      <td className="px-4 py-4 text-right text-muted-foreground">{branch.coins_10.toLocaleString()}</td>
                      <td className="px-4 py-4 text-right text-muted-foreground">{branch.coins_20.toLocaleString()}</td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-bold text-green-600 dark:text-green-500">
                          ₱{branch.actualTotal.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button className="text-muted-foreground group-hover:text-primary transition-colors">
                           <ArrowRight className="h-4 w-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                      No branches found for the selected period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {selectedBranch && (
          <BranchDetailsModal
            branch={selectedBranch}
            onClose={() => setSelectedBranch(null)}
          />
        )}
      </div>
    </div>
  );
}