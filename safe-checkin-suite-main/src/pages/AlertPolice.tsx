import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  Eye,
  Clock,
  Shield,
  User,
  Phone,
  MapPin,
  Calendar,
  Users,
  Search,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { Guest } from "@/components/dashboard/GuestTable";
import { fetchGuests } from "@/api/guestApi";

// Create axios instance for alerts API with authentication
const alertsApi = axios.create({
  baseURL: "http://localhost:5000/api/alerts",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for authentication
alertsApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("hotelToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
alertsApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Alert API Error:", error.response?.data || error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem("hotelToken");
      localStorage.removeItem("hotelData");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

interface AlertData {
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  type: "Police";
}

const AlertPolicePage = () => {
  const [roomNumber, setRoomNumber] = useState("");
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [alertData, setAlertData] = useState<AlertData>({
    title: "",
    description: "",
    priority: "Medium",
    type: "Police",
  });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFindGuests = async () => {
    setSearchAttempted(true);
    setLoading(true);

    if (!roomNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Room number required",
        description: "Please enter a valid room number.",
      });
      setGuests([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch all guests for the specified room using the guestApi
      const { guests: allGuests } = await fetchGuests({
        roomNumber: roomNumber.trim(),
      });

      // Since we want all guests regardless of status, we might need to make multiple calls
      const [checkedInGuests, checkedOutGuests] = await Promise.all([
        fetchGuests({
          roomNumber: roomNumber.trim(),
          status: "checked-in",
        }).catch(() => ({ guests: [] })),
        fetchGuests({
          roomNumber: roomNumber.trim(),
          status: "checked-out",
        }).catch(() => ({ guests: [] })),
      ]);

      // Combine all guests from different statuses
      const combinedGuests = [
        ...checkedInGuests.guests,
        ...checkedOutGuests.guests,
      ];

      // Remove duplicates based on guest ID
      const uniqueGuests = combinedGuests.filter(
        (guest, index, self) =>
          index === self.findIndex((g) => g._id === guest._id)
      );

      if (uniqueGuests.length === 0) {
        toast({
          variant: "destructive",
          title: "No guests found",
          description: `No records found for room ${roomNumber}.`,
        });
      } else {
        toast({
          title: "Guests found",
          description: `Found ${uniqueGuests.length} guest record(s) for room ${roomNumber}.`,
        });
      }

      setGuests(uniqueGuests);
    } catch (error) {
      console.error("Error fetching guests:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch guest records. Please try again.",
      });
      setGuests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAlertDialog = (guest: Guest) => {
    setSelectedGuest(guest);
    setAlertData({
      title: `Suspicious Activity Report - ${guest.name}`,
      description: `Alert regarding guest ${guest.name} in room ${roomNumber}. Please provide details about the suspicious activity.`,
      priority: "Medium",
      type: "Police",
    });
    setAlertDialogOpen(true);
  };

  const handleSubmitAlert = async () => {
    if (
      !selectedGuest ||
      !alertData.title.trim() ||
      !alertData.description.trim()
    ) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const alertPayload = {
        guestId: selectedGuest._id,
        type: alertData.type,
        priority: alertData.priority,
        title: alertData.title.trim(),
        description: alertData.description.trim(),
        location: {
          roomNumber: selectedGuest.roomNumber || roomNumber,
          floor: Math.floor(parseInt(roomNumber) / 100).toString(),
        },
      };

      const response = await alertsApi.post("/", alertPayload);

      if (response.status === 201) {
        toast({
          title: "Alert Sent Successfully!",
          description: `Police alert created for ${selectedGuest.name} in room ${roomNumber}. Alert ID: ${response.data.alert.id}`,
        });

        // Update guest status to reported in local state
        setGuests((prevGuests) =>
          prevGuests.map((guest) =>
            guest._id === selectedGuest._id
              ? { ...guest, status: "reported" }
              : guest
          )
        );

        setAlertDialogOpen(false);
        setSelectedGuest(null);
        setAlertData({
          title: "",
          description: "",
          priority: "Medium",
          type: "Police",
        });
      }
    } catch (error) {
      console.error("Error creating alert:", error);
      let errorMessage = "Failed to create alert. Please try again.";

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          errorMessage = "Guest not found or doesn't belong to your hotel.";
        } else if (error.response?.status === 400) {
          errorMessage =
            error.response.data?.error || "Invalid alert data provided.";
        } else if (error.response?.status === 401) {
          errorMessage = "Authentication required. Please log in again.";
        }
      }

      toast({
        variant: "destructive",
        title: "Alert Failed",
        description: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "checked-in":
        return {
          label: "Checked In",
          color: "bg-green-100 text-green-800 border-green-200",
          icon: "🟢",
        };
      case "checked-out":
        return {
          label: "Checked Out",
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: "⚪",
        };
      case "reported":
        return {
          label: "Reported",
          color: "bg-red-100 text-red-800 border-red-200",
          icon: "🔴",
        };
      default:
        return {
          label: "Unknown",
          color: "bg-gray-100 text-gray-600 border-gray-200",
          icon: "❓",
        };
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "Critical":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "High":
        return <Shield className="h-4 w-4 text-orange-600" />;
      case "Medium":
        return <Eye className="h-4 w-4 text-yellow-600" />;
      case "Low":
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Eye className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "border-red-500 bg-red-50";
      case "High":
        return "border-orange-500 bg-orange-50";
      case "Medium":
        return "border-yellow-500 bg-yellow-50";
      case "Low":
        return "border-blue-500 bg-blue-50";
      default:
        return "border-gray-500 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center lg:text-left">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center justify-center lg:justify-start gap-2">
            <AlertTriangle className="h-6 w-6 lg:h-8 lg:w-8 text-red-600" />
            Alert to Police
          </h1>
          <p className="text-gray-600 mt-2">
            Report suspicious activities and create official police alerts
          </p>
        </div>

        {/* Search Card */}
        <Card className="w-full shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Search className="h-5 w-5" />
              Report Suspicious Activity
            </CardTitle>
            <CardDescription className="text-sm lg:text-base">
              Enter a room number to view all guest history and create a police
              alert if necessary. This will create an official alert in the
              system that can be tracked.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-end gap-3">
              <div className="w-full sm:flex-grow space-y-2">
                <Label
                  htmlFor="roomNumberAlert"
                  className="text-sm font-medium"
                >
                  Room Number
                </Label>
                <Input
                  id="roomNumberAlert"
                  placeholder="e.g., 101, 205, 312"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFindGuests()}
                  className="text-base"
                  disabled={loading}
                />
              </div>
              <Button
                onClick={handleFindGuests}
                disabled={loading || !roomNumber.trim()}
                className="w-full sm:w-auto px-6"
                size="default"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Find Guests
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {searchAttempted && (
          <div className="space-y-4">
            {guests.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Guest Records for Room {roomNumber}
                  </h2>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {guests.length} record(s) found
                  </span>
                </div>

                <div className="grid gap-4">
                  {guests.map((guest, index) => {
                    const statusConfig = getStatusConfig(guest.status);
                    return (
                      <Card
                        key={guest._id || index}
                        className="shadow-md hover:shadow-lg transition-shadow"
                      >
                        <CardContent className="p-4 lg:p-6">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            {/* Guest Information */}
                            <div className="flex-grow space-y-3">
                              {/* Name and Status */}
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <User className="h-5 w-5 text-gray-600" />
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {guest.name || "N/A"}
                                  </h3>
                                </div>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}
                                >
                                  <span>{statusConfig.icon}</span>
                                  {statusConfig.label}
                                </span>
                              </div>

                              {/* Contact Info */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Phone className="h-4 w-4" />
                                  <span>{guest.phone || "N/A"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <MapPin className="h-4 w-4" />
                                  <span>{guest.nationality || "Unknown"}</span>
                                </div>
                              </div>

                              {/* Visit Details */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Users className="h-4 w-4" />
                                  <span>
                                    Purpose:{" "}
                                    {guest.purposeOfVisit ||
                                      guest.purpose ||
                                      "N/A"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Users className="h-4 w-4" />
                                  <span>
                                    Guests:{" "}
                                    {guest.totalGuests || guest.guestCount || 0}
                                  </span>
                                </div>
                              </div>

                              {/* Dates */}
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    Check-in:{" "}
                                    {guest.checkInTime ||
                                      guest.checkInDate ||
                                      "N/A"}
                                  </span>
                                </div>
                                {guest.checkOutDate && (
                                  <div className="flex items-center gap-2 text-gray-600 ml-6">
                                    <span>Check-out: {guest.checkOutDate}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Alert Button */}
                            <div className="flex-shrink-0 w-full lg:w-auto">
                              <Button
                                variant={
                                  guest.status === "reported"
                                    ? "secondary"
                                    : "destructive"
                                }
                                size="default"
                                disabled={
                                  guest.status === "reported" || loading
                                }
                                onClick={() => handleOpenAlertDialog(guest)}
                                className="w-full lg:w-auto min-w-[140px] font-medium"
                              >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                {guest.status === "reported"
                                  ? "Already Reported"
                                  : "Create Alert"}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            ) : (
              <Card className="shadow-md">
                <CardContent className="p-8 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Search className="h-12 w-12 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900">
                      No guests found
                    </h3>
                    <p className="text-gray-600">
                      No guest records found for room {roomNumber}. Please check
                      the room number and try again.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Alert Creation Dialog */}
      <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              Create Police Alert
            </DialogTitle>
            <DialogDescription className="text-base">
              Creating an official police alert for{" "}
              <span className="font-semibold">{selectedGuest?.name}</span> in
              room <span className="font-semibold">{roomNumber}</span>. This
              will be recorded in the system and can be tracked.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Alert Title */}
            <div className="space-y-2">
              <Label htmlFor="alert-title" className="text-sm font-medium">
                Alert Title *
              </Label>
              <Input
                id="alert-title"
                value={alertData.title}
                onChange={(e) =>
                  setAlertData({ ...alertData, title: e.target.value })
                }
                placeholder="Brief title describing the issue"
                className="text-base"
              />
            </div>

            {/* Priority Level */}
            <div className="space-y-2">
              <Label htmlFor="alert-priority" className="text-sm font-medium">
                Priority Level
              </Label>
              <Select
                value={alertData.priority}
                onValueChange={(
                  value: "Low" | "Medium" | "High" | "Critical"
                ) => setAlertData({ ...alertData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">
                    <div className="flex items-center gap-2">
                      {getPriorityIcon("Low")}
                      Low Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="Medium">
                    <div className="flex items-center gap-2">
                      {getPriorityIcon("Medium")}
                      Medium Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="High">
                    <div className="flex items-center gap-2">
                      {getPriorityIcon("High")}
                      High Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="Critical">
                    <div className="flex items-center gap-2">
                      {getPriorityIcon("Critical")}
                      Critical Priority
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label
                htmlFor="alert-description"
                className="text-sm font-medium"
              >
                Detailed Description *
              </Label>
              <Textarea
                id="alert-description"
                value={alertData.description}
                onChange={(e) =>
                  setAlertData({ ...alertData, description: e.target.value })
                }
                placeholder="Provide detailed information about the suspicious activity, including time, behavior observed, and any other relevant details..."
                className="min-h-[120px] text-base resize-none"
              />
            </div>

            {/* Guest Information Summary */}
            {selectedGuest && (
              <div
                className={`p-4 rounded-lg border-2 ${getPriorityColor(
                  alertData.priority
                )}`}
              >
                <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Guest Information Summary
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Name:</span>{" "}
                    {selectedGuest.name}
                  </div>
                  <div>
                    <span className="font-medium">Room:</span> {roomNumber}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span>{" "}
                    {selectedGuest.phone}
                  </div>
                  <div>
                    <span className="font-medium">Nationality:</span>{" "}
                    {selectedGuest.nationality}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-medium">Purpose:</span>{" "}
                    {selectedGuest.purpose}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setAlertDialogOpen(false)}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmitAlert}
              disabled={
                submitting ||
                !alertData.title.trim() ||
                !alertData.description.trim()
              }
              className="w-full sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Alert...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Create Police Alert
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AlertPolicePage;
