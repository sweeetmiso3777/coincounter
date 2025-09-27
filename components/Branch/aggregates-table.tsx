"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, CreditCard, Coins } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { HistoricalAggregate } from "@/types/aggregates";

interface AggregatesTableProps {
  data: HistoricalAggregate[];
  location: string;
}

export function AggregatesTable({ data, location }: AggregatesTableProps) {
  const MotionCell = motion(TableCell);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-yellow-500" />
          <h2 className="text-xl font-semibold">
            Aggregates History for {location}
          </h2>
        </div>
        <span className="text-sm text-muted-foreground">
          Showing {data.length} days
        </span>
      </div>

      <div className="rounded-lg border border-border bg-background shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Date</TableHead>
              <TableHead className="text-right">
                <TrendingUp className="inline h-4 w-4 mr-1 text-green-600" />
                Revenue
              </TableHead>
              <TableHead className="text-right">
                <CreditCard className="inline h-4 w-4 mr-1 text-blue-600" />
                Transactions
              </TableHead>
              <TableHead className="text-right">₱1</TableHead>
              <TableHead className="text-right">₱5</TableHead>
              <TableHead className="text-right">₱10</TableHead>
              <TableHead className="text-right">₱20</TableHead>
              <TableHead className="text-right">Total Coins</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <AnimatePresence>
              {data.length ? (
                data.map((row, i) => (
                  <TableRow
                    key={row.date}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <MotionCell
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="font-medium"
                    >
                      {row.date}
                    </MotionCell>
                    <MotionCell className="text-right font-semibold text-green-600">
                      ₱{row.totalRevenue.toLocaleString()}
                    </MotionCell>
                    <MotionCell className="text-right">
                      {row.totalTransactions.toLocaleString()}
                    </MotionCell>
                    <MotionCell className="text-right">
                      {row.coinBreakdown.peso1.toLocaleString()}
                    </MotionCell>
                    <MotionCell className="text-right">
                      {row.coinBreakdown.peso5.toLocaleString()}
                    </MotionCell>
                    <MotionCell className="text-right">
                      {row.coinBreakdown.peso10.toLocaleString()}
                    </MotionCell>
                    <MotionCell className="text-right">
                      {row.coinBreakdown.peso20.toLocaleString()}
                    </MotionCell>
                    <MotionCell className="text-right font-medium">
                      {row.totalCoins?.toLocaleString() || 0}
                    </MotionCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No aggregate data available.
                  </TableCell>
                </TableRow>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
