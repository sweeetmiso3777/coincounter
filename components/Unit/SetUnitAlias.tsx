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
import { Loader2 } from "lucide-react";

interface SetUnitAliasProps {
  deviceId: string;
  onClose: () => void;
}

export function SetUnitAlias({ deviceId, onClose }: SetUnitAliasProps) {
  const { updateAlias, units } = useUnits();
  const [alias, setAlias] = useState("");

  const currentUnit = units.find((unit) => unit.deviceId === deviceId);
  const currentAlias = currentUnit?.alias || "";

  const handleSetAlias = () => {
    if (alias.trim()) {
      updateAlias.mutate(
        { deviceId, alias: alias.trim() },
        {
          onSuccess: () => {
            setTimeout(onClose, 300);
          },
        }
      );
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
            <div className="flex items-center justify-center gap-2">
              {updateAlias.isPending && (
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              )}
              <CardTitle className="text-sm text-center">
                Set Unit Alias
              </CardTitle>
            </div>

            {currentAlias && (
              <CardDescription className="text-xs text-center text-muted-foreground">
                Current: &ldquo;{currentAlias}&rdquo;
              </CardDescription>
            )}

            <CardDescription className="text-xs text-center text-foreground">
              Enter a new alias for this unit.
            </CardDescription>

            <Input
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Enter alias"
              className="text-center text-foreground"
              disabled={updateAlias.isPending}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  alias.trim() &&
                  !updateAlias.isPending
                ) {
                  handleSetAlias();
                }
              }}
            />

            <div className="flex gap-2 mt-2">
              <Button
                className="flex-1 relative"
                onClick={handleSetAlias}
                disabled={!alias.trim() || updateAlias.isPending}
              >
                {updateAlias.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Alias"
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={updateAlias.isPending}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
