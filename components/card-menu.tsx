"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";
import EditBranchModal from "./EditBranchModal";

interface CardMenuProps {
  branchId: string; // Firestore document ID
  branchData: {
    branch_manager: string;
    location: string;
    date_of_harvest: Date | Timestamp | string;
    share: number;
  };
}

export function CardMenu({ branchId, branchData }: CardMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(false); // controls edit modal
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this branch?")) return;
    try {
      await deleteDoc(doc(db, "Branches", branchId));
      console.log("Branch deleted:", branchId);
    } catch (error) {
      console.error("Failed to delete branch:", error);
    }
  };

  return (
    <div className="relative cursor-pointer" ref={menuRef}>
      {/* Menu Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 rounded-full hover:bg-accent transition-colors"
        aria-label="More options"
      >
        <MoreVertical className="h-5 w-5 text-muted-foreground cursor-pointer" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-8 w-32 bg-popover rounded-md shadow-lg border border-border py-1 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              console.log("Editing branch with ID:", branchId);
              setEditing(true); // Open modal
            }}
            className="w-full px-3 py-2 text-left text-sm text-popover-foreground hover:bg-accent flex items-center gap-2 cursor-pointer"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              handleDelete();
            }}
            className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </button>
        </div>
      )}

      {editing && (
        <EditBranchModal
          open={editing}
          onClose={() => setEditing(false)}
          existingBranch={{ id: branchId, ...branchData }}
        />
      )}
    </div>
  );
}
