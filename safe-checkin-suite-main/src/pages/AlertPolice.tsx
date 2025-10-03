import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Trash2,
  Plus,
  Bell,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Building,
  SortAsc,
  SortDesc,
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
  id: string;
  type: "Police" | "Security" | "Management" | "Emergency" | "Maintenance";
  priority: "Low" | "Medium" | "High" | "Critical";
  title: string;
  description: string;
  status: "Pending" | "Acknowledged" | "In Progress" | "Resolved" | "Cancelled";
  location: {
    roomNumber: string;
    floor?: string;
    building?: string;
  };
  guest: {
    id: string;
    name: string;
    roomNumber: string;
    phone: string;
    email?: string;
  };
  hotel?: {
    id: string;
    name: string;
    address: string;
    phone: string;
  };
  assignedTo?: {
    name: string;
    role: string;
  };
  timeline?: Array<{
    action: string;
    performedBy: {
      name: string;
      role: string;
    };
    timestamp: string;
    notes?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  age: number;
  responseTime?: number;
  isActive: boolean;
}

interface CreateAlertData {
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  type: "Police" | "Security" | "Management" | "Emergency" | "Maintenance";
}

type SortType = "name" | "date" | "room";
type SortOrder = "asc" | "desc";

const GuestAlertManagement = () => {
  const [activeTab, setActiveTab] = useState("guests");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [guestAlerts, setGuestAlerts] = useState<AlertData[]>([]);
  const [allAlerts, setAllAlerts] = useState<AlertData[]>([]);

  // Sorting and filtering
  const [sortType, setSortType] = useState<SortType>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [alertFilters, setAlertFilters] = useState({
    status: "all",
    priority: "all",
    type: "all",
  });

  // Dialog states
  const [showAddAlertModal, setShowAddAlertModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [deleteAlertId, setDeleteAlertId] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AlertData | null>(null);

  // Form data
  const [newAlertData, setNewAlertData] = useState<CreateAlertData>({
    title: "",
    description: "",
    priority: "Medium",
    type: "Police",
  });

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();

  // Fetch all alerts
  const fetchAllAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const response = await alertsApi.get("/", {
        params: { limit: 100 },
      });

      if (response.data?.alerts) {
        setAllAlerts(response.data.alerts);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch alerts.",
      });
    } finally {
      setLoadingAlerts(false);
    }
  };

  // Fetch guest alerts
  const fetchGuestAlerts = async (guestId: string) => {
    const filteredAlerts = allAlerts.filter(
      (alert: AlertData) => alert.guest?.id === guestId
    );
    setGuestAlerts(filteredAlerts);
  };

  const handleSearchGuests = async () => {
    setSearchAttempted(true);
    setLoading(true);
    setSelectedGuest(null);
    setGuestAlerts([]);

    if (!searchQuery.trim()) {
      toast({
        variant: "destructive",
        title: "Search query required",
        description: "Please enter a search term.",
      });
      setGuests([]);
      setLoading(false);
      return;
    }

    try {
      // Search through both checked-in and checked-out guests
      const [checkedInGuests, checkedOutGuests] = await Promise.all([
        fetchGuests({
          search: searchQuery.trim(),
          status: "checked-in",
        }).catch(() => ({ guests: [] })),
        fetchGuests({
          search: searchQuery.trim(),
          status: "checked-out",
        }).catch(() => ({ guests: [] })),
      ]);

      // Also try searching by room number if the query looks like a room number
      let roomGuests: Guest[] = [];
      if (/^\d+$/.test(searchQuery.trim())) {
        const [roomCheckedIn, roomCheckedOut] = await Promise.all([
          fetchGuests({
            roomNumber: searchQuery.trim(),
            status: "checked-in",
          }).catch(() => ({ guests: [] })),
          fetchGuests({
            roomNumber: searchQuery.trim(),
            status: "checked-out",
          }).catch(() => ({ guests: [] })),
        ]);
        roomGuests = [...roomCheckedIn.guests, ...roomCheckedOut.guests];
      }

      const combinedGuests = [
        ...checkedInGuests.guests,
        ...checkedOutGuests.guests,
        ...roomGuests,
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
          description: `No guests found matching: "${searchQuery}"`,
        });
      } else {
        toast({
          title: "Search completed",
          description: `Found ${uniqueGuests.length} guest record(s) matching your search.`,
        });
      }

      setGuests(uniqueGuests);
    } catch (error) {
      console.error("Error searching guests:", error);
      toast({
        variant: "destructive",
        title: "Search Error",
        description: "Failed to search guests. Please try again.",
      });
      setGuests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGuest = async (guest: Guest) => {
    setSelectedGuest(guest);
    await fetchGuestAlerts(guest._id);
  };

  const handleSubmitAlert = async () => {
    if (
      !selectedGuest ||
      !newAlertData.title.trim() ||
      !newAlertData.description.trim()
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
        type: newAlertData.type,
        priority: newAlertData.priority,
        title: newAlertData.title.trim(),
        description: newAlertData.description.trim(),
        location: {
          roomNumber: selectedGuest.roomNumber || "Unknown",
          floor: selectedGuest.roomNumber
            ? Math.floor(parseInt(selectedGuest.roomNumber) / 100).toString()
            : undefined,
        },
      };

      const response = await alertsApi.post("/", alertPayload);

      if (response.status === 201) {
        toast({
          title: "Alert Created Successfully!",
          description: `Alert created for ${selectedGuest.name}. ID: ${response.data.alert.id}`,
        });

        // Refresh data
        await fetchAllAlerts();
        await fetchGuestAlerts(selectedGuest._id);

        setShowAddAlertModal(false);
        setNewAlertData({
          title: "",
          description: "",
          priority: "Medium",
          type: "Police",
        });
      }
    } catch (error) {
      console.error("Error creating alert:", error);
      toast({
        variant: "destructive",
        title: "Alert Failed",
        description: "Failed to create alert. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await alertsApi.delete(`/${alertId}`);

      toast({
        title: "Alert Deleted",
        description: "Alert has been successfully removed.",
      });

      // Refresh data
      await fetchAllAlerts();
      if (selectedGuest) {
        await fetchGuestAlerts(selectedGuest._id);
      }
    } catch (error) {
      console.error("Error deleting alert:", error);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Failed to delete alert. Please try again.",
      });
    } finally {
      setDeleteAlertId(null);
    }
  };

  // Utility functions
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

  const getAlertStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="h-4 w-4" />;
      case "Acknowledged":
        return <Eye className="h-4 w-4" />;
      case "In Progress":
        return <RefreshCw className="h-4 w-4" />;
      case "Resolved":
        return <CheckCircle className="h-4 w-4" />;
      case "Cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-500";
      case "High":
        return "bg-orange-500";
      case "Medium":
        return "bg-yellow-500";
      case "Low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Sorted guests
  const sortedGuests = [...guests].sort((a, b) => {
    if (sortType === "name") {
      const comparison = a.name.localeCompare(b.name);
      return sortOrder === "asc" ? comparison : -comparison;
    }
    if (sortType === "date") {
      const aDate = new Date(a.checkInDate || a.checkInTime || 0);
      const bDate = new Date(b.checkInDate || b.checkInTime || 0);
      const comparison = aDate.getTime() - bDate.getTime();
      return sortOrder === "asc" ? comparison : -comparison;
    }
    return 0;
  });

  // Filtered alerts
  const filteredAlerts = allAlerts.filter((alert) => {
    if (
      alertFilters.status !== "all" &&
      alert.status.toLowerCase() !== alertFilters.status
    ) {
      return false;
    }
    if (
      alertFilters.priority !== "all" &&
      alert.priority.toLowerCase() !== alertFilters.priority
    ) {
      return false;
    }
    if (
      alertFilters.type !== "all" &&
      alert.type.toLowerCase() !== alertFilters.type
    ) {
      return false;
    }
    return true;
  });

  // Load alerts on component mount
  useEffect(() => {
    fetchAllAlerts();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">
          Guest Alert Management System
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="guests">Guest Search & Alerts</TabsTrigger>
          <TabsTrigger value="alerts">All Active Alerts</TabsTrigger>
        </TabsList>

        {/* Guest Search Tab */}
        <TabsContent value="guests" className="space-y-6">
          {/* Search Section */}
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Guests
              </CardTitle>
              <CardDescription>
                Search for guests by name, phone number, or room number
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-end gap-3">
                <div className="w-full sm:flex-grow space-y-2">
                  <Label htmlFor="guestSearch" className="text-sm font-medium">
                    Search Guests
                  </Label>
                  <Input
                    id="guestSearch"
                    placeholder="Enter guest name, phone, or room number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchGuests()}
                    className="rounded-xl"
                    disabled={loading}
                  />
                </div>
                <Button
                  onClick={handleSearchGuests}
                  disabled={loading || !searchQuery.trim()}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 rounded-xl"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search Guests
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          {searchAttempted && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Guests List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Search Results
                  </h2>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={`${sortType}-${sortOrder}`}
                      onValueChange={(value) => {
                        const [type, order] = value.split("-") as [
                          SortType,
                          SortOrder
                        ];
                        setSortType(type);
                        setSortOrder(order);
                      }}
                    >
                      <SelectTrigger className="w-[140px] rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name-asc">
                          <div className="flex items-center">
                            <SortAsc className="h-4 w-4 mr-2" />
                            Name (A-Z)
                          </div>
                        </SelectItem>
                        <SelectItem value="name-desc">
                          <div className="flex items-center">
                            <SortDesc className="h-4 w-4 mr-2" />
                            Name (Z-A)
                          </div>
                        </SelectItem>
                        <SelectItem value="date-desc">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            Latest
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {guests.length > 0 && (
                      <Badge variant="outline" className="text-sm">
                        {guests.length} found
                      </Badge>
                    )}
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="h-16 w-16 mx-auto text-gray-400 mb-4 animate-spin" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Searching Guests...
                    </h3>
                  </div>
                ) : guests.length > 0 ? (
                  <div className="space-y-3">
                    {sortedGuests.map((guest, index) => {
                      const statusConfig = getStatusConfig(guest.status);
                      const isSelected = selectedGuest?._id === guest._id;
                      const guestAlertCount = allAlerts.filter(
                        (alert) => alert.guest?.id === guest._id
                      ).length;

                      return (
                        <Card
                          key={guest._id || index}
                          className={`cursor-pointer transition-all hover:shadow-lg rounded-2xl ${
                            isSelected ? "ring-2 ring-blue-500 bg-blue-50" : ""
                          }`}
                          onClick={() => handleSelectGuest(guest)}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                    <User className="h-5 w-5 text-gray-600" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-gray-900">
                                      {guest.name || "N/A"}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        Room: {guest.roomNumber || "N/A"}
                                      </Badge>
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {new Date(
                                          guest.checkInTime ||
                                            guest.checkInDate ||
                                            ""
                                        ).toLocaleDateString()}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}
                                  >
                                    <span>{statusConfig.icon}</span>
                                    {statusConfig.label}
                                  </span>
                                  {guestAlertCount > 0 && (
                                    <Badge
                                      variant="destructive"
                                      className="text-xs"
                                    >
                                      {guestAlertCount} Alert
                                      {guestAlertCount > 1 ? "s" : ""}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="text-sm text-gray-600 space-y-1">
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3" />
                                  <span>{guest.phone || "N/A"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Users className="h-3 w-3" />
                                  <span>
                                    Purpose:{" "}
                                    {guest.purpose ||
                                      guest.purposeOfVisit ||
                                      "N/A"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="rounded-2xl">
                    <CardContent className="p-8 text-center">
                      <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No guests found
                      </h3>
                      <p className="text-gray-600">
                        No guests match your search criteria: "{searchQuery}"
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Selected Guest Alerts */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedGuest
                      ? `Alerts for ${selectedGuest.name}`
                      : "Select a Guest"}
                  </h2>
                  {selectedGuest && (
                    <Button
                      onClick={() => {
                        setNewAlertData({
                          title: `Alert for ${selectedGuest.name}`,
                          description: `Alert regarding guest ${
                            selectedGuest.name
                          } in room ${selectedGuest.roomNumber || "Unknown"}.`,
                          priority: "Medium",
                          type: "Police",
                        });
                        setShowAddAlertModal(true);
                      }}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 rounded-xl"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      New Alert
                    </Button>
                  )}
                </div>

                {selectedGuest ? (
                  <div className="space-y-3">
                    {guestAlerts.length > 0 ? (
                      guestAlerts.map((alert) => {
                        return (
                          <Card
                            key={alert.id}
                            className="shadow-lg rounded-2xl border hover:shadow-xl transition-all duration-300"
                          >
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div
                                        className={`h-3 w-3 rounded-full ${getPriorityColor(
                                          alert.priority
                                        )}`}
                                      />
                                      <h3 className="font-semibold text-gray-900">
                                        {alert.title}
                                      </h3>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                      {alert.description}
                                    </p>
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge
                                        variant={
                                          alert.status === "Resolved"
                                            ? "default"
                                            : "secondary"
                                        }
                                        className="text-xs"
                                      >
                                        {getAlertStatusIcon(alert.status)}
                                        <span className="ml-1">
                                          {alert.status}
                                        </span>
                                      </Badge>
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {alert.priority}
                                      </Badge>
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {alert.type}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Created: {formatDateTime(alert.createdAt)}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedAlert(alert);
                                        setShowAlertModal(true);
                                      }}
                                      className="rounded-full h-8 w-8 p-0"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => setDeleteAlertId(alert.id)}
                                      className="rounded-full h-8 w-8 p-0"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    ) : (
                      <Card className="rounded-2xl">
                        <CardContent className="p-8 text-center">
                          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No alerts found
                          </h3>
                          <p className="text-gray-600 mb-4">
                            This guest has no alerts currently
                          </p>
                          <Button
                            onClick={() => {
                              setNewAlertData({
                                title: `Alert for ${selectedGuest.name}`,
                                description: `Alert regarding guest ${
                                  selectedGuest.name
                                } in room ${
                                  selectedGuest.roomNumber || "Unknown"
                                }.`,
                                priority: "Medium",
                                type: "Police",
                              });
                              setShowAddAlertModal(true);
                            }}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 rounded-xl"
                            size="sm"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Create First Alert
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card className="rounded-2xl">
                    <CardContent className="p-8 text-center">
                      <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No guest selected
                      </h3>
                      <p className="text-gray-600">
                        Select a guest from the search results to view and
                        manage their alerts
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* All Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Select
                value={alertFilters.status}
                onValueChange={(value) =>
                  setAlertFilters((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="w-[120px] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={alertFilters.priority}
                onValueChange={(value) =>
                  setAlertFilters((prev) => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger className="w-[120px] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={alertFilters.type}
                onValueChange={(value) =>
                  setAlertFilters((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger className="w-[120px] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="police">Police</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="management">Management</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="text-sm">
                {filteredAlerts.length} Total Alerts
              </Badge>
              <Button
                onClick={fetchAllAlerts}
                disabled={loadingAlerts}
                variant="outline"
                size="sm"
                className="rounded-xl"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                    loadingAlerts ? "animate-spin" : ""
                  }`}
                />
                {loadingAlerts ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>

          {loadingAlerts ? (
            <div className="text-center py-12">
              <RefreshCw className="h-16 w-16 mx-auto text-gray-400 mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Loading Alerts...
              </h3>
              <p className="text-gray-500">
                Fetching latest alerts from the system.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredAlerts.map((alert) => (
                <Card
                  key={alert.id}
                  className="bg-white shadow-lg rounded-2xl border hover:shadow-xl transition-all duration-300"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`h-3 w-3 rounded-full ${getPriorityColor(
                            alert.priority
                          )}`}
                        />
                        <div>
                          <CardTitle className="text-lg">
                            {alert.title}
                          </CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge
                              variant={
                                alert.status === "Resolved"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {getAlertStatusIcon(alert.status)}
                              <span className="ml-1">{alert.status}</span>
                            </Badge>
                            <Badge variant="outline">{alert.priority}</Badge>
                            <Badge variant="outline">{alert.type}</Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full h-8 w-8"
                        onClick={() => {
                          setSelectedAlert(alert);
                          setShowAlertModal(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {alert.description}
                    </p>

                    {alert.guest && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">
                            {alert.guest.name}
                          </span>
                        </div>
                        {alert.guest.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{alert.guest.phone}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {alert.hotel && (
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{alert.hotel.name}</span>
                      </div>
                    )}

                    {alert.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          Room: {alert.location.roomNumber}
                          {alert.location.floor &&
                            ` (Floor ${alert.location.floor})`}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-gray-500">
                        {formatDateTime(alert.createdAt)}
                      </span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteAlertId(alert.id)}
                        className="rounded-lg"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loadingAlerts && filteredAlerts.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Alerts Found
              </h3>
              <p className="text-gray-500">
                No alerts match your current filter criteria.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Alert Dialog */}
      <Dialog open={showAddAlertModal} onOpenChange={setShowAddAlertModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Alert
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="alert-type">Alert Type *</Label>
              <Select
                value={newAlertData.type}
                onValueChange={(value: any) =>
                  setNewAlertData({ ...newAlertData, type: value })
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Police">Police</SelectItem>
                  <SelectItem value="Security">Security</SelectItem>
                  <SelectItem value="Management">Management</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alert-priority">Priority *</Label>
              <Select
                value={newAlertData.priority}
                onValueChange={(value: any) =>
                  setNewAlertData({ ...newAlertData, priority: value })
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low Priority</SelectItem>
                  <SelectItem value="Medium">Medium Priority</SelectItem>
                  <SelectItem value="High">High Priority</SelectItem>
                  <SelectItem value="Critical">Critical Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alert-title">Title *</Label>
              <Input
                id="alert-title"
                value={newAlertData.title}
                onChange={(e) =>
                  setNewAlertData({ ...newAlertData, title: e.target.value })
                }
                className="rounded-xl"
                placeholder="Brief description of the alert"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alert-description">Description *</Label>
              <Textarea
                id="alert-description"
                value={newAlertData.description}
                onChange={(e) =>
                  setNewAlertData({
                    ...newAlertData,
                    description: e.target.value,
                  })
                }
                placeholder="Detailed description of the issue or concern"
                className="rounded-xl min-h-[100px]"
              />
            </div>

            <Button
              onClick={handleSubmitAlert}
              disabled={
                submitting ||
                !newAlertData.title.trim() ||
                !newAlertData.description.trim()
              }
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 rounded-xl"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Alert
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Detail Modal */}
      <Dialog open={showAlertModal} onOpenChange={setShowAlertModal}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center space-x-2">
              <div
                className={`h-3 w-3 rounded-full ${
                  selectedAlert ? getPriorityColor(selectedAlert.priority) : ""
                }`}
              />
              <span>{selectedAlert?.title}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-6">
              {/* Alert Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    {getAlertStatusIcon(selectedAlert.status)}
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
                    {formatDateTime(selectedAlert.createdAt)}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm mt-1 p-3 bg-gray-50 rounded-lg">
                  {selectedAlert.description}
                </p>
              </div>

              {/* Guest Information */}
              {selectedAlert.guest && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Guest Information
                  </Label>
                  <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="text-xs text-gray-500">Name</Label>
                      <p className="text-sm">{selectedAlert.guest.name}</p>
                    </div>
                    {selectedAlert.guest.phone && (
                      <div>
                        <Label className="text-xs text-gray-500">Phone</Label>
                        <p className="text-sm">{selectedAlert.guest.phone}</p>
                      </div>
                    )}
                    {selectedAlert.guest.email && (
                      <div>
                        <Label className="text-xs text-gray-500">Email</Label>
                        <p className="text-sm">{selectedAlert.guest.email}</p>
                      </div>
                    )}
                    {selectedAlert.guest.roomNumber && (
                      <div>
                        <Label className="text-xs text-gray-500">Room</Label>
                        <p className="text-sm">
                          {selectedAlert.guest.roomNumber}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Hotel Information */}
              {selectedAlert.hotel && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Hotel Information
                  </Label>
                  <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="text-xs text-gray-500">
                        Hotel Name
                      </Label>
                      <p className="text-sm">{selectedAlert.hotel.name}</p>
                    </div>
                    {selectedAlert.hotel.phone && (
                      <div>
                        <Label className="text-xs text-gray-500">Phone</Label>
                        <p className="text-sm">{selectedAlert.hotel.phone}</p>
                      </div>
                    )}
                    {selectedAlert.hotel.address && (
                      <div className="col-span-2">
                        <Label className="text-xs text-gray-500">Address</Label>
                        <p className="text-sm">{selectedAlert.hotel.address}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timeline */}
              {selectedAlert.timeline && selectedAlert.timeline.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Timeline</Label>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {selectedAlert.timeline.map((entry, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {entry.action}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDateTime(entry.timestamp)}
                            </span>
                          </div>
                          {entry.performedBy && (
                            <p className="text-xs text-gray-600">
                              by {entry.performedBy.name} (
                              {entry.performedBy.role})
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
              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
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

      {/* Delete Alert Dialog */}
      <AlertDialog
        open={!!deleteAlertId}
        onOpenChange={() => setDeleteAlertId(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Alert
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this alert? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAlertId && handleDeleteAlert(deleteAlertId)}
              className="bg-red-600 hover:bg-red-700 rounded-xl"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Alert
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GuestAlertManagement;
