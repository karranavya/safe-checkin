// components/Evidence/HotelEvidenceViewer.tsx - FIXED STATUS DISPLAY
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Image,
  Video,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  File,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Grid3x3,
  List,
  Trash2,
} from "lucide-react";

interface Evidence {
  _id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  evidenceType: string;
  files: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
    _id?: string;
  }>;
  hotelId?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  sharedWith?: Array<any>;
  // NEW: Alert reference
  alertId?: string;
  relatedAlert?: {
    id: string;
    status: string;
    priority: string;
    type: string;
  };
}

interface Alert {
  id: string;
  status: "Pending" | "Acknowledged" | "In Progress" | "Resolved" | "Cancelled";
  priority: string;
  type: string;
  guestId?: string;
  guest?: {
    id: string;
  };
  createdAt?: string;
}

interface HotelEvidenceViewerProps {
  suspectId: string;
}

export default function HotelEvidenceViewer({
  suspectId,
}: HotelEvidenceViewerProps) {
  const { toast } = useToast();
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);

  // Image viewer state
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState("all");

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token =
    localStorage.getItem("hotelToken") || localStorage.getItem("token");

  useEffect(() => {
    if (suspectId) {
      fetchData();
    }
  }, [suspectId]);

  // ⭐ NEW: Fetch both evidence AND alerts to get real-time status
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch evidence and alerts in parallel
      const [evidenceRes, alertsRes] = await Promise.all([
        fetch(`${apiUrl}/api/evidence/suspect/${suspectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/api/alerts?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      let evidenceData = [];
      let alertsData = [];

      if (evidenceRes.ok) {
        const data = await evidenceRes.json();
        evidenceData = data.evidence || [];
      }

      if (alertsRes.ok) {
        const data = await alertsRes.json();
        alertsData = data.alerts || [];
      }

      // ⭐ Filter alerts for this guest
      const guestAlerts = alertsData.filter(
        (alert: Alert) =>
          alert.guest?.id === suspectId || alert.guestId === suspectId
      );

      setAlerts(guestAlerts);
      setEvidence(evidenceData);

      console.log("✅ Evidence loaded:", evidenceData.length);
      console.log("✅ Guest alerts loaded:", guestAlerts.length);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load evidence and alerts",
      });
    } finally {
      setLoading(false);
    }
  };

  // ⭐ NEW: Get the actual alert status for evidence
  const getEvidenceStatus = (evidence: Evidence) => {
    // If evidence has a related alert, use the alert's status
    if (evidence.alertId) {
      const relatedAlert = alerts.find((a) => a.id === evidence.alertId);
      if (relatedAlert) {
        return relatedAlert.status;
      }
    }

    // Otherwise, check if there's any alert for this guest at the same time
    // Find the most recent alert for this guest
    if (alerts.length > 0) {
      const mostRecentAlert = alerts.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      )[0];
      return mostRecentAlert.status;
    }

    // Fallback to evidence's own status
    return evidence.status;
  };

  // ⭐ UPDATED: Status badge with real alert status
  const getStatusBadge = (evidence: Evidence) => {
    const status = getEvidenceStatus(evidence);

    const badges = {
      Pending: (
        <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1 text-xs">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      ),
      "Pending Review": (
        <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1 text-xs">
          <Clock className="h-3 w-3" />
          Pending Review
        </Badge>
      ),
      Acknowledged: (
        <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1 text-xs">
          <Eye className="h-3 w-3" />
          Acknowledged
        </Badge>
      ),
      "In Progress": (
        <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1 text-xs">
          <RefreshCw className="h-3 w-3" />
          In Progress
        </Badge>
      ),
      Resolved: (
        <Badge className="bg-green-100 text-green-800 flex items-center gap-1 text-xs">
          <CheckCircle className="h-3 w-3" />
          Resolved
        </Badge>
      ),
      Approved: (
        <Badge className="bg-green-100 text-green-800 flex items-center gap-1 text-xs">
          <CheckCircle className="h-3 w-3" />
          Approved
        </Badge>
      ),
      Rejected: (
        <Badge className="bg-red-100 text-red-800 flex items-center gap-1 text-xs">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      ),
      Cancelled: (
        <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1 text-xs">
          <XCircle className="h-3 w-3" />
          Cancelled
        </Badge>
      ),
    };

    return badges[status as keyof typeof badges] || badges["Pending Review"];
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      Critical: "bg-red-100 text-red-800 border-red-300",
      High: "bg-orange-100 text-orange-800 border-orange-300",
      Medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
      Low: "bg-green-100 text-green-800 border-green-300",
    };
    return colors[severity as keyof typeof colors] || colors.Medium;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownload = (file: any) => {
    const link = document.createElement("a");
    link.href = `${apiUrl}${file.fileUrl}`;
    link.download = file.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Flatten all files from all evidence
  const allFiles = evidence.flatMap((ev, evIndex) =>
    ev.files.map((file, fileIndex) => ({
      ...file,
      evidenceId: ev._id,
      evidenceTitle: ev.title,
      evidenceDate: ev.createdAt,
      evidenceSeverity: ev.severity,
      evidenceCategory: ev.category,
      evidenceStatus: getEvidenceStatus(ev), // ⭐ Use real status
      evidenceDescription: ev.description,
      hotelName: ev.hotelId?.name,
      globalIndex: `${evIndex}-${fileIndex}`,
      evidence: ev, // ⭐ Pass full evidence for status lookup
    }))
  );

  const imageFiles = allFiles.filter((f) => f.mimeType?.startsWith("image/"));
  const videoFiles = allFiles.filter((f) => f.mimeType?.startsWith("video/"));
  const documentFiles = allFiles.filter(
    (f) => f.mimeType?.includes("pdf") || f.mimeType?.includes("document")
  );

  const getFilteredFiles = () => {
    switch (filterType) {
      case "images":
        return imageFiles;
      case "videos":
        return videoFiles;
      case "documents":
        return documentFiles;
      default:
        return allFiles;
    }
  };

  const openImageViewer = (file: any, index: number) => {
    setSelectedImage(file);
    setCurrentImageIndex(index);
    setZoom(1);
    setRotation(0);
  };

  const closeImageViewer = () => {
    setSelectedImage(null);
    setZoom(1);
    setRotation(0);
  };

  const nextImage = () => {
    const nextIndex = (currentImageIndex + 1) % imageFiles.length;
    setCurrentImageIndex(nextIndex);
    setSelectedImage(imageFiles[nextIndex]);
    setZoom(1);
    setRotation(0);
  };

  const prevImage = () => {
    const prevIndex =
      (currentImageIndex - 1 + imageFiles.length) % imageFiles.length;
    setCurrentImageIndex(prevIndex);
    setSelectedImage(imageFiles[prevIndex]);
    setZoom(1);
    setRotation(0);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="h-8 w-8 mx-auto animate-spin text-blue-600 mb-2" />
        <p className="text-gray-600 text-sm">Loading evidence...</p>
      </div>
    );
  }

  if (evidence.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium">No Evidence Uploaded</p>
        <p className="text-sm text-gray-500 mt-1">
          Evidence you upload will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Uploaded Evidence ({evidence.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {allFiles.length} total files • {imageFiles.length} images •{" "}
            {videoFiles.length} videos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="rounded-lg"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs for filtering */}
      <Tabs value={filterType} onValueChange={setFilterType}>
        <TabsList>
          <TabsTrigger value="all">All ({allFiles.length})</TabsTrigger>
          <TabsTrigger value="images">Images ({imageFiles.length})</TabsTrigger>
          <TabsTrigger value="videos">Videos ({videoFiles.length})</TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({documentFiles.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filterType} className="mt-4">
          {viewMode === "grid" ? (
            /* GRID VIEW */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {getFilteredFiles().map((file, index) => (
                <Card
                  key={file.globalIndex}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div
                    className="relative aspect-square bg-gray-100"
                    onClick={() =>
                      file.mimeType?.startsWith("image/") &&
                      openImageViewer(
                        file,
                        imageFiles.findIndex(
                          (f) => f.globalIndex === file.globalIndex
                        )
                      )
                    }
                  >
                    {file.mimeType?.startsWith("image/") ? (
                      <img
                        src={`${apiUrl}${file.fileUrl}`}
                        alt={file.fileName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/400x400?text=Image+Not+Found";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        {file.mimeType?.startsWith("video/") ? (
                          <Video className="h-12 w-12 text-purple-600 mb-2" />
                        ) : (
                          <File className="h-12 w-12 text-gray-600 mb-2" />
                        )}
                        <p className="text-xs text-gray-600 px-2 text-center truncate w-full">
                          {file.fileName}
                        </p>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {getStatusBadge(file.evidence)}
                    </div>
                    <div className="absolute top-2 left-2">
                      <Badge
                        className={getSeverityColor(file.evidenceSeverity)}
                      >
                        {file.evidenceSeverity}
                      </Badge>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-white text-xs font-medium truncate">
                        {file.evidenceTitle}
                      </p>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="text-xs text-gray-600 truncate mb-2">
                      {file.fileName}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatFileSize(file.fileSize)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(file);
                        }}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* LIST VIEW */
            <div className="space-y-3">
              {evidence.map((item) => (
                <Card
                  key={item._id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm mb-1">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="text-xs text-gray-600 mb-2">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>📅 {formatDate(item.createdAt)}</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(item)}
                        <Badge
                          className={`text-xs ${getSeverityColor(
                            item.severity
                          )}`}
                        >
                          {item.severity}
                        </Badge>
                      </div>
                    </div>

                    {/* Files */}
                    {item.files && item.files.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-2">
                          Files ({item.files.length}):
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                          {item.files.map((file, idx) => (
                            <div key={idx}>
                              {file.mimeType?.startsWith("image/") ? (
                                <div
                                  className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => {
                                    const globalIndex = allFiles.findIndex(
                                      (f) =>
                                        f.evidenceId === item._id &&
                                        f.fileName === file.fileName
                                    );
                                    openImageViewer(
                                      allFiles[globalIndex],
                                      imageFiles.findIndex(
                                        (f) =>
                                          f.globalIndex ===
                                          allFiles[globalIndex].globalIndex
                                      )
                                    );
                                  }}
                                >
                                  <img
                                    src={`${apiUrl}${file.fileUrl}`}
                                    alt={file.fileName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src =
                                        "https://via.placeholder.com/200x200?text=Image";
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                                  <div className="flex items-center gap-2 flex-1 truncate">
                                    <File className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">
                                      {file.fileName}
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleDownload({
                                        ...file,
                                        evidenceId: item._id,
                                      })
                                    }
                                    className="h-6 px-2 rounded hover:bg-blue-100"
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Image Viewer Modal */}
      <Dialog open={!!selectedImage} onOpenChange={closeImageViewer}>
        <DialogContent className="max-w-5xl h-[90vh] p-0">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b bg-white">
              <div>
                <h3 className="font-semibold">
                  {selectedImage?.evidenceTitle}
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedImage?.fileName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={getSeverityColor(selectedImage?.evidenceSeverity)}
                >
                  {selectedImage?.evidenceSeverity}
                </Badge>
                <span className="text-sm text-gray-600">
                  {currentImageIndex + 1} / {imageFiles.length}
                </span>
              </div>
            </div>

            <div className="flex-1 relative bg-gray-900 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <img
                  src={`${apiUrl}${selectedImage?.fileUrl}`}
                  alt={selectedImage?.fileName}
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: "transform 0.3s ease",
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/800x600?text=Image+Not+Found";
                  }}
                />
              </div>

              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full"
                onClick={prevImage}
                disabled={imageFiles.length <= 1}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full"
                onClick={nextImage}
                disabled={imageFiles.length <= 1}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border-t bg-white">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                  disabled={zoom <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600 min-w-[60px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                  disabled={zoom >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRotation((rotation + 90) % 360)}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={() => handleDownload(selectedImage)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
