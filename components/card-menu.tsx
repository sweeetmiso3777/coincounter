"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, Edit, Trash2 } from "lucide-react";

export function CardMenu() {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className="relative cursor-pointer" ref={menuRef}>
      {/* Menu Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="More options"
      >
        <MoreVertical className="h-5 w-5 text-gray-500 cursor-pointer" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-8 w-32 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              // Edit function will go here
              console.log("Edit clicked");
            }}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              // Remove function will go here
              console.log("Remove clicked");
            }}
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
