"use client";

import { motion } from "framer-motion";
import { useBranches } from "@/hooks/use-branches-query";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUnits } from "@/hooks/use-units-query";
import { Loader2 } from "lucide-react";

interface AssignBranchModalProps {
  deviceId: string;
  onClose: () => void;
}

export function AssignBranchModal({
  deviceId,
  onClose,
}: AssignBranchModalProps) {
  const { data: branches = [] } = useBranches();
  const { assignUnit, units } = useUnits();

  // Get current unit for better UX
  const currentUnit = units.find((unit) => unit.deviceId === deviceId);
  const currentBranchName = branches.find(
    (b) => b.id === currentUnit?.branchId
  )?.location;

  const assignBranch = (branchId: string) => {
    assignUnit.mutate(
      { deviceId, branchId },
      {
        onSuccess: () => {
          // Small delay to show success state
          setTimeout(onClose, 300);
        },
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-card rounded-lg shadow-lg p-4 grid grid-cols-3 gap-3 max-w-md w-full">
        {branches.map((b) => {
          const isAssigning =
            assignUnit.isPending && assignUnit.variables?.branchId === b.id;
          const isCurrentBranch = currentUnit?.branchId === b.id;

          return (
            <Card
              key={b.id}
              onClick={() => !isAssigning && assignBranch(b.id)}
              className={`cursor-pointer p-3 transition-all ${
                isAssigning
                  ? "bg-blue-50 border-blue-200"
                  : isCurrentBranch
                  ? "bg-green-50 border-green-200"
                  : "hover:shadow-md hover:border-primary/50"
              } ${isAssigning ? "cursor-not-allowed opacity-80" : ""}`}
            >
              <CardContent className="text-center relative">
                {isAssigning && (
                  <Loader2 className="w-4 h-4 animate-spin absolute top-1 right-1 text-blue-500" />
                )}
                {isCurrentBranch && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
                )}
                <CardTitle className="text-sm line-clamp-1">
                  {b.location}
                </CardTitle>
                <CardDescription className="text-xs line-clamp-1">
                  {b.branch_manager}
                </CardDescription>
                <CardDescription className="text-xs text-muted-foreground">
                  Share: {b.share}%
                </CardDescription>
                {isCurrentBranch && (
                  <CardDescription className="text-xs text-green-600 font-medium mt-1">
                    Current
                  </CardDescription>
                )}
                {isAssigning && (
                  <CardDescription className="text-xs text-blue-600 font-medium mt-1">
                    Assigning...
                  </CardDescription>
                )}
              </CardContent>
            </Card>
          );
        })}
        <Button
          onClick={onClose}
          className="col-span-3 mt-2"
          disabled={assignUnit.isPending}
        >
          {assignUnit.isPending ? "Processing..." : "Cancel"}
        </Button>
      </div>
    </motion.div>
  );
}
