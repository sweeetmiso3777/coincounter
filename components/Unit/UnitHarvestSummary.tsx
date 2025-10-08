"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CircleDollarSign,
  Coins,
  TrendingUp,
  CheckCircle,
  Calendar,
  Download,
} from "lucide-react";
import type { HarvestResult } from "@/hooks/use-unit-harvest";
import { generateHarvestPDF } from "@/lib/pdf-export";

interface UnitHarvestSummaryProps {
  open: boolean;
  onClose: () => void;
  result: HarvestResult;
  unitAlias: string;
}

export function UnitHarvestSummary({
  open,
  onClose,
  result,
  unitAlias,
}: UnitHarvestSummaryProps) {
  const formatDateRange = () => {
    if (result.harvestedDates.length === 1) {
      return result.harvestedDates[0];
    }
    return `${result.dateRange.start} to ${result.dateRange.end}`;
  };

  const handleExportPDF = () => {
    generateHarvestPDF(result, unitAlias, result.branchLocation);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Harvest Complete
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Card */}
          <Card className="bg-card border-green-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-3 bg-green-100 rounded-full">
                    <CircleDollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <h3 className="font-semibold text-green-800 mb-1">
                  {unitAlias}
                </h3>

                {/* Branch Location */}
                <div className="text-sm text-green-600 mb-2">
                  Branch: {result.branchLocation}
                </div>

                <p className="text-sm text-green-600 mb-3">
                  Successfully harvested {result.documentsUpdated} day
                  {result.documentsUpdated !== 1 ? "s" : ""} of data
                </p>

                <div className="flex items-center justify-center gap-2 mb-3 text-sm text-green-700">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">{formatDateRange()}</span>
                </div>

                {/* Total Amount */}
                <div className="text-2xl font-bold text-green-700 mb-4">
                  ₱{result.totalHarvested.toFixed(2)}
                </div>
              </div>

              {/* Coin Breakdown - This was missing! */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-blue-600" />
                  <span>₱1 Coins:</span>
                  <span className="font-semibold ml-auto">
                    {result.coins_1}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-blue-600" />
                  <span>₱5 Coins:</span>
                  <span className="font-semibold ml-auto">
                    {result.coins_5}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-blue-600" />
                  <span>₱10 Coins:</span>
                  <span className="font-semibold ml-auto">
                    {result.coins_10}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-blue-600" />
                  <span>₱20 Coins:</span>
                  <span className="font-semibold ml-auto">
                    {result.coins_20}
                  </span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span>Total Transactions:</span>
                  <span className="font-semibold ml-auto">
                    {result.sales_count}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              onClick={handleExportPDF}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            <Button
              onClick={onClose}
              className="bg-green-600 hover:bg-green-700"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
