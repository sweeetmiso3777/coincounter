import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Clock, Monitor } from "lucide-react";
import type { SalesDocument } from "@/types/sales";
import type { Timestamp as FirestoreTimestamp } from "firebase/firestore";

interface SalesCardProps {
  sale: SalesDocument & {
    branchName?: string;
    alias?: string;
  };
}

export function SalesCard({ sale }: SalesCardProps) {
  const formatTimestamp = (timestamp: FirestoreTimestamp) => {
    let date: Date;

    // Handle serialized Firestore timestamp
    if (timestamp && typeof timestamp === "object" && timestamp.seconds) {
      date = new Date(
        timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000
      );
    }
    // Handle Firestore Timestamp object
    else if (timestamp && typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    }
    // Handle JavaScript Date
    else if (timestamp instanceof Date) {
      date = timestamp;
    }
    // Handle string timestamp
    else if (typeof timestamp === "string") {
      date = new Date(timestamp);
    } else {
      console.warn("[SalesCard] Unable to parse timestamp:", timestamp);
      date = new Date(); // fallback to current date
    }

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

  const { date, time } = formatTimestamp(sale.timestamp as FirestoreTimestamp);

  const coinDenominations = [
    { denomination: "₱1", count: sale.coins_1 },
    { denomination: "₱5", count: sale.coins_5 },
    { denomination: "₱10", count: sale.coins_10 },
    { denomination: "₱20", count: sale.coins_20 },
  ].filter((coin) => coin.count > 0);

  const branchName = sale.branchName || "";
  const deviceAlias =
    sale.alias && sale.alias.trim() !== "" ? sale.alias : "Alias";

  return (
    <Card className="hover:shadow-md transition-shadow bg-card border-border">
      <CardContent className="px-3 flex items-center justify-between">
        {/* Left side */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
          {/* Monitor + Branch & Alias */}
          <div className="flex items-start space-x-2">
            <Monitor className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <div className="flex space-x-2">
                <span className="text-sm font-semibold text-foreground">
                  {branchName}
                </span>
                <span className="font-mono text-sm font-medium text-foreground">
                  {deviceAlias}
                </span>
              </div>
              {/* Device ID directly below */}
              <span className="font-mono text-[11px] text-muted-foreground mt-0.5 ml-1">
                {sale.deviceId}
              </span>
            </div>
          </div>

          {/* Coins */}
          <div className="flex items-center space-x-2 mt-2 sm:mt-0">
            <Coins className="h-4 w-4 text-amber-500" />
            <div className="flex flex-wrap gap-1">
              {coinDenominations.map((coin, i) => (
                <span
                  key={i}
                  className="text-xs font-medium px-2 py-0.5 rounded-md
                             bg-amber-50 dark:bg-amber-900/20
                             text-amber-800 dark:text-amber-300
                             border border-amber-200 dark:border-amber-800"
                >
                  {coin.denomination} ×{" "}
                  <span className="font-semibold">{coin.count}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right side */}
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
