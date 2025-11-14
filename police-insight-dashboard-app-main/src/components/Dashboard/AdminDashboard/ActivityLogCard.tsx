// ActivityLogCard.tsx - ENHANCED WITH STATUS CHANGE DETAILS
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  ArrowRight,
  Info,
  Calendar,
} from "lucide-react";

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
  metadata?: any;
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
  severity?: string;
  category?: string;
  status?: string;
}

interface ActivityLogCardProps {
  activity: ActivityLog;
  actionColor: string;
}

export const ActivityLogCard: React.FC<ActivityLogCardProps> = ({
  activity,
  actionColor,
}) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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
      evidence: <FileText className="h-4 w-4" />,
    };
    return icons[targetType] || <FileText className="h-4 w-4" />;
  };

  const getActionDescription = (
    action: string,
    targetType: string,
    details: any
  ) => {
    // ⭐ ENHANCED: Show status changes with "from → to"
    if (action === "alert_status_updated" && details?.statusChange) {
      return `updated alert status: ${details.statusChange}`;
    }

    const descriptions: { [key: string]: string } = {
      hotel_verified: "verified a hotel registration",
      hotel_registered: "registered a new hotel",
      hotel_updated: "updated hotel information",
      hotel_deleted: "removed a hotel registration",
      suspect_added: "added a new suspect",
      suspect_updated: "updated suspect information",
      suspect_deleted: "removed a suspect",
      suspect_viewed: "viewed suspect details",
      suspect_verified: "verified a suspect",
      suspect_status_updated: details?.statusChange
        ? `updated suspect status: ${details.statusChange}`
        : "updated suspect status",
      alert_created: "created a new alert",
      alert_updated: "updated an alert",
      alert_removed: "removed an alert",
      alert_viewed: "viewed an alert",
      alert_resolved: "resolved an alert",
      alert_acknowledged: "acknowledged an alert",
      alert_assigned: details?.assignedTo
        ? `assigned alert to ${details.assignedTo}`
        : "assigned an alert",
      case_handled: "handled a case",
      case_updated: "updated case information",
      case_closed: "closed a case",
      report_generated: "generated a report",
      report_viewed: "viewed a report",
      evidence_uploaded: "uploaded evidence",
      evidence_viewed: "viewed evidence",
      evidence_approved: "approved evidence",
      evidence_rejected: "rejected evidence",
      guest_checked:
        details?.action === "check_in"
          ? "checked in a guest"
          : "checked out a guest",
      guest_flagged: "flagged a guest as suspicious",
      profile_updated: "updated profile information",
      login_attempt: details?.success
        ? "logged in successfully"
        : "failed login attempt",
      logout: "logged out",
      password_changed: "changed password",
      role_updated: "updated user role",
      status_changed: "changed user status",
    };
    return descriptions[action] || `performed ${action.replace(/_/g, " ")}`;
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    };
    return colors[severity as keyof typeof colors] || "";
  };

  const getPerformerInfo = () => {
    if (!activity.performedBy) {
      return {
        name: "Unknown User",
        rank: "Unknown",
        badgeNumber: "N/A",
      };
    }
    return {
      name: activity.performedBy.name || "Unknown User",
      rank: activity.performedBy.rank || "Unknown",
      badgeNumber: activity.performedBy.badgeNumber || "N/A",
    };
  };

  const performerInfo = getPerformerInfo();

  // ⭐ NEW: Format status change display
  const renderStatusChange = () => {
    const { details } = activity;

    if (details?.previousStatus && details?.newStatus) {
      return (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <div className="flex items-center gap-2 text-sm">
            <Badge className="bg-gray-200 text-gray-800">
              {details.previousStatus}
            </Badge>
            <ArrowRight className="h-4 w-4 text-blue-600" />
            <Badge className="bg-blue-600 text-white">
              {details.newStatus}
            </Badge>
          </div>
        </div>
      );
    }

    if (details?.statusChange) {
      return (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">
            {details.statusChange}
          </span>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <div className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
        {/* Activity Icon */}
        <div className="flex-shrink-0 p-2 bg-blue-100 rounded-full">
          {getActionIcon(activity.targetType)}
        </div>

        {/* Activity Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-sm">{performerInfo.name}</span>
              <Badge variant="outline" className="text-xs">
                {performerInfo.rank}
              </Badge>
              <Badge variant="outline" className="text-xs">
                #{performerInfo.badgeNumber}
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

          {/* ⭐ NEW: Show status change inline */}
          {(activity.details?.previousStatus ||
            activity.details?.statusChange) && (
            <div className="mt-2">{renderStatusChange()}</div>
          )}

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-4">
              <Badge className={`text-xs ${actionColor}`}>
                {activity.action.replace(/_/g, " ").toUpperCase()}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {activity.targetType.toUpperCase()}
              </Badge>

              {activity.severity && (
                <Badge
                  className={`text-xs ${getSeverityColor(activity.severity)}`}
                >
                  {activity.severity.toUpperCase()}
                </Badge>
              )}

              {activity.ipAddress && activity.ipAddress !== "::1" && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 mr-1" />
                  {activity.ipAddress}
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => setShowDetailsModal(true)}
            >
              <Eye className="h-3 w-3 mr-1" />
              <span className="text-xs">Details</span>
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Activity Details</span>
              <Badge className={actionColor}>
                {activity.action.replace(/_/g, " ")}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Complete information about this activity with change tracking
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* ⭐ ENHANCED: Status Change Section */}
            {(activity.details?.previousStatus ||
              activity.details?.statusChange) && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <ArrowRight className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-lg text-blue-900">
                    Status Change Details
                  </h3>
                </div>

                {activity.details.previousStatus &&
                activity.details.newStatus ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">
                          Previous Status
                        </p>
                        <Badge className="bg-gray-200 text-gray-800 text-sm">
                          {activity.details.previousStatus}
                        </Badge>
                      </div>
                      <ArrowRight className="h-6 w-6 text-blue-600 mx-4" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">New Status</p>
                        <Badge className="bg-green-600 text-white text-sm">
                          {activity.details.newStatus}
                        </Badge>
                      </div>
                    </div>

                    {activity.details.updatedBy && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <User className="h-4 w-4" />
                        <span>
                          Updated by:{" "}
                          <strong>{activity.details.updatedBy}</strong>
                        </span>
                      </div>
                    )}

                    {activity.details.notes && (
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Notes</p>
                        <p className="text-sm text-gray-700">
                          {activity.details.notes}
                        </p>
                      </div>
                    )}

                    {activity.details.timeToResolve && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Clock className="h-4 w-4" />
                        <span>
                          Time to resolve:{" "}
                          <strong>
                            {activity.details.timeToResolve} minutes
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      {activity.details.statusChange}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Performed By
                </label>
                <p className="text-sm mt-1">{performerInfo.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Badge Number
                </label>
                <p className="text-sm mt-1">#{performerInfo.badgeNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Rank
                </label>
                <p className="text-sm mt-1">{performerInfo.rank}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Timestamp
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <p className="text-sm">
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Activity Information */}
            <div>
              <label className="text-sm font-medium text-gray-600">
                Action
              </label>
              <p className="text-sm mt-1">
                {getActionDescription(
                  activity.action,
                  activity.targetType,
                  activity.details
                )}
              </p>
            </div>

            {/* Target Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Target Type
                </label>
                <p className="text-sm mt-1 capitalize">{activity.targetType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Target ID
                </label>
                <p className="text-sm mt-1 font-mono text-xs break-all">
                  {activity.targetId}
                </p>
              </div>
            </div>

            {/* Severity and Category */}
            {(activity.severity || activity.category) && (
              <div className="grid grid-cols-2 gap-4">
                {activity.severity && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Severity
                    </label>
                    <Badge
                      className={`mt-1 ${getSeverityColor(activity.severity)}`}
                    >
                      {activity.severity.toUpperCase()}
                    </Badge>
                  </div>
                )}
                {activity.category && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Category
                    </label>
                    <p className="text-sm mt-1 capitalize">
                      {activity.category.replace(/_/g, " ")}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ⭐ ENHANCED: Related Information */}
            {(activity.details?.guestName ||
              activity.details?.alertTitle ||
              activity.details?.hotelName ||
              activity.details?.assignedTo) && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-600">
                  Related Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {activity.details.guestName && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">
                        Guest/Suspect
                      </label>
                      <p className="text-sm mt-1">
                        {activity.details.guestName}
                      </p>
                    </div>
                  )}
                  {activity.details.alertTitle && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">
                        Alert Title
                      </label>
                      <p className="text-sm mt-1">
                        {activity.details.alertTitle}
                      </p>
                    </div>
                  )}
                  {activity.details.hotelName && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">
                        Hotel
                      </label>
                      <p className="text-sm mt-1">
                        {activity.details.hotelName}
                      </p>
                    </div>
                  )}
                  {activity.details.assignedTo && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">
                        Assigned To
                      </label>
                      <p className="text-sm mt-1">
                        {activity.details.assignedTo}
                      </p>
                    </div>
                  )}
                  {activity.details.priority && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">
                        Priority
                      </label>
                      <Badge className="mt-1">
                        {activity.details.priority}
                      </Badge>
                    </div>
                  )}
                  {activity.details.type && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">
                        Type
                      </label>
                      <p className="text-sm mt-1">{activity.details.type}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Technical Details */}
            {(activity.ipAddress || activity.userAgent) && (
              <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-600">
                  Technical Information
                </h4>
                {activity.ipAddress && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">
                      IP Address
                    </label>
                    <p className="text-sm mt-1">{activity.ipAddress}</p>
                  </div>
                )}
                {activity.userAgent && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">
                      User Agent
                    </label>
                    <p className="text-xs mt-1 text-gray-600 break-all">
                      {activity.userAgent}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Additional Details */}
            {activity.details && Object.keys(activity.details).length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">
                  Complete Activity Data
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <pre className="text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                    {JSON.stringify(activity.details, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
