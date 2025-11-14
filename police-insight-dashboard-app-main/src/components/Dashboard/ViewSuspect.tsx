// components/police/ViewSuspect.tsx - UPDATED WITH EVIDENCE TAB
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // ⭐ NEW
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  Shield, // ⭐ NEW
} from "lucide-react";
import EvidenceViewer from "./Evidence/EvidenceViewer"; // ⭐ NEW

interface ViewSuspectProps {
  isOpen: boolean;
  onClose: () => void;
  suspect: any;
  onUpdateSuspect?: (suspect: any) => void;
}

export default function ViewSuspect({
  isOpen,
  onClose,
  suspect,
  onUpdateSuspect,
}: ViewSuspectProps) {
  const { toast } = useToast();
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  if (!suspect) return null;

  const formatDate = (date: any) => {
    try {
      if (!date) return "N/A";
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const handleUpdateAlertStatus = async () => {
    if (!selectedAlert) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No alert selected",
      });
      return;
    }

    if (!selectedAlert.id && !selectedAlert.alertId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Alert ID is missing",
      });
      return;
    }

    const alertId = selectedAlert.id || selectedAlert.alertId;

    setIsUpdating(true);
    try {
      const token = localStorage.getItem("policeToken");
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

      console.log("📤 Updating alert:", { alertId, status: newStatus });

      const response = await fetch(
        `${apiUrl}/api/police/alerts/${alertId}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
            notes: `Status updated to ${newStatus}`,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update");
      }

      toast({
        title: "✅ Success",
        description: `Alert status updated to ${newStatus}`,
      });

      setSelectedAlert(null);
      setNewStatus("");
    } catch (error: any) {
      console.error("❌ Update error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update alert status",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "acknowledged":
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case "in progress":
        return <RefreshCw className="h-4 w-4 text-orange-500" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <p>{suspect.name || "Unknown"}</p>
              <p className="text-xs text-gray-500 font-normal">
                Suspect Profile
              </p>
            </div>
          </DialogTitle>
          <DialogDescription>
            View and manage suspect details, alerts, and evidence.
          </DialogDescription>
        </DialogHeader>

        {/* ⭐ NEW: Tabs for organizing content */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-lg">
            <TabsTrigger value="details" className="rounded-lg">
              <Shield className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="alerts" className="rounded-lg">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="evidence" className="rounded-lg">
              <FileText className="h-4 w-4 mr-2" />
              Evidence
            </TabsTrigger>
          </TabsList>

          {/* ========== DETAILS TAB ========== */}
          <TabsContent value="details" className="space-y-4 py-4">
            {/* PERSONAL INFO */}
            <Card className="rounded-lg">
              <CardContent className="pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-xs text-gray-500">Name</Label>
                    <p className="font-medium mt-1">{suspect.name || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Phone</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <p className="font-medium">{suspect.phone || "N/A"}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Email</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-3 w-3 text-gray-400" />
                      <p className="font-medium truncate">
                        {suspect.email || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Aadhar</Label>
                    <p className="font-mono text-sm mt-1">
                      {suspect.aadhar || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Age</Label>
                    <p className="font-medium mt-1">{suspect.age || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Room</Label>
                    <p className="font-medium mt-1">
                      {suspect.roomNumber || "N/A"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-gray-500">Address</Label>
                    <p className="font-medium mt-1">
                      {suspect.address || "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* LAST SEEN */}
            {suspect.lastSeen && (
              <Card className="rounded-lg">
                <CardContent className="pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Last Seen
                  </h3>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-2">
                    <p>
                      <strong>Location:</strong>{" "}
                      {suspect.lastSeen.location || "N/A"}
                    </p>
                    <p>
                      <strong>Date:</strong> {formatDate(suspect.lastSeen.date)}
                    </p>
                    <p>
                      <strong>Reported By:</strong>{" "}
                      {suspect.lastSeen.reportedBy || "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* VERIFICATION */}
            {suspect.verifiedBy && (
              <Card className="rounded-lg bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Verification
                  </h3>
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Verified By:</strong> {suspect.verifiedBy.name}
                    </p>
                    <p>
                      <strong>Rank:</strong> {suspect.verifiedBy.rank}
                    </p>
                    <p>
                      <strong>Date:</strong> {formatDate(suspect.dateAdded)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* REASON FOR SUSPICION */}
            {suspect.evidence?.reasonForSuspicion && (
              <Card className="rounded-lg">
                <CardContent className="pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Reason for Suspicion
                  </h3>
                  <p className="text-sm text-gray-700 p-3 bg-blue-50 rounded-lg">
                    {suspect.evidence.reasonForSuspicion}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ========== ALERTS TAB ========== */}
          <TabsContent value="alerts" className="space-y-4 py-4">
            {suspect.associatedAlerts && suspect.associatedAlerts.length > 0 ? (
              <Card className="rounded-lg">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Associated Alerts ({suspect.associatedAlerts.length})
                    </h3>
                    <Badge
                      className={
                        suspect.associatedAlerts.some((a: any) =>
                          ["Pending", "Acknowledged", "In Progress"].includes(
                            a.status
                          )
                        )
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }
                    >
                      {suspect.associatedAlerts.some((a: any) =>
                        ["Pending", "Acknowledged", "In Progress"].includes(
                          a.status
                        )
                      )
                        ? "⚠️ Action Required"
                        : "✓ All Handled"}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {suspect.associatedAlerts.map((alert: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-900 text-sm">
                                {alert.title || "Alert"}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {alert.type || "N/A"}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600">
                              {formatDate(
                                alert.date || alert.createdAt || alert.alertDate
                              )}
                            </p>
                          </div>
                          <Badge className="text-xs bg-yellow-100 text-yellow-800">
                            {alert.priority || "N/A"}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(alert.status)}
                          <Badge variant="outline" className="text-xs">
                            {alert.status || "Unknown"}
                          </Badge>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs rounded-lg mt-2"
                          onClick={() => {
                            setSelectedAlert(alert);
                            setNewStatus(alert.status || "");
                          }}
                        >
                          Manage Status
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Status Update Section */}
                  {selectedAlert && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
                      <Label className="text-xs font-medium">
                        Update Status
                      </Label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger className="rounded-lg text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Acknowledged">
                            Acknowledged
                          </SelectItem>
                          <SelectItem value="In Progress">
                            In Progress
                          </SelectItem>
                          <SelectItem value="Resolved">Resolved</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs rounded-lg"
                          onClick={() => {
                            setSelectedAlert(null);
                            setNewStatus("");
                          }}
                          disabled={isUpdating}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 text-xs rounded-lg bg-blue-600 hover:bg-blue-700"
                          onClick={handleUpdateAlertStatus}
                          disabled={isUpdating || !newStatus}
                        >
                          {isUpdating ? "Updating..." : "Update"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 font-medium">No Alerts</p>
                <p className="text-sm text-gray-500 mt-1">
                  No alerts associated with this suspect
                </p>
              </div>
            )}
          </TabsContent>

          {/* ⭐ NEW: EVIDENCE TAB */}
          <TabsContent value="evidence" className="py-4">
            <EvidenceViewer
              suspectId={suspect.id}
              token={localStorage.getItem("policeToken") || ""}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
