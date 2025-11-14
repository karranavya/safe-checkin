// OfficerAnalyticsModal.tsx - FIXED WITH REAL DYNAMIC DATA
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OfficerAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  officerId: string;
  officerName: string;
}

interface OfficerMetrics {
  totalActivities: number;
  securityActivities: number;
  caseActivities: number;
  evidenceActivities: number;
  criticalActions: number;
  highActions: number;
  latestActivity: string;
  routineActivities: number;
  highPriority: number;
  criticalIssues: number;
  successRate: number;
  last7Days: number;
  last30Days: number;
  performanceScore: number;
  engagementLevel: string;
}

export const OfficerAnalyticsModal: React.FC<OfficerAnalyticsModalProps> = ({
  isOpen,
  onClose,
  officerId,
  officerName,
}) => {
  const [metrics, setMetrics] = useState<OfficerMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [activityHistory, setActivityHistory] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && officerId) {
      fetchOfficerMetrics();
    }
  }, [isOpen, officerId]);

  const fetchOfficerMetrics = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const token =
        localStorage.getItem("policeToken") ||
        sessionStorage.getItem("policeToken");

      // Fetch comprehensive officer activities and calculate metrics
      const response = await fetch(
        `${apiUrl}/api/activities/officer/${officerId}?days=30`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Officer metrics data:", data);

        const activities = data.data?.activities || [];
        const stats = data.data?.statistics || {};

        // Calculate real metrics from activities
        const totalActivities = stats.totalActivities || activities.length || 0;
        const securityActivities = stats.securityCount || 0;
        const caseActivities = stats.caseActivities || 0;
        const evidenceActivities = stats.evidenceActivities || 0;
        const criticalActions = stats.criticalSeverityCount || 0;
        const highActions = stats.highSeverityCount || 0;

        // Calculate activities in last 7 and 30 days
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        );

        const last7Days = activities.filter(
          (a: any) => new Date(a.createdAt) >= sevenDaysAgo
        ).length;
        const last30Days = activities.filter(
          (a: any) => new Date(a.createdAt) >= thirtyDaysAgo
        ).length;

        // Calculate performance metrics
        const routineActivities = activities.filter(
          (a: any) => a.severity === "low" || a.severity === "medium"
        ).length;
        const highPriority = activities.filter(
          (a: any) => a.severity === "high"
        ).length;
        const criticalIssues = criticalActions;

        // Calculate success rate (non-failed activities / total)
        const failedActivities = activities.filter(
          (a: any) => a.status === "failed"
        ).length;
        const successRate =
          totalActivities > 0
            ? Math.round(
                ((totalActivities - failedActivities) / totalActivities) * 100
              )
            : 100;

        // Calculate performance score (0-100)
        // Formula: weighted average of activity frequency, security involvement, and consistency
        let performanceScore = 0;
        if (totalActivities > 0) {
          const activityFrequency = Math.min((last7Days / 7) * 10, 40); // Max 40 points for frequency
          const securityInvolvement = Math.min(
            (securityActivities / totalActivities) * 30,
            30
          ); // Max 30 points
          const consistency = Math.min((successRate / 100) * 30, 30); // Max 30 points
          performanceScore = Math.round(
            activityFrequency + securityInvolvement + consistency
          );
        }

        // Determine engagement level
        let engagementLevel = "Unknown";
        if (totalActivities > 0) {
          const avgPerDay = last30Days / 30;
          if (avgPerDay >= 5) engagementLevel = "Very High";
          else if (avgPerDay >= 3) engagementLevel = "High";
          else if (avgPerDay >= 1) engagementLevel = "Moderate";
          else if (avgPerDay > 0) engagementLevel = "Low";
          else engagementLevel = "Inactive";
        }

        const calculatedMetrics: OfficerMetrics = {
          totalActivities,
          securityActivities,
          caseActivities,
          evidenceActivities,
          criticalActions,
          highActions,
          latestActivity:
            stats.latestActivity ||
            activities[0]?.createdAt ||
            new Date().toISOString(),
          routineActivities,
          highPriority,
          criticalIssues,
          successRate,
          last7Days,
          last30Days,
          performanceScore,
          engagementLevel,
        };

        setMetrics(calculatedMetrics);
        setActivityHistory(activities.slice(0, 10)); // Keep last 10 for timeline
      } else {
        throw new Error("Failed to fetch officer metrics");
      }
    } catch (error) {
      console.error("Error fetching officer metrics:", error);
      toast({
        title: "Error",
        description: "Failed to load officer analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    if (score >= 25) return "text-orange-600";
    return "text-red-600";
  };

  const getEngagementColor = (level: string) => {
    if (level === "Very High") return "text-green-600";
    if (level === "High") return "text-blue-600";
    if (level === "Moderate") return "text-yellow-600";
    if (level === "Low") return "text-orange-600";
    return "text-gray-600";
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {officerName} - Analytics
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchOfficerMetrics}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {loading && !metrics ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading analytics...</p>
            </div>
          </div>
        ) : metrics ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total Activities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {metrics.totalActivities}
                    </div>
                    <p className="text-xs text-gray-500">All time</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      This Month
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {metrics.last30Days}
                    </div>
                    <p className="text-xs text-gray-500">Last 30 days</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      This Week
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {metrics.last7Days}
                    </div>
                    <p className="text-xs text-gray-500">Last 7 days</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Success Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {metrics.successRate}%
                    </div>
                    <p className="text-xs text-gray-500">
                      Non-failed activities
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Activity Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Activity Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Security Activities
                    </span>
                    <Badge variant="outline">
                      {metrics.securityActivities}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Evidence Activities
                    </span>
                    <Badge variant="outline">
                      {metrics.evidenceActivities}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Case Activities
                    </span>
                    <Badge variant="outline">{metrics.caseActivities}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Critical Actions
                    </span>
                    <Badge className="bg-red-100 text-red-800">
                      {metrics.criticalActions}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">High Priority</span>
                    <Badge className="bg-orange-100 text-orange-800">
                      {metrics.highActions}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Performance Score */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Performance Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-5xl font-bold ${getPerformanceColor(
                        metrics.performanceScore
                      )}`}
                    >
                      {metrics.performanceScore}%
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Based on activity frequency, security involvement, and
                      consistency
                    </p>
                  </CardContent>
                </Card>

                {/* Engagement Level */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Engagement Level
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-3xl font-bold ${getEngagementColor(
                        metrics.engagementLevel
                      )}`}
                    >
                      {metrics.engagementLevel}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      System engagement and activity participation
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Performance Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-6 text-center">
                    <div>
                      <div className="text-2xl font-semibold text-green-600">
                        {metrics.routineActivities}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Routine Activities
                      </p>
                    </div>
                    <div>
                      <div className="text-2xl font-semibold text-orange-600">
                        {metrics.highPriority}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        High Priority
                      </p>
                    </div>
                    <div>
                      <div className="text-2xl font-semibold text-red-600">
                        {metrics.criticalIssues}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Critical Issues
                      </p>
                    </div>
                    <div>
                      <div className="text-2xl font-semibold text-green-600">
                        {metrics.successRate}%
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Success Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              {/* Activity Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  {activityHistory.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-600 mb-3">
                        Last 7 Days:{" "}
                        <span className="text-blue-600">
                          {metrics.last7Days}
                        </span>
                      </div>
                      {activityHistory.map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {activity.action?.replace(/_/g, " ")}
                            </p>
                            <p className="text-xs text-gray-500">
                              {activity.targetType}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(activity.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No recent activities
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Last Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Last Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    {formatDate(metrics.latestActivity)}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No data available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
