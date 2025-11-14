// components/police/Evidence/EvidenceViewer.tsx - ENHANCED WITH IMAGE GALLERY
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
  FileIcon,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Grid3x3,
  List,
} from "lucide-react";
import EvidenceModal from "./EvidenceModal";

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
  hotelId: {
    name: string;
    address?: string;
  };
  createdAt: string;
  approvedBy?: {
    name: string;
    timestamp: string;
  };
  rejectionReason?: string;
}

interface EvidenceViewerProps {
  suspectId: string;
  token: string;
}

export default function EvidenceViewer({
  suspectId,
  token,
}: EvidenceViewerProps) {
  const { toast } = useToast();
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);

  // Image viewer state
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [filterType, setFilterType] = useState("all");

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (suspectId) {
      fetchEvidence();
    }
  }, [suspectId]);

  // Flatten all files from all evidence
  const allFiles = evidence.flatMap((ev, evIndex) =>
    ev.files.map((file, fileIndex) => ({
      ...file,
      evidenceId: ev._id,
      evidenceTitle: ev.title,
      evidenceDate: ev.createdAt,
      evidenceSeverity: ev.severity,
      evidenceCategory: ev.category,
      evidenceStatus: ev.status,
      evidenceDescription: ev.description,
      hotelName: ev.hotelId?.name,
      globalIndex: `${evIndex}-${fileIndex}`,
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

  const fetchEvidence = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${apiUrl}/api/evidence/shared/${suspectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEvidence(data.evidence || []);
        console.log("✅ Evidence loaded:", data.evidence?.length || 0);
      } else {
        throw new Error("Failed to fetch evidence");
      }
    } catch (error) {
      console.error("Error fetching evidence:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load evidence",
      });
    } finally {
      setLoading(false);
    }
  };

  const getEvidenceIcon = (type: string) => {
    const icons = {
      Image: <Image className="h-5 w-5 text-blue-600" />,
      Video: <Video className="h-5 w-5 text-purple-600" />,
      Document: <FileText className="h-5 w-5 text-orange-600" />,
      Audio: <FileIcon className="h-5 w-5 text-green-600" />,
      Other: <FileIcon className="h-5 w-5 text-gray-600" />,
    };
    return icons[type as keyof typeof icons] || icons.Other;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      "Pending Review": (
        <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1 text-xs">
          <Clock className="h-3 w-3" />
          Pending Review
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
      Archived: (
        <Badge className="bg-gray-100 text-gray-800 text-xs">Archived</Badge>
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

  const handleDownload = async (
    evidenceId: string,
    fileIndex: number,
    fileName: string
  ) => {
    try {
      const response = await fetch(
        `${apiUrl}/api/evidence/download/${evidenceId}/${fileIndex}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "✅ Success",
          description: "File downloaded successfully",
        });
      } else {
        throw new Error("Download failed");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download file",
      });
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
      <Card className="rounded-lg">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 font-medium">No Evidence Found</p>
            <p className="text-sm text-gray-500 mt-1">
              No evidence has been shared for this suspect yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Evidence Records ({evidence.length})
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {allFiles.length} total files • {imageFiles.length} images •{" "}
            {videoFiles.length} videos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEvidence}
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
            /* GRID VIEW - Show all files as thumbnails */
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
                          <FileIcon className="h-12 w-12 text-gray-600 mb-2" />
                        )}
                        <p className="text-xs text-gray-600 px-2 text-center truncate w-full">
                          {file.fileName}
                        </p>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
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
                          const evidenceIndex = evidence.findIndex(
                            (ev) => ev._id === file.evidenceId
                          );
                          const fileIndexInEvidence = evidence[
                            evidenceIndex
                          ]?.files.findIndex(
                            (f) => f.fileName === file.fileName
                          );
                          if (fileIndexInEvidence !== -1) {
                            handleDownload(
                              file.evidenceId,
                              fileIndexInEvidence,
                              file.fileName
                            );
                          }
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
            /* LIST VIEW - Original card layout */
            <div className="grid grid-cols-1 gap-4">
              {evidence.map((item) => (
                <Card
                  key={item._id}
                  className="rounded-lg hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                          {getEvidenceIcon(item.evidenceType)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className="text-xs text-gray-600 mt-1">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <span>
                              📍 {item.hotelId?.name || "Unknown Hotel"}
                            </span>
                            <span>•</span>
                            <span>
                              📅 {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(item.status)}
                        <Badge
                          className={`text-xs ${getSeverityColor(
                            item.severity
                          )}`}
                        >
                          {item.severity}
                        </Badge>
                      </div>
                    </div>

                    {/* Files - Show thumbnails for images */}
                    {item.files && item.files.length > 0 && (
                      <div className="mb-3">
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
                                    <FileIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">
                                      {file.fileName}
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleDownload(
                                        item._id,
                                        idx,
                                        file.fileName
                                      )
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

                    {/* Category & Actions */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEvidence(item);
                          setShowModal(true);
                        }}
                        className="rounded-lg text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </div>

                    {/* Approval/Rejection Info */}
                    {item.status === "Approved" && item.approvedBy && (
                      <div className="mt-3 p-2 bg-green-50 rounded-lg text-xs">
                        ✅ Approved by {item.approvedBy.name} on{" "}
                        {new Date(
                          item.approvedBy.timestamp
                        ).toLocaleDateString()}
                      </div>
                    )}

                    {item.status === "Rejected" && item.rejectionReason && (
                      <div className="mt-3 p-2 bg-red-50 rounded-lg text-xs">
                        ❌ Rejected: {item.rejectionReason}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Evidence Detail Modal */}
      {showModal && selectedEvidence && (
        <EvidenceModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedEvidence(null);
          }}
          evidence={selectedEvidence}
          token={token}
          onUpdate={fetchEvidence}
        />
      )}

      {/* Image Viewer Modal */}
      <Dialog open={!!selectedImage} onOpenChange={closeImageViewer}>
        <DialogContent className="max-w-5xl h-[90vh] p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
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

            {/* Image Container */}
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

              {/* Navigation Buttons */}
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

            {/* Controls */}
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
              <Button
                onClick={() => {
                  const evidenceIndex = evidence.findIndex(
                    (ev) => ev._id === selectedImage.evidenceId
                  );
                  const fileIndexInEvidence = evidence[
                    evidenceIndex
                  ]?.files.findIndex(
                    (f) => f.fileName === selectedImage.fileName
                  );
                  if (fileIndexInEvidence !== -1) {
                    handleDownload(
                      selectedImage.evidenceId,
                      fileIndexInEvidence,
                      selectedImage.fileName
                    );
                  }
                }}
              >
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
