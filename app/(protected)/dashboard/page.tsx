"use client";

import { Bell, ChevronDown, Moon, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function DashboardPage() {
  // Sales Overview Data
  const salesData = [
    { month: "Jan", sales: 45 },
    { month: "Feb", sales: 47 },
    { month: "Mar", sales: 48 },
    { month: "Apr", sales: 50 },
    { month: "May", sales: 52 },
    { month: "Jun", sales: 54 },
    { month: "Jul", sales: 56 },
    { month: "Aug", sales: 58 },
    { month: "Sep", sales: 60 },
    { month: "Oct", sales: 62 },
    { month: "Nov", sales: 64 },
    { month: "Dec", sales: 66 },
  ];

  // Coin Breakdown Data
  const coinData = [
    { name: "₱1", value: 1247, color: "#F59E0B" },
    { name: "₱5", value: 2850, color: "#3B82F6" },
    { name: "₱10", value: 4120, color: "#10B981" },
    { name: "₱20", value: 6940, color: "#8B5CF6" },
  ];

  // Real-time Sales Data
  const realtimeSales = [
    {
      unit: "Unit #404293C",
      location: "Natumolan",
      amount: "₱125",
      time: "2:34 PM",
    },
    {
      unit: "Unit #302847A",
      location: "Downtown",
      amount: "₱85",
      time: "2:31 PM",
    },
  ];

  // System Logs Data
  const systemLogs = [
    {
      message: 'No sales for unit "404293C" yesterday',
      time: "2 hours ago",
      type: "warning",
    },
    {
      message: 'Branch "Natumolan" is up for harvest in 3 days',
      time: "4 hours ago",
      type: "info",
    },
  ];

  // Branch Performance Data
  const branches = [
    {
      name: "Natumolan",
      percentage: 85,
      manager: "Rosalie Paculanan",
      units: 7,
      revenue: "₱45,280",
      color: "text-green-600",
    },
    {
      name: "Downtown",
      percentage: 72,
      manager: "Johnjory Amparo",
      units: 6,
      revenue: "₱38,950",
      color: "text-blue-600",
    },
    {
      name: "Eastside",
      percentage: 68,
      manager: "Jake Cuyngan",
      units: 5,
      revenue: "₱32,140",
      color: "text-orange-600",
    },
    {
      name: "Westpoint",
      percentage: 61,
      manager: "Jobess Secsing",
      units: 4,
      revenue: "₱28,760",
      color: "text-purple-600",
    },
    {
      name: "Northgate",
      percentage: 45,
      manager: "Gabriel Suarez",
      units: 3,
      revenue: "₱21,580",
      color: "text-red-600",
    },
  ];

  // Calendar Data
  const calendarDays = [
    { day: 29, month: "prev" },
    { day: 30, month: "prev" },
    { day: 31, month: "prev" },
    { day: 1, month: "current" },
    { day: 2, month: "current" },
    { day: 3, month: "current" },
    { day: 4, month: "current" },
    { day: 5, month: "current", event: "natumolan" },
    { day: 6, month: "current" },
    { day: 7, month: "current" },
    { day: 8, month: "current" },
    { day: 9, month: "current", event: "downtown" },
    { day: 10, month: "current" },
    { day: 11, month: "current" },
    { day: 12, month: "current" },
    { day: 13, month: "current" },
    { day: 14, month: "current" },
    { day: 15, month: "current" },
    { day: 16, month: "current" },
    { day: 17, month: "current" },
    { day: 18, month: "current" },
    { day: 19, month: "current" },
    { day: 20, month: "current" },
    { day: 21, month: "current" },
    { day: 22, month: "current" },
    { day: 23, month: "current", event: "eastside" },
    { day: 24, month: "current" },
    { day: 25, month: "current" },
    { day: 26, month: "current" },
    { day: 27, month: "current" },
    { day: 28, month: "current" },
    { day: 29, month: "current" },
    { day: 30, month: "current" },
  ];

  const getEventColor = (event: string) => {
    switch (event) {
      case "natumolan":
        return "bg-green-500";
      case "downtown":
        return "bg-blue-500";
      case "eastside":
        return "bg-orange-500";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container mx-auto p-6 space-y-6">
        {/* Top Row: Sales Overview and Coin Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Overview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="month"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    label={{
                      value: "Sales (₱k)",
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "hsl(var(--muted-foreground))" },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    name="Total Sales"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Coin Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Coin Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={coinData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {coinData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-6 grid grid-cols-2 gap-4 w-full">
                {coinData.map((coin) => (
                  <div key={coin.name} className="text-center">
                    <div
                      className="text-2xl font-bold"
                      style={{ color: coin.color }}
                    >
                      {coin.name === "₱1" && "₱1,247"}
                      {coin.name === "₱5" && "₱2,850"}
                      {coin.name === "₱10" && "₱4,120"}
                      {coin.name === "₱20" && "₱6,940"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {coin.name}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Row: Branch Performance and Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Branch Performance */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Branch Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {branches.map((branch) => (
                  <div key={branch.name} className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold">{branch.name}</span>
                      <span className={`text-sm font-bold ${branch.color}`}>
                        {branch.percentage}%
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {branch.manager}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {branch.units} units
                    </div>
                    <div className={`text-xl font-bold ${branch.color}`}>
                      {branch.revenue}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sidebar: Real-time Sales and System Logs */}
          <div className="space-y-6">
            {/* Real-time Sales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Real-time Sales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {realtimeSales.map((sale, index) => (
                  <div key={index} className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{sale.unit}</div>
                      <div className="text-sm text-muted-foreground">
                        {sale.location}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">
                        {sale.amount}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {sale.time}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* System Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-orange-500">⚠</span>
                  System Logs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {systemLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`rounded-lg p-3 ${
                      log.type === "warning"
                        ? "bg-red-50 dark:bg-red-950/20"
                        : "bg-green-50 dark:bg-green-950/20"
                    }`}
                  >
                    <div className="text-sm">{log.message}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {log.time}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Harvest Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Harvest Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Calendar Header */}
              <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-muted-foreground">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`relative aspect-square flex items-center justify-center rounded-lg border text-sm ${
                      day.month === "prev"
                        ? "text-muted-foreground/40"
                        : day.event
                        ? "border-primary bg-primary/5 font-semibold"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    {day.day}
                    {day.event && (
                      <span
                        className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${getEventColor(
                          day.event
                        )}`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-green-500" />
                  <span>Natumolan - Today</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-blue-500" />
                  <span>Downtown - 3 days</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-orange-500" />
                  <span>Eastside - 6 days</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
