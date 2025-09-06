import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Building2,
  UserCheck,
  UserX,
  MapPin,
  Activity,
  Shield,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

// TypeScript interfaces based on your API responses
interface Hotel {
  id: string;
  name: string;
  address: string;
  city: string;
  category: string;
  type: string;
  checkins: number;
  checkouts: number;
  totalGuests: number;
  numberOfRooms: number;
  ownerName: string;
  phone: string;
}

interface AreaStats {
  totalCheckins: number;
  totalCheckouts: number;
  totalAccommodations: number;
  totalGuests: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  metadata?: {
    period: string;
    startDate: string;
    endDate: string;
  };
}

interface Guest {
  _id: string;
  name: string;
  phone: string;
  roomNumber: string;
  status: string;
  checkInTime: string;
  nationality: string;
  purpose: string;
  guestCount: number;
}

const accommodationTypeColors = {
  hotel: "bg-blue-500",
  lodge: "bg-emerald-500",
  guestHouse: "bg-violet-500",
  dormitory: "bg-amber-500",
  pg: "bg-red-500",
  serviceApartment: "bg-cyan-500",
  hostel: "bg-lime-500",
  rentalHouse: "bg-pink-500",
};

const accommodationTypeLabels = {
  hotel: "Hotels",
  lodge: "Lodges",
  guestHouse: "Guest Houses",
  dormitory: "Dormitories",
  pg: "PG",
  serviceApartment: "Service Apartments",
  hostel: "Hostels",
  rentalHouse: "Rental Houses",
};

