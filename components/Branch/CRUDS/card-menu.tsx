"use client";

import { toast } from "sonner";
import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { MoreVertical, Trash2, Edit } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";

interface CardMenuProps {
  branchId: string; // Firestore document ID
  branchData: {
    branch_manager: string;
    location: string;
    harvest_day_of_month: number;
    share: number;
  };
  onEdit?: () => void; // new callback to open modal
}

export interface CardMenuRef {
  openMenu: () => void;
}

export const CardMenu = forwardRef<CardMenuRef, CardMenuProps>(
  ({ branchId, branchData, onEdit }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Expose openMenu function to parent
    useImperativeHandle(ref, () => ({
      openMenu: () => setIsOpen(true),
    }));

    // Close menu when clicking outside
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          menuRef.current &&
          !menuRef.current.contains(event.target as Node)
        ) {
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
        toast.success("Branch has been deleted successfully!", {
          style: {
            background: "#dcfce7",
            border: "1px solid #bbf7d0",
            color: "#166534",
          },
          description: `Manager: ${branchData.branch_manager}, Location: ${branchData.location}, Harvest Day: ${branchData.harvest_day_of_month}, Share: ${branchData.share}%`,
        });
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
                onEdit?.(); // call parent's edit handler
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
      </div>
    );
  }
);

CardMenu.displayName = "CardMenu";
