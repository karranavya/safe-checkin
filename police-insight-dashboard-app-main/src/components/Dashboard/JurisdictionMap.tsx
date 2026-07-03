// components/Dashboard/JurisdictionMap.tsx - ADDED: Eye button in popup to view full hotel details
import { MapContainer, TileLayer, Circle, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Eye } from "lucide-react";
import type { JurisdictionData } from "@/hooks/useJurisdictionData";

const STATUS_COLORS: Record<string, string> = {
  verified: "#22c55e", // green
  pending: "#eab308", // yellow
  unverified: "#ef4444", // red
};

function makeDivIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 16px; height: 16px; border-radius: 50%;
      background:${color}; border:2px solid white;
      box-shadow: 0 0 4px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

interface JurisdictionMapProps {
  data: JurisdictionData | null;
  heightClass?: string;
  // ✅ NEW — when provided, shows an Eye button in each marker's popup.
  // Pass a handler that fetches the full hotel record and opens your modal.
  onViewDetails?: (hotelId: string) => void;
}

export function JurisdictionMap({
  data,
  heightClass = "h-[400px]",
  onViewDetails,
}: JurisdictionMapProps) {
  if (!data) {
    return (
      <div
        className={`${heightClass} flex items-center justify-center bg-red-50 rounded-xl border-2 border-dashed border-red-200`}
      >
        <p className="text-sm text-red-500 text-center px-6">
          Couldn't load jurisdiction data. Check that the backend route is
          registered and try refreshing.
        </p>
      </div>
    );
  }

  if (!data.configured || !data.jurisdiction) {
    return (
      <div
        className={`${heightClass} flex items-center justify-center bg-slate-100 rounded-xl border-2 border-dashed border-gray-300`}
      >
        <p className="text-sm text-gray-500 text-center px-6">
          {data.message ||
            "Jurisdiction not configured yet. Ask an admin to set it up."}
        </p>
      </div>
    );
  }

  const { center, radiusKm, areaName } = data.jurisdiction;
  const centerLatLng: [number, number] = [center[1], center[0]];

  return (
    <div
      className={`${heightClass} relative rounded-xl overflow-hidden border border-gray-200`}
    >
      <MapContainer
        center={centerLatLng}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Circle
          center={centerLatLng}
          radius={radiusKm * 1000}
          pathOptions={{
            color: "#3b82f6",
            fillColor: "#3b82f6",
            fillOpacity: 0.08,
          }}
        />

        {data.hotels.map((hotel) => {
          if (
            !hotel.coordinates ||
            (hotel.coordinates[0] === 0 && hotel.coordinates[1] === 0)
          ) {
            return null;
          }
          const latLng: [number, number] = [
            hotel.coordinates[1],
            hotel.coordinates[0],
          ];
          const color = STATUS_COLORS[hotel.status] || "#94a3b8";

          return (
            <Marker key={hotel.id} position={latLng} icon={makeDivIcon(color)}>
              <Popup>
                <div className="text-sm min-w-[170px]">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold leading-tight">{hotel.name}</p>
                    {/* ✅ NEW — same view-details action as the table's Eye button */}
                    {onViewDetails && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails(hotel.id);
                        }}
                        className="shrink-0 p-1 -mt-0.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="View full details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {hotel.type} · {hotel.city}
                  </p>
                  <p className="text-xs mt-1">
                    Status:{" "}
                    <span style={{ color }} className="font-medium capitalize">
                      {hotel.status}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">{hotel.rooms} rooms</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow text-xs font-medium z-[1000]">
        {areaName} · {radiusKm}km radius
      </div>
    </div>
  );
}
