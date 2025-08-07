import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Building,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Guest {
  id?: string;
  _id?: string;
  name?: string;
  phone?: string;
  email?: string;
  nationality?: string;
  roomNumber?: string;
  checkInDate: string;
  checkOutDate?: string;
  status: "checked-in" | "checked-out" | "pending";
  purposeOfVisit?: string;
  referenceNumber?: string;
  totalGuests?: number;
  bookingWebsite?: string;
}

const GuestDetailsView = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("=== GuestDetailsView mounted ===");
    console.log("URL param id:", id);
    console.log("Location state:", location.state);

    // First try to get guest from navigation state
    if (location.state?.guest) {
      console.log("✅ Using guest from navigation state");
      setGuest(location.state.guest);
      setLoading(false);
      return;
    }

    // If no state, fetch from API
    const fetchGuest = async () => {
      if (!id || id === "undefined") {
        console.error("❌ Invalid ID provided:", id);
        setError("Invalid guest ID provided");
        setLoading(false);
        return;
      }

      try {
        console.log("📡 Fetching guest from API with ID:", id);
        setLoading(true);
        const response = await axios.get(
          `http://localhost:5000/api/guests/${id}`
        );
        console.log("✅ Guest fetched successfully:", response.data);
        setGuest(response.data);
      } catch (error) {
        console.error("❌ Failed to fetch guest:", error);
        setError("Failed to load guest details");
      } finally {
        setLoading(false);
      }
    };

    if (id && id !== "undefined") {
      fetchGuest();
    } else {
      setError("No guest ID provided");
      setLoading(false);
    }
  }, [id, location.state]);

  const getStatusBadge = (status: Guest["status"]) => {
    switch (status) {
      case "checked-in":
        return (
          <Badge variant="default" className="bg-green-500 text-white">
            Checked In
          </Badge>
        );
      case "checked-out":
        return <Badge variant="secondary">Checked Out</Badge>;
      case "pending":
        return (
          <Badge
            variant="outline"
            className="border-yellow-500 text-yellow-600"
          >
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Invalid date"
      : date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
  };

  const getInitials = (name?: string) => {
    if (!name || typeof name !== "string") return "NA";
    const nameParts = name.trim().split(" ");
    return nameParts
      .map((n) => n[0] || "")
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Loading guest details...</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !guest) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Guest Not Found</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              {error || "The requested guest could not be found."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Guest Details</h1>
          <p className="text-muted-foreground">
            Viewing information for {guest.name || "Unnamed Guest"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Guest Information Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {getInitials(guest.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-xl">
                    {guest.name || "Unnamed Guest"}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusBadge(guest.status)}
                    <span className="text-sm text-muted-foreground">
                      {guest.referenceNumber && `Ref: ${guest.referenceNumber}`}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{guest.phone || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{guest.email || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{guest.nationality || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Stay Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Stay Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Room Number
                    </label>
                    <p className="text-lg font-semibold">
                      {guest.roomNumber || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Total Guests
                    </label>
                    <p className="text-lg font-semibold">
                      {guest.totalGuests ?? 0} guest
                      {guest.totalGuests !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Check-in Date
                    </label>
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(guest.checkInDate)}
                    </p>
                  </div>
                  {guest.checkOutDate && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Check-out Date
                      </label>
                      <p className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(guest.checkOutDate)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* All Guests Details */}
              {(guest.totalGuests ?? 0) > 1 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    All Guests in this Booking ({guest.totalGuests} guests)
                  </h3>
                  <div className="space-y-3">
                    {Array.from(
                      { length: guest.totalGuests || 1 },
                      (_, index) => (
                        <details
                          key={index}
                          className="group border rounded-lg"
                        >
                          <summary className="cursor-pointer p-4 hover:bg-muted/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {index === 0
                                    ? getInitials(guest.name)
                                    : `G${index + 1}`}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="font-medium">
                                  {index === 0
                                    ? guest.name || "Primary Guest"
                                    : `Guest ${index + 1}`}
                                </span>
                                <div className="text-sm text-muted-foreground">
                                  {index === 0
                                    ? "Primary Guest"
                                    : "Additional Guest"}
                                </div>
                              </div>
                            </div>
                            <svg
                              className="w-4 h-4 transform group-open:rotate-180 transition-transform"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </summary>
                          <div className="px-4 pb-4 pt-2 border-t bg-muted/20">
                            {index === 0 ? (
                              // Primary guest - show all available details
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Name
                                  </label>
                                  <p className="font-medium">
                                    {guest.name || "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Phone
                                  </label>
                                  <p className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {guest.phone || "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Email
                                  </label>
                                  <p className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {guest.email || "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Nationality
                                  </label>
                                  <p className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {guest.nationality || "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Reference Number
                                  </label>
                                  <p>{guest.referenceNumber || "N/A"}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Purpose of Visit
                                  </label>
                                  <p>{guest.purposeOfVisit || "N/A"}</p>
                                </div>
                              </div>
                            ) : (
                              // Additional guests - show placeholder info
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Name
                                  </label>
                                  <p className="text-muted-foreground italic">
                                    Guest details not available
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Relationship
                                  </label>
                                  <p className="text-muted-foreground italic">
                                    Not specified
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Age Group
                                  </label>
                                  <p className="text-muted-foreground italic">
                                    Not specified
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Status
                                  </label>
                                  <p className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    Checked in with primary guest
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </details>
                      )
                    )}
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                    <strong>Note:</strong> Individual guest details are only
                    available for the primary guest. Additional guest
                    information would need to be collected during check-in
                    process.
                  </div>
                </div>
              )}

              {/* Visit Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Visit Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Purpose of Visit
                    </label>
                    <p>{guest.purposeOfVisit || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Booking Website
                    </label>
                    <p>{guest.bookingWebsite || "N/A"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Card */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {guest.status === "checked-in" && (
                <Button className="w-full" variant="outline">
                  Check Out Guest
                </Button>
              )}
              <Button className="w-full" variant="outline">
                Edit Details
              </Button>
              <Button className="w-full" variant="outline">
                Print Details
              </Button>
              {guest.phone && (
                <Button className="w-full" variant="outline">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Guest
                </Button>
              )}
              {guest.email && (
                <Button className="w-full" variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GuestDetailsView;
