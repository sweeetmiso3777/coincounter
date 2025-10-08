"use client";

import type { BranchData } from "@/types/branch";
import dynamic from "next/dynamic";

// Dynamically import MapDisplay with no SSR
const MapDisplay = dynamic(() => import("./MapDisplay"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

interface MapModalProps {
  open: boolean;
  onClose: () => void;
  branch: BranchData;
}

export function MapModal({ open, onClose, branch }: MapModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-2xl w-full max-w-3xl h-[70vh] flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Location: {branch.location}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-2xl font-bold"
          >
            &times;
          </button>
        </div>
        <div className="flex-grow rounded-md overflow-hidden border dark:border-gray-700">
          {branch.latitude && branch.longitude ? (
            <MapDisplay position={[branch.latitude, branch.longitude]} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
              <p className="text-gray-500">
                Location coordinates not available.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
