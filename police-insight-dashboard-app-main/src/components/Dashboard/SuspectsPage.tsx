import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { usePoliceAuth } from "@/contexts/PoliceAuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Trash2,
  User,
  Phone,
  CreditCard,
  Car,
  Calendar,
  SortAsc,
  SortDesc,
  AlertTriangle,
  Clock,
  MapPin,
  Building,
  Eye,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";

// Mock suspects data (keeping this separate from alerts)
const mockSuspects = [
  {
    id: 1,
    name: "John Doe",
    aadhar: "1234-5678-9012",
    phone: "+91-9876543210",
    vehicle: "MH-01-AB-1234",
    photo: "/placeholder-avatar.jpg",
    dateAdded: "2024-01-15",
  },
  {
    id: 2,
    name: "Jane Smith",
    aadhar: "2345-6789-0123",
    phone: "+91-8765432109",
    vehicle: "MH-02-CD-5678",
    photo: "/placeholder-avatar.jpg",
    dateAdded: "2024-01-20",
  },
];

type SortType = "name" | "date";
type SortOrder = "asc" | "desc";

export default function SuspectsPage() {
  const [suspects, setSuspects] = useState(mockSuspects);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortType, setSortType] = useState<SortType>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedSuspect, setSelectedSuspect] = useState<any>(null);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("suspects");
  const [alertFilters, setAlertFilters] = useState({
    status: "all",
    priority: "all",
    type: "all",
  });

  // New suspect form data
  const [newSuspect, setNewSuspect] = useState({
    name: "",
    aadhar: "",
    phone: "",
    vehicle: "",
    photo: null as File | null,
  });
  const { token, user, isAuthenticated, isLoading } = usePoliceAuth();

  // Fetch alerts from API
  useEffect(() => {
    if (activeTab === "alerts") {
      fetchAlerts();
    }
  }, [alertFilters, activeTab]);

  // In SuspectsPage.tsx - Updated fetchAlerts function with debugging
  const fetchAlerts = async () => {
    setLoading(true);
    try {
      if (!token || !isAuthenticated) {
        console.error("No valid police token found");
        return;
      }

      const params = new URLSearchParams({
        status: alertFilters.status,
        priority: alertFilters.priority,
        type: alertFilters.type,
        limit: "50",
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const fullUrl = `${apiUrl}/api/police/alerts?${params}`;

      console.log("Fetching alerts from:", fullUrl); // Debug log
      console.log("Using token:", token?.substring(0, 20) + "..."); // Debug log

      const response = await fetch(fullUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status); // Debug log
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      ); // Debug log

      // Check the actual response content before parsing
      const responseText = await response.text();
      console.log("Raw response:", responseText.substring(0, 200) + "..."); // Debug log

      if (response.ok) {
        try {
          const data = JSON.parse(responseText);
          console.log("Parsed data:", data);
          setAlerts(data.alerts || []);
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          console.error("Response was:", responseText);
        }
      } else {
        console.error("HTTP error:", response.status, responseText);
      }
    } catch (error) {
      console.error("Network error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateAlertStatus = async (
    alertId: string,
    status: string,
    notes?: string
  ) => {
    try {
      const token = localStorage.getItem("policeToken");
      if (!token) return;

      const response = await fetch(`/api/police/alerts/${alertId}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, notes }),
      });

      if (response.ok) {
        fetchAlerts(); // Refresh alerts
        if (selectedAlert && selectedAlert.id === alertId) {
          setSelectedAlert((prev) => ({ ...prev, status }));
        }
      }
    } catch (error) {
      console.error("Failed to update alert status:", error);
    }
  };

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
        return <AlertTriangle className="h-4 w-4" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const sortedSuspects = [...suspects].sort((a, b) => {
    if (sortType === "name") {
      const comparison = a.name.localeCompare(b.name);
      return sortOrder === "asc" ? comparison : -comparison;
    } else {
      const comparison =
        new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
      return sortOrder === "asc" ? comparison : -comparison;
    }
  });

  const handleAddSuspect = async () => {
    if (!newSuspect.name || !newSuspect.aadhar || !newSuspect.phone) {
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const suspect = {
        id: Date.now(),
        ...newSuspect,
        photo: "/placeholder-avatar.jpg",
        dateAdded: new Date().toISOString().split("T")[0],
      };

      setSuspects((prev) => [...prev, suspect]);
      setNewSuspect({
        name: "",
        aadhar: "",
        phone: "",
        vehicle: "",
        photo: null,
      });
      setShowAddModal(false);
      setIsSubmitting(false);
    }, 1000);
  };

  const handleDeleteSuspect = async () => {
    if (!deleteReason.trim()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      setSuspects((prev) => prev.filter((s) => s.id !== selectedSuspect.id));
      setShowDeleteModal(false);
      setSelectedSuspect(null);
      setDeleteReason("");
      setIsSubmitting(false);
    }, 1000);
  };

  const formatAadhar = (aadhar: string) => {
    return aadhar.replace(/(\d{4})(\d{4})(\d{4})/, "$1-$2-$3");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">
          Police Dashboard - Suspects & Alerts
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="suspects">Suspects Management</TabsTrigger>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
        </TabsList>

        {/* Suspects Tab */}
        <TabsContent value="suspects" className="space-y-6">
          <div className="flex items-center justify-between">
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
                <SelectTrigger className="w-[180px] rounded-xl">
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
                      Latest Added
                    </div>
                  </SelectItem>
                  <SelectItem value="date-asc">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Oldest Added
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 rounded-xl">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Suspect
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-primary">
                    Add New Suspect
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={newSuspect.name}
                      onChange={(e) =>
                        setNewSuspect((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="rounded-xl"
                      placeholder="Enter suspect name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aadhar">Aadhar Number *</Label>
                    <Input
                      id="aadhar"
                      value={newSuspect.aadhar}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 12);
                        setNewSuspect((prev) => ({
                          ...prev,
                          aadhar: formatAadhar(value),
                        }));
                      }}
                      className="rounded-xl"
                      placeholder="1234-5678-9012"
                      maxLength={14}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={newSuspect.phone}
                      onChange={(e) =>
                        setNewSuspect((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      className="rounded-xl"
                      placeholder="+91-9876543210"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vehicle">Vehicle Number</Label>
                    <Input
                      id="vehicle"
                      value={newSuspect.vehicle}
                      onChange={(e) =>
                        setNewSuspect((prev) => ({
                          ...prev,
                          vehicle: e.target.value,
                        }))
                      }
                      className="rounded-xl"
                      placeholder="MH-01-AB-1234"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photo">Photograph</Label>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setNewSuspect((prev) => ({
                          ...prev,
                          photo: e.target.files?.[0] || null,
                        }))
                      }
                      className="rounded-xl"
                    />
                  </div>

                  <Button
                    onClick={handleAddSuspect}
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 rounded-xl"
                  >
                    {isSubmitting ? "Adding..." : "Add Suspect"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedSuspects.map((suspect) => (
              <Card
                key={suspect.id}
                className="bg-white shadow-lg rounded-2xl border hover:shadow-xl transition-all duration-300"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {suspect.name}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                          Added:{" "}
                          {new Date(suspect.dateAdded).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="rounded-full h-8 w-8"
                      onClick={() => {
                        setSelectedSuspect(suspect);
                        setShowDeleteModal(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{suspect.aadhar}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{suspect.phone}</span>
                  </div>
                  {suspect.vehicle && (
                    <div className="flex items-center space-x-2">
                      <Car className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{suspect.vehicle}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
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
                {alerts.length} Total Alerts
              </Badge>
              <Button
                onClick={fetchAlerts}
                disabled={loading}
                variant="outline"
                size="sm"
                className="rounded-xl"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                {loading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>

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
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {alerts.map((alert) => (
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
                              {getStatusIcon(alert.status)}
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
                        {new Date(alert.createdAt).toLocaleString()}
                      </span>

                      {alert.status === "Pending" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            updateAlertStatus(
                              alert.id,
                              "Acknowledged",
                              "Acknowledged by police"
                            )
                          }
                          className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                        >
                          Acknowledge
                        </Button>
                      )}

                      {(alert.status === "Acknowledged" ||
                        alert.status === "In Progress") && (
                        <Button
                          size="sm"
                          onClick={() =>
                            updateAlertStatus(
                              alert.id,
                              "Resolved",
                              "Resolved by police department"
                            )
                          }
                          className="bg-green-500 hover:bg-green-600 text-white rounded-lg"
                        >
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && alerts.length === 0 && (
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
                              {new Date(entry.timestamp).toLocaleString()}
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
                {selectedAlert.status === "Pending" && (
                  <Button
                    onClick={() => {
                      updateAlertStatus(
                        selectedAlert.id,
                        "Acknowledged",
                        "Acknowledged by police officer"
                      );
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
                  <Button
                    onClick={() => {
                      updateAlertStatus(
                        selectedAlert.id,
                        "Resolved",
                        "Resolved by police department - situation handled"
                      );
                      setShowAlertModal(false);
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Resolved
                  </Button>
                )}

                {selectedAlert.status !== "Resolved" &&
                  selectedAlert.status !== "Cancelled" && (
                    <Button
                      onClick={() => {
                        updateAlertStatus(
                          selectedAlert.id,
                          "Cancelled",
                          "Cancelled by police - false alarm or duplicate"
                        );
                        setShowAlertModal(false);
                      }}
                      variant="destructive"
                      className="rounded-xl"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Alert
                    </Button>
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

      {/* Delete Suspect Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Delete Suspect
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You are about to delete <strong>{selectedSuspect?.name}</strong>
                . This action cannot be undone.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="deleteReason">Reason for deletion *</Label>
              <Textarea
                id="deleteReason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Please provide a reason for removing this suspect from the database..."
                className="rounded-xl min-h-[100px]"
                required
              />
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteReason("");
                  setSelectedSuspect(null);
                }}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteSuspect}
                disabled={isSubmitting || !deleteReason.trim()}
                className="flex-1 rounded-xl"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Suspect
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
