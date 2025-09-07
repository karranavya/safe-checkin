// components/Dashboard/AdminDashboard/ActivityLogCard.tsx - NEW FILE
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  Clock,
  MapPin,
  Eye,
  ChevronRight,
  Shield,
  Building,
  Users,
  AlertTriangle,
  FileText,
} from "lucide-react";

interface ActivityLog {
  _id: string;
  performedBy: {
    _id: string;
    name: string;
    badgeNumber: string;
    rank: string;
  };
  action: string;
  targetType: string;
  targetId: string;
  details: any;
  createdAt: string;
  ipAddress?: string;
}

interface ActivityLogCardProps {
  activity: ActivityLog;
  actionColor: string;
}

export const ActivityLogCard: React.FC<ActivityLogCardProps> = ({
  activity,
  actionColor,
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const getActionIcon = (targetType: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      hotel: <Building className="h-4 w-4" />,
      suspect: <Users className="h-4 w-4" />,
      alert: <AlertTriangle className="h-4 w-4" />,
      case: <Shield className="h-4 w-4" />,
      report: <FileText className="h-4 w-4" />,
      profile: <User className="h-4 w-4" />,
      system: <Shield className="h-4 w-4" />,
    };
    return icons[targetType] || <FileText className="h-4 w-4" />;
  };

  const getActionDescription = (
    action: string,
    targetType: string,
    details: any
  ) => {
    const descriptions: { [key: string]: string } = {
      hotel_verified: "verified a hotel registration",
      hotel_registered: "registered a new hotel",
      hotel_updated: "updated hotel information",
      hotel_deleted: "removed a hotel registration",
      suspect_added: "added a new suspect",
      suspect_updated: "updated suspect information",
      suspect_deleted: "removed a suspect",
      suspect_viewed: "viewed suspect details",
      alert_created: "created a new alert",
      alert_updated: "updated an alert",
      alert_removed: "removed an alert",
      case_handled: "handled a case",
      case_updated: "updated case information",
      case_closed: "closed a case",
      report_generated: "generated a report",
      report_viewed: "viewed a report",
      profile_updated: "updated profile information",
      login_attempt: details?.success
        ? "logged in successfully"
        : "failed login attempt",
      logout: "logged out",
    };
    return descriptions[action] || `performed ${action.replace(/_/g, " ")}`;
  };

  return (
    <div className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      {/* Activity Icon */}
      <div className="flex-shrink-0 p-2 bg-blue-100 rounded-full">
        {getActionIcon(activity.targetType)}
      </div>

      {/* Activity Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm">
              {activity.performedBy.name}
            </span>
            <Badge variant="outline" className="text-xs">
              {activity.performedBy.rank}
            </Badge>
            <Badge variant="outline" className="text-xs">
              #{activity.performedBy.badgeNumber}
            </Badge>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatTime(activity.createdAt)}
          </div>
        </div>

        <div className="mt-1">
          <span className="text-sm text-muted-foreground">
            {getActionDescription(
              activity.action,
              activity.targetType,
              activity.details
            )}
          </span>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-4">
            <Badge className={`text-xs ${actionColor}`}>
              {activity.action.replace(/_/g, " ").toUpperCase()}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {activity.targetType.toUpperCase()}
            </Badge>
            {activity.ipAddress && (
              <div className="flex items-center text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1" />
                {activity.ipAddress}
              </div>
            )}
          </div>

          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Eye className="h-3 w-3 mr-1" />
            <span className="text-xs">Details</span>
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        {/* Additional Details */}
        {activity.details && Object.keys(activity.details).length > 0 && (
          <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
            <div className="text-muted-foreground">
              Additional details:{" "}
              {JSON.stringify(activity.details).substring(0, 100)}
              {JSON.stringify(activity.details).length > 100 && "..."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
