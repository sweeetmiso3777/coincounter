"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

interface BranchAggregateData {
  totalRevenue: number;
  totalTransactions: number;
  location: string;
  coinBreakdown: {
    peso1: number;
    peso5: number;
    peso10: number;
  };
}

interface AggregatesCardProps {
  data: BranchAggregateData;
  timePeriod: string;
}

export function AggregatesCard({ data, timePeriod }: AggregatesCardProps) {
  return (
    <>
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-muted-foreground mr-2">Time Period:</span>
        <Badge variant="secondary">
          {timePeriod === "1d"
            ? "Today"
            : timePeriod === "7d"
            ? "Last 7 Days"
            : "Last 30 Days"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          key={`revenue-${timePeriod}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <div className="p-2 bg-chart-2/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-chart-2" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ₱{data?.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {timePeriod === "1d"
                  ? "Today's earnings"
                  : `Last ${timePeriod === "7d" ? "7" : "30"} days`}
              </p>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-chart-2/20">
                <div className="h-full w-full bg-chart-2 rounded-full" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          key={`transactions-${timePeriod}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Transactions
              </CardTitle>
              <div className="p-2 bg-chart-1/10 rounded-lg">
                <CreditCard className="h-4 w-4 text-chart-1" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {data?.totalTransactions.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {timePeriod === "1d" ? "Total processed" : "Total transactions"}
              </p>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-chart-1/20">
                <div className="h-full w-4/5 bg-chart-1 rounded-full" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Coin Breakdown Card */}
        <motion.div
          key={`coins-${timePeriod}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Coin Breakdown
              </CardTitle>
              <div className="p-2 bg-chart-3/10 rounded-lg">
                <CreditCard className="h-4 w-4 text-chart-3" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    ₱1 coins:
                  </span>
                  <span className="font-semibold">
                    {data?.coinBreakdown.peso1.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    ₱5 coins:
                  </span>
                  <span className="font-semibold">
                    {data?.coinBreakdown.peso5.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    ₱10 coins:
                  </span>
                  <span className="font-semibold">
                    {data?.coinBreakdown.peso10.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-chart-3/20">
                <div className="h-full w-3/4 bg-chart-3 rounded-full" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
