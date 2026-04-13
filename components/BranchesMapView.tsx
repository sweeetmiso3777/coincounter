"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useRouter } from "next/navigation";
import type { BranchData } from "@/types/branch";

// Fix default marker icons
const defaultIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

/** Narrows BranchData to only those with valid coordinates. */
type MappableBranch = BranchData & { latitude: number; longitude: number };

function isMappable(b: BranchData): b is MappableBranch {
  return b.latitude != null && b.longitude != null;
}

/** Auto-fits the map viewport to all markers on first render. */
function FitBounds({ branches }: { branches: MappableBranch[] }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current || branches.length === 0) return;

    if (branches.length === 1) {
      map.setView([branches[0].latitude, branches[0].longitude], 13);
    } else {
      const bounds = L.latLngBounds(
        branches.map((b) => [b.latitude, b.longitude] as [number, number])
      );
      map.fitBounds(bounds, { padding: [48, 48] });
    }

    fitted.current = true;
  }, [branches, map]);

  return null;
}

interface BranchesMapViewProps {
  branches: BranchData[];
}

export default function BranchesMapView({ branches }: BranchesMapViewProps) {
  const router = useRouter();

  const mappable = branches.filter(isMappable);

  // Default center: Philippines
  const defaultCenter: [number, number] = [12.8797, 121.774];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={6}
      scrollWheelZoom
      className="h-full w-full z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds branches={mappable} />

      {mappable.map((branch) => (
        <Marker
          key={branch.id}
          position={[branch.latitude, branch.longitude]}
        >
          <Popup>
            <div className="min-w-[172px]">
              <p className="font-semibold text-sm text-gray-900 leading-snug mb-0.5">
                {branch.location}
              </p>

              <p className="text-xs text-gray-500 mb-1">
                Manager:{" "}
                <span className="text-gray-700 font-medium">
                  {branch.branch_manager}
                </span>
              </p>

              {(branch.contact_number ?? branch.contactNumber ?? branch.phone) && (
                <p className="text-xs text-gray-500 mb-1">
                  Contact:{" "}
                  <span className="text-gray-700 font-medium">
                    {branch.contact_number ?? branch.contactNumber ?? branch.phone}
                  </span>
                </p>
              )}

              <p className="text-xs text-gray-500 mb-3">
                Share:{" "}
                <span className="text-gray-700 font-medium">
                  {branch.share}%
                </span>
              </p>

              <button
                onClick={() => router.push(`/branches/${branch.id}`)}
                className="w-full text-xs bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-1.5 px-3 rounded transition-colors"
              >
                View Branch →
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}