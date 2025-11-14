// components/Dashboard/AdminDashboard/OfficerActivitiesModal.tsx - ENHANCED WITH REAL DATA
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  Clock,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  User,
  Shield,
  Calendar,
  Globe,
  Eye,
  AlertCircle,
  Lock,
  LogOut,
  Settings,
  BarChart3,
  TrendingUp,
  Database,
} from "lucide-react";
import { ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ActivityLog {
  _id: string;
  action: string;
  targetType: string;
  targetId: string;
  details: any;
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
  status: string;
  severity?: string;
  category?: string;
}

interface ActivityStatistics {
  totalActivities: number;
  recentCount: number;
  statistics: {
    totalActivities: number;
    authenticationCount: number;
    securityCount: number;
    lowSeverityCount: number;
    mediumSeverityCount: number;
    highSeverityCount: number;
    criticalSeverityCount: number;
    alertActivitiesCount: number;
    averageActivitiesPerDay: number;
    activityTrend: string;
  };
}

interface OfficerActivitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  officerId: string;
  officerName: string;
}
const formatStatusChangeDisplay = (activity: ActivityLog) => {
  const { details } = activity;

  if (details?.previousStatus && details?.newStatus) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <Badge className="bg-gray-200 text-gray-800 text-xs">
          {details.previousStatus}
        </Badge>
        <ArrowRight className="h-3 w-3 text-blue-600" />
        <Badge className="bg-green-600 text-white text-xs">
          {details.newStatus}
        </Badge>
      </div>
    );
  }

  if (details?.statusChange) {
    return (
      <div className="mt-2">
        <Badge variant="outline" className="text-xs">
          {details.statusChange}
        </Badge>
      </div>
    );
  }

  return null;
};
export const OfficerActivitiesModal: React.FC<OfficerActivitiesModalProps> = ({
  isOpen,
  onClose,
  officerId,
  officerName,
}) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [statistics, setStatistics] = useState<ActivityStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    action: "all",
    targetType: "all",
    days: "7",
    status: "all",
    severity: "all",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && officerId) {
      fetchActivities();
    }
  }, [
    isOpen,
    officerId,
    filters.days,
    filters.action,
    filters.targetType,
    filters.severity,
  ]);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const token =
        localStorage.getItem("policeToken") ||
        sessionStorage.getItem("policeToken");

      const queryParams = new URLSearchParams({
        days: filters.days,
        limit: "50",
      });

      if (filters.action !== "all")
        queryParams.append("action", filters.action);
      if (filters.targetType !== "all")
        queryParams.append("targetType", filters.targetType);
      if (filters.severity !== "all")
        queryParams.append("severity", filters.severity);

      console.log("Fetching activities with params:", queryParams.toString());

      const response = await fetch(
        `${apiUrl}/api/activities/officer/${officerId}?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Real activity data received:", data);

        let activityList = data.data.activities || [];

        // Apply client-side search filter
        if (filters.search) {
          activityList = activityList.filter(
            (activity: ActivityLog) =>
              activity.action
                .toLowerCase()
                .includes(filters.search.toLowerCase()) ||
              activity.targetType
                .toLowerCase()
                .includes(filters.search.toLowerCase()) ||
              JSON.stringify(activity.details)
                .toLowerCase()
                .includes(filters.search.toLowerCase())
          );
        }

        setActivities(activityList);
        setStatistics({
          totalActivities: data.data.totalCount || 0,
          recentCount: data.data.recentCount || activityList.length,
          statistics: data.data.statistics || {},
        });
      } else {
        throw new Error("Failed to fetch activities");
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      setError("Failed to load officer activities");
      toast({
        title: "Error",
        description: "Failed to load officer activities",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (action: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      login_attempt: <User className="h-4 w-4" />,
      logout: <LogOut className="h-4 w-4" />,
      profile_updated: <Settings className="h-4 w-4" />,
      alert_viewed: <Eye className="h-4 w-4" />,
      alert_updated: <AlertTriangle className="h-4 w-4" />,
      alert_created: <AlertCircle className="h-4 w-4" />,
      report_generated: <Shield className="h-4 w-4" />,
      dashboard_viewed: <BarChart3 className="h-4 w-4" />,
      system: <Globe className="h-4 w-4" />,
    };
    return iconMap[action] || <Activity className="h-4 w-4" />;
  };

  const getActivityColor = (action: string, severity?: string) => {
    // Priority: severity over action
    if (severity) {
      const severityColorMap: { [key: string]: string } = {
        low: "text-green-600 bg-green-50",
        medium: "text-yellow-600 bg-yellow-50",
        high: "text-orange-600 bg-orange-50",
        critical: "text-red-600 bg-red-50",
      };
      return severityColorMap[severity] || "text-gray-600 bg-gray-50";
    }

    const colorMap: { [key: string]: string } = {
      login_attempt: "text-green-600 bg-green-50",
      logout: "text-gray-600 bg-gray-50",
      profile_updated: "text-blue-600 bg-blue-50",
      alert_viewed: "text-yellow-600 bg-yellow-50",
      alert_updated: "text-orange-600 bg-orange-50",
      alert_created: "text-red-600 bg-red-50",
      report_generated: "text-purple-600 bg-purple-50",
      dashboard_viewed: "text-indigo-600 bg-indigo-50",
    };
    return colorMap[action] || "text-gray-600 bg-gray-50";
  };

  const getSeverityBadge = (severity?: string) => {
    if (!severity) return null;

    const severityMap: { [key: string]: string } = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={severityMap[severity] || "bg-gray-100 text-gray-800"}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  };

  const getCategoryBadge = (category?: string) => {
    if (!category) return null;

    const categoryMap: { [key: string]: string } = {
      authentication: "bg-blue-100 text-blue-800",
      security: "bg-red-100 text-red-800",
      data_management: "bg-green-100 text-green-800",
      reporting: "bg-purple-100 text-purple-800",
      monitoring: "bg-indigo-100 text-indigo-800",
      system: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge
        variant="outline"
        className={categoryMap[category] || "bg-gray-100 text-gray-800"}
      >
        {category.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const formatActivityDescription = (activity: ActivityLog) => {
    const { action, details, targetType } = activity;

    switch (action) {
      case "login_attempt":
        return details.success
          ? "Successfully logged into the system"
          : "Failed login attempt detected";
      case "logout":
        return "Logged out from the system";
      case "profile_updated":
        return details.action === "password_change"
          ? "Changed account password"
          : `Updated profile: ${
              details.updatedFields?.join(", ") || "various fields"
            }`;
      case "alert_viewed":
        return `Viewed ${details.viewType || targetType} alert: ${
          details.alertTitle || details.title || "N/A"
        }`;
      case "alert_updated":
        return `Updated alert status to ${details.newStatus || "N/A"}`;
      case "alert_created":
        return `Created new alert: ${
          details.alertTitle || details.title || "N/A"
        }`;
      case "report_generated":
        return `Generated ${details.reportType || "activity"} report`;
      case "dashboard_viewed":
        return "Accessed admin dashboard";
      case "suspect_viewed":
        return `Viewed suspect information: ${details.suspectName || "N/A"}`;
      case "hotel_verified":
        return `Verified hotel: ${details.hotelName || "N/A"}`;
      default:
        return `Performed ${action.replace(/_/g, " ")} on ${targetType}`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      action: "all",
      targetType: "all",
      days: "7",
      status: "all",
      severity: "all",
    });
  };

  const refreshActivities = () => {
    fetchActivities();
  };

  if (isLoading && activities.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
            Activity History - {officerName}
          </DialogTitle>
          <DialogDescription>
            Detailed activity logs and system interactions with real-time
            statistics
          </DialogDescription>
        </DialogHeader>

        {/* Enhanced Statistics Overview [web:78][web:70] */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {statistics.totalActivities}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total Activities
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {statistics.recentCount}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Recent Period
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {statistics.statistics?.securityCount || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Security Actions
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <div>
                    <div className="text-lg font-bold text-purple-600 capitalize">
                      {statistics.statistics?.activityTrend || "Stable"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Activity Trend
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Filters & Search
              <Button
                variant="outline"
                size="sm"
                onClick={refreshActivities}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-10"
                />
              </div>

              <Select
                value={filters.action}
                onValueChange={(value) =>
                  setFilters({ ...filters, action: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="login_attempt">Login Attempts</SelectItem>
                  <SelectItem value="logout">Logouts</SelectItem>
                  <SelectItem value="profile_updated">
                    Profile Updates
                  </SelectItem>
                  <SelectItem value="alert_viewed">Alert Views</SelectItem>
                  <SelectItem value="alert_created">Alert Creation</SelectItem>
                  <SelectItem value="dashboard_viewed">
                    Dashboard Access
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.targetType}
                onValueChange={(value) =>
                  setFilters({ ...filters, targetType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="profile">Profile</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.severity}
                onValueChange={(value) =>
                  setFilters({ ...filters, severity: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.days}
                onValueChange={(value) =>
                  setFilters({ ...filters, days: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 hours</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activities List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Activities</span>
              <Badge variant="secondary">
                {statistics?.totalActivities || 0} total activities
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-600">{error}</p>
                <Button onClick={fetchActivities} className="mt-4">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : activities.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {activities.map((activity) => (
                  <div
                    key={activity._id}
                    className="flex items-start space-x-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`p-2 rounded-full ${getActivityColor(
                        activity.action,
                        activity.severity
                      )}`}
                    >
                      {getActivityIcon(activity.action)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {formatActivityDescription(activity)}
                          </p>

                          {/* ⭐ NEW: Show status change */}
                          {formatStatusChangeDisplay(activity)}

                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-sm text-gray-500">
                              {activity.targetType}
                            </span>
                            {getSeverityBadge(activity.severity)}
                            {getCategoryBadge(activity.category)}
                            {activity.status === "failed" && (
                              <Badge className="bg-red-100 text-red-800">
                                Failed
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center ml-4">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(activity.createdAt)}
                        </div>
                      </div>

                      {/* Additional Details */}
                      {activity.details &&
                        Object.keys(activity.details).length > 0 && (
                          <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              {activity.ipAddress && (
                                <div>
                                  <span className="font-medium">IP:</span>{" "}
                                  {activity.ipAddress}
                                </div>
                              )}
                              {activity.details.hotelName && (
                                <div>
                                  <span className="font-medium">Hotel:</span>{" "}
                                  {activity.details.hotelName}
                                </div>
                              )}
                              {activity.details.alertTitle && (
                                <div className="md:col-span-2">
                                  <span className="font-medium">Alert:</span>{" "}
                                  {activity.details.alertTitle}
                                </div>
                              )}
                              {activity.details.guestName && (
                                <div>
                                  <span className="font-medium">Guest:</span>{" "}
                                  {activity.details.guestName}
                                </div>
                              )}
                              {activity.details.updatedBy && (
                                <div>
                                  <span className="font-medium">
                                    Updated By:
                                  </span>{" "}
                                  {activity.details.updatedBy}
                                </div>
                              )}
                              {activity.details.notes && (
                                <div className="md:col-span-2">
                                  <span className="font-medium">Notes:</span>{" "}
                                  {activity.details.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  No activities found for the selected criteria
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
