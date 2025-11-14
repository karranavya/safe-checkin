// components/police/Evidence/EvidenceModal.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  XCircle,
  Download,
  FileIcon,
  AlertTriangle,
} from "lucide-react";

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidence: any;
  token: string;
  onUpdate: () => void;
}

export default function EvidenceModal({
  isOpen,
  onClose,
  evidence,
  token,
  onUpdate,
}: EvidenceModalProps) {
  const { toast } = useToast();
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [approveNotes, setApproveNotes] = useState("");

  const handleApprove = async () => {
    setApproving(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(
        `${apiUrl}/api/evidence/approve/${evidence._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ notes: approveNotes }),
        }
      );

      if (response.ok) {
        toast({
          title: "✅ Evidence Approved",
          description: "Evidence has been approved successfully",
        });
        onUpdate();
        onClose();
      } else {
        throw new Error("Failed to approve evidence");
      }
    } catch (error) {
      console.error("Approve error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve evidence",
      });
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide a rejection reason",
      });
      return;
    }

    setRejecting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(
        `${apiUrl}/api/evidence/reject/${evidence._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: rejectReason }),
        }
      );

      if (response.ok) {
        toast({
          title: "❌ Evidence Rejected",
          description: "Evidence has been rejected",
        });
        onUpdate();
        onClose();
      } else {
        throw new Error("Failed to reject evidence");
      }
    } catch (error) {
      console.error("Reject error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject evidence",
      });
    } finally {
      setRejecting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{evidence.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <Card className="rounded-lg">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs mb-1">Category</p>
                  <Badge variant="outline">{evidence.category}</Badge>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Status</p>
                  <Badge>{evidence.status}</Badge>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Severity</p>
                  <Badge>{evidence.severity}</Badge>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Type</p>
                  <Badge variant="outline">{evidence.evidenceType}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {evidence.description && (
            <Card className="rounded-lg">
              <CardContent className="pt-4">
                <p className="text-gray-500 text-xs mb-2">Description</p>
                <p className="text-sm text-gray-800">{evidence.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Files */}
          {evidence.files && evidence.files.length > 0 && (
            <Card className="rounded-lg">
              <CardContent className="pt-4">
                <p className="font-semibold text-sm mb-3">
                  Files ({evidence.files.length})
                </p>
                <div className="space-y-2">
                  {evidence.files.map((file: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <FileIcon className="h-5 w-5 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{file.fileName}</p>
                          <p className="text-xs text-gray-500">
                            {(file.fileSize / 1024).toFixed(2)} KB •{" "}
                            {new Date(file.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        asChild
                      >
                        <a
                          href={file.fileUrl}
                          download
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hotel Info */}
          {evidence.hotelId && (
            <Card className="rounded-lg">
              <CardContent className="pt-4">
                <p className="font-semibold text-sm mb-2">Source Hotel</p>
                <p className="text-sm text-gray-800">{evidence.hotelId.name}</p>
                {evidence.hotelId.address && (
                  <p className="text-xs text-gray-500 mt-1">
                    {evidence.hotelId.address}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Approval/Rejection Actions */}
          {evidence.status === "Pending Review" && (
            <div className="space-y-3">
              {!showRejectForm ? (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Approval Notes (Optional)
                    </label>
                    <Textarea
                      value={approveNotes}
                      onChange={(e) => setApproveNotes(e.target.value)}
                      placeholder="Add any notes about this approval..."
                      className="rounded-lg"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleApprove}
                      disabled={approving}
                      className="flex-1 bg-green-600 hover:bg-green-700 rounded-lg"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {approving ? "Approving..." : "Approve Evidence"}
                    </Button>
                    <Button
                      onClick={() => setShowRejectForm(true)}
                      variant="destructive"
                      className="flex-1 rounded-lg"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Evidence
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block text-red-600">
                      Rejection Reason *
                    </label>
                    <Textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Please provide a reason for rejection..."
                      className="rounded-lg border-red-300"
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleReject}
                      disabled={rejecting || !rejectReason.trim()}
                      variant="destructive"
                      className="flex-1 rounded-lg"
                    >
                      {rejecting ? "Rejecting..." : "Confirm Rejection"}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectReason("");
                      }}
                      variant="outline"
                      className="flex-1 rounded-lg"
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Already Approved/Rejected Info */}
          {evidence.status === "Approved" && evidence.approvedBy && (
            <Card className="rounded-lg bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <p className="text-sm font-medium text-green-800">
                  ✅ Approved by {evidence.approvedBy.name}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  {new Date(evidence.approvedBy.timestamp).toLocaleString()}
                </p>
                {evidence.approvedBy.notes && (
                  <p className="text-sm text-green-800 mt-2">
                    Notes: {evidence.approvedBy.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {evidence.status === "Rejected" && evidence.rejectionReason && (
            <Card className="rounded-lg bg-red-50 border-red-200">
              <CardContent className="pt-4">
                <p className="text-sm font-medium text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Evidence Rejected
                </p>
                <p className="text-sm text-red-800 mt-2">
                  Reason: {evidence.rejectionReason}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose} variant="outline" className="rounded-lg">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
