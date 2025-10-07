"use client";

import { useEffect, useState } from "react";
import { useUnits } from "@/hooks/use-units-query";
import { useBranches } from "@/hooks/use-branches-query";
import { useSalesQuery } from "@/hooks/use-sales-query";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, MoreVertical, Pencil } from "lucide-react";
import Link from "next/link";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { AssignBranchModal } from "./AssignUnitModal";
import { DecommissionModal } from "./DecommissionUnitModal";
import { SetUnitAlias } from "./SetUnitAlias";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// number animation
function AnimatedNumber({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.5, ease: "easeOut" });
    return controls.stop;
  }, [value, count]);

  return <motion.span>{rounded}</motion.span>;
}

export function UnitsPageCards() {
  const { units, loading, error, decommissionUnit } = useUnits();
  const { data: branches = [] } = useBranches();
  const { data: sales = [] } = useSalesQuery();

  const branchMap = new Map(branches.map((branch) => [branch.id, branch]));

  const [assignModalUnitId, setAssignModalUnitId] = useState<string | null>(
    null
  );
  const [decommissionModalUnitId, setDecommissionModalUnitId] = useState<
    string | null
  >(null);
  const [aliasModalUnitId, setAliasModalUnitId] = useState<string | null>(null); // 👈 alias modal state

  if (loading) return <p>Loading units...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  const unitsWithBranch = units.filter((u) => u.branchId);
  const unitsWithoutBranch = units.filter((u) => !u.branchId);

  return (
    <div className="flex gap-6">
      {/* Grid for assigned units */}
      <div
        className={`flex-1 grid gap-4 ${
          unitsWithoutBranch.length > 0 ? "grid-cols-4" : "grid-cols-5"
        }`}
      >
        {unitsWithBranch.map((unit) => {
          const branch = branchMap.get(unit.branchId);
          const branchLocation = branch?.location || "Unknown Location";

          // Total sales for this unit today
          const totalToday = sales
            .filter((s) => s.deviceId === unit.deviceId)
            .reduce((sum, sale) => sum + (sale.total || 0), 0);

          return (
            <div key={unit.deviceId} className="relative group">
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative"
              >
                <Card className="bg-card border shadow-sm hover:shadow-md transition aspect-square flex flex-col w-50 relative">
                  <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-4">
                    <Monitor className="w-10 h-10 text-muted-foreground mb-2" />

                    {/* Alias with pencil button */}
                    <div className="flex items-center gap-1 mb-1">
                      <CardTitle className="text-sm line-clamp-2">
                        {unit.alias || "No Alias Yet"}
                      </CardTitle>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-4 h-4 p-0"
                        onClick={() => setAliasModalUnitId(unit.deviceId)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </div>

                    <CardDescription className="text-xs mb-1 truncate w-full">
                      {unit.deviceId}
                    </CardDescription>

                    <div className="text-xs text-green-600 font-medium mb-2 line-clamp-2">
                      {branchLocation}
                    </div>

                    {/* Simple total earned today */}
                    <div className="mt-auto pt-2 text-sm font-medium text-foreground">
                      Total Earned Today:{" "}
                      <span className="text-green-600">₱</span>
                      <span className="text-green-600">
                        <AnimatedNumber value={totalToday} />
                      </span>
                    </div>

                    {/* Link to unit details */}
                    <Link href={`/units/${unit.deviceId}`} passHref>
                      <Button
                        size="sm"
                        variant="link"
                        className="text-blue-500 p-0 h-auto text-xs mt-2"
                      >
                        View Details
                      </Button>
                    </Link>
                  </CardContent>

                  {/* Burger menu for mobile */}
                  <div className="absolute top-2 right-2 md:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-8 h-8 p-0"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setAssignModalUnitId(unit.deviceId)}
                        >
                          Assign
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setAssignModalUnitId(unit.deviceId)}
                        >
                          Reassign
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            setDecommissionModalUnitId(unit.deviceId)
                          }
                          className="text-red-600"
                        >
                          Decommission
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              </motion.div>

              {/* Desktop hover actions */}
              <div className="hidden md:flex absolute top-1/2 -right-20 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-col gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/80 backdrop-blur-sm hover:bg-background text-foreground border-gray-300 px-3 py-1 text-xs"
                  onClick={() => setAssignModalUnitId(unit.deviceId)}
                >
                  Assign
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/80 backdrop-blur-sm hover:bg-background text-foreground border-gray-300 px-3 py-1 text-xs"
                  onClick={() => setAssignModalUnitId(unit.deviceId)}
                >
                  Reassign
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/80 backdrop-blur-sm hover:bg-background text-red-600 border-gray-300 px-3 py-1 text-xs"
                  onClick={() => setDecommissionModalUnitId(unit.deviceId)}
                  disabled={decommissionUnit.isPending}
                >
                  {decommissionUnit.isPending
                    ? "Decommissioning..."
                    : "Decommission"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sidebar for unassigned units */}
      {unitsWithoutBranch.length > 0 && (
        <div className="w-72 sticky top-20 h-fit space-y-2 border-l border-muted p-4 bg-card/90 backdrop-blur-sm">
          <h2 className="text-lg font-semibold">Unassigned Units</h2>
          {unitsWithoutBranch.map((unit) => (
            <Card key={unit.deviceId} className="p-3 bg-card/80">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>{unit.alias || "No Alias Yet"}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-4 h-4 p-0"
                  onClick={() => setAliasModalUnitId(unit.deviceId)}
                >
                  <Pencil className="w-3 h-3" />
                </Button>
              </CardTitle>
              <CardDescription className="text-xs mb-2">
                Device ID: {unit.deviceId}
              </CardDescription>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => setAssignModalUnitId(unit.deviceId)}
              >
                Assign to Branch
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Assign / Reassign Modal */}
      <AnimatePresence>
        {assignModalUnitId && (
          <AssignBranchModal
            deviceId={assignModalUnitId}
            onClose={() => setAssignModalUnitId(null)}
          />
        )}
      </AnimatePresence>

      {/* Decommission Modal */}
      <AnimatePresence>
        {decommissionModalUnitId && (
          <DecommissionModal
            deviceId={decommissionModalUnitId}
            onClose={() => setDecommissionModalUnitId(null)}
          />
        )}
      </AnimatePresence>

      {/* Set Alias Modal */}
      <AnimatePresence>
        {aliasModalUnitId && (
          <SetUnitAlias
            deviceId={aliasModalUnitId}
            onClose={() => setAliasModalUnitId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
