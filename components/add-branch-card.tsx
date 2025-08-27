"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import AddBranchModal from "./AddbranchModal";

export function AddBranchCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="bg-card rounded-lg border-2 border-dashed border-border hover:border-muted-foreground transition-colors cursor-pointer group"
      >
        <div className="p-6 h-full flex flex-col items-center justify-center min-h-[280px]">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted group-hover:bg-accent transition-colors flex items-center justify-center">
              <Plus className="h-8 w-8 text-muted-foreground group-hover:text-accent-foreground transition-colors" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-foreground group-hover:text-muted-foreground transition-colors">
                Add New Branch
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Click to create a new branch
              </p>
            </div>
          </div>
        </div>
      </div>

      <AddBranchModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
