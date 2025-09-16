import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Clock, Monitor, Microchip } from "lucide-react";
import type { SalesDocument } from "@/types/sales";

interface SalesCardProps {
  sale: SalesDocument;
}

export function SalesCard({ sale }: SalesCardProps) {
  const formatTimestamp = (timestamp: any) => {
    const date = timestamp.toDate();
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const { date, time } = formatTimestamp(sale.timestamp);

  const coinDenominations = [
    { value: sale.coins_1, denomination: "₱1", count: sale.coins_1 },
    { value: sale.coins_5, denomination: "₱5", count: sale.coins_5 },
    { value: sale.coins_10, denomination: "₱10", count: sale.coins_10 },
    { value: sale.coins_20, denomination: "₱20", count: sale.coins_20 },
  ].filter((coin) => coin.count > 0);

  return (
    <Card className="hover:shadow-md transition-shadow bg-card border-border">
      <CardContent className="px-3 flex items-center justify-between">
        {/* Left side: Device + Coins */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
          <div className="flex items-center space-x-1">
            <Microchip className="h-4 w-4 text-blue-500" />
            <span className="font-mono text-sm font-medium text-foreground">
              {sale.deviceId}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Coins className="h-4 w-4 text-amber-500" />
            <div className="flex flex-wrap gap-1">
              {coinDenominations.map((coin, index) => (
                <span
                  key={index}
                  className="text-xs font-medium px-2 py-0.5 rounded-md 
               bg-amber-50 dark:bg-amber-900/20 
               text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                >
                  {coin.denomination} ×{" "}
                  <span className="font-semibold">{coin.count}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right side: Amount + Date */}
        <div className="flex flex-col items-end">
          <Badge
            variant="outline"
            className="bg-green-50 dark:bg-green-900/20 text-green-700 
                 dark:text-green-400 border-green-200 dark:border-green-800 mb-0.5 
                 text-base px-2 py-0.5"
          >
            ₱{sale.total}
          </Badge>
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            <span>
              {date} at {time}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
