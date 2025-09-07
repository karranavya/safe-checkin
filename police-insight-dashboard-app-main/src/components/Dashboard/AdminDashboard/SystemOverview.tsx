// components/Dashboard/AdminDashboard/SystemOverview.tsx - NEW FILE
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  Users,
  Shield,
  Activity,
  AlertTriangle,
} from "lucide-react";

export const SystemOverview = () => {
  const [systemStats, setSystemStats] = useState({
    activeOfficers: 12,
    totalActivities: 156,
    systemUptime: "99.8%",
    responseTime: "1.2s",
    regions: [
      { name: "Central Mumbai", officers: 4, activities: 45 },
      { name: "South Mumbai", officers: 3, activities: 32 },
      { name: "North Mumbai", officers: 5, activities: 79 },
    ],
    recentTrends: {
      activitiesChange: +12,
      alertsChange: -3,
      registrationsChange: +8,
    },
  });

  return (
    <div className="space-y-6">
      {/* System Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {systemStats.systemUptime}
            </div>
            <div className="mt-2">
              <Progress value={99.8} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Response Time
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.responseTime}</div>
            <div className="flex items-center mt-1">
              <TrendingDown className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-xs text-green-600">
                -0.3s from last week
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Officers
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemStats.activeOfficers}
            </div>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-xs text-green-600">+2 this week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Activities
            </CardTitle>
            <Shield className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemStats.totalActivities}
            </div>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-xs text-green-600">
                +{systemStats.recentTrends.activitiesChange}% this week
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regional Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Regional Distribution
            </CardTitle>
            <CardDescription>
              Officer deployment and activity across regions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemStats.regions.map((region, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{region.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {region.officers} officers • {region.activities}{" "}
                      activities
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={region.activities > 50 ? "default" : "secondary"}
                    >
                      {region.activities > 50 ? "High" : "Normal"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weekly Trends
            </CardTitle>
            <CardDescription>
              Performance metrics for the past week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium">Activity Volume</div>
                  <div className="text-sm text-muted-foreground">
                    Daily operations
                  </div>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                  <span className="font-semibold text-green-600">
                    +{systemStats.recentTrends.activitiesChange}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium">Alert Resolution</div>
                  <div className="text-sm text-muted-foreground">
                    Response efficiency
                  </div>
                </div>
                <div className="flex items-center">
                  <TrendingDown className="h-4 w-4 text-green-600 mr-2" />
                  <span className="font-semibold text-green-600">
                    -{Math.abs(systemStats.recentTrends.alertsChange)}% faster
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium">New Registrations</div>
                  <div className="text-sm text-muted-foreground">
                    Hotel onboarding
                  </div>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                  <span className="font-semibold text-green-600">
                    +{systemStats.recentTrends.registrationsChange}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            System Alerts
          </CardTitle>
          <CardDescription>
            Recent system notifications and warnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border-l-4 border-green-500 bg-green-50 rounded-r-lg">
              <div>
                <div className="font-medium text-green-800">
                  System Update Completed
                </div>
                <div className="text-sm text-green-600">
                  Security patches applied successfully
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-green-600 border-green-600"
              >
                Info
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border-l-4 border-yellow-500 bg-yellow-50 rounded-r-lg">
              <div>
                <div className="font-medium text-yellow-800">
                  High Activity Detected
                </div>
                <div className="text-sm text-yellow-600">
                  Unusual activity in North Mumbai region
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-yellow-600 border-yellow-600"
              >
                Warning
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
              <div>
                <div className="font-medium text-blue-800">
                  Backup Completed
                </div>
                <div className="text-sm text-blue-600">
                  Daily database backup successful
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-blue-600 border-blue-600"
              >
                Success
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