export const DashboardHome = () => {
  // State variables
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [areaStats, setAreaStats] = useState<AreaStats>({
    totalCheckins: 0,
    totalCheckouts: 0,
    totalAccommodations: 0,
    totalGuests: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // API call helper function
  const apiCall = async <T,>(endpoint: string): Promise<ApiResponse<T>> => {
    const token =
      sessionStorage.getItem("policeToken") ||
      localStorage.getItem("policeToken");

    if (!token) {
      throw new Error("Authentication token not found. Please login again.");
    }

    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
  };

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch data in parallel
      const [hotelsResponse, statsResponse] = await Promise.all([
        apiCall<Hotel[]>("/api/reports/hotels-stats?period=all"),
        apiCall<AreaStats>("/api/reports/area-stats?period=all"),
      ]);

      if (hotelsResponse.success) {
        setHotels(hotelsResponse.data || []);
      }

      if (statsResponse.success) {
        setAreaStats(
          statsResponse.data || {
            totalCheckins: 0,
            totalCheckouts: 0,
            totalAccommodations: 0,
            totalGuests: 0,
          }
        );
      }

      // Generate recent activity from hotels data
      if (hotelsResponse.success && hotelsResponse.data) {
        const activity = hotelsResponse.data
          .filter((hotel) => hotel.checkins > 0 || hotel.checkouts > 0)
          .slice(0, 6)
          .map((hotel, index) => ({
            id: index + 1,
            type: hotel.checkins > hotel.checkouts ? "checkin" : "checkout",
            location: hotel.name,
            time: new Date().toLocaleTimeString(),
            count:
              hotel.checkins > hotel.checkouts
                ? hotel.checkins
                : hotel.checkouts,
            accommodationType: hotel.type,
          }));

        setRecentActivity(activity);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();

    // Set up auto-refresh every 2 minutes
    const interval = setInterval(fetchDashboardData, 120000);
    return () => clearInterval(interval);
  }, []);

  // Calculate accommodation types breakdown
  const accommodationTypes = hotels.reduce((acc, hotel) => {
    const type = hotel.type || "hotel";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "checkin":
        return <UserCheck className="h-4 w-4 text-emerald-600" />;
      case "checkout":
        return <UserX className="h-4 w-4 text-amber-600" />;
      case "hopper":
        return <Activity className="h-4 w-4 text-blue-600" />;
      case "suspect":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  if (loading && hotels.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-700">
                Loading Dashboard...
              </p>
              <p className="text-gray-500">
                Fetching real-time data from the system
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Police Command Dashboard
              </h1>
              <p className="text-gray-600">
                Real-time monitoring and surveillance
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 text-sm font-medium">
              SYSTEM OPERATIONAL • Last updated:{" "}
              {lastUpdated.toLocaleTimeString()}
            </Badge>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Error loading dashboard data:</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Check-Ins */}
          <Card className="bg-white shadow-xl border-0 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <p className="text-emerald-100 text-sm font-medium">
                    Total Check-Ins
                  </p>
                  <p className="text-3xl font-bold">
                    {areaStats.totalCheckins}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <UserCheck className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Across all accommodations</p>
            </CardContent>
          </Card>

          {/* Active Accommodations */}
          <Card className="bg-white shadow-xl border-0 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <p className="text-blue-100 text-sm font-medium">
                    Active Accommodations
                  </p>
                  <p className="text-3xl font-bold">
                    {areaStats.totalAccommodations}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-1">
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  Hotels: {accommodationTypes.hotel || 0}
                </Badge>
                <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                  Others:{" "}
                  {Object.keys(accommodationTypes).length -
                    (accommodationTypes.hotel ? 1 : 0)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Check-Outs */}
          <Card className="bg-white shadow-xl border-0 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <p className="text-amber-100 text-sm font-medium">
                    Total Check-Outs
                  </p>
                  <p className="text-3xl font-bold">
                    {areaStats.totalCheckouts}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <UserX className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Completed stays</p>
            </CardContent>
          </Card>

          {/* Total Guests */}
          <Card className="bg-white shadow-xl border-0 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <p className="text-purple-100 text-sm font-medium">
                    Total Guests
                  </p>
                  <p className="text-3xl font-bold">{areaStats.totalGuests}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Currently tracked</p>
            </CardContent>
          </Card>
        </div>

        {/* Map and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <Card className="lg:col-span-2 bg-white shadow-xl border-0 rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-2xl">
              <CardTitle className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-blue-600" />
                <span className="text-gray-900">Area Surveillance Map</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center space-y-3">
                  <MapPin className="h-16 w-16 text-blue-500 mx-auto" />
                  <p className="text-lg font-semibold text-gray-700">
                    Interactive surveillance map
                  </p>
                  <p className="text-sm text-gray-500">
                    Tracking {hotels.length} accommodation facilities
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white shadow-xl border-0 rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-2xl">
              <CardTitle className="flex items-center space-x-3">
                <Activity className="h-5 w-5 text-blue-600" />
                <span className="text-gray-900">Live Activity Feed</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center space-x-4 p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {activity.location}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.count} {activity.type}s recorded
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accommodation Types Breakdown */}
        <Card className="bg-white shadow-xl border-0 rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-2xl">
            <CardTitle className="flex items-center space-x-3">
              <Building2 className="h-5 w-5 text-blue-600" />
              <span className="text-gray-900">Accommodation Intelligence</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {Object.keys(accommodationTypes).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {Object.entries(accommodationTypes).map(([type, count]) => {
                  const colorClass =
                    accommodationTypeColors[
                      type as keyof typeof accommodationTypeColors
                    ] || "bg-gray-500";
                  const label =
                    accommodationTypeLabels[
                      type as keyof typeof accommodationTypeLabels
                    ] || type.charAt(0).toUpperCase() + type.slice(1);

                  return (
                    <div
                      key={type}
                      className="text-center p-6 bg-slate-50 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow"
                    >
                      <div
                        className={`text-3xl font-bold mb-2 ${colorClass.replace(
                          "bg-",
                          "text-"
                        )}`}
                      >
                        {count}
                      </div>
                      <div className="text-sm font-medium text-gray-700 mb-3">
                        {label}
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${colorClass}`}
                          style={{
                            width: `${
                              (count /
                                Math.max(
                                  ...Object.values(accommodationTypes)
                                )) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-semibold">
                  No accommodation data available
                </p>
                <p className="text-sm">
                  Check your API endpoints or refresh the data
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
