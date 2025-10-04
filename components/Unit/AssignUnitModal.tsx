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

interface AssignBranchModalProps {
  deviceId: string;
  onClose: () => void;
}

export function AssignBranchModal({
  deviceId,
  onClose,
}: AssignBranchModalProps) {
  const { data: branches = [] } = useBranches();
  const { assignUnit } = useUnits();

  const assignBranch = (branchId: string) => {
    assignUnit.mutate({ deviceId, branchId });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-card rounded-lg shadow-lg p-4 grid grid-cols-3 gap-3 max-w-md w-full">
        {branches.map((b) => (
          <Card
            key={b.id}
            onClick={() => assignBranch(b.id)}
            className="cursor-pointer p-3 hover:shadow-md transition"
          >
            <CardContent className="text-center">
              <CardTitle className="text-sm line-clamp-1">
                {b.location}
              </CardTitle>
              <CardDescription className="text-xs line-clamp-1">
                {b.branch_manager}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
        <Button onClick={onClose} className="col-span-3 mt-2">
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}
