// GuestDetailsView.tsx - COMPLETE WITH EVIDENCE FEATURES (FIXED)
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
  Camera,
  X,
  ZoomIn,
  Download,
  Eye,
  AlertTriangle,
  Upload,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import EvidenceUpload from "@/components/Evidence/EvidenceUpload";
import EvidenceManager from "@/components/Evidence/EvidenceManager";
import HotelEvidenceViewer from "@/components/Evidence/HotelEvidenceViewer";

interface PhotoInfo {
  path?: string;
  filename?: string;
  originalName?: string;
  size?: number;
  uploadTime?: string;
}

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
  status: "checked-in" | "checked-out" | "pending" | "reported" | "flagged";
  purposeOfVisit?: string;
  referenceNumber?: string;
  totalGuests?: number;
  bookingWebsite?: string;
  isFlagged?: boolean;
  flagReason?: string;
  photos?: {
    guestPhoto?: PhotoInfo;
    idFront?: PhotoInfo;
    idBack?: PhotoInfo;
  };
  hotelId?: string;
}

// Photo Modal Component
const PhotoModal = ({
  isOpen,
  onClose,
  photoUrl,
  title,
  filename,
}: {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string;
  title: string;
  filename?: string;
}) => {
  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `${title}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-4xl max-h-[90vh] w-full">
        <div className="absolute top-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-4 flex justify-between items-center z-10 rounded-t-lg">
          <h3 className="text-white font-semibold">{title}</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="text-white hover:bg-white/10"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <img
          src={photoUrl}
          alt={title}
          className="w-full h-full object-contain rounded-lg shadow-2xl"
          style={{ maxHeight: "calc(90vh - 4rem)" }}
        />

        {filename && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-3 rounded-b-lg">
            <p className="text-white text-sm text-center">{filename}</p>
          </div>
        )}
      </div>
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};

// Photo Gallery Component
const PhotoGallery = ({
  photos,
  guestName,
}: {
  photos: Guest["photos"];
  guestName: string;
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<{
    url: string;
    title: string;
    filename?: string;
  } | null>(null);
  const [imageLoadStates, setImageLoadStates] = useState<{
    [key: string]: "loading" | "loaded" | "error";
  }>({});

  const getPhotoUrl = (photoInfo: PhotoInfo) => {
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    const photoPath = photoInfo.path || photoInfo.filename;
    const cleanPath = photoPath.startsWith("uploads")
      ? photoPath
      : `uploads/${photoPath}`;
    const url = `${baseUrl}/${cleanPath}`;
    console.log("Photo URL construction:", { photoPath, cleanPath, url });
    return url;
  };

  const photoItems = [
    {
      key: "guestPhoto",
      title: "Guest Photo",
      icon: User,
      photo: photos?.guestPhoto,
      description: "Primary guest photograph",
    },
    {
      key: "idFront",
      title: "ID Front",
      icon: Camera,
      photo: photos?.idFront,
      description: "Front side of ID document",
    },
    {
      key: "idBack",
      title: "ID Back",
      icon: Camera,
      photo: photos?.idBack,
      description: "Back side of ID document",
    },
  ];

  const availablePhotos = photoItems.filter((item) => item.photo?.filename);

  if (availablePhotos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Guest Photos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No photos available for this guest</p>
            <p className="text-sm">
              Photos are captured during the check-in process
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Guest Photos ({availablePhotos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photoItems.map((item) => {
              const { key, title, icon: Icon, photo, description } = item;

              if (!photo?.filename) {
                return (
                  <div
                    key={key}
                    className="relative group border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-gray-300 transition-colors"
                  >
                    <Icon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <h4 className="font-medium text-gray-500 mb-1">{title}</h4>
                    <p className="text-xs text-gray-400">{description}</p>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        Not Available
                      </Badge>
                    </div>
                  </div>
                );
              }

              const photoUrl = getPhotoUrl(photo);
              const loadState = imageLoadStates[key] || "loading";

              return (
                <div
                  key={key}
                  className="relative group border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer bg-white"
                  onClick={() =>
                    setSelectedPhoto({
                      url: photoUrl,
                      title: `${title} - ${guestName}`,
                      filename: photo.filename || undefined,
                    })
                  }
                >
                  <div className="aspect-square overflow-hidden bg-gray-100 relative">
                    {loadState === "loading" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    )}

                    <img
                      src={photoUrl}
                      alt={title}
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 ${
                        loadState === "loaded" ? "opacity-100" : "opacity-0"
                      }`}
                      onLoad={() => {
                        setImageLoadStates((prev) => ({
                          ...prev,
                          [key]: "loaded",
                        }));
                      }}
                      onError={() => {
                        setImageLoadStates((prev) => ({
                          ...prev,
                          [key]: "error",
                        }));
                      }}
                    />

                    {loadState === "error" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="text-center">
                          <Icon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-xs text-gray-500">
                            Image not available
                          </p>
                        </div>
                      </div>
                    )}

                    {loadState === "loaded" && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2 bg-white rounded-full px-3 py-1">
                          <ZoomIn className="w-4 h-4" />
                          <span className="text-sm font-medium">View</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-primary" />
                      <h4 className="font-medium text-sm">{title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        <Eye className="w-3 h-3 mr-1" />
                        {loadState === "loaded"
                          ? "Available"
                          : loadState === "loading"
                          ? "Loading..."
                          : "Error"}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                        {photo.size && `${Math.round(photo.size / 1024)} KB`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-medium">
                📸 {availablePhotos.length} of 3 photos captured
              </span>
              <span className="text-blue-600">
                Click any photo to view in full size
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <PhotoModal
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        photoUrl={selectedPhoto?.url || ""}
        title={selectedPhoto?.title || ""}
        filename={selectedPhoto?.filename}
      />
    </>
  );
};

// Main Component
const GuestDetailsView = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    console.log("=== GuestDetailsView mounted ===");
    console.log("URL param id:", id);
    console.log("Location state:", location.state);

    if (location.state?.guest) {
      console.log("✅ Using guest from navigation state");
      setGuest(location.state.guest);
      setLoading(false);
      return;
    }

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
          `http://localhost:5000/api/guests/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("hotelToken")}`,
            },
          }
        );
        console.log("✅ Guest fetched successfully:", response.data);
        setGuest(response.data.data || response.data);
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
      case "flagged":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Flagged
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
      <div className="space-y-6 p-6">
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
      <div className="space-y-6 p-6">
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

  const guestId = guest._id || guest.id || "";

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
        <div className="flex items-center gap-2">
          {getStatusBadge(guest.status)}
          {guest.referenceNumber && (
            <Badge variant="outline">Ref: {guest.referenceNumber}</Badge>
          )}
        </div>
      </div>

      {/* ⭐ FIXED: Tabs for Details, Photos, and Evidence */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 rounded-lg">
          <TabsTrigger value="details" className="rounded-lg">
            <User className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="photos" className="rounded-lg">
            <Camera className="h-4 w-4 mr-2" />
            Photos
          </TabsTrigger>
          <TabsTrigger value="upload-evidence" className="rounded-lg">
            <Upload className="h-4 w-4 mr-2" />
            Upload Evidence
          </TabsTrigger>
          <TabsTrigger value="view-evidence" className="rounded-lg">
            <Eye className="h-4 w-4 mr-2" />
            View Evidence
          </TabsTrigger>
        </TabsList>

        {/* ========== DETAILS TAB ========== */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
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

            {/* Quick Actions Sidebar */}
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
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setActiveTab("upload-evidence")}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Evidence
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ========== PHOTOS TAB ========== */}
        <TabsContent value="photos" className="space-y-6">
          <PhotoGallery
            photos={guest.photos}
            guestName={guest.name || "Unknown Guest"}
          />
        </TabsContent>

        {/* ========== UPLOAD EVIDENCE TAB ========== */}
        <TabsContent value="upload-evidence" className="space-y-6">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Upload Evidence for Guest
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Guest Info Banner */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700 mb-1">
                    Uploading evidence for:
                  </p>
                  <p className="font-semibold text-blue-900 text-lg">
                    {guest.name}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-sm text-blue-700">
                      <Phone className="h-3 w-3" />
                      {guest.phone}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-blue-700">
                      <MapPin className="h-3 w-3" />
                      Room {guest.roomNumber || "N/A"}
                    </div>
                  </div>
                </div>

                {/* Evidence Upload Component */}
                <EvidenceUpload
                  suspectId={guestId}
                  guestId={guestId}
                  onUploadSuccess={() => {
                    toast({
                      title: "✅ Success",
                      description: "Evidence uploaded and shared with police",
                    });
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== VIEW EVIDENCE TAB ========== */}
        <TabsContent value="view-evidence" className="space-y-6">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Evidence Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HotelEvidenceViewer suspectId={guestId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GuestDetailsView;
