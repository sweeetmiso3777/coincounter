import { Building2, Users, Calendar, TrendingUp } from "lucide-react";
import type { BranchData } from "@/types/branch";

interface DashboardStatsProps {
  branches: BranchData[];
}

function getNextHarvestDate(harvestDay: number): Date {
  const now = new Date();
  let harvestDate = new Date(now.getFullYear(), now.getMonth(), harvestDay);

  // If the harvest day this month has already passed, move to next month
  if (harvestDate < now) {
    harvestDate = new Date(now.getFullYear(), now.getMonth() + 1, harvestDay);
  }

  // Handle cases where the day might not exist in next month (e.g., 31st in Feb)
  if (harvestDate.getDate() !== harvestDay) {
    // Set to last day of next month
    harvestDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  }

  return harvestDate;
}

export function DashboardStats({ branches }: DashboardStatsProps) {
  const totalBranches = branches.length;
  const uniqueManagers = new Set(branches.map((b) => b.branch_manager)).size;
  const averageShare =
    branches.length > 0
      ? Math.round(
          branches.reduce((sum, b) => sum + b.share, 0) / branches.length
        )
      : 0;

  const now = new Date();
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const upcomingHarvests = branches.filter((b) => {
    const nextHarvest = getNextHarvestDate(b.harvest_day_of_month);
    return nextHarvest > now && nextHarvest <= in30Days;
  }).length;

  const stats = [
    {
      name: "Total Branches",
      value: totalBranches,
      icon: Building2,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      name: "Branch Managers",
      value: uniqueManagers,
      icon: Users,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      name: "Average Share",
      value: `${averageShare}%`,
      icon: TrendingUp,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      name: "Upcoming Harvests",
      value: upcomingHarvests,
      icon: Calendar,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="bg-card rounded-lg border border-border shadow-sm p-6"
        >
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </p>
              <p className="text-2xl font-semibold text-foreground">
                {stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
