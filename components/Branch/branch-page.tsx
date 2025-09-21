"use client";

import { BranchCard } from "@/components/Branch/branch-card";
import { AddBranchCard } from "@/components/Branch/add-branch-card";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { TrendingUp, Coins, Clock } from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

export interface Branch {
  id: string;
  branch_manager: string;
  created_at: Date;
  harvest_day_of_month: number;
  location: string;
  share: number;
}

export interface BranchWithUnits extends Branch {
  totalUnits: number;
  onlineUnits: number;
}

interface BranchPageProps {
  branches: Branch[];
}

function AnimatedNumber({
  value,
  decimals = 0,
}: {
  value: number;
  decimals?: number;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) =>
    decimals > 0 ? Number(latest.toFixed(decimals)) : Math.round(latest)
  );

  animate(count, value, { duration: 2.5, ease: "easeOut" });

  return <motion.span>{rounded}</motion.span>;
}

export function BranchPage({ branches }: BranchPageProps) {
  const [branchesWithUnits, setBranchesWithUnits] = useState<BranchWithUnits[]>(
    []
  );

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    const enrichedBranches = branches.map((branch) => {
      const q = query(
        collection(db, "Units"),
        where("branchId", "==", branch.id)
      );
      const branchData: BranchWithUnits = {
        ...branch,
        totalUnits: 0,
        onlineUnits: 0,
      };

      const unsub = onSnapshot(q, (snapshot) => {
        branchData.totalUnits = snapshot.size;
        branchData.onlineUnits = snapshot.docs.filter(
          (d) => d.data().status === "online"
        ).length;
        setBranchesWithUnits((prev) => {
          const others = prev.filter((b) => b.id !== branch.id);
          return [...others, branchData];
        });
      });

      unsubscribes.push(unsub);
      return branchData;
    });

    setBranchesWithUnits(enrichedBranches);

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [branches]);

  const totalBranches = branches.length;
  const totalActive = 4; // calculate as needed
  const totalInactive = totalBranches - totalActive;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">
            Branch Management Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage and monitor all your PISONET branches
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-[2px] mb-8">
          <div className="flex flex-col border-l-2 border-current pl-2">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">
                Total Branches
              </span>
            </div>
            <div className="text-xl font-bold text-foreground">
              <AnimatedNumber value={totalBranches} />
            </div>
            <p className="text-xs text-muted-foreground">All branches</p>
          </div>

          <div className="flex flex-col border-l-2 border-current pl-2">
            <div className="flex items-center gap-1">
              <Coins className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
            <div className="text-xl font-bold text-foreground">
              <AnimatedNumber value={totalActive} />
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </div>

          <div className="flex flex-col border-l-2 border-current pl-2">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Inactive</span>
            </div>
            <div className="text-xl font-bold text-foreground">
              <AnimatedNumber value={totalInactive} />
            </div>
            <p className="text-xs text-muted-foreground">Currently inactive</p>
          </div>

          <div className="flex flex-col border-l-2 border-current pl-2">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">
                Recently Added
              </span>
            </div>
            <div className="text-xl font-bold text-foreground">
              {branches.slice(-1).length}
            </div>
            <p className="text-xs text-muted-foreground">New this session</p>
          </div>
        </div>

        {/* Branches Grid */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            All Branches ({branches.length})
          </h2>

          {branchesWithUnits.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No branches found
                </h3>
                <p className="text-muted-foreground mb-6">
                  Get started by creating your first branch to track harvests
                  and manage operations.
                </p>
                <AddBranchCard />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AddBranchCard />
              {branchesWithUnits.map((branch) => (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  totalUnits={branch.totalUnits}
                  onlineUnits={branch.onlineUnits}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
