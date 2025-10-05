"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import React from "react";
import { useUnitAggregates } from "@/hooks/use-unit-aggregates";
import { useUnitsContext } from "@/providers/UnitsQueryProvider";
import {
  Calendar,
  DollarSign,
  Activity,
  Coins,
  ArrowLeft,
  TrendingUp,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface UnitAggregate {
  id: string;
  total: number;
  sales_count: number;
  coins_1: number;
  coins_5: number;
  coins_10: number;
  coins_20: number;
  timestamp: string | Date;
}

// Header for the unit page
const UnitHeader = ({
  deviceId,
  alias,
}: {
  deviceId: string;
  alias?: string;
}) => (
  <div className="mb-8">
    <div className="flex justify-between items-center mb-4">
      <Button asChild variant="ghost">
        <Link href="/units">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Units
        </Link>
      </Button>

      <Button asChild variant="ghost">
        <Link href="/real-time">
          Back to Real-Time
          <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
      </Button>
    </div>

    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-secondary/10 rounded-lg">
        <Activity className="h-6 w-6 text-primary" />
      </div>
      <h1 className="text-3xl font-bold text-foreground text-balance">
        {alias || deviceId}
      </h1>
    </div>
    <p className="text-muted-foreground text-lg">
      Transaction history and earnings overview
    </p>
  </div>
);

// Desktop table for aggregates
const UnitAggregatesTable = ({ data }: { data: UnitAggregate[] }) => {
  const grandTotal = data.reduce((sum, agg) => sum + agg.total, 0);
  const totalSales = data.reduce((sum, agg) => sum + agg.sales_count, 0);
  const total1Peso = data.reduce((sum, agg) => sum + agg.coins_1, 0);
  const total5Peso = data.reduce((sum, agg) => sum + agg.coins_5, 0);
  const total10Peso = data.reduce((sum, agg) => sum + agg.coins_10, 0);
  const total20Peso = data.reduce((sum, agg) => sum + agg.coins_20, 0);

  const uniqueDays = new Set(
    data.map((agg) => new Date(agg.timestamp).toLocaleDateString())
  ).size;

  return (
    <div className="space-y-4">
      <div className="mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-md text-sm text-center">
        Summary Today will be generated at exactly 11:49 PM
      </div>
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Total Earnings
            </h2>
          </div>
          <p className="text-2xl font-bold text-green-700">
            ₱{grandTotal.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            From {totalSales}{" "}
            {totalSales === 1 ? "transaction" : "transactions"} across{" "}
            {uniqueDays} {uniqueDays === 1 ? "day" : "days"}
          </p>
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto border rounded-lg bg-card">
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 border-b text-sm font-medium text-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Date & Time</span>
                </div>
              </th>
              <th className="p-3 border-b text-sm font-medium text-foreground">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-muted-foreground" />
                  <span>1 Peso Coins</span>
                </div>
              </th>
              <th className="p-3 border-b text-sm font-medium text-foreground">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-muted-foreground" />
                  <span>5 Peso Coins</span>
                </div>
              </th>
              <th className="p-3 border-b text-sm font-medium text-foreground">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-muted-foreground" />
                  <span>10 Peso Coins</span>
                </div>
              </th>
              <th className="p-3 border-b text-sm font-medium text-foreground">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-muted-foreground" />
                  <span>20 Peso Coins</span>
                </div>
              </th>
              <th className="p-3 border-b text-sm font-medium text-foreground">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span>Transactions</span>
                </div>
              </th>
              <th className="p-3 border-b text-sm font-medium text-foreground">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span>Amount Earned</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((agg) => (
              <tr key={agg.id} className="hover:bg-muted/30">
                <td className="p-3 border-b text-sm text-foreground">
                  {new Date(agg.timestamp).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="p-3 border-b text-sm text-foreground">
                  {agg.coins_1}
                </td>
                <td className="p-3 border-b text-sm text-foreground">
                  {agg.coins_5}
                </td>
                <td className="p-3 border-b text-sm text-foreground">
                  {agg.coins_10}
                </td>
                <td className="p-3 border-b text-sm text-foreground">
                  {agg.coins_20}
                </td>
                <td className="p-3 border-b text-sm text-foreground">
                  {agg.sales_count}
                </td>
                <td className="p-3 border-b text-sm font-semibold text-green-700">
                  ₱{agg.total.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Version */}
      <div className="md:hidden space-y-4">
        {data.map((agg) => (
          <Card key={agg.id} className="border border-muted/20">
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {new Date(agg.timestamp).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="text-sm font-semibold text-green-700">
                  ₱{agg.total.toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between text-sm">
                  <span>1 Peso:</span> <span>{agg.coins_1}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>5 Peso:</span> <span>{agg.coins_5}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>10 Peso:</span> <span>{agg.coins_10}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>20 Peso:</span> <span>{agg.coins_20}</span>
                </div>
                <div className="flex justify-between text-sm col-span-2">
                  <span>Transactions:</span> <span>{agg.sales_count}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

function UnitPageClient() {
  const { unitId } = useParams<{ unitId: string }>();
  const { units, loading: unitsLoading, error: unitsError } = useUnitsContext();
  const unit = units.find((u) => u.deviceId === unitId);

  const {
    aggregates,
    loading: aggLoading,
    fetchAggregates,
  } = useUnitAggregates(unitId);

  React.useEffect(() => {
    if (unitId) fetchAggregates();
  }, [unitId, fetchAggregates]);

  if (unitsLoading || aggLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (unitsError || !unit) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <UnitHeader deviceId={unitId} alias={unit?.alias} />
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-destructive/10 rounded-full mb-4">
                <Activity className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Error Loading Unit Data
              </h3>
              <p className="text-muted-foreground text-center">
                Unit not found or failed to load data.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!aggregates || aggregates.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <UnitHeader deviceId={unitId} alias={unit.alias} />
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-muted rounded-full mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Data Available
              </h3>
              <p className="text-muted-foreground text-center">
                No transaction data available yet.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UnitHeader deviceId={unitId} alias={unit.alias} />
        <UnitAggregatesTable data={aggregates} />
      </div>
    </div>
  );
}

export default UnitPageClient;
