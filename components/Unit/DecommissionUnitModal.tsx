"use client";

import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useUnits } from "@/hooks/use-units-query";
import { Info } from "lucide-react";

interface DecommissionModalProps {
  deviceId: string;
  onClose: () => void;
}

export function DecommissionModal({
  deviceId,
  onClose,
}: DecommissionModalProps) {
  const { decommissionUnit, units } = useUnits();
  const [confirmation, setConfirmation] = useState("");

  // Get the current unit to show branch info in confirmation
  const currentUnit = units.find((unit) => unit.deviceId === deviceId);
  const currentBranchLocation =
    currentUnit?.branchLocation || currentUnit?.branch;

  const handleDecommission = () => {
    if (confirmation === "CONFIRM") {
      decommissionUnit.mutate({ deviceId });
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-card rounded-lg shadow-lg p-4 max-w-md w-full">
        <Card className="p-3">
          <CardContent className="flex flex-col gap-3">
            <CardTitle className="text-sm text-center text-red-600">
              Confirm Decommission
            </CardTitle>

            {currentBranchLocation && (
              <CardDescription className="text-xs text-center text-foreground">
                Remove from: <strong>{currentBranchLocation}</strong>
              </CardDescription>
            )}

            <div className="flex items-center justify-center gap-1">
              <CardDescription className="text-xs text-center text-foreground">
                Please type <strong>CONFIRM</strong> to decommission this unit.
              </CardDescription>
              <div className="group relative">
                <Info className="h-3 w-3 text-muted-foreground cursor-help shrink-0" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-md shadow-lg border w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                  Decommissioning a unit means its sales will not be counted in
                  any of the branch harvests.
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-popover"></div>
                </div>
              </div>
            </div>

            <Input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="Type CONFIRM"
              className="text-center text-foreground"
            />

            <div className="flex gap-2 mt-2">
              <Button
                variant="destructive"
                className="flex-1 text-foreground"
                disabled={confirmation !== "CONFIRM"}
                onClick={handleDecommission}
              >
                Decommission
              </Button>
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
