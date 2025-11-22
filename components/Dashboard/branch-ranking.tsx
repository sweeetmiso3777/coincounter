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
  Trophy,
  CalendarIcon,
  Coins,
  TrendingUp,
  Building,
  User,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

import { BranchDetailsModal } from "./branch-details-modal";

type FilterType = "all" | "30days" | "7days" | "thisMonth";

// Coin colors for consistent styling
const COIN_COLORS = {
  "₱1 Coins": "#6B7280",
  "₱5 Coins": "#8B5CF6",
  "₱10 Coins": "#F59E0B",
  "₱20 Coins": "#10B981",
};

const CHART_COLORS = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#6366F1",
];

// Helper function to safely handle errors
const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error)
    return String(error.message);
  return "Failed to load branch data";
};

// Default empty data structure
const EMPTY_DATA = {
  chartData: [],
  dateRange: null,
  coinBreakdown: [],
  totalCoins: {
    coins_1: 0,
    coins_5: 0,
    coins_10: 0,
    coins_20: 0,
    totalValue: 0,
  },
  branchCoinDistribution: [],
  performanceMetrics: {
    totalHarvests: 0,
    avgCoinsPerHarvest: {
      coins_1: 0,
      coins_5: 0,
      coins_10: 0,
      coins_20: 0,
    },
    coinDistribution: {
      coins_1: 0,
      coins_5: 0,
      coins_10: 0,
      coins_20: 0,
    },
  },
  coinLeaderboards: {
    coins_1: [],
    coins_5: [],
    coins_10: [],
    coins_20: [],
  },
};

// Interface for processed branch data
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

// Interface for selected branch data for modal
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

// Interface for Unit data
interface Unit {
  deviceId: string;
  alias: string;
  branch: string;
  branchId: string;
}

// Interface for coin breakdown data
interface CoinBreakdownData {
  name: string;
  value: number;
  amount: number;
  percentage: number;
  color: string;
  [key: string]: string | number; // Index signature for Recharts compatibility
}

// Interface for branch coin distribution
interface BranchCoinDistribution {
  name: string;
  "₱1 Coins": number;
  "₱5 Coins": number;
  "₱10 Coins": number;
  "₱20 Coins": number;
}

// Interface for coin leaderboard
interface CoinLeaderboardItem {
  name: string;
  coins_1?: number;
  coins_5?: number;
  coins_10?: number;
  coins_20?: number;
}

// Recharts Tooltip payload interfaces
interface PieTooltipPayload {
  payload: CoinBreakdownData;
  value: number;
  name: string;
  dataKey: string;
  color: string;
}

interface BarTooltipPayload {
  payload: ProcessedBranchData | BranchCoinDistribution;
  value: number;
  name: string;
  dataKey: string;
  color: string;
}

// Tooltip props interfaces
interface CustomPieTooltipProps {
  active?: boolean;
  payload?: PieTooltipPayload[];
}

interface CustomBarTooltipProps {
  active?: boolean;
  payload?: BarTooltipPayload[];
  label?: string;
}

// Bar click event interface
interface BarClickEvent {
  activePayload?: Array<{
    payload: ProcessedBranchData;
  }>;
}

