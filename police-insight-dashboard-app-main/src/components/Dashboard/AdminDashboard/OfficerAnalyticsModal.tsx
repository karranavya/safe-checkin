// components/Dashboard/AdminDashboard/OfficerAnalyticsModal.tsx - UPDATED WITH REAL DATA
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Shield,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Calendar,
  MapPin,
  Mail,
  Phone,
  RefreshCw,
  Download,
  BarChart3,
  Target,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OfficerDetails {
  _id: string;
  name: string;
  badgeNumber: string;
  email: string;
  phone?: string;
  station: string;
  rank: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string;
  loginCount: number;
  createdAt: string;
  updatedAt: string;
  // Enhanced with real activity data
  totalActivities: number;
  monthlyActivities: number;
  weeklyActivities: number;
  alertActivities: number;
}

interface ActivityStats {
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
  dateRange: {
    from: string;
    to: string;
    days: number;
  };
}

interface OfficerAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  officerId: string;
  officerName: string;
}

export const OfficerAnalyticsModal: React.FC<OfficerAnalyticsModalProps> = ({
  isOpen,
  onClose,
  officerId,
  officerName,
}) => {
  const [officer, setOfficer] = useState<OfficerDetails | null>(null);
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && officerId) {
      fetchOfficerDetails();
    }
  }, [isOpen, officerId]);

  const fetchOfficerDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const token =
        localStorage.getItem("policeToken") ||
        sessionStorage.getItem("policeToken");

      // Fetch officer details and comprehensive statistics [web:78][web:70]
      const [officerResponse, statsResponse] = await Promise.all([
        fetch(`${apiUrl}/api/police/officer/${officerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/api/activities/officer/${officerId}?days=30&limit=1`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (officerResponse.ok) {
        const officerData = await officerResponse.json();
        setOfficer(officerData.data);
        console.log("Officer data with real stats:", officerData.data);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setActivityStats(statsData.data);
        console.log("Real activity statistics:", statsData.data);
      }
    } catch (error) {
      console.error("Error fetching officer details:", error);
      setError("Failed to load officer analytics");
      toast({
        title: "Error",
        description: "Failed to load officer analytics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPerformanceScore = () => {
    if (!activityStats || !officer) return 0;

    const { statistics } = activityStats;
    const baseScore = Math.min(statistics.averageActivitiesPerDay * 10, 50);
    const trendBonus = statistics.activityTrend === "increasing" ? 20 : 10;
    const securityBonus = statistics.securityCount > 0 ? 15 : 0;
    const criticalPenalty = statistics.criticalSeverityCount * 5;

    return Math.min(
      Math.max(baseScore + trendBonus + securityBonus - criticalPenalty, 0),
      100
    );
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 85) return "text-green-600 bg-green-50";
    if (score >= 70) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Inactive</Badge>
    );
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "stable":
        return <BarChart3 className="h-4 w-4 text-blue-600" />;
      default:
        return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const performanceScore = getPerformanceScore();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            Officer Analytics - {officerName}
          </DialogTitle>
          <DialogDescription>
            Comprehensive performance and activity analytics with real-time data
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchOfficerDetails} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Real Statistics Cards from Database [web:78][web:70] */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Activities
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {officer?.totalActivities || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      All time activities
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Monthly Activities
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {officer?.monthlyActivities ||
                        activityStats?.recentCount ||
                        0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last 30 days
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Security Actions
                    </CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {activityStats?.statistics.securityCount || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Security activities
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Login Sessions
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {officer?.loginCount || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total logins
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Activity Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Activity Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        Authentication
                      </span>
                      <span className="font-semibold">
                        {activityStats?.statistics.authenticationCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        Security
                      </span>
                      <span className="font-semibold">
                        {activityStats?.statistics.securityCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-600" />
                        Alerts Handled
                      </span>
                      <span className="font-semibold">
                        {activityStats?.statistics.alertActivitiesCount || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Activity Severity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-green-600">Low Priority</span>
                      <span className="font-semibold">
                        {activityStats?.statistics.lowSeverityCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-600">Medium Priority</span>
                      <span className="font-semibold">
                        {activityStats?.statistics.mediumSeverityCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-orange-600">High Priority</span>
                      <span className="font-semibold">
                        {activityStats?.statistics.highSeverityCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-red-600">Critical Priority</span>
                      <span className="font-semibold">
                        {activityStats?.statistics.criticalSeverityCount || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Status and Trend Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Current Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Account Status</span>
                      {officer && getStatusBadge(officer.isActive)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Last Login</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(officer?.lastLoginAt || "")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Activity Trend</span>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(
                          activityStats?.statistics.activityTrend || "stable"
                        )}
                        <span className="text-sm capitalize">
                          {activityStats?.statistics.activityTrend || "Stable"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Activity Rate</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Daily Average</span>
                      <span className="font-semibold text-blue-600">
                        {activityStats?.statistics.averageActivitiesPerDay?.toFixed(
                          1
                        ) || "0.0"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Weekly Total</span>
                      <span className="font-semibold text-green-600">
                        {officer?.weeklyActivities ||
                          Math.floor((officer?.monthlyActivities || 0) * 0.25)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Monthly Total</span>
                      <span className="font-semibold text-purple-600">
                        {officer?.monthlyActivities ||
                          activityStats?.recentCount ||
                          0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              {/* Calculated Performance Metrics [web:78][web:70] */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Performance Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div
                        className={`text-3xl font-bold px-4 py-2 rounded-lg ${getPerformanceColor(
                          performanceScore
                        )}`}
                      >
                        {performanceScore}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Based on activity frequency, security involvement, and
                        consistency
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Engagement Level</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="text-3xl font-bold text-blue-600">
                        {activityStats?.statistics.averageActivitiesPerDay
                          ? activityStats.statistics.averageActivitiesPerDay > 5
                            ? "High"
                            : activityStats.statistics.averageActivitiesPerDay >
                              2
                            ? "Medium"
                            : "Low"
                          : "Unknown"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        System engagement and activity participation
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Performance Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Performance Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {(activityStats?.statistics.lowSeverityCount || 0) +
                          (activityStats?.statistics.mediumSeverityCount || 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Routine Activities
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {activityStats?.statistics.highSeverityCount || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        High Priority
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {activityStats?.statistics.criticalSeverityCount || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Critical Issues
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {(activityStats?.statistics.criticalSeverityCount ||
                          0) === 0
                          ? "100"
                          : Math.max(
                              0,
                              100 -
                                activityStats.statistics.criticalSeverityCount *
                                  10
                            )}
                        %
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Success Rate
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                      <span className="font-medium">Last 7 Days</span>
                      <span className="text-blue-600 font-bold">
                        {officer?.weeklyActivities ||
                          Math.floor((officer?.monthlyActivities || 0) * 0.25)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                      <span className="font-medium">Last 30 Days</span>
                      <span className="text-green-600 font-bold">
                        {officer?.monthlyActivities ||
                          activityStats?.recentCount ||
                          0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
                      <span className="font-medium">All Time</span>
                      <span className="text-purple-600 font-bold">
                        {officer?.totalActivities || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              {officer && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Officer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm text-muted-foreground">
                              Badge Number
                            </div>
                            <div className="font-medium">
                              {officer.badgeNumber}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm text-muted-foreground">
                              Station
                            </div>
                            <div className="font-medium">{officer.station}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm text-muted-foreground">
                              Rank
                            </div>
                            <div className="font-medium">{officer.rank}</div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm text-muted-foreground">
                              Email
                            </div>
                            <div className="font-medium">{officer.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm text-muted-foreground">
                              Joined
                            </div>
                            <div className="font-medium">
                              {formatDate(officer.createdAt)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm text-muted-foreground">
                              Role
                            </div>
                            <div className="font-medium">
                              {officer.role === "sub_police"
                                ? "Sub-Police Officer"
                                : "Admin Police"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Real-time Statistics Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">System Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">
                        {activityStats?.dateRange.days || 30}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Days of Data
                      </div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        Real-time
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Data Updates
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
