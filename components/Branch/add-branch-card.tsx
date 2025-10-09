"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import AddBranchModal from "./AddbranchModal";
import { Button } from "@/components/ui/button";

export function AddBranchCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
        className="bg-foreground/90 gap-2 border-lime-500 text-lime-600 hover:bg-lime-50 hover:text-lime-700 dark:border-lime-400 dark:text-lime-400 dark:hover:bg-lime-950 dark:hover:text-lime-300"
      >
        <Plus className="h-4 w-4" />
        Add Branch
      </Button>

      <AddBranchModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
