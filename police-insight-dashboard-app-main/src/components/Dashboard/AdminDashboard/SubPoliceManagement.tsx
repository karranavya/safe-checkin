// components/Dashboard/AdminDashboard/SubPoliceManagement.tsx - ENHANCED WITH REAL-TIME DATA
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  RefreshCw,
  Filter,
  Users,
  BarChart3,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubPoliceCard } from "./SubPoliceCard";
import { useToast } from "@/hooks/use-toast";

interface SubPoliceOfficer {
  _id: string;
  name: string;
  badgeNumber: string;
  email: string;
  station: string;
  rank: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string;
  loginCount: number;
  createdAt: string;
  // Enhanced with real activity data
  totalActivities?: number;
  recentActivities?: number;
  monthlyActivities?: number;
  weeklyActivities?: number;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface DashboardStats {
  totalOfficers: number;
  activeOfficers: number;
  totalActivities: number;
  averageActivitiesPerOfficer: number;
}

export const SubPoliceManagement = () => {
  const [officers, setOfficers] = useState<SubPoliceOfficer[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalOfficers: 0,
    activeOfficers: 0,
    totalActivities: 0,
    averageActivitiesPerOfficer: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    isActive: "all",
    station: "all",
  });
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchOfficers();
    // Set up auto-refresh every 30 seconds for real-time updates [web:78][web:45]
    const interval = setInterval(() => {
      fetchOfficers(pagination.currentPage, filters, true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchOfficers = async (
    page = 1,
    customFilters = filters,
    silent = false
  ) => {
    try {
      setIsLoading(page === 1 && !silent);
      setIsRefreshing(page !== 1 || silent);

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const token =
        localStorage.getItem("policeToken") ||
        sessionStorage.getItem("policeToken");

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "12", // Show more officers in grid
      });

      if (customFilters.isActive !== "all")
        queryParams.append("isActive", customFilters.isActive);
      if (customFilters.station !== "all")
        queryParams.append("station", customFilters.station);

      console.log("Fetching sub-police officers with real activity data...");

      const response = await fetch(
        `${apiUrl}/api/police/sub-police?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Sub-police data with activity counts:", data);

        const officersWithStats = data.data.officers || [];

        if (page === 1) {
          setOfficers(officersWithStats);
        } else {
          setOfficers((prev) => [...prev, ...officersWithStats]);
        }

        setPagination(data.data.pagination);

        // Calculate dashboard statistics [web:70]
        const totalActivities = officersWithStats.reduce(
          (sum: number, officer: SubPoliceOfficer) =>
            sum + (officer.totalActivities || 0),
          0
        );
        const activeOfficers = officersWithStats.filter(
          (officer: SubPoliceOfficer) => officer.isActive
        ).length;

        setDashboardStats({
          totalOfficers: data.data.pagination.totalCount,
          activeOfficers,
          totalActivities,
          averageActivitiesPerOfficer:
            officersWithStats.length > 0
              ? Math.round((totalActivities / officersWithStats.length) * 10) /
                10
              : 0,
        });

        if (!silent) {
          toast({
            title: "Success",
            description: `Loaded ${officersWithStats.length} officers with real-time activity data`,
          });
        }
      } else {
        throw new Error("Failed to fetch officers");
      }
    } catch (error) {
      console.error("Error fetching officers:", error);
      if (!silent) {
        toast({
          title: "Error",
          description: "Failed to load officers",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchOfficers(1, newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: "",
      isActive: "all",
      station: "all",
    };
    setFilters(clearedFilters);
    fetchOfficers(1, clearedFilters);
  };

  const refreshOfficers = () => {
    fetchOfficers(1, filters);
  };

  const handleToggleStatus = async (
    officerId: string,
    currentStatus: boolean
  ) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const token =
        localStorage.getItem("policeToken") ||
        sessionStorage.getItem("policeToken");

      const response = await fetch(
        `${apiUrl}/api/police/officer/${officerId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isActive: !currentStatus }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: `Officer ${
            currentStatus ? "deactivated" : "activated"
          } successfully`,
        });
        fetchOfficers(1, filters);
      }
    } catch (error) {
      console.error("Error updating officer status:", error);
      toast({
        title: "Error",
        description: "Failed to update officer status",
        variant: "destructive",
      });
    }
  };

  // Filter officers client-side for search
  const filteredOfficers = officers.filter((officer) => {
    if (!filters.search) return true;
    const searchTerm = filters.search.toLowerCase();
    return (
      officer.name.toLowerCase().includes(searchTerm) ||
      officer.badgeNumber.toLowerCase().includes(searchTerm) ||
      officer.email.toLowerCase().includes(searchTerm) ||
      officer.station.toLowerCase().includes(searchTerm)
    );
  });

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Real-time Statistics [web:78][web:70] */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sub-Police Management</h2>
          <p className="text-muted-foreground">
            Monitor and manage {dashboardStats.totalOfficers} sub-police
            officers with real-time activity tracking
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={refreshOfficers}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Officer
          </Button>
        </div>
      </div>

      {/* Real-time Dashboard Statistics [web:70] */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Officers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dashboardStats.totalOfficers}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.activeOfficers} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Activities
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboardStats.totalActivities.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All officer activities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Activities
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {dashboardStats.averageActivitiesPerOfficer}
            </div>
            <p className="text-xs text-muted-foreground">Per officer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600">Real-time</div>
            <p className="text-xs text-muted-foreground">
              Data updates every 30s
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
          <CardDescription>
            Filter officers by status, station, or search by name, badge, or
            email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search officers..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.isActive}
              onValueChange={(value) => handleFilterChange("isActive", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.station}
              onValueChange={(value) => handleFilterChange("station", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Stations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stations</SelectItem>
                <SelectItem value="District Police Station">
                  District Police Station
                </SelectItem>
                <SelectItem value="Central Police Station">
                  Central Police Station
                </SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={clearFilters} className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Officers Grid with Real Activity Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Officers</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {filteredOfficers.length} showing
              </Badge>
              <Badge variant="outline">
                {dashboardStats.totalOfficers} total
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredOfficers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOfficers.map((officer) => (
                <SubPoliceCard
                  key={officer._id}
                  officer={officer}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                No officers found matching your criteria
              </p>
            </div>
          )}

          {/* Load More Button */}
          {pagination.hasNextPage && !isLoading && (
            <div className="text-center mt-6">
              <Button
                variant="outline"
                onClick={() =>
                  fetchOfficers(pagination.currentPage + 1, filters)
                }
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Load More Officers
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Update Indicator */}
      {isRefreshing && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Updating real-time data...</span>
          </div>
        </div>
      )}
    </div>
  );
};
