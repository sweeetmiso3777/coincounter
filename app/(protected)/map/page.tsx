"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useBranches } from "@/hooks/use-branches-query";
import {
  MapPin,
  AlertCircle,
  Loader2,
  Layers,
  Info,
  MousePointerClick,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useRouter } from "next/navigation";

// Dynamically import the map so Leaflet never runs on the server
const BranchesMapView = dynamic(() => import("@/components/BranchesMapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-gray-900">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading map…</p>
    </div>
  ),
});

export default function BranchesMapPage() {
  const { data: branches, isLoading, isError } = useBranches();
  const [legendDismissed, setLegendDismissed] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const router = useRouter();

  const mappableBranches = useMemo(
    () =>
      (branches ?? []).filter(
        (b) => b.latitude != null && b.longitude != null
      ),
    [branches]
  );

  const unmappableCount = (branches?.length ?? 0) - mappableBranches.length;

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden bg-gray-100 dark:bg-gray-900">

      {/* ── Full-bleed map ── */}
      {!isError && (
        <div className="absolute inset-0">
          <BranchesMapView branches={branches ?? []} />
        </div>
      )}

      {/* ── Loading overlay ── */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Fetching branches…
          </p>
        </div>
      )}

      {/* ── Error overlay ── */}
      {isError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-white dark:bg-gray-900">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Failed to load branches. Please refresh.
          </p>
        </div>
      )}

      {/* ── TOP-LEFT: Page title pill ── */}
      {/* <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-lg border border-white/60 dark:border-gray-700/60">
        <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
        <span className="text-sm font-semibold text-gray-800 dark:text-white tracking-tight">
          Branch Map
        </span>
      </div> */}

      {/* ── TOP-RIGHT: Stats chips ── */}
      {!isLoading && !isError && (
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">

          {/* Collapsible branch count + list */}
          <div className="rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-lg border border-white/60 dark:border-gray-700/60 overflow-hidden w-56">

            {/* Toggle header */}
            <button
              onClick={() => setListOpen((o) => !o)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-200 flex-1 text-left">
                {mappableBranches.length} branch{mappableBranches.length !== 1 ? "es" : ""} on map
              </span>
              {listOpen
                ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                : <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              }
            </button>

            {/* Branch list */}
            {listOpen && (
              <div className="border-t border-gray-100 dark:border-gray-700 max-h-64 overflow-y-auto">
                {mappableBranches.length === 0 ? (
                  <p className="text-xs text-gray-400 px-3 py-2">
                    No branches with coordinates.
                  </p>
                ) : (
                  <ul>
                    {mappableBranches.map((branch, i) => (
                      <li key={branch.id}>
                        <button
                          onClick={() => router.push(`/branches/${branch.id}`)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors group"
                        >
                          <MapPin className="w-3 h-3 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 shrink-0 transition-colors" />
                          <span className="text-xs text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate transition-colors">
                            {branch.location}
                          </span>
                        </button>
                        {i < mappableBranches.length - 1 && (
                          <div className="mx-3 border-b border-gray-50 dark:border-gray-700/50" />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Missing coords warning */}
          {unmappableCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50/95 dark:bg-amber-900/60 backdrop-blur-md shadow-md border border-amber-200/70 dark:border-amber-700/50">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                {unmappableCount} missing coordinates
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── BOTTOM-LEFT: Hint tooltip (dismissible) ── */}
      {!legendDismissed && !isLoading && !isError && (
        <div className="absolute bottom-8 left-4 z-10 flex items-start gap-2.5 max-w-[220px] px-3 py-2.5 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-lg border border-white/60 dark:border-gray-700/60">
          <MousePointerClick className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-200 leading-snug">
              Click a pin label to open the branch page.
            </p>
          </div>
          <button
            onClick={() => setLegendDismissed(true)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm leading-none mt-0.5 shrink-0 transition-colors"
            aria-label="Dismiss tip"
          >
            ×
          </button>
        </div>
      )}

      {/* ── BOTTOM-RIGHT: Attribution pill ── */}
      {!isLoading && !isError && (
        <div className="absolute bottom-8 right-4 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm border border-white/50 dark:border-gray-700/50">
          <Info className="w-3 h-3 text-gray-400" />
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            Powered by OpenStreetMap
          </span>
        </div>
      )}
    </div>
  );
}