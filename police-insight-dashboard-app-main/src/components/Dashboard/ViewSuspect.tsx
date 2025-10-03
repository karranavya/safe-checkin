import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Phone,
  CreditCard,
  Car,
  Calendar,
  MapPin,
  AlertTriangle,
  Clock,
  Eye,
  FileText,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Edit3,
} from "lucide-react";

interface SuspectDetails {
  id: string | number;
  name: string;
  aadhar: string;
  phone: string;
  vehicle?: string;
  photo?: string;
  dateAdded: string;
  address?: string;
  email?: string;
  age?: number;
  occupation?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  criminalHistory?: Array<{
    case: string;
    date: string;
    status: string;
    description: string;
  }>;
  associatedAlerts?: Array<{
    id: string;
    title: string;
    type: string;
    priority: string;
    status: string;
    date: string;
    location?: string;
  }>;
  physicalDescription?: {
    height?: string;
    weight?: string;
    eyeColor?: string;
    hairColor?: string;
    distinguishingMarks?: string;
  };
  lastSeen?: {
    location: string;
    date: string;
    reportedBy: string;
  };
}

interface ViewSuspectProps {
  isOpen: boolean;
  onClose: () => void;
  suspect: SuspectDetails | null;
  onUpdateSuspect?: (suspect: SuspectDetails) => void;
}

export default function ViewSuspect({
  isOpen,
  onClose,
  suspect,
  onUpdateSuspect,
}: ViewSuspectProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(false);
  const [updatingAlert, setUpdatingAlert] = useState<string | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [localAlerts, setLocalAlerts] = useState(
    suspect?.associatedAlerts || []
  );

  const { toast } = useToast();

  // Reset active tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab("details");
      setLocalAlerts(suspect?.associatedAlerts || []);
    }
  }, [isOpen, suspect]);

  // Update alert status function
  const updateAlertStatus = async (
    alertId: string,
    status: string,
    notes?: string
  ) => {
    setUpdatingAlert(alertId);
    try {
      const token = localStorage.getItem("policeToken");
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

      const response = await fetch(
        `${apiUrl}/api/police/alerts/${alertId}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status, notes }),
        }
      );

      if (response.ok) {
        // Update local alerts state
        setLocalAlerts((prev) =>
          prev.map((alert) =>
            alert.id === alertId ? { ...alert, status } : alert
          )
        );

        // Update the suspect's associated alerts
        if (suspect && onUpdateSuspect) {
          const updatedSuspect = {
            ...suspect,
            associatedAlerts: localAlerts.map((alert) =>
              alert.id === alertId ? { ...alert, status } : alert
            ),
          };
          onUpdateSuspect(updatedSuspect);
        }

        toast({
          title: "Status Updated",
          description: `Alert status changed to ${status}`,
        });

        // Close dialog if open
        if (showStatusDialog) {
          setShowStatusDialog(false);
          setSelectedAlert(null);
          setNewStatus("");
          setStatusNotes("");
        }
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      console.error("Failed to update alert status:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update alert status. Please try again.",
      });
    } finally {
      setUpdatingAlert(null);
    }
  };

  const handleStatusChange = (alert: any) => {
    setSelectedAlert(alert);
    setNewStatus(alert.status);
    setShowStatusDialog(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "critical":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-500 text-black";
      case "low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "acknowledged":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in progress":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "acknowledged":
        return <AlertCircle className="h-4 w-4" />;
      case "in progress":
        return <RefreshCw className="h-4 w-4" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getQuickActionButton = (alert: any) => {
    const isUpdating = updatingAlert === alert.id;

    if (isUpdating) {
      return (
        <Button size="sm" disabled className="rounded-lg">
          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
          Updating...
        </Button>
      );
    }

    switch (alert.status?.toLowerCase()) {
      case "pending":
        return (
          <Button
            size="sm"
            onClick={() =>
              updateAlertStatus(
                alert.id,
                "Acknowledged",
                "Acknowledged by police officer"
              )
            }
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            <AlertCircle className="h-4 w-4 mr-1" />
            Acknowledge
          </Button>
        );
      case "acknowledged":
      case "in progress":
        return (
          <Button
            size="sm"
            onClick={() =>
              updateAlertStatus(
                alert.id,
                "Resolved",
                "Resolved by police officer"
              )
            }
            className="bg-green-500 hover:bg-green-600 text-white rounded-lg"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Resolve
          </Button>
        );
      case "resolved":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Resolved
          </Badge>
        );
      default:
        return null;
    }
  };

  if (!suspect) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <span>{suspect.name}</span>
                <p className="text-sm text-gray-500 font-normal">
                  Suspect Profile
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4 bg-gray-100">
                <TabsTrigger value="details" className="text-sm">
                  Basic Details
                </TabsTrigger>
                <TabsTrigger value="alerts" className="text-sm">
                  Associated Alerts
                </TabsTrigger>
                <TabsTrigger value="history" className="text-sm">
                  Criminal History
                </TabsTrigger>
                <TabsTrigger value="activity" className="text-sm">
                  Recent Activity
                </TabsTrigger>
              </TabsList>

              {/* Basic Details Tab - Keep existing code */}
              <TabsContent value="details" className="space-y-6 mt-6">
                {/* Your existing basic details code here */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <Card className="rounded-xl shadow-sm border border-gray-200">
                    <CardHeader className="bg-gray-50 rounded-t-xl">
                      <CardTitle className="flex items-center space-x-2 text-gray-900">
                        <User className="h-5 w-5" />
                        <span>Personal Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4">
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Full Name
                          </Label>
                          <p className="text-base text-gray-900">
                            {suspect.name}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Aadhar Number
                          </Label>
                          <div className="flex items-center space-x-2">
                            <CreditCard className="h-4 w-4 text-gray-400" />
                            <p className="text-base font-mono text-gray-900">
                              {suspect.aadhar}
                            </p>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Phone Number
                          </Label>
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <p className="text-base text-gray-900">
                              {suspect.phone}
                            </p>
                          </div>
                        </div>
                        {suspect.email && (
                          <div>
                            <Label className="text-sm font-medium text-gray-500">
                              Email Address
                            </Label>
                            <p className="text-base text-gray-900">
                              {suspect.email}
                            </p>
                          </div>
                        )}
                        {suspect.age && (
                          <div>
                            <Label className="text-sm font-medium text-gray-500">
                              Age
                            </Label>
                            <p className="text-base text-gray-900">
                              {suspect.age} years
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Last Seen Information */}
                  {suspect.lastSeen && (
                    <Card className="rounded-xl shadow-sm border border-gray-200">
                      <CardHeader className="bg-gray-50 rounded-t-xl">
                        <CardTitle className="flex items-center space-x-2 text-gray-900">
                          <MapPin className="h-5 w-5" />
                          <span>Last Seen</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="space-y-2">
                            <p className="text-sm text-orange-900">
                              <strong>Location:</strong>{" "}
                              {suspect.lastSeen.location}
                            </p>
                            <p className="text-sm text-orange-900">
                              <strong>Date:</strong>{" "}
                              {formatDate(suspect.lastSeen.date)}
                            </p>
                            <p className="text-sm text-orange-900">
                              <strong>Reported by:</strong>{" "}
                              {suspect.lastSeen.reportedBy}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Enhanced Associated Alerts Tab with Status Management */}
              <TabsContent value="alerts" className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Associated Alerts Management
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-white">
                      {localAlerts?.length || 0} Alert(s)
                    </Badge>
                    <Badge
                      className={`text-xs ${
                        localAlerts?.some((alert) => alert.status === "Pending")
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {localAlerts?.some((alert) => alert.status === "Pending")
                        ? "Action Required"
                        : "All Handled"}
                    </Badge>
                  </div>
                </div>

                {localAlerts && localAlerts.length > 0 ? (
                  <div className="space-y-4">
                    {localAlerts.map((alert, index) => (
                      <Card
                        key={index}
                        className="rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-gray-900 text-lg">
                                  {alert.title}
                                </h4>
                                <Badge
                                  className={`text-xs ${getPriorityColor(
                                    alert.priority
                                  )}`}
                                >
                                  {alert.priority}
                                </Badge>
                              </div>

                              <div className="flex items-center space-x-3">
                                <Badge
                                  className={`${getStatusColor(
                                    alert.status
                                  )} border px-2 py-1`}
                                >
                                  {getStatusIcon(alert.status)}
                                  <span className="ml-1 font-medium">
                                    {alert.status}
                                  </span>
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {alert.type}
                                </Badge>
                              </div>

                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatDate(alert.date)}</span>
                                </div>
                                {alert.location && (
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="h-4 w-4" />
                                    <span>{alert.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {/* Quick Action Button */}
                              {/* {getQuickActionButton(alert)} */}

                              {/* Advanced Status Management Button */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(alert)}
                                className="rounded-lg border-gray-300"
                                disabled={updatingAlert === alert.id}
                              >
                                <Edit3 className="h-4 w-4 mr-1" />
                                Manage
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">No associated alerts found</p>
                  </div>
                )}
              </TabsContent>

              {/* Keep existing Criminal History and Recent Activity tabs */}
              <TabsContent value="history" className="space-y-4 mt-6">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No criminal history on record</p>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4 mt-6">
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">
                    Activity tracking will be available soon
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Status Management Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <Edit3 className="h-5 w-5 text-blue-600" />
              <span>Manage Alert Status</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Update the status of "{selectedAlert?.title}" for suspect{" "}
              {suspect?.name}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status-select">New Status *</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span>Pending</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Acknowledged">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-blue-500" />
                      <span>Acknowledged</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="In Progress">
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="h-4 w-4 text-orange-500" />
                      <span>In Progress</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Resolved">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Resolved</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Cancelled">
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-gray-500" />
                      <span>Cancelled</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-notes">Notes (Optional)</Label>
              <Textarea
                id="status-notes"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Add notes about this status change..."
                className="rounded-xl min-h-[80px]"
              />
            </div>

            {selectedAlert && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Current Status:</strong> {selectedAlert.status}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Priority:</strong> {selectedAlert.priority}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Type:</strong> {selectedAlert.type}
                </p>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedAlert && newStatus) {
                  updateAlertStatus(
                    selectedAlert.id,
                    newStatus,
                    statusNotes ||
                      `Status changed to ${newStatus} by police officer`
                  );
                }
              }}
              disabled={!newStatus || updatingAlert === selectedAlert?.id}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              {updatingAlert === selectedAlert?.id ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update Status
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
