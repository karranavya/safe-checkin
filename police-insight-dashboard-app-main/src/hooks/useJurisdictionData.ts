// hooks/useJurisdictionData.ts
import { useState, useEffect } from "react";

export interface JurisdictionHotel {
  id: string;
  name: string;
  type: string;
  city: string;
  rooms: number;
  status: "verified" | "pending" | "unverified";
  coordinates: [number, number]; // [lng, lat]
}

export interface JurisdictionCounts {
  total: number;
  verified: number;
  pending: number;
  unverified: number;
}

export interface JurisdictionData {
  configured: boolean;
  message?: string;
  jurisdiction?: {
    areaName: string;
    center: [number, number]; // [lng, lat]
    radiusKm: number;
  };
  hotels: JurisdictionHotel[];
  counts: JurisdictionCounts;
}

const EMPTY_COUNTS: JurisdictionCounts = {
  total: 0,
  verified: 0,
  pending: 0,
  unverified: 0,
};

export function useJurisdictionData() {
  const [data, setData] = useState<JurisdictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const token =
          sessionStorage.getItem("policeToken") ||
          localStorage.getItem("policeToken");

        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

        const res = await fetch(`${baseUrl}/api/police/jurisdiction/map-data`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (!json.success)
          throw new Error(json.error || "Failed to load jurisdiction data");

        if (!cancelled) {
          setData({
            configured: json.configured,
            message: json.message,
            jurisdiction: json.jurisdiction,
            hotels: json.hotels || [],
            counts: json.counts || EMPTY_COUNTS,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load jurisdiction data",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
