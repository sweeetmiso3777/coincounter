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
        className="bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer group"
      >
        <div className="p-6 h-full flex flex-col items-center justify-center min-h-[280px]">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors flex items-center justify-center">
              <Plus className="h-8 w-8 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
                Add New Branch
              </h3>
              <p className="text-sm text-gray-500 mt-1">
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
