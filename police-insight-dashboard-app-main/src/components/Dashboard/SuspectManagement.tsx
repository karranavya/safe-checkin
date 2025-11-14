// components/police/SuspectManagement.jsx - SIMPLE RECTANGLE CARD
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Trash2,
  User,
  Phone,
  Calendar,
  SortAsc,
  SortDesc,
  AlertTriangle,
  Eye,
  RefreshCw,
  Mail,
} from "lucide-react";
import ViewSuspect from "./ViewSuspect";

type SortType = "name" | "date";
type SortOrder = "asc" | "desc";

interface SuspectManagementProps {
  suspects: any[];
  setSuspects: React.Dispatch<React.SetStateAction<any[]>>;
  loading: boolean;
  updateAlertStatus: (
    alertId: string,
    status: string,
    notes?: string
  ) => Promise<void>;
}

export default function SuspectManagement({
  suspects,
  setSuspects,
  loading,
  updateAlertStatus,
}: SuspectManagementProps) {
  const { toast } = useToast();

  const [sortType, setSortType] = useState<SortType>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSuspect, setSelectedSuspect] = useState<any>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showViewSuspectModal, setShowViewSuspectModal] = useState(false);
  const [selectedSuspectForView, setSelectedSuspectForView] =
    useState<any>(null);

  const sortedSuspects = [...suspects].sort((a, b) => {
    if (sortType === "name") {
      const nameA = a.suspectData?.name || "";
      const nameB = b.suspectData?.name || "";
      return sortOrder === "asc"
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    } else {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
    }
  });

  const formatDate = (dateString: string | Date) => {
    try {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return "N/A";
    }
  };

  const handleDeleteSuspect = async () => {
    if (!deleteReason.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide a reason",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedSuspect.associatedAlerts) {
        for (const alert of selectedSuspect.associatedAlerts) {
          await updateAlertStatus(
            alert.alertId || alert.id,
            "Resolved",
            `Suspect removed: ${deleteReason}`
          );
        }
      }

      setSuspects((prev) => prev.filter((s) => s._id !== selectedSuspect._id));
      setShowDeleteModal(false);
      setSelectedSuspect(null);
      setDeleteReason("");

      toast({
        title: "✅ Success",
        description: `${selectedSuspect.suspectData?.name} removed`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      critical: "bg-red-600 text-white",
      high: "bg-orange-600 text-white",
      medium: "bg-yellow-600 text-white",
      low: "bg-green-600 text-white",
    };
    return colors[priority?.toLowerCase()] || "bg-gray-600 text-white";
  };

  // ⭐ PROPERLY CONSTRUCT SUSPECT DATA FOR VIEW MODAL
  const handleViewSuspect = (suspect: any) => {
    const constructedSuspect = {
      id: suspect._id,
      name: suspect.suspectData?.name || "N/A",
      phone: suspect.suspectData?.phone || "N/A",
      email: suspect.suspectData?.email || "N/A",
      aadhar: suspect.suspectData?.aadhar || "N/A",
      age: suspect.suspectData?.age || null,
      roomNumber: suspect.suspectData?.roomNumber || "N/A",
      address: suspect.suspectData?.address || "N/A",
      nationality: suspect.suspectData?.nationality || "N/A",
      dateAdded: suspect.createdAt,
      photo: suspect.suspectData?.photo || "/placeholder-avatar.jpg",
      status: suspect.status || "Active",
      verifiedBy: suspect.verifiedBy,
      evidence: suspect.evidence,
      associatedAlerts: suspect.associatedAlerts || [],
      lastSeen: {
        location: suspect.lastSeen?.location || "Unknown",
        date: suspect.lastSeen?.date || new Date(),
        reportedBy: suspect.lastSeen?.reportedBy || "System",
      },
      criminalHistory: suspect.criminalHistory || [],
      activityLog: suspect.activityLog || [],
    };

    console.log("👁️ Viewing Suspect:", constructedSuspect);
    setSelectedSuspectForView(constructedSuspect);
    setShowViewSuspectModal(true);
  };

  return (
    <>
      {/* ========== HEADER ========== */}
      <div className="flex items-center justify-between mb-4">
        <Select
          value={`${sortType}-${sortOrder}`}
          onValueChange={(value) => {
            const [type, order] = value.split("-") as [SortType, SortOrder];
            setSortType(type);
            setSortOrder(order);
          }}
        >
          <SelectTrigger className="w-40 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Latest Added
              </div>
            </SelectItem>
            <SelectItem value="date-asc">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Oldest Added
              </div>
            </SelectItem>
            <SelectItem value="name-asc">
              <div className="flex items-center gap-2">
                <SortAsc className="h-4 w-4" />
                Name A-Z
              </div>
            </SelectItem>
            <SelectItem value="name-desc">
              <div className="flex items-center gap-2">
                <SortDesc className="h-4 w-4" />
                Name Z-A
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <Badge variant="outline" className="text-sm">
          {suspects.length} Suspect{suspects.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* ========== CARDS GRID ========== */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 mx-auto text-gray-400 mb-2 animate-spin" />
          <p className="text-gray-600 text-sm">Loading suspects...</p>
        </div>
      ) : suspects.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600 text-sm">No verified suspects</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedSuspects.map((suspect) => (
            <Card
              key={suspect._id}
              className="rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all"
            >
              <CardContent className="p-4">
                {/* TOP ROW: Avatar, Name, Date, Delete */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate text-sm">
                        {suspect.suspectData?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(suspect.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setSelectedSuspect(suspect);
                      setShowDeleteModal(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* CONTACT INFO */}
                <div className="space-y-2 mb-3 pb-3 border-b border-gray-200">
                  {suspect.suspectData?.phone && (
                    <div className="flex items-center gap-2 text-xs">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-700">
                        {suspect.suspectData.phone}
                      </span>
                    </div>
                  )}
                  {suspect.suspectData?.email && (
                    <div className="flex items-center gap-2 text-xs">
                      <Mail className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-700 truncate">
                        {suspect.suspectData.email}
                      </span>
                    </div>
                  )}
                  {suspect.suspectData?.roomNumber && (
                    <p className="text-xs text-gray-600">
                      🏠 Room {suspect.suspectData.roomNumber}
                    </p>
                  )}
                </div>

                {/* STATUS & ALERTS */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className="text-xs bg-blue-50 text-blue-700"
                    >
                      {suspect.status || "Active"}
                    </Badge>
                    {suspect.associatedAlerts?.length > 0 && (
                      <Badge className="bg-orange-500 text-white text-xs">
                        {suspect.associatedAlerts.length} Alert
                        {suspect.associatedAlerts.length > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                  {suspect.associatedAlerts?.[0]?.alertPriority && (
                    <Badge
                      className={`text-xs ${getPriorityColor(
                        suspect.associatedAlerts[0].alertPriority
                      )}`}
                    >
                      {suspect.associatedAlerts[0].alertPriority}
                    </Badge>
                  )}
                </div>

                {/* REASON */}
                {suspect.evidence?.reasonForSuspicion && (
                  <div className="mb-3 p-2 bg-blue-50 rounded-lg text-xs">
                    <p className="font-medium text-blue-900 mb-1">Reason:</p>
                    <p className="text-blue-800 line-clamp-2">
                      {suspect.evidence.reasonForSuspicion}
                    </p>
                  </div>
                )}

                {/* VIEW BUTTON */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-lg text-xs border-blue-300 hover:bg-blue-50"
                  onClick={() => handleViewSuspect(suspect)}
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ========== DELETE MODAL ========== */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="rounded-lg max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Suspect</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Deleting <strong>{selectedSuspect?.suspectData?.name}</strong>{" "}
              cannot be undone.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <label className="text-xs font-medium">Reason *</label>
            <Textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Why?"
              className="rounded-lg min-h-20 text-xs"
            />
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteReason("");
              }}
              className="flex-1 text-xs"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSuspect}
              disabled={isSubmitting || !deleteReason.trim()}
              className="flex-1 text-xs"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========== VIEW SUSPECT MODAL ========== */}
      {showViewSuspectModal && selectedSuspectForView && (
        <ViewSuspect
          isOpen={showViewSuspectModal}
          onClose={() => {
            setShowViewSuspectModal(false);
            setSelectedSuspectForView(null);
          }}
          suspect={selectedSuspectForView}
          onUpdateSuspect={() => {}}
        />
      )}
    </>
  );
}
