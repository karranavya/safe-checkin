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
import { AlertTriangle, Eye, Clock, Shield } from "lucide-react";
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
      // or modify the backend to accept a parameter to return all statuses
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

  const statusLabel = (status: string) => {
    switch (status) {
      case "checked-in":
        return "🟢 Checked In";
      case "checked-out":
        return "⚪ Checked Out";
      case "reported":
        return "🔴 Reported";
      default:
        return "Unknown";
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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Alert to Police</h1>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Report Suspicious Activity</CardTitle>
          <CardDescription>
            Enter a room number to view all guest history and create a police
            alert if necessary. This will create an official alert in the
            system.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-grow space-y-2">
              <Label htmlFor="roomNumberAlert">Room Number</Label>
              <Input
                id="roomNumberAlert"
                placeholder="e.g., 101"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFindGuests()}
              />
            </div>
            <Button onClick={handleFindGuests} disabled={loading}>
              {loading ? "Searching..." : "Find Guests"}
            </Button>
          </div>

          {searchAttempted && (
            <div className="pt-4 space-y-4">
              {guests.length > 0 ? (
                guests.map((guest, index) => (
                  <div
                    key={guest._id || index}
                    className="border rounded-lg p-4 flex items-center justify-between gap-4 bg-muted/50"
                  >
                    <div className="flex-grow">
                      <p className="font-bold">{guest.name || "N/A"}</p>
                      <p className="text-sm text-muted-foreground">
                        {guest.nationality || "Unknown"}, Phone:{" "}
                        {guest.phone || "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Purpose:{" "}
                        {guest.purposeOfVisit || guest.purpose || "N/A"},
                        Guests: {guest.totalGuests || guest.guestCount || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Check-in:{" "}
                        {guest.checkInTime || guest.checkInDate || "N/A"}
                      </p>
                      {guest.checkOutDate && (
                        <p className="text-sm text-muted-foreground">
                          Check-out: {guest.checkOutDate}
                        </p>
                      )}
                      <p className="text-sm font-medium mt-1">
                        {statusLabel(guest.status)}
                      </p>
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={guest.status === "reported"}
                      onClick={() => handleOpenAlertDialog(guest)}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      {guest.status === "reported"
                        ? "Reported"
                        : "Create Alert"}
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground">
                  No guests found for this room.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Creation Dialog */}
      <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Create Police Alert</DialogTitle>
            <DialogDescription>
              Creating an official police alert for {selectedGuest?.name} in
              room {roomNumber}. This will be recorded in the system and can be
              tracked.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="alert-title">Alert Title *</Label>
              <Input
                id="alert-title"
                value={alertData.title}
                onChange={(e) =>
                  setAlertData({ ...alertData, title: e.target.value })
                }
                placeholder="Brief title describing the issue"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alert-priority">Priority Level</Label>
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

            <div className="space-y-2">
              <Label htmlFor="alert-description">Detailed Description *</Label>
              <Textarea
                id="alert-description"
                value={alertData.description}
                onChange={(e) =>
                  setAlertData({ ...alertData, description: e.target.value })
                }
                placeholder="Provide detailed information about the suspicious activity, including time, behavior observed, and any other relevant details..."
                className="min-h-[120px]"
              />
            </div>

            {selectedGuest && (
              <div
                className={`p-3 rounded-md border-2 ${getPriorityColor(
                  alertData.priority
                )}`}
              >
                <h4 className="font-semibold text-sm mb-2">
                  Guest Information:
                </h4>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Name:</strong> {selectedGuest.name}
                  </p>
                  <p>
                    <strong>Room:</strong> {roomNumber}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedGuest.phone}
                  </p>
                  <p>
                    <strong>Nationality:</strong> {selectedGuest.nationality}
                  </p>
                  <p>
                    <strong>Purpose:</strong> {selectedGuest.purpose}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAlertDialogOpen(false)}
              disabled={submitting}
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
            >
              {submitting ? "Creating Alert..." : "Create Police Alert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AlertPolicePage;
