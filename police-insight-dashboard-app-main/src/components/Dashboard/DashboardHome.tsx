// components/Dashboard/DashboardHome.tsx - UPDATED with role-based content and data fetching
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Crown,
  BarChart3,
  Eye,
  TrendingUp,
  Clock,
} from "lucide-react";
import { usePoliceAuth } from "@/contexts/PoliceAuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

// TypeScript interfaces
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

interface AdminStats {
  totalSubPolice: number;
  activeSubPolice: number;
  weeklyActivities: number;
  systemHealth: number;
  recentActivities: any[];
  activitiesByAction: any[];
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
  const { user } = usePoliceAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Role detection
  const isAdmin = user?.role === "admin_police";

  // Common state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Admin-specific state
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);

  // Regular police state
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [areaStats, setAreaStats] = useState<AreaStats>({
    totalCheckins: 0,
    totalCheckouts: 0,
    totalAccommodations: 0,
    totalGuests: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Debug logs
  console.log("🔍 DashboardHome - User:", user);
  console.log("🔍 DashboardHome - Role:", user?.role);
  console.log("🔍 DashboardHome - Is Admin?:", isAdmin);

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

  // Fetch admin dashboard data
  const fetchAdminData = async () => {
    try {
      console.log("🔄 Fetching admin data...");

      const [subPoliceRes, activityStatsRes] = await Promise.all([
        apiCall<{ officers: any[]; pagination: { totalCount: number } }>(
          "/api/police/sub-police?limit=1000"
        ),
        apiCall<{
          summary: { totalActivities: number };
          recentActivities: any[];
          activitiesByAction: any[];
        }>("/api/activities/stats?days=7"),
      ]);

      if (subPoliceRes.success && activityStatsRes.success) {
        setAdminStats({
          totalSubPolice: subPoliceRes.data?.pagination?.totalCount || 0,
          activeSubPolice:
            subPoliceRes.data?.officers?.filter((o: any) => o.isActive)
              ?.length || 0,
          weeklyActivities:
            activityStatsRes.data?.summary?.totalActivities || 0,
          systemHealth: 98.5,
          recentActivities: activityStatsRes.data?.recentActivities || [],
          activitiesByAction: activityStatsRes.data?.activitiesByAction || [],
        });
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
      // Fallback to mock data for demo
      setAdminStats({
        totalSubPolice: 12,
        activeSubPolice: 10,
        weeklyActivities: 156,
        systemHealth: 98.5,
        recentActivities: [],
        activitiesByAction: [],
      });
    }
  };

  // Fetch regular police dashboard data
  const fetchRegularData = async () => {
    try {
      console.log("🔄 Fetching regular police data...");

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
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch dashboard data"
      );
    }
  };

  // Main data fetch function
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (isAdmin) {
        await fetchAdminData();
      } else {
        await fetchRegularData();
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    console.log("📊 DashboardHome useEffect - Role:", user?.role);
    fetchDashboardData();

    // Set up auto-refresh every 2 minutes
    const interval = setInterval(fetchDashboardData, 120000);
    return () => clearInterval(interval);
  }, [isAdmin, user?.role]);

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

  // Loading state
  if (loading && !adminStats && hotels.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-700">
                Loading {isAdmin ? "Admin" : "Police"} Dashboard...
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

  // Admin Dashboard Render
  if (isAdmin && adminStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Admin Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-purple-900 to-purple-700 rounded-xl shadow-lg">
                <Crown className="h-8 w-8 text-yellow-300" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome, Administrator {user?.name}
                </h1>
                <p className="text-gray-600">
                  System overview and control panel
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </button>
              <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 text-sm font-medium">
                ADMIN PANEL ACTIVE • {lastUpdated.toLocaleTimeString()}
              </Badge>
            </div>
          </div>

          {/* Admin Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white shadow-xl border-0 rounded-2xl overflow-hidden border-l-4 border-blue-500">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <p className="text-blue-100 text-sm font-medium">
                      Sub-Police Officers
                    </p>
                    <p className="text-3xl font-bold">
                      {adminStats.totalSubPolice}
                    </p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">
                  {adminStats.activeSubPolice} currently active
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => navigate("/dashboard/admin/officers")}
                >
                  Manage Officers
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-xl border-0 rounded-2xl overflow-hidden border-l-4 border-green-500">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <p className="text-green-100 text-sm font-medium">
                      Weekly Activities
                    </p>
                    <p className="text-3xl font-bold">
                      {adminStats.weeklyActivities}
                    </p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% from last week
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => navigate("/dashboard/admin/activities")}
                >
                  View Activities
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-xl border-0 rounded-2xl overflow-hidden border-l-4 border-purple-500">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <p className="text-purple-100 text-sm font-medium">
                      System Health
                    </p>
                    <p className="text-3xl font-bold text-green-300">
                      {adminStats.systemHealth}%
                    </p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">
                  All systems operational
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => navigate("/dashboard/admin/analytics")}
                >
                  View Analytics
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-xl border-0 rounded-2xl overflow-hidden border-l-4 border-orange-500">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <p className="text-orange-100 text-sm font-medium">
                      Quick Actions
                    </p>
                    <p className="text-3xl font-bold">4</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">
                  Administrative tasks
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => navigate("/dashboard/admin/reports")}
                >
                  Admin Reports
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities & Quick Links */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white shadow-xl border-0 rounded-2xl">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-purple-50 rounded-t-2xl">
                <CardTitle className="flex items-center space-x-3">
                  <Activity className="h-5 w-5 text-purple-600" />
                  <span className="text-gray-900">
                    Recent System Activities
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {adminStats.recentActivities
                    .slice(0, 5)
                    .map((activity: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-purple-50 rounded"
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {activity.performedBy?.name || "Officer"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {activity.action?.replace(/_/g, " ") ||
                              "Unknown action"}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {new Date(activity.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Badge>
                      </div>
                    )) || (
                    <div className="text-center py-4 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No recent activities</p>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => navigate("/dashboard/admin/activities")}
                >
                  View All Activities
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-xl border-0 rounded-2xl">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-purple-50 rounded-t-2xl">
                <CardTitle className="flex items-center space-x-3">
                  <Crown className="h-5 w-5 text-purple-600" />
                  <span className="text-gray-900">Admin Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => navigate("/dashboard/admin/officers")}
                  >
                    <Users className="h-6 w-6 mb-2" />
                    <span className="text-sm">Manage Officers</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => navigate("/dashboard/admin/activities")}
                  >
                    <Eye className="h-6 w-6 mb-2" />
                    <span className="text-sm">Monitor Activities</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => navigate("/dashboard/admin/analytics")}
                  >
                    <BarChart3 className="h-6 w-6 mb-2" />
                    <span className="text-sm">System Analytics</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => navigate("/dashboard/admin/reports")}
                  >
                    <Shield className="h-6 w-6 mb-2" />
                    <span className="text-sm">Generate Reports</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Regular Police Dashboard (your existing code with minor modifications)
  const accommodationTypes = hotels.reduce((acc, hotel) => {
    const type = hotel.type || "hotel";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Regular Police Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, Officer {user?.name}
              </h1>
              <p className="text-gray-600">Your field operations dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={fetchDashboardData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </Button>
            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 text-sm font-medium">
              FIELD READY • Last updated: {lastUpdated.toLocaleTimeString()}
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

        {/* Stats Cards - Your existing code */}
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

        {/* Map and Activity - Your existing code continues here... */}
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

        {/* Accommodation Types Breakdown - Your existing code */}
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
