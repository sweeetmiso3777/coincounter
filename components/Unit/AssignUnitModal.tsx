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
import { Loader2, MapPin, User, Percent, Check } from "lucide-react";

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
      {/* Desktop: Grid Cards | Mobile: Compact List */}
      <div className="hidden sm:block bg-card rounded-xl shadow-xl border p-4 max-w-2xl w-full">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Assign to Branch
          </h2>
          <p className="text-sm text-muted-foreground">
            Select a branch for this device
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {branches.map((b) => {
            const isAssigning =
              assignUnit.isPending && assignUnit.variables?.branchId === b.id;
            const isCurrentBranch = currentUnit?.branchId === b.id;

            return (
              <Card
                key={b.id}
                onClick={() => !isAssigning && assignBranch(b.id)}
                className={`cursor-pointer p-3 transition-all border-2 hover:shadow-md ${
                  isAssigning
                    ? "bg-blue-50 border-blue-300 shadow-blue-100"
                    : isCurrentBranch
                    ? "bg-green-50 border-green-300 shadow-green-100"
                    : "bg-card hover:border-primary/30 border-border"
                } ${isAssigning ? "cursor-not-allowed opacity-80" : ""}`}
              >
                <CardContent className="text-center relative p-0">
                  {isAssigning && (
                    <Loader2 className="w-4 h-4 animate-spin absolute top-1 right-1 text-blue-600" />
                  )}
                  {isCurrentBranch && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-green-600 rounded-full" />
                  )}
                  <CardTitle className="text-sm font-medium text-foreground line-clamp-1">
                    {b.location}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground line-clamp-1">
                    {b.branch_manager}
                  </CardDescription>
                  <CardDescription className="text-xs text-blue-600 font-medium">
                    Share: {b.share}%
                  </CardDescription>
                  {isCurrentBranch && (
                    <CardDescription className="text-xs text-green-700 font-medium mt-1">
                      Current
                    </CardDescription>
                  )}
                  {isAssigning && (
                    <CardDescription className="text-xs text-blue-700 font-medium mt-1">
                      Assigning...
                    </CardDescription>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        <Button
          onClick={onClose}
          className="w-full mt-4"
          variant="outline"
          disabled={assignUnit.isPending}
        >
          {assignUnit.isPending ? "Processing..." : "Cancel"}
        </Button>
      </div>

      {/* Mobile: Compact List */}
      <div className="sm:hidden bg-card rounded-xl shadow-xl border w-full max-w-sm max-h-[70vh] overflow-hidden flex flex-col">
        {/* Header - compact */}
        <div className="p-3 border-b bg-muted/30">
          <h2 className="text-sm font-semibold text-foreground">
            Assign to Branch
          </h2>
          <p className="text-xs text-muted-foreground">
            Select a branch for this device
          </p>
        </div>

        {/* Branches List - super compact and scrollable */}
        <div className="overflow-y-auto flex-1">
          {branches.map((b) => {
            const isAssigning =
              assignUnit.isPending && assignUnit.variables?.branchId === b.id;
            const isCurrentBranch = currentUnit?.branchId === b.id;

            return (
              <div
                key={b.id}
                onClick={() => !isAssigning && assignBranch(b.id)}
                className={`border-b last:border-b-0 p-3 transition-all ${
                  isAssigning
                    ? "bg-blue-50 border-blue-200"
                    : isCurrentBranch
                    ? "bg-green-50 border-green-200"
                    : "hover:bg-accent/50 active:bg-accent border-border"
                } ${
                  isAssigning
                    ? "cursor-not-allowed opacity-80"
                    : "cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Icons with color */}
                  <div className="flex-shrink-0">
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground line-clamp-1">
                        {b.location}
                      </span>
                      <div className="flex items-center gap-2 ml-2">
                        {isCurrentBranch && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 border border-green-200">
                            <Check className="w-3 h-3" />
                            Current
                          </span>
                        )}
                        {isAssigning && (
                          <Loader2 className="w-3 h-3 animate-spin text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-3 h-3 text-purple-600 flex-shrink-0" />
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {b.branch_manager}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Percent className="w-3 h-3 text-orange-600 flex-shrink-0" />
                      <span className="text-xs font-medium text-blue-600">
                        Share: {b.share}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer - compact */}
        <div className="p-3 border-t bg-muted/30">
          <Button
            onClick={onClose}
            className="w-full h-9"
            variant="outline"
            disabled={assignUnit.isPending}
          >
            {assignUnit.isPending ? "Processing..." : "Cancel"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
