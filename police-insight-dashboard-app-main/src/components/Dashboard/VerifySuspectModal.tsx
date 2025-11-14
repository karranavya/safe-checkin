// components/police/VerifySuspectModal.jsx - COMPLETE FIXED VERSION
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import axios from "axios";

interface VerifySuspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: any; // ⭐ THIS IS THE ALERT DATA
  onSuccess: (suspect: any) => void;
  token: string;
}

export default function VerifySuspectModal({
  isOpen,
  onClose,
  alert, // ⭐ ALERT IS PASSED HERE
  onSuccess,
  token,
}: VerifySuspectModalProps) {
  const { toast } = useToast();

  // ========== STATE ========== //
  const [step, setStep] = useState(1);
  const [reasonForSuspicion, setReasonForSuspicion] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========== HANDLERS ========== //
  const handleClose = () => {
    setStep(1);
    setReasonForSuspicion("");
    setAdditionalNotes("");
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleConfirmStep1 = () => {
    setStep(2);
  };

  // ⭐ FIX: Use 'alert' directly instead of selectedAlertForVerification
  const handleVerifySuspect = async () => {
    if (!reasonForSuspicion.trim()) {
      setError("Please provide a reason for suspicion");
      return;
    }

    if (reasonForSuspicion.trim().length < 10) {
      setError("Reason must be at least 10 characters");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

      // ⭐ USE alert._id INSTEAD OF selectedAlertForVerification._id
      const response = await axios.post(
        `${apiUrl}/api/suspects/verify/${alert._id}`,
        {
          reasonForSuspicion: reasonForSuspicion.trim(),
          additionalNotes: additionalNotes.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        if (onSuccess) {
          onSuccess(response.data.suspect);
        }

        setStep(1);
        handleClose();
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to verify suspect. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!alert) return null;

  const guest = alert.guestId || {};

  // ========== RENDER ========== //
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[80vh] overflow-y-auto">
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl text-destructive">
                <AlertTriangle className="h-6 w-6" />
                Verify Suspect
              </DialogTitle>
              <DialogDescription>
                Step 1 of 2: Confirm this person as a suspect
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-6">
              {/* Alert Details */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-blue-900">Alert Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-xs text-blue-700">Alert Type</Label>
                    <p className="font-medium text-blue-900">{alert.type}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-blue-700">Priority</Label>
                    <Badge className="mt-1" variant="outline">
                      {alert.priority}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-blue-700">Title</Label>
                    <p className="font-medium text-blue-900">{alert.title}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-blue-700">Description</Label>
                    <p className="text-blue-800 line-clamp-2">
                      {alert.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Guest Information */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900">
                  Guest Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-gray-600">Name</Label>
                    <p className="font-medium text-gray-900">
                      {guest.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Room</Label>
                    <p className="font-medium text-gray-900">
                      {guest.roomNumber || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Phone</Label>
                    <p className="font-medium text-gray-900">
                      {guest.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Status</Label>
                    <Badge variant="outline" className="mt-1">
                      {guest.status || "Unknown"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Important Alert */}
              <Alert>
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  <strong>Important:</strong> By confirming, you are officially
                  marking this guest as a suspect in the police database. This
                  action will:
                  <ul className="mt-2 ml-4 space-y-1 list-disc">
                    <li>Create a permanent suspect record</li>
                    <li>Notify the hotel management</li>
                    <li>Flag their profile as critical</li>
                    <li>Add to suspect database for investigation</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Confirmation */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="font-semibold text-amber-900 mb-3">
                  Are you certain this person is a suspect?
                </p>
                <p className="text-sm text-amber-800">
                  You will be able to add detailed evidence and notes in the
                  next step.
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmStep1}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Yes, Continue to Details
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
                Add Suspect Details
              </DialogTitle>
              <DialogDescription>
                Step 2 of 2: Provide reason and evidence for suspicion
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-6">
              {/* Selected Guest */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold text-blue-900">{guest.name}</p>
                  <p className="text-sm text-blue-700">
                    Room {guest.roomNumber} • {guest.phone}
                  </p>
                </div>
                <Badge className="bg-blue-600">Selected</Badge>
              </div>

              {/* Reason for Suspicion */}
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-sm font-medium">
                  Reason for Suspicion <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Provide a detailed reason why this person is suspected. Include specific incidents, behaviors, or evidence..."
                  value={reasonForSuspicion}
                  onChange={(e) => {
                    setReasonForSuspicion(e.target.value);
                    setError(null);
                  }}
                  className="rounded-xl min-h-[100px]"
                  disabled={isSubmitting}
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500">
                  {reasonForSuspicion.length} / 1000 characters
                </p>
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Additional Notes
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information, context, or observations..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="rounded-xl min-h-[80px]"
                  disabled={isSubmitting}
                  maxLength={2000}
                />
                <p className="text-xs text-gray-500">
                  {additionalNotes.length} / 2000 characters
                </p>
              </div>

              {/* Info Alert */}
              <Alert>
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  This information will be stored permanently in the suspect
                  database and visible to all authorized police personnel.
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleVerifySuspect}
                disabled={
                  isSubmitting ||
                  !reasonForSuspicion.trim() ||
                  reasonForSuspicion.trim().length < 10
                }
                className="bg-gradient-to-r from-green-500 to-green-600 hover:opacity-90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Suspect Record...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm & Create Suspect
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
