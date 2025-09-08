// components/Dashboard/AdminDashboard/ActivityMonitoring.tsx
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
import { Search, Filter, Download, RefreshCw, Activity } from "lucide-react";
import { usePoliceAuth } from "@/contexts/PoliceAuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActivityLogCard } from "./ActivityLogCard";
import { useToast } from "@/hooks/use-toast";

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ActivityLog {
  _id: string;
  performedBy: {
    _id: string;
    name: string;
    badgeNumber: string;
    rank: string;
  } | null;
  action: string;
  targetType: string;
  targetId: string;
  details: any;
  createdAt: string;
  ipAddress?: string;
}

export const ActivityMonitoring = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isAuthenticated, user, token } = usePoliceAuth();
  const [filters, setFilters] = useState({
    search: "",
    officerId: "",
    action: "all",
    targetType: "all",
    startDate: "",
    endDate: "",
  });
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const { toast } = useToast();
  // Add this useEffect after your existing ones
  useEffect(() => {
    console.log("=== AUTH DEPENDENCY CHECK ===");
    console.log("Is Authenticated:", isAuthenticated);
    console.log("Has User:", !!user);
    console.log("Has Token:", !!token);

    if (isAuthenticated && token) {
      console.log("✅ Authentication confirmed - fetching activities");
      fetchActivities();
    } else {
      console.log("❌ Not authenticated yet - waiting...");
    }
  }, [isAuthenticated, token]); // Dependencies: only fetch when authenticated

  // Keep your auto-refresh useEffect but add auth check
  useEffect(() => {
    if (!isAuthenticated) return; // Don't auto-refresh if not authenticated

    const interval = setInterval(() => {
      if (!isLoading && isAuthenticated) {
        fetchActivities(1, filters);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [filters, isLoading, isAuthenticated]);
  const fetchActivities = async (page = 1, customFilters = filters) => {
    try {
      console.log(`=== FETCHING ACTIVITIES (Page ${page}) ===`);

      setIsLoading(page === 1);
      setIsRefreshing(page !== 1);

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

      // Get token from context first, then fallback to storage
      const contextToken = token;
      const storageToken =
        localStorage.getItem("policeToken") ||
        sessionStorage.getItem("policeToken");
      const finalToken = contextToken || storageToken;

      console.log("=== TOKEN DEBUG ===");
      console.log(
        "Token from context:",
        contextToken ? "✅ Present" : "❌ Missing"
      );
      console.log(
        "Token from localStorage:",
        localStorage.getItem("policeToken") ? "✅ Present" : "❌ Missing"
      );
      console.log(
        "Token from sessionStorage:",
        sessionStorage.getItem("policeToken") ? "✅ Present" : "❌ Missing"
      );
      console.log(
        "Final token being used:",
        finalToken ? `✅ ${finalToken.substring(0, 20)}...` : "❌ None"
      );

      if (!finalToken) {
        console.error("❌ NO TOKEN FOUND - User needs to login again");
        toast({
          title: "Authentication Error",
          description: "Please login again to access activities.",
          variant: "destructive",
        });
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      // Add filters if they exist
      if (customFilters.officerId && customFilters.officerId !== "") {
        queryParams.append("officerId", customFilters.officerId);
      }
      if (customFilters.action && customFilters.action !== "all") {
        queryParams.append("action", customFilters.action);
      }
      if (customFilters.targetType && customFilters.targetType !== "all") {
        queryParams.append("targetType", customFilters.targetType);
      }
      if (customFilters.startDate && customFilters.startDate !== "") {
        queryParams.append("startDate", customFilters.startDate);
      }
      if (customFilters.endDate && customFilters.endDate !== "") {
        queryParams.append("endDate", customFilters.endDate);
      }
      if (customFilters.search && customFilters.search !== "") {
        queryParams.append("search", customFilters.search);
      }

      const fullUrl = `${apiUrl}/api/activities/logs?${queryParams}`;

      console.log("=== API CALL DEBUG ===");
      console.log("API URL:", fullUrl);
      console.log("Query Params:", Object.fromEntries(queryParams));
      console.log("Headers being sent:", {
        Authorization: `Bearer ${finalToken.substring(0, 20)}...`,
        "Content-Type": "application/json",
      });

      const response = await fetch(fullUrl, {
        headers: {
          Authorization: `Bearer ${finalToken}`,
          "Content-Type": "application/json",
        },
      });

      console.log("=== RESPONSE DEBUG ===");
      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (response.ok) {
        const data = await response.json();

        console.log("=== RAW API RESPONSE ===");
        console.log("Response structure:", {
          hasSuccess: "success" in data,
          success: data.success,
          hasData: "data" in data,
          hasActivities: !!(data.data?.activities || data.activities),
          activitiesLength:
            data.data?.activities?.length || data.activities?.length || 0,
          hasPagination: !!(data.data?.pagination || data.pagination),
        });

        // Handle multiple possible response structures
        const activitiesArray = data.data?.activities || data.activities || [];
        const paginationData = data.data?.pagination || data.pagination || {};

        console.log("=== ACTIVITIES PROCESSING ===");
        console.log("Raw activities array:", activitiesArray);
        console.log("Activities count:", activitiesArray.length);

        // Log first few activities for debugging
        if (activitiesArray.length > 0) {
          console.log("Sample activities:");
          activitiesArray.slice(0, 3).forEach((activity, index) => {
            console.log(`  Activity ${index}:`, {
              id: activity._id,
              action: activity.action,
              performedBy: activity.performedBy?.name || "Unknown",
              targetType: activity.targetType,
              createdAt: activity.createdAt,
              hasPerformedBy: !!activity.performedBy,
              performedByType: typeof activity.performedBy,
            });
          });
        }

        // Update activities state
        if (page === 1) {
          console.log(
            `🔄 Setting ${activitiesArray.length} activities for page 1`
          );
          setActivities(activitiesArray);
        } else {
          console.log(
            `🔄 Adding ${activitiesArray.length} activities to existing list`
          );
          setActivities((prev) => {
            const newTotal = prev.length + activitiesArray.length;
            console.log(`📊 Total activities after merge: ${newTotal}`);
            return [...prev, ...activitiesArray];
          });
        }

        // Update pagination
        const newPagination = {
          currentPage: paginationData.currentPage || page,
          totalPages: paginationData.totalPages || 1,
          totalCount: paginationData.totalCount || activitiesArray.length,
          limit: paginationData.limit || 20,
          hasNextPage: paginationData.hasNextPage || false,
          hasPrevPage: paginationData.hasPrevPage || false,
        };

        console.log("=== PAGINATION DEBUG ===");
        console.log("Pagination data:", newPagination);
        setPagination(newPagination);

        // Success feedback
        console.log("✅ Activities fetched successfully!");
        console.log(
          `📈 Total: ${newPagination.totalCount}, Page: ${newPagination.currentPage}/${newPagination.totalPages}`
        );
      } else {
        // Handle error responses
        const errorText = await response.text();
        let errorData;

        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }

        console.error("=== API ERROR ===");
        console.error("Status:", response.status);
        console.error("Error data:", errorData);

        throw new Error(
          errorData.error || `HTTP ${response.status}: ${errorText}`
        );
      }
    } catch (error) {
      console.error("=== FETCH ERROR ===");
      console.error("Error type:", error.constructor.name);
      console.error("Error message:", error.message);
      console.error("Full error:", error);

      // Show user-friendly error message
      toast({
        title: "Error Loading Activities",
        description: `Failed to load activities: ${error.message}`,
        variant: "destructive",
      });

      // Ensure activities is set to empty array on error
      if (page === 1) {
        setActivities([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          limit: 20,
          hasNextPage: false,
          hasPrevPage: false,
        });
      }
    } finally {
      // Always clear loading states
      console.log("🏁 Clearing loading states");
      setIsLoading(false);
      setIsRefreshing(false);

      // Add a small delay to ensure state updates are processed
      setTimeout(() => {
        console.log("=== FINAL STATE CHECK ===");
        console.log("Is loading:", false);
        console.log("Is refreshing:", false);
      }, 100);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchActivities(1, newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: "",
      officerId: "",
      action: "all",
      targetType: "all",
      startDate: "",
      endDate: "",
    };
    setFilters(clearedFilters);
    fetchActivities(1, clearedFilters);
  };

  const refreshActivities = () => {
    fetchActivities(1, filters);
  };

  const loadMore = () => {
    if (pagination.hasNextPage) {
      fetchActivities(pagination.currentPage + 1, filters);
    }
  };

  const getActionColor = (action: string) => {
    const actionColors: { [key: string]: string } = {
      hotel_verified: "bg-green-100 text-green-800",
      hotel_registered: "bg-blue-100 text-blue-800",
      suspect_added: "bg-red-100 text-red-800",
      suspect_updated: "bg-yellow-100 text-yellow-800",
      alert_created: "bg-orange-100 text-orange-800",
      case_handled: "bg-purple-100 text-purple-800",
      report_generated: "bg-gray-100 text-gray-800",
      login_attempt: "bg-cyan-100 text-cyan-800",
      logout: "bg-slate-100 text-slate-800",
      profile_updated: "bg-indigo-100 text-indigo-800",
    };
    return actionColors[action] || "bg-gray-100 text-gray-800";
  };

  // Debug log for component state
  // console.log("=== COMPONENT STATE DEBUG ===");
  // console.log("Activities:", activities);
  // console.log("Activities length:", activities?.length);
  // console.log("Is Loading:", isLoading);
  // console.log("Pagination:", pagination);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Activity Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time tracking of all sub-police activities
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={refreshActivities}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.action}
              onValueChange={(value) => handleFilterChange("action", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="hotel_verified">Hotel Verified</SelectItem>
                <SelectItem value="hotel_registered">
                  Hotel Registered
                </SelectItem>
                <SelectItem value="hotel_updated">Hotel Updated</SelectItem>
                <SelectItem value="hotel_deleted">Hotel Deleted</SelectItem>
                <SelectItem value="suspect_added">Suspect Added</SelectItem>
                <SelectItem value="suspect_updated">Suspect Updated</SelectItem>
                <SelectItem value="suspect_deleted">Suspect Deleted</SelectItem>
                <SelectItem value="suspect_viewed">Suspect Viewed</SelectItem>
                <SelectItem value="alert_created">Alert Created</SelectItem>
                <SelectItem value="alert_updated">Alert Updated</SelectItem>
                <SelectItem value="alert_removed">Alert Removed</SelectItem>
                <SelectItem value="case_handled">Case Handled</SelectItem>
                <SelectItem value="case_updated">Case Updated</SelectItem>
                <SelectItem value="case_closed">Case Closed</SelectItem>
                <SelectItem value="report_generated">
                  Report Generated
                </SelectItem>
                <SelectItem value="report_viewed">Report Viewed</SelectItem>
                <SelectItem value="guest_checked">Guest Checked</SelectItem>
                <SelectItem value="guest_flagged">Guest Flagged</SelectItem>
                <SelectItem value="profile_updated">Profile Updated</SelectItem>
                <SelectItem value="login_attempt">Login Attempt</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="password_changed">
                  Password Changed
                </SelectItem>
                <SelectItem value="role_updated">Role Updated</SelectItem>
                <SelectItem value="status_changed">Status Changed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.targetType}
              onValueChange={(value) => handleFilterChange("targetType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="hotel">Hotel</SelectItem>
                <SelectItem value="suspect">Suspect</SelectItem>
                <SelectItem value="alert">Alert</SelectItem>
                <SelectItem value="case">Case</SelectItem>
                <SelectItem value="report">Report</SelectItem>
                <SelectItem value="profile">Profile</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              placeholder="Start date"
            />

            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              placeholder="End date"
            />

            <Button variant="outline" onClick={clearFilters} className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activities Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Activity Feed</span>
            <Badge variant="secondary">
              {pagination.totalCount} total activities
            </Badge>
          </CardTitle>
          <CardDescription>
            Live feed of all officer activities and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : Array.isArray(activities) && activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => {
                console.log("Rendering activity:", activity._id, activity);
                return (
                  <ActivityLogCard
                    key={activity._id}
                    activity={activity}
                    actionColor={getActionColor(activity.action)}
                  />
                );
              })}

              {pagination.hasNextPage && (
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>Load More</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No activities found</p>
              <p className="text-xs text-gray-400 mt-2">
                Debug: activities.length = {activities?.length}, isLoading ={" "}
                {isLoading.toString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
