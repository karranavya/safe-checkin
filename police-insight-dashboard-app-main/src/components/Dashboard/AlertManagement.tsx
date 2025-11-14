// components/police/AlertManagement.jsx - COMPLETE VERSION
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  Phone,
  Clock,
  MapPin,
  Building,
  Eye,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import ViewSuspect from "./ViewSuspect";
import VerifySuspectModal from "./VerifySuspectModal";

interface AlertManagementProps {
  alerts: any[];
  setAlerts: React.Dispatch<React.SetStateAction<any[]>>;
  loading: boolean;
  fetchAlerts: () => Promise<void>;
  updateAlertStatus: (
    alertId: string,
    status: string,
    notes?: string
  ) => Promise<void>;
  token: string;
  onSuspectVerified?: (suspect: any) => void;
}

export default function AlertManagement({
  alerts,
  setAlerts,
  loading,
  fetchAlerts,
  updateAlertStatus,
  token,
  onSuspectVerified,
}: AlertManagementProps) {
  const { toast } = useToast();

  // ========== STATE ========== //
  const [alertFilters, setAlertFilters] = useState({
    status: "all",
    priority: "all",
    type: "all",
  });
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [showViewSuspectModal, setShowViewSuspectModal] = useState(false);
  const [selectedSuspectForView, setSelectedSuspectForView] =
    useState<any>(null);
  const [showVerifySuspectModal, setShowVerifySuspectModal] = useState(false);
  const [selectedAlertForVerification, setSelectedAlertForVerification] =
    useState<any>(null);

  // ========== EFFECTS ========== //
  useEffect(() => {
    fetchFilteredAlerts();
  }, [alertFilters]);

  // ========== FETCH FILTERED ALERTS ========== //
  const fetchFilteredAlerts = async () => {
    try {
      if (!token) return;

      const params = new URLSearchParams();
      params.append("status", alertFilters.status);
      params.append("priority", alertFilters.priority);
      params.append("type", alertFilters.type);
      params.append("limit", "50");
      params.append("sortBy", "createdAt");
      params.append("sortOrder", "desc");

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(
        `${apiUrl}/api/police/alerts?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const unverifiedAlerts = (data.alerts || []).filter(
          (alert) => !alert.suspectVerification?.isVerifiedSuspect
        );
        setAlerts(unverifiedAlerts);
      }
    } catch (error) {
      console.error("Failed to fetch filtered alerts:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch alerts",
      });
    }
  };

  // ========== HANDLERS ========== //
  const handleMarkAsSuspect = (alert: any) => {
    setSelectedAlertForVerification(alert);
    setShowVerifySuspectModal(true);
  };

  // ⭐ UPDATE THIS FUNCTION
  const handleSuspectVerificationSuccess = (suspect: any) => {
    // Remove the verified alert from the list
    setAlerts((prev) =>
      prev.filter((alert) => alert._id !== selectedAlertForVerification?._id)
    );

    // Close modal
    setShowVerifySuspectModal(false);
    setSelectedAlertForVerification(null);

    // ⭐ CALL onSuspectVerified CALLBACK
    if (onSuspectVerified) {
      onSuspectVerified(suspect);
    }

    toast({
      title: "Success! ✅",
      description: `${
        suspect.suspectData?.name || "Guest"
      } has been verified as a suspect.`,
    });
  };

  const handleViewSuspect = (alert: any) => {
    if (alert.guestId) {
      const suspectData = {
        id: alert.guestId._id || `guest-${alert._id}`,
        name: alert.guestId.name || "Unknown",
        aadhar: alert.guestId.aadhar || "Not Available",
        phone: alert.guestId.phone || "Not Available",
        email: alert.guestId.email || "",
        age: alert.guestId.age || null,
        roomNumber: alert.guestId.roomNumber || "N/A",
        address: alert.guestId.address || "",
        nationality: alert.guestId.nationality || "",
        photo: alert.guestId.photo || "/placeholder-avatar.jpg",
        dateAdded: alert.createdAt || new Date().toISOString(),
        associatedAlerts: [
          {
            id: alert._id,
            title: alert.title,
            type: alert.type,
            priority: alert.priority,
            status: alert.status,
            date: alert.createdAt,
            location: alert.location
              ? `Room ${alert.location.roomNumber}${
                  alert.location.floor ? `, Floor ${alert.location.floor}` : ""
                }`
              : alert.hotelId?.name || "Unknown",
          },
        ],
        lastSeen: {
          location: alert.location
            ? `${alert.hotelId?.name || "Hotel"} - Room ${
                alert.location.roomNumber
              }`
            : alert.hotelId?.name || "Unknown Location",
          date: alert.createdAt,
          reportedBy: alert.reportedBy || "Hotel Security System",
        },
      };

      setSelectedSuspectForView(suspectData);
      setShowViewSuspectModal(true);
    } else {
      setSelectedAlert(alert);
      setShowAlertModal(true);
    }
  };

  // ========== UTILITY FUNCTIONS ========== //
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
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

  const handleAcknowledgeAlert = (alertId: string) => {
    updateAlertStatus(alertId, "Acknowledged", "Acknowledged by police");
  };

  const handleResolveAlert = (alertId: string) => {
    updateAlertStatus(alertId, "Resolved", "Resolved by police department");
  };

  const handleCancelAlert = (alertId: string) => {
    updateAlertStatus(
      alertId,
      "Cancelled",
      "Cancelled by police - false alarm or duplicate"
    );
  };

  // ========== RENDER ========== //
  return (
    <>
      {/* ========== FILTERS ========== */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <Select
            value={alertFilters.status}
            onValueChange={(value) =>
              setAlertFilters((prev) => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger className="w-[140px] rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Acknowledged">Acknowledged</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={alertFilters.priority}
            onValueChange={(value) =>
              setAlertFilters((prev) => ({ ...prev, priority: value }))
            }
          >
            <SelectTrigger className="w-[140px] rounded-xl">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={alertFilters.type}
            onValueChange={(value) =>
              setAlertFilters((prev) => ({ ...prev, type: value }))
            }
          >
            <SelectTrigger className="w-[140px] rounded-xl">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Police">Police</SelectItem>
              <SelectItem value="Security">Security</SelectItem>
              <SelectItem value="Emergency">Emergency</SelectItem>
              <SelectItem value="Management">Management</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto">
          <Badge variant="outline" className="text-sm whitespace-nowrap">
            {alerts.length} Alerts
          </Badge>
          <Button
            onClick={fetchAlerts}
            disabled={loading}
            variant="outline"
            size="sm"
            className="rounded-xl whitespace-nowrap"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* ========== ALERTS GRID ========== */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-16 w-16 mx-auto text-gray-400 mb-4 animate-spin" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Loading Alerts...
          </h3>
          <p className="text-gray-500">
            Fetching latest alerts from the system.
          </p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Alerts Found
          </h3>
          <p className="text-gray-500">
            No alerts match your current filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {alerts.map((alert) => (
            <Card
              key={alert._id}
              className="bg-white shadow-lg rounded-2xl border hover:shadow-xl transition-all duration-300"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`h-3 w-3 rounded-full ${getPriorityColor(
                          alert.priority
                        )}`}
                      />
                      <CardTitle className="text-lg truncate">
                        {alert.title || "No Title"}
                      </CardTitle>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          alert.status === "Resolved" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {getStatusIcon(alert.status)}
                        <span className="ml-1">
                          {alert.status || "Unknown"}
                        </span>
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {alert.priority || "N/A"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {alert.type || "N/A"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full h-8 w-8 flex-shrink-0"
                    onClick={() => handleViewSuspect(alert)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {alert.description || "No description"}
                </p>

                {/* GUEST INFORMATION */}
                {alert.guestId && (
                  <div className="bg-white rounded-lg p-3 space-y-2 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {alert.guestId.name || "N/A"}
                      </span>
                    </div>
                    {alert.guestId.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm">{alert.guestId.phone}</span>
                      </div>
                    )}
                    {alert.guestId.roomNumber && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm">
                          Room {alert.guestId.roomNumber}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* HOTEL INFORMATION */}
                {alert.hotelId && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm">{alert.hotelId.name}</span>
                  </div>
                )}

                {/* FOOTER */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t">
                  <span className="text-xs text-gray-500">
                    {new Date(alert.createdAt).toLocaleString()}
                  </span>

                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {!alert.suspectVerification?.isVerifiedSuspect ? (
                      <Button
                        size="sm"
                        onClick={() => handleMarkAsSuspect(alert)}
                        className="flex-1 sm:flex-none bg-gradient-to-r from-orange-500 to-red-600 hover:opacity-90 rounded-lg text-white text-xs"
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Mark Suspect
                      </Button>
                    ) : (
                      <Badge className="bg-green-600 text-white flex-1 sm:flex-none justify-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}

                    {alert.status === "Pending" && (
                      <Button
                        size="sm"
                        onClick={() => handleAcknowledgeAlert(alert._id)}
                        className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs"
                      >
                        Acknowledge
                      </Button>
                    )}

                    {(alert.status === "Acknowledged" ||
                      alert.status === "In Progress") && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleResolveAlert(alert._id)}
                          className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs"
                        >
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelAlert(alert._id)}
                          className="flex-1 sm:flex-none rounded-lg text-xs"
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ========== ALERT DETAIL MODAL ========== */}
      <Dialog open={showAlertModal} onOpenChange={setShowAlertModal}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div
                className={`h-3 w-3 rounded-full ${
                  selectedAlert ? getPriorityColor(selectedAlert.priority) : ""
                }`}
              />
              {selectedAlert?.title || "Alert Details"}
            </DialogTitle>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-6 py-6">
              {/* Alert Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(selectedAlert.status)}
                    <span>{selectedAlert.status}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <Badge
                    className={`mt-1 ${getPriorityColor(
                      selectedAlert.priority
                    )} text-white`}
                  >
                    {selectedAlert.priority}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <Badge variant="outline" className="mt-1">
                    {selectedAlert.type}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm mt-1">
                    {new Date(selectedAlert.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm mt-2 p-3 bg-gray-50 rounded-lg">
                  {selectedAlert.description}
                </p>
              </div>

              {/* Guest Information */}
              {selectedAlert.guestId && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Guest Information
                  </Label>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <Label className="text-xs text-blue-700">Name</Label>
                      <p className="text-sm font-medium mt-1">
                        {selectedAlert.guestId.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-blue-700">Phone</Label>
                      <p className="text-sm font-medium mt-1">
                        {selectedAlert.guestId.phone || "N/A"}
                      </p>
                    </div>
                    {selectedAlert.guestId.email && (
                      <div>
                        <Label className="text-xs text-blue-700">Email</Label>
                        <p className="text-sm font-medium mt-1">
                          {selectedAlert.guestId.email}
                        </p>
                      </div>
                    )}
                    {selectedAlert.guestId.roomNumber && (
                      <div>
                        <Label className="text-xs text-blue-700">Room</Label>
                        <p className="text-sm font-medium mt-1">
                          {selectedAlert.guestId.roomNumber}
                        </p>
                      </div>
                    )}
                    {selectedAlert.guestId.aadhar && (
                      <div>
                        <Label className="text-xs text-blue-700">Aadhar</Label>
                        <p className="text-sm font-medium mt-1">
                          {selectedAlert.guestId.aadhar}
                        </p>
                      </div>
                    )}
                    {selectedAlert.guestId.status && (
                      <div>
                        <Label className="text-xs text-blue-700">Status</Label>
                        <Badge className="mt-1 text-xs">
                          {selectedAlert.guestId.status}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Hotel Information */}
              {selectedAlert.hotelId && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Hotel Information
                  </Label>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <Label className="text-xs text-gray-600">
                        Hotel Name
                      </Label>
                      <p className="text-sm font-medium mt-1">
                        {selectedAlert.hotelId.name}
                      </p>
                    </div>
                    {selectedAlert.hotelId.phone && (
                      <div>
                        <Label className="text-xs text-gray-600">Phone</Label>
                        <p className="text-sm font-medium mt-1">
                          {selectedAlert.hotelId.phone}
                        </p>
                      </div>
                    )}
                    {selectedAlert.hotelId.address && (
                      <div className="col-span-2">
                        <Label className="text-xs text-gray-600">Address</Label>
                        <p className="text-sm font-medium mt-1">
                          {selectedAlert.hotelId.address}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Location */}
              {selectedAlert.location && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Location Details
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500">Room</Label>
                        <p className="text-sm">
                          {selectedAlert.location.roomNumber}
                        </p>
                      </div>
                      {selectedAlert.location.floor && (
                        <div>
                          <Label className="text-xs text-gray-500">Floor</Label>
                          <p className="text-sm">
                            {selectedAlert.location.floor}
                          </p>
                        </div>
                      )}
                      {selectedAlert.location.building && (
                        <div>
                          <Label className="text-xs text-gray-500">
                            Building
                          </Label>
                          <p className="text-sm">
                            {selectedAlert.location.building}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              {selectedAlert.timeline && selectedAlert.timeline.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Timeline</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedAlert.timeline.map((entry, idx) => (
                      <div
                        key={idx}
                        className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium">
                              {entry.action}
                            </span>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {new Date(entry.timestamp).toLocaleString()}
                            </span>
                          </div>
                          {entry.performedBy && (
                            <p className="text-xs text-gray-600 mt-1">
                              by {entry.performedBy.name}
                            </p>
                          )}
                          {entry.notes && (
                            <p className="text-xs text-gray-600 mt-1">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t flex-wrap gap-2">
                {selectedAlert.status === "Pending" && (
                  <Button
                    onClick={() => {
                      handleAcknowledgeAlert(selectedAlert._id);
                      setShowAlertModal(false);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Acknowledge
                  </Button>
                )}

                {(selectedAlert.status === "Acknowledged" ||
                  selectedAlert.status === "In Progress") && (
                  <>
                    <Button
                      onClick={() => {
                        handleResolveAlert(selectedAlert._id);
                        setShowAlertModal(false);
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Resolved
                    </Button>
                    <Button
                      onClick={() => {
                        handleCancelAlert(selectedAlert._id);
                        setShowAlertModal(false);
                      }}
                      variant="destructive"
                      className="rounded-xl"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Alert
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  onClick={() => setShowAlertModal(false)}
                  className="rounded-xl"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========== VERIFY SUSPECT MODAL ========== */}
      {showVerifySuspectModal && selectedAlertForVerification && (
        <VerifySuspectModal
          isOpen={showVerifySuspectModal}
          onClose={() => {
            setShowVerifySuspectModal(false);
            setSelectedAlertForVerification(null);
          }}
          alert={selectedAlertForVerification}
          onSuccess={handleSuspectVerificationSuccess}
          token={token}
        />
      )}

      {/* ========== VIEW SUSPECT MODAL ========== */}
      {showViewSuspectModal && selectedSuspectForView && (
        <ViewSuspect
          isOpen={showViewSuspectModal}
          onClose={() => {
            setShowViewSuspectModal(false);
            setSelectedSuspectForView(null);
          }}
          suspect={selectedSuspectForView}
          onUpdateSuspect={(updatedSuspect) => {
            console.log("Suspect updated:", updatedSuspect);
          }}
        />
      )}
    </>
  );
}