export function BranchRanking() {
  const { data, isLoading, error } = useAllBranchesHarvestData();
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedBranch, setSelectedBranch] =
    useState<SelectedBranchData | null>(null);

  // Function to open branch modal
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

    // Initialize coin totals
    let totalCoins1 = 0;
    let totalCoins5 = 0;
    let totalCoins10 = 0;
    let totalCoins20 = 0;

    const processedData: ProcessedBranchData[] = data
      .map((branch) => {
        // Filter harvests based on the selected range
        const filteredHarvests = branch.harvests.filter((harvest) => {
          if (!harvest.last_harvest_date) return false;

          const harvestDate = new Date(harvest.last_harvest_date);

          if (!minDate || harvestDate < minDate) minDate = harvestDate;
          if (!maxDate || harvestDate > maxDate) maxDate = harvestDate;

          switch (filter) {
            case "30days":
              return harvestDate >= thirtyDaysAgo;
            case "7days":
              return harvestDate >= sevenDaysAgo;
            case "thisMonth":
              return harvestDate >= startOfMonth;
            case "all":
            default:
              return true;
          }
        });

        // Recalculate totals for the filtered harvests
        const filteredTotal = filteredHarvests.reduce(
          (sum, h) => sum + (h.total || 0),
          0
        );
        const filteredCoins1 = filteredHarvests.reduce(
          (sum, h) => sum + (h.coins_1 || 0),
          0
        );
        const filteredCoins5 = filteredHarvests.reduce(
          (sum, h) => sum + (h.coins_5 || 0),
          0
        );
        const filteredCoins10 = filteredHarvests.reduce(
          (sum, h) => sum + (h.coins_10 || 0),
          0
        );
        const filteredCoins20 = filteredHarvests.reduce(
          (sum, h) => sum + (h.coins_20 || 0),
          0
        );

        // Accumulate global coin totals
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
          dateRange:
            filteredHarvests.length > 0
              ? {
                  start:
                    filteredHarvests[filteredHarvests.length - 1].date_range
                      ?.start || "Beginning",
                  end: filteredHarvests[0].date_range?.end || "Unknown",
                }
              : null,
          branchId: branch.branchId,
        };
      })
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total);

    // Calculate total value
    const totalValue =
      totalCoins1 * 1 + totalCoins5 * 5 + totalCoins10 * 10 + totalCoins20 * 20;

    // Prepare data for pie chart - Use QUANTITIES instead of amounts for visual representation
    const coinBreakdown: CoinBreakdownData[] = [
      {
        name: "₱1",
        value: totalCoins1,
        amount: totalCoins1 * 1,
        percentage: totalValue > 0 ? ((totalCoins1 * 1) / totalValue) * 100 : 0,
        color: COIN_COLORS["₱1 Coins"],
        dataKey: "₱1 Coins", // Added for Recharts compatibility
      },
      {
        name: "₱5",
        value: totalCoins5,
        amount: totalCoins5 * 5,
        percentage: totalValue > 0 ? ((totalCoins5 * 5) / totalValue) * 100 : 0,
        color: COIN_COLORS["₱5 Coins"],
        dataKey: "₱5 Coins", // Added for Recharts compatibility
      },
      {
        name: "₱10",
        value: totalCoins10,
        amount: totalCoins10 * 10,
        percentage:
          totalValue > 0 ? ((totalCoins10 * 10) / totalValue) * 100 : 0,
        color: COIN_COLORS["₱10 Coins"],
        dataKey: "₱10 Coins", // Added for Recharts compatibility
      },
      {
        name: "₱20",
        value: totalCoins20,
        amount: totalCoins20 * 20,
        percentage:
          totalValue > 0 ? ((totalCoins20 * 20) / totalValue) * 100 : 0,
        color: COIN_COLORS["₱20 Coins"],
        dataKey: "₱20 Coins", // Added for Recharts compatibility
      },
    ];

    // Branch Coin Distribution
    const branchCoinDistribution: BranchCoinDistribution[] = processedData
      .slice(0, 5)
      .map((branch) => ({
        name:
          branch.name.substring(0, 15) + (branch.name.length > 15 ? "..." : ""),
        "₱1 Coins": branch.coins_1 || 0,
        "₱5 Coins": branch.coins_5 || 0,
        "₱10 Coins": branch.coins_10 || 0,
        "₱20 Coins": branch.coins_20 || 0,
      }));

    // Performance Metrics
    const totalHarvests = processedData.reduce(
      (sum, branch) => sum + branch.harvestCount,
      0
    );
    const avgCoinsPerHarvest =
      totalHarvests > 0
        ? {
            coins_1: totalCoins1 / totalHarvests,
            coins_5: totalCoins5 / totalHarvests,
            coins_10: totalCoins10 / totalHarvests,
            coins_20: totalCoins20 / totalHarvests,
          }
        : { coins_1: 0, coins_5: 0, coins_10: 0, coins_20: 0 };

    const performanceMetrics = {
      totalHarvests,
      avgCoinsPerHarvest,
      coinDistribution: {
        coins_1: totalCoins1 > 0 ? ((totalCoins1 * 1) / totalValue) * 100 : 0,
        coins_5: totalCoins5 > 0 ? ((totalCoins5 * 5) / totalValue) * 100 : 0,
        coins_10:
          totalCoins10 > 0 ? ((totalCoins10 * 10) / totalValue) * 100 : 0,
        coins_20:
          totalCoins20 > 0 ? ((totalCoins20 * 20) / totalValue) * 100 : 0,
      },
    };

    // Coin Leaderboards
    const coinLeaderboards = {
      coins_1: processedData
        .sort((a, b) => b.coins_1 - a.coins_1)
        .slice(0, 3)
        .map((branch) => ({
          name: branch.name,
          coins_1: branch.coins_1,
        })),
      coins_5: processedData
        .sort((a, b) => b.coins_5 - a.coins_5)
        .slice(0, 3)
        .map((branch) => ({
          name: branch.name,
          coins_5: branch.coins_5,
        })),
      coins_10: processedData
        .sort((a, b) => b.coins_10 - a.coins_10)
        .slice(0, 3)
        .map((branch) => ({
          name: branch.name,
          coins_10: branch.coins_10,
        })),
      coins_20: processedData
        .sort((a, b) => b.coins_20 - a.coins_20)
        .slice(0, 3)
        .map((branch) => ({
          name: branch.name,
          coins_20: branch.coins_20,
        })),
    };

    return {
      chartData: processedData,
      dateRange: minDate && maxDate ? { start: minDate, end: maxDate } : null,
      coinBreakdown,
      totalCoins: {
        coins_1: totalCoins1,
        coins_5: totalCoins5,
        coins_10: totalCoins10,
        coins_20: totalCoins20,
        totalValue,
      },
      branchCoinDistribution,
      performanceMetrics,
      coinLeaderboards,
    };
  }, [data, filter]);

  // Safe destructuring with fallback
  const {
    chartData: branchChartData,
    dateRange: filteredDateRange,
    coinBreakdown: coinData,
    totalCoins: coinTotals,
    branchCoinDistribution,
    performanceMetrics,
    coinLeaderboards,
  } = filteredData || EMPTY_DATA;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleBarClick = (event: object) => {
    const data = event as BarClickEvent;
    if (data?.activePayload?.[0]) {
      const branchData = data.activePayload[0].payload;
      openBranchModal(branchData);
    }
  };

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }: CustomPieTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-semibold text-foreground">
              {data.name} Coins
            </span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span>Quantity:</span>
              <span className="font-medium">{data.value.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Amount:</span>
              <span className="font-medium">
                ₱{data.amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Percentage:</span>
              <span className="font-medium">{data.percentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for grouped bar chart
  const CustomGroupedBarTooltip = ({
    active,
    payload,
    label,
  }: CustomBarTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-lg">
          <div className="font-semibold text-foreground mb-2">{label}</div>
          <div className="space-y-1 text-sm">
            {payload.map((entry, index: number) => (
              <div key={index} className="flex justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-muted-foreground">{entry.name}:</span>
                </div>
                <span className="font-medium">
                  {entry.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Enhanced tooltip for branch ranking chart
  const EnhancedBarTooltip = ({
    active,
    payload,
    label,
  }: CustomBarTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ProcessedBranchData;
      const totalCoins =
        data.coins_1 + data.coins_5 + data.coins_10 + data.coins_20;

      const handleTooltipClick = () => {
        openBranchModal(data);
      };

      return (
        <div
          className="bg-background border border-border p-4 rounded-lg shadow-lg min-w-[280px] cursor-pointer"
          onMouseEnter={(e) => e.stopPropagation()}
          onMouseLeave={(e) => e.stopPropagation()}
          onClick={handleTooltipClick}
        >
          <div className="font-semibold text-foreground mb-3 text-base">
            {label}
          </div>

          {/* Main Revenue */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-muted-foreground">Total Revenue:</span>
            <span className="font-bold text-green-600 text-lg">
              ₱{data.actualTotal.toLocaleString()}
            </span>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <div className="text-sm text-muted-foreground">Harvests</div>
              <div className="font-medium text-foreground">
                {data.harvestCount}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                Avg per Harvest
              </div>
              <div className="font-medium text-amber-600">
                ₱
                {data.harvestCount > 0
                  ? Math.round(
                      data.actualTotal / data.harvestCount
                    ).toLocaleString()
                  : "0"}
              </div>
            </div>
          </div>

          {/* Manager */}
          <div className="mb-3">
            <div className="text-sm text-muted-foreground">Manager</div>
            <div className="font-medium text-foreground text-sm">
              {data.manager}
            </div>
          </div>

          {/* Coin Breakdown */}
          <div className="border-t border-border pt-3">
            <div className="text-sm text-muted-foreground mb-2">
              Coin Breakdown:
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">₱1:</span>
                <span className="font-medium">
                  {data.coins_1?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-600">₱5:</span>
                <span className="font-medium">
                  {data.coins_5?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-600">₱10:</span>
                <span className="font-medium">
                  {data.coins_10?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">₱20:</span>
                <span className="font-medium">
                  {data.coins_20?.toLocaleString() || 0}
                </span>
              </div>
            </div>
            <div className="flex justify-between mt-2 pt-2 border-t border-border">
              <span className="text-muted-foreground text-xs">
                Total Coins:
              </span>
              <span className="font-medium text-xs">
                {totalCoins.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Click hint */}
          <div className="mt-3 pt-2 border-t border-border">
            <div className="text-xs text-blue-600 text-center font-semibold hover:text-blue-700 transition-colors">
              Click anywhere to view detailed history →
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <h1 className="text-3xl font-mono text-foreground mt-4">
            Loading Branch Performance
          </h1>
          <p className="text-muted-foreground mt-2">
            Analyzing harvest data from all branches...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-3xl font-mono text-foreground mb-2">
            Error Loading Data
          </h1>
          <p className="text-muted-foreground mb-6">{getErrorMessage(error)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-mono text-foreground">
              Branch Performance
            </h1>
            <p className="font-mono text-muted-foreground mt-2">
              Monitor and compare branch harvest performance
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              {filteredDateRange ? (
                <span>
                  {formatDate(filteredDateRange.start)} -{" "}
                  {formatDate(filteredDateRange.end)}
                </span>
              ) : (
                <span>No data in this range</span>
              )}
            </div>
            <Select
              value={filter}
              onValueChange={(value) => setFilter(value as FilterType)}
            >
              <SelectTrigger className="w-[140px] bg-background border-border">
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

        {/* Stats and Coin Breakdown Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Summary Cards */}
          <div className="space-y-4">
            {/* Total Revenue Card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold text-foreground">
                    Total Revenue
                  </h3>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  ₱{coinTotals.totalValue.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Across {branchChartData.length} branches
                </p>
              </CardContent>
            </Card>

            {/* Coin Distribution */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Coins className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold text-foreground">
                    Coin Distribution
                  </h3>
                </div>
                <div className="flex gap-4 items-center">
                  {/* Pie Chart */}
                  <div className="flex-1 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={coinData}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={60}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {coinData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Minimal Coin List */}
                  <div className="w-24 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">₱1:</span>
                      <span className="font-mono">
                        {coinTotals.coins_1.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">₱5:</span>
                      <span className="font-mono">
                        {coinTotals.coins_5.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">₱10:</span>
                      <span className="font-mono">
                        {coinTotals.coins_10.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">₱20:</span>
                      <span className="font-mono">
                        {coinTotals.coins_20.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Branch */}
            {branchChartData.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <h3 className="font-semibold text-foreground">
                      Top Branch
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <button
                        onClick={() => openBranchModal(branchChartData[0])}
                        className="font-bold text-lg text-foreground hover:text-blue-600 hover:underline transition-colors text-left w-full"
                      >
                        {branchChartData[0].name}
                      </button>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {branchChartData[0].manager}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground">Revenue</div>
                        <div className="font-bold text-green-600">
                          ₱{branchChartData[0].actualTotal.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Harvests</div>
                        <div className="font-bold text-purple-600">
                          {branchChartData[0].harvestCount}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Middle Column - Consolidated Coin Analytics */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5" />
                  Coin Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Performance Metrics */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">
                      Performance Overview
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center p-3 bg-muted/20 rounded-lg">
                        <div className="text-lg font-bold text-foreground">
                          {performanceMetrics.totalHarvests}
                        </div>
                        <div className="text-muted-foreground">
                          Total Harvests
                        </div>
                      </div>
                      <div className="text-center p-3 bg-muted/20 rounded-lg">
                        <div className="text-lg font-bold text-foreground">
                          {branchChartData.length}
                        </div>
                        <div className="text-muted-foreground">
                          Active Branches
                        </div>
                      </div>
                      <div className="text-center p-3 bg-muted/20 rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          ₱{coinTotals.totalValue.toLocaleString()}
                        </div>
                        <div className="text-muted-foreground">
                          Total Revenue
                        </div>
                      </div>
                      <div className="text-center p-3 bg-muted/20 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">
                          {coinTotals.coins_1.toLocaleString()}
                        </div>
                        <div className="text-muted-foreground">₱1 Coins</div>
                      </div>
                    </div>
                  </div>

                  {/* Top Branches Coin Distribution */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">
                      Top Branches Coin Distribution
                    </h4>
                    <div className="h-48">
                      {branchCoinDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={branchCoinDistribution}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#374151"
                              opacity={0.3}
                            />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 12 }}
                              angle={0}
                              textAnchor="middle"
                              height={50}
                            />
                            <YAxis
                              tick={{ fontSize: 12 }}
                              tickFormatter={(value) => value.toLocaleString()}
                            />
                            <Tooltip content={<CustomGroupedBarTooltip />} />
                            <Legend />
                            <Bar
                              dataKey="₱1 Coins"
                              fill={COIN_COLORS["₱1 Coins"]}
                              name="₱1 Coins"
                              radius={[2, 2, 0, 0]}
                            />
                            <Bar
                              dataKey="₱5 Coins"
                              fill={COIN_COLORS["₱5 Coins"]}
                              name="₱5 Coins"
                              radius={[2, 2, 0, 0]}
                            />
                            <Bar
                              dataKey="₱10 Coins"
                              fill={COIN_COLORS["₱10 Coins"]}
                              name="₱10 Coins"
                              radius={[2, 2, 0, 0]}
                            />
                            <Bar
                              dataKey="₱20 Coins"
                              fill={COIN_COLORS["₱20 Coins"]}
                              name="₱20 Coins"
                              radius={[2, 2, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No distribution data available
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Leaderboards */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">
                      Top Performers by Coin Type
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="font-medium text-muted-foreground flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          ₱1 Coins
                        </div>
                        {coinLeaderboards.coins_1
                          .slice(0, 2)
                          .map((branch, index) => {
                            const fullBranchData = branchChartData.find(
                              (b) => b.name === branch.name
                            );
                            return (
                              <button
                                key={branch.name}
                                onClick={() =>
                                  fullBranchData &&
                                  openBranchModal(fullBranchData)
                                }
                                className="flex justify-between items-center p-2 bg-muted/20 rounded hover:bg-muted/40 transition-colors w-full text-left"
                              >
                                <span className="truncate">
                                  {index + 1}. {branch.name}
                                </span>
                                <span className="font-bold text-blue-600">
                                  {branch.coins_1.toLocaleString()}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                      <div className="space-y-2">
                        <div className="font-medium text-muted-foreground flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                          ₱5 Coins
                        </div>
                        {coinLeaderboards.coins_5
                          .slice(0, 2)
                          .map((branch, index) => {
                            const fullBranchData = branchChartData.find(
                              (b) => b.name === branch.name
                            );
                            return (
                              <button
                                key={branch.name}
                                onClick={() =>
                                  fullBranchData &&
                                  openBranchModal(fullBranchData)
                                }
                                className="flex justify-between items-center p-2 bg-muted/20 rounded hover:bg-muted/40 transition-colors w-full text-left"
                              >
                                <span className="truncate">
                                  {index + 1}. {branch.name}
                                </span>
                                <span className="font-bold text-purple-600">
                                  {branch.coins_5.toLocaleString()}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                      <div className="space-y-2">
                        <div className="font-medium text-muted-foreground flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                          ₱10 Coins
                        </div>
                        {coinLeaderboards.coins_10
                          .slice(0, 2)
                          .map((branch, index) => {
                            const fullBranchData = branchChartData.find(
                              (b) => b.name === branch.name
                            );
                            return (
                              <button
                                key={branch.name}
                                onClick={() =>
                                  fullBranchData &&
                                  openBranchModal(fullBranchData)
                                }
                                className="flex justify-between items-center p-2 bg-muted/20 rounded hover:bg-muted/40 transition-colors w-full text-left"
                              >
                                <span className="truncate">
                                  {index + 1}. {branch.name}
                                </span>
                                <span className="font-bold text-amber-600">
                                  {branch.coins_10.toLocaleString()}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                      <div className="space-y-2">
                        <div className="font-medium text-muted-foreground flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          ₱20 Coins
                        </div>
                        {coinLeaderboards.coins_20
                          .slice(0, 2)
                          .map((branch, index) => {
                            const fullBranchData = branchChartData.find(
                              (b) => b.name === branch.name
                            );
                            return (
                              <button
                                key={branch.name}
                                onClick={() =>
                                  fullBranchData &&
                                  openBranchModal(fullBranchData)
                                }
                                className="flex justify-between items-center p-2 bg-muted/20 rounded hover:bg-muted/40 transition-colors w-full text-left"
                              >
                                <span className="truncate">
                                  {index + 1}. {branch.name}
                                </span>
                                <span className="font-bold text-green-600">
                                  {branch.coins_20.toLocaleString()}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Branch Ranking Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-500" />
              Branch Performance Ranking
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (Click bars for details)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {branchChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={branchChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--foreground)"
                      opacity={0.5}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{
                        fontSize: 11,
                        fill: "#3b82f6",
                        cursor: "pointer",
                      }}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      angle={0}
                      textAnchor="middle"
                      height={70}
                      tickFormatter={(value) =>
                        value.length > 12
                          ? `${value.substring(0, 12)}...`
                          : value
                      }
                      onClick={(data) => {
                        if (data && data.value) {
                          const branchData = branchChartData.find(
                            (branch) => branch.name === data.value
                          );
                          if (branchData) {
                            openBranchModal(branchData);
                          }
                        }
                      }}
                    />
                    <YAxis
                      tick={{
                        fontSize: 12,
                        fill: "var(--foreground)",
                      }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) =>
                        `₱${
                          value >= 1000
                            ? `${(value / 1000).toFixed(0)}k`
                            : value.toLocaleString()
                        }`
                      }
                    />
                    <Tooltip content={<EnhancedBarTooltip />} />
                    <Bar
                      dataKey="total"
                      radius={[4, 4, 0, 0]}
                      barSize={28}
                      name="Total Revenue"
                      onClick={handleBarClick}
                    >
                      {branchChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                          style={{
                            cursor: "pointer",
                            opacity: selectedBranch?.id === entry.id ? 1 : 0.8,
                          }}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No branch data available for the selected period
                </div>
              )}
            </div>

            {/* Additional metrics below the chart */}
            {branchChartData.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ₱{branchChartData[0].actualTotal.toLocaleString()}
                    </div>
                    <div className="text-muted-foreground">Top Branch</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">
                      {branchChartData.length}
                    </div>
                    <div className="text-muted-foreground">Active Branches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600">
                      {branchChartData
                        .reduce((sum, branch) => sum + branch.harvestCount, 0)
                        .toLocaleString()}
                    </div>
                    <div className="text-muted-foreground">Total Harvests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-amber-600">
                      ₱
                      {Math.round(
                        branchChartData.reduce(
                          (sum, branch) => sum + branch.actualTotal,
                          0
                        ) / branchChartData.length
                      ).toLocaleString()}
                    </div>
                    <div className="text-muted-foreground">Avg per Branch</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Branch Details Modal */}
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
