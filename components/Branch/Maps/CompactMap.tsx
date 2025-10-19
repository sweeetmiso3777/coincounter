"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default markers
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function MapWithClick({
  setCoords,
  coords,
}: {
  setCoords: (coords: [number, number]) => void;
  coords: [number, number] | null;
}) {
  const map = useMap();

  useMapEvents({
    click(e) {
      setCoords([e.latlng.lat, e.latlng.lng]);
    },
  });

  useEffect(() => {
    if (coords) {
      map.setView(coords, map.getZoom());
    }
  }, [coords, map]);

  return coords ? <Marker position={coords} /> : null;
}

interface CompactMapProps {
  onLocationSelect?: (coords: [number, number]) => void;
  initialCoords?: [number, number];
  className?: string;
  showSearch?: boolean;
  showCoordinates?: boolean;
}

export default function CompactMap({
  onLocationSelect,
  initialCoords = [10.3157, 123.8854],
  className = "",
  showSearch = true,
  showCoordinates = true,
}: CompactMapProps) {
  const [coords, setCoords] = useState<[number, number] | null>(initialCoords);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSetCoords = (newCoords: [number, number]) => {
    setCoords(newCoords);
    onLocationSelect?.(newCoords);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newCoords: [number, number] = [parseFloat(lat), parseFloat(lon)];
        handleSetCoords(newCoords);
        setSearchQuery("");
      } else {
        alert("Location not found. Please try a different search.");
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("Search failed. Please try again.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission
      handleSearch();
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {showSearch && (
        <>
          {/* Remove form element and use div instead */}
          <div className="mb-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search location..."
                className="flex-1 p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button" // Change to button type to prevent form submission
                onClick={handleSearch}
                className="px-3 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                Search
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-600 mb-2 text-center">
            Click on map or search to select location
          </p>
        </>
      )}

      {/* Original compact size: h-64 (256px height) */}
      <div className="w-full h-64 border border-gray-300 rounded-lg overflow-hidden">
        <MapContainer
          center={coords || initialCoords}
          zoom={12}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapWithClick setCoords={handleSetCoords} coords={coords} />
        </MapContainer>
      </div>

      {showCoordinates && coords && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
          <p className="font-mono text-center">
            Lat: {coords[0].toFixed(6)}, Lng: {coords[1].toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
}
