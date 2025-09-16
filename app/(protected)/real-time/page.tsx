"use client";

import { useSalesQuery } from "@/hooks/use-sales-query";
import { SalesCard } from "@/components/sales-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Coins,
  Clock,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { salesKeys } from "@/lib/sales-api";

export default function RealTimeSales() {
  const { data: sales = [], isLoading, error, isError } = useSalesQuery();
  const queryClient = useQueryClient();

  const handleReloadSales = () => {
    queryClient.invalidateQueries({ queryKey: salesKeys.realTime() });
  };

  // Calculate stats
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = sales.length;
  const averageTransaction =
    totalTransactions > 0 ? totalSales / totalTransactions : 0;
  const todaySales = sales.filter((sale) => {
    const saleDate = sale.timestamp.toDate();
    const today = new Date();
    return saleDate.toDateString() === today.toDateString();
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <h1 className="text-3xl font-bold text-foreground mt-4">
            Loading Real-Time Sales
          </h1>
          <p className="text-muted-foreground mt-2">
            Fetching sales data from all units...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-3xl font-bold text-foreground mt-4">
            Error Loading Sales Data
          </h1>
          <p className="text-muted-foreground mt-2">
            {error instanceof Error
              ? error.message
              : "Failed to load sales data"}
          </p>
          <Button onClick={handleReloadSales} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Real-Time Sales
            </h1>
            <p className="text-muted-foreground mt-2">
              Monitor sales across all coin-operated units
            </p>
          </div>
          <Button
            onClick={handleReloadSales}
            variant="outline"
            className="mt-4 sm:mt-0 bg-transparent"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Real-Time Sales
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Sales
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ₱{totalSales}
              </div>
              <p className="text-xs text-muted-foreground">All time revenue</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Transactions
              </CardTitle>
              <Coins className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {totalTransactions}
              </div>
              <p className="text-xs text-muted-foreground">
                Total transactions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Sale
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ₱{averageTransaction.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Per transaction</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today's Sales
              </CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {todaySales.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Transactions today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sales List */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Recent Sales ({sales.length})
          </h2>

          {sales.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No sales data found
                </h3>
                <p className="text-muted-foreground mb-6">
                  Sales transactions will appear here once units start
                  generating revenue.
                </p>
                <Button onClick={handleReloadSales} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Sales Data
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {" "}
              {/* ⬅️ stack cards vertically */}
              {sales.map((sale) => (
                <SalesCard key={`${sale.deviceId}-${sale.id}`} sale={sale} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
