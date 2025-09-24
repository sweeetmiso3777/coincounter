// src/components/backup-card.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Clock, Monitor } from "lucide-react";
import type { BackupDocument } from "@/hooks/use-backups-query";
import type { Timestamp as FirestoreTimestamp } from "firebase/firestore";

function formatUploadedAt(ts: FirestoreTimestamp | string) {
  let date: Date;
  if (typeof ts === "string") date = new Date(ts);
  else if (ts?.seconds) date = new Date(ts.seconds * 1000);
  else if (typeof ts?.toDate === "function") date = ts.toDate();
  else date = new Date();
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BackupCard({ backup }: { backup: BackupDocument }) {
  const coins = [
    { label: "₱1", value: backup.coins_1 },
    { label: "₱5", value: backup.coins_5 },
    { label: "₱10", value: backup.coins_10 },
    { label: "₱20", value: backup.coins_20 },
  ].filter((c) => c.value > 0);

  return (
    <Card className="hover:shadow-md transition-shadow bg-card border-border">
      <CardContent className="px-3 flex items-center justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
          <div className="flex items-start space-x-2">
            <Monitor className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {backup.branchId}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground mt-0.5">
                {backup.deviceId}
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">
                Last Online: {backup.lastOnline}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 mt-2 sm:mt-0">
            <Coins className="h-4 w-4 text-amber-500" />
            <div className="flex flex-wrap gap-1">
              {coins.map((c, i) => (
                <span
                  key={i}
                  className="text-xs font-medium px-2 py-0.5 rounded-md
                             bg-amber-50 dark:bg-amber-900/20
                             text-amber-800 dark:text-amber-300
                             border border-amber-200 dark:border-amber-800"
                >
                  {c.label} × <span className="font-semibold">{c.value}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <Badge
            variant="outline"
            className="bg-green-50 dark:bg-green-900/20 text-green-700
                       dark:text-green-400 border-green-200 dark:border-green-800 mb-0.5
                       text-base px-2 py-0.5"
          >
            ₱{backup.total}
          </Badge>
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            {formatUploadedAt(backup.uploadedAt)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
