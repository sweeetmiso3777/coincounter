"use client";

import { toast } from "sonner";
import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { MoreVertical, Trash2, Edit, Archive, RefreshCw } from "lucide-react";
import { useBranches } from "@/hooks/use-branches-query"; // Adjust import path as needed

interface CardMenuProps {
  branchId: string; // Firestore document ID
  branchData: {
    branch_manager: string;
    location: string;
    harvest_day_of_month: number;
    share: number;
    archived?: boolean; // Added archived status
  };
  onEdit?: () => void; // callback to open modal
}

export interface CardMenuRef {
  openMenu: () => void;
}

export const CardMenu = forwardRef<CardMenuRef, CardMenuProps>(
  ({ branchId, branchData, onEdit }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { archiveBranch, restoreBranch } = useBranches();

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

    const handleArchive = async () => {
      if (!confirm("Are you sure you want to archive this branch?")) return;

      archiveBranch.mutate(branchId, {
        onSuccess: () => {
          toast.success("Branch has been archived successfully!", {
            style: {
              background: "#fef3c7",
              border: "1px solid #fcd34d",
              color: "#92400e",
            },
            description: `Manager: ${branchData.branch_manager}, Location: ${branchData.location}`,
          });
        },
        onError: (error) => {
          console.error("Failed to archive branch:", error);
          toast.error("Failed to archive branch. Please try again.");
        },
      });
    };

    const handleRestore = async () => {
      if (!confirm("Are you sure you want to restore this branch?")) return;

      restoreBranch.mutate(branchId, {
        onSuccess: () => {
          toast.success("Branch has been restored successfully!", {
            style: {
              background: "#dcfce7",
              border: "1px solid #bbf7d0",
              color: "#166534",
            },
            description: `Manager: ${branchData.branch_manager}, Location: ${branchData.location}`,
          });
        },
        onError: (error) => {
          console.error("Failed to restore branch:", error);
          toast.error("Failed to restore branch. Please try again.");
        },
      });
    };

    const isArchived = branchData.archived || false;

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
          disabled={archiveBranch.isPending || restoreBranch.isPending}
        >
          <MoreVertical className="h-5 w-5 text-muted-foreground cursor-pointer" />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 top-8 w-36 bg-popover rounded-md shadow-lg border border-border py-1 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onEdit?.(); // call parent's edit handler
              }}
              className="w-full px-3 py-2 text-left text-sm text-popover-foreground hover:bg-accent flex items-center gap-2 cursor-pointer"
              disabled={archiveBranch.isPending || restoreBranch.isPending}
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>

            {isArchived ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  handleRestore();
                }}
                className="w-full px-3 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2 cursor-pointer"
                disabled={restoreBranch.isPending}
              >
                {restoreBranch.isPending ? (
                  <>
                    <div className="h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Restore
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  handleArchive();
                }}
                className="w-full px-3 py-2 text-left text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2 cursor-pointer"
                disabled={archiveBranch.isPending}
              >
                {archiveBranch.isPending ? (
                  <>
                    <div className="h-4 w-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                    Archiving...
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4" />
                    Archive
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
);

CardMenu.displayName = "CardMenu";
