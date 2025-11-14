// components/check-in/CaptureDetailsForm.tsx - Updated with photo support
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Camera, UserPlus, Trash2, Crown, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { validateUniqueness } from "@/api/guestApi";

interface PhotoFiles {
  guestPhoto: File | null;
  idFront: File | null;
  idBack: File | null;
}

interface CaptureDetailsFormProps {
  onBack: () => void;
  onComplete: () => void;
  totalGuests: number;
  onCaptureChange: (
    guests: {
      name: string;
      idType: string;
      idNumber: string;
      isPrimary?: boolean;
      email?: string;
    }[]
  ) => void;
  capturedGuestsData: {
    name: string;
    idType: string;
    idNumber: string;
    isPrimary?: boolean;
    email?: string;
  }[];
  primaryGuestName?: string;
  onPhotoChange: (photoType: keyof PhotoFiles, file: File | null) => void;
  photoFiles: PhotoFiles;
}

const CaptureDetailsForm: React.FC<CaptureDetailsFormProps> = ({
  onBack,
  onComplete,
  totalGuests,
  onCaptureChange,
  capturedGuestsData,
  primaryGuestName,
  onPhotoChange,
  photoFiles,
}) => {
  const [guests, setGuests] = useState(capturedGuestsData || []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Refs for file inputs
  const guestPhotoRef = useRef<HTMLInputElement>(null);
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onCaptureChange(guests);
  }, [guests, onCaptureChange]);

  const [guestDialog, setGuestDialog] = useState({
    name: "",
    idType: "",
    idNumber: "",
    isPrimary: false,
    email: "",
  });
  const [guestError, setGuestError] = useState("");

  // Photo validation and handling
  const validatePhotoFile = (file: File): string | null => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (file.size > maxSize) {
      return "File size must be less than 5MB";
    }

    if (!allowedTypes.includes(file.type)) {
      return "Only JPEG, PNG, and WebP images are allowed";
    }

    return null;
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    photoType: keyof PhotoFiles
  ) => {
    const file = event.target.files?.[0] || null;

    if (file) {
      const validationError = validatePhotoFile(file);
      if (validationError) {
        alert(validationError);
        return;
      }
    }

    onPhotoChange(photoType, file);
  };

  const triggerFileInput = (photoType: keyof PhotoFiles) => {
    switch (photoType) {
      case "guestPhoto":
        guestPhotoRef.current?.click();
        break;
      case "idFront":
        idFrontRef.current?.click();
        break;
      case "idBack":
        idBackRef.current?.click();
        break;
    }
  };

  // Existing validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateAadhar = (value: string) => /^\d{12}$/.test(value);
  const validatePassport = (value: string) => /^[A-Z][A-Z0-9]{7}$/.test(value);
  const validateDL = (value: string) =>
    /^[A-Z]{2}[0-9]{2}\s?[0-9]{11}$/.test(value.replace(/\s+/g, ""));

  const validateID = (type: string, number: string) => {
    switch (type) {
      case "aadhar":
      case "Aadhar":
      case "National ID":
        return validateAadhar(number);
      case "passport":
      case "Passport":
        return validatePassport(number);
      case "dl":
      case "Driver License":
        return validateDL(number);
      default:
        return number.length > 0;
    }
  };

  // Existing validation functions for uniqueness
  const checkIdUniqueness = async (idNumber: string) => {
    try {
      const result = await validateUniqueness({ idNumber });
      return result.isUnique;
    } catch (error) {
      console.error("Error checking ID uniqueness:", error);
      return false;
    }
  };

  const checkPhoneUniqueness = async (phone: string) => {
    try {
      const result = await validateUniqueness({ phone });
      return result.isUnique;
    } catch (error) {
      console.error("Error checking phone uniqueness:", error);
      return false;
    }
  };

  const checkEmailUniqueness = async (email: string) => {
    try {
      return true;
    } catch (error) {
      console.error("Error checking email uniqueness:", error);
      return false;
    }
  };

  // Existing guest management functions
  const handleAddGuest = async () => {
    const { name, idType, idNumber, isPrimary, email } = guestDialog;

    if (guests.length >= totalGuests) {
      setGuestError(`You can only add ${totalGuests} guest(s).`);
      return;
    }

    if (!name || !idType || !idNumber) {
      setGuestError("All fields are required.");
      return;
    }

    if (isPrimary && !email) {
      setGuestError("Email is required for primary guest.");
      return;
    }

    if (isPrimary && email && !validateEmail(email)) {
      setGuestError("Please enter a valid email address.");
      return;
    }

    if (!validateID(idType, idNumber)) {
      setGuestError("Invalid ID format.");
      return;
    }

    if (isPrimary && guests.some((guest) => guest.isPrimary)) {
      setGuestError("Only one primary guest is allowed.");
      return;
    }

    const localIdExists = guests.some((guest) => guest.idNumber === idNumber);
    if (localIdExists) {
      setGuestError("This ID number is already added to the guest list.");
      return;
    }

    if (isPrimary && email) {
      const localEmailExists = guests.some((guest) => guest.email === email);
      if (localEmailExists) {
        setGuestError("This email is already added to the guest list.");
        return;
      }
    }

    setIsValidating(true);

    try {
      const isIdUnique = await checkIdUniqueness(idNumber);
      if (!isIdUnique) {
        setGuestError(
          "This ID number is already registered with an active guest. Please use a different ID."
        );
        setIsValidating(false);
        return;
      }

      if (isPrimary && email) {
        const isEmailUnique = await checkEmailUniqueness(email);
        if (!isEmailUnique) {
          setGuestError(
            "This email is already registered with an active guest. Please use a different email."
          );
          setIsValidating(false);
          return;
        }
      }

      const updatedGuests = isPrimary
        ? [
            ...guests.map((guest) => ({ ...guest, isPrimary: false })),
            { ...guestDialog },
          ]
        : [...guests, { ...guestDialog }];

      setGuests(updatedGuests);
      setGuestDialog({
        name: "",
        idType: "",
        idNumber: "",
        isPrimary: false,
        email: "",
      });
      setGuestError("");
      setDialogOpen(false);
    } catch (error) {
      setGuestError("Error validating guest details. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveGuest = (index: number) => {
    setGuests((prev) => prev.filter((_, i) => i !== index));
  };

  const togglePrimaryGuest = (index: number) => {
    setGuests((prev) =>
      prev.map((guest, i) => ({
        ...guest,
        isPrimary: i === index ? !guest.isPrimary : false,
      }))
    );
  };

  const resetDialog = () => {
    setGuestDialog({
      name: "",
      idType: "",
      idNumber: "",
      isPrimary: false,
      email: "",
    });
    setGuestError("");
  };

  const hasPrimaryGuest = guests.some((guest) => guest.isPrimary);

  // Check if all required photos are uploaded
  const hasRequiredPhotos = photoFiles.guestPhoto !== null;
  const canComplete = guests.length >= totalGuests && hasRequiredPhotos;

  return (
    <div className="space-y-6">
      {/* Hidden file inputs */}
      <input
        ref={guestPhotoRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e, "guestPhoto")}
        style={{ display: "none" }}
      />
      <input
        ref={idFrontRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e, "idFront")}
        style={{ display: "none" }}
      />
      <input
        ref={idBackRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e, "idBack")}
        style={{ display: "none" }}
      />

      {/* Image Capture Section */}
      <Card>
        <CardHeader>
          <CardTitle>Capture Details</CardTitle>
          <CardDescription>
            Use device camera to capture required images.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Guest Photo */}
          <div className="flex flex-col items-center space-y-2">
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center space-y-2"
              onClick={() => triggerFileInput("guestPhoto")}
              type="button"
            >
              {photoFiles.guestPhoto ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <Camera className="h-6 w-6" />
              )}
              <span>Guest Photo</span>
            </Button>
            {photoFiles.guestPhoto && (
              <p className="text-xs text-green-600 text-center">
                ✓ {photoFiles.guestPhoto.name}
              </p>
            )}
          </div>

          {/* ID Front */}
          <div className="flex flex-col items-center space-y-2">
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center space-y-2"
              onClick={() => triggerFileInput("idFront")}
              type="button"
            >
              {photoFiles.idFront ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <Camera className="h-6 w-6" />
              )}
              <span>ID Front</span>
            </Button>
            {photoFiles.idFront && (
              <p className="text-xs text-green-600 text-center">
                ✓ {photoFiles.idFront.name}
              </p>
            )}
          </div>

          {/* ID Back */}
          <div className="flex flex-col items-center space-y-2">
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center space-y-2"
              onClick={() => triggerFileInput("idBack")}
              type="button"
            >
              {photoFiles.idBack ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <Camera className="h-6 w-6" />
              )}
              <span>ID Back</span>
            </Button>
            {photoFiles.idBack && (
              <p className="text-xs text-green-600 text-center">
                ✓ {photoFiles.idBack.name}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Existing Guest Details Section */}
      <Card>
        <CardHeader className="flex justify-between">
          <div>
            <CardTitle>Guests Details</CardTitle>
            <CardDescription>
              Add details for all guests. Mark one as primary guest for room
              booking.
              {primaryGuestName && (
                <span className="block mt-1 text-sm font-medium text-blue-600">
                  Room booked under: {primaryGuestName}
                </span>
              )}
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                disabled={guests.length >= totalGuests}
                onClick={() => {
                  resetDialog();
                  setDialogOpen(true);
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" /> Add Guest
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Guest Details</DialogTitle>
                <DialogDescription>
                  Fill in the details for the guest.
                  {!hasPrimaryGuest && (
                    <span className="block mt-1 text-amber-600 font-medium">
                      Consider marking one guest as primary for room booking.
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={guestDialog.name}
                    onChange={(e) =>
                      setGuestDialog({ ...guestDialog, name: e.target.value })
                    }
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ID Proof Type</Label>
                  <Select
                    value={guestDialog.idType}
                    onValueChange={(val) =>
                      setGuestDialog({ ...guestDialog, idType: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Passport">Passport</SelectItem>
                      <SelectItem value="National ID">National ID</SelectItem>
                      <SelectItem value="Driver License">
                        Driver License
                      </SelectItem>
                      <SelectItem value="Voter ID">Voter ID</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ID Number</Label>
                  <Input
                    value={guestDialog.idNumber}
                    onChange={(e) =>
                      setGuestDialog({
                        ...guestDialog,
                        idNumber: e.target.value,
                      })
                    }
                    placeholder="Enter ID number"
                    className={
                      guestDialog.idNumber &&
                      !validateID(guestDialog.idType, guestDialog.idNumber)
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {guestDialog.idNumber &&
                    !validateID(guestDialog.idType, guestDialog.idNumber) && (
                      <p className="text-sm text-red-500">Invalid ID format</p>
                    )}
                </div>

                {guestDialog.isPrimary && (
                  <div className="space-y-2">
                    <Label>
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      value={guestDialog.email}
                      onChange={(e) =>
                        setGuestDialog({
                          ...guestDialog,
                          email: e.target.value,
                        })
                      }
                      placeholder="Enter email address"
                      className={
                        guestDialog.email && !validateEmail(guestDialog.email)
                          ? "border-red-500"
                          : ""
                      }
                    />
                    {guestDialog.email && !validateEmail(guestDialog.email) && (
                      <p className="text-sm text-red-500">
                        Please enter a valid email address
                      </p>
                    )}
                    <p className="text-xs text-gray-600">
                      Required for primary guest for booking confirmations
                    </p>
                  </div>
                )}

                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border">
                  <Checkbox
                    id="isPrimary"
                    checked={guestDialog.isPrimary}
                    onCheckedChange={(checked) =>
                      setGuestDialog({ ...guestDialog, isPrimary: !!checked })
                    }
                    disabled={hasPrimaryGuest}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="isPrimary"
                      className={`text-sm font-medium ${
                        hasPrimaryGuest ? "text-gray-400" : "text-blue-700"
                      }`}
                    >
                      <Crown className="inline w-4 h-4 mr-1" />
                      Mark as Primary Guest
                    </Label>
                    <p className="text-xs text-gray-600 mt-1">
                      {hasPrimaryGuest
                        ? "A primary guest is already selected"
                        : "Primary guest's name will be used for room booking"}
                    </p>
                  </div>
                </div>

                {guestError && (
                  <p className="text-sm text-red-500">{guestError}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isValidating}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAddGuest}
                  disabled={
                    isValidating ||
                    !guestDialog.name ||
                    !guestDialog.idType ||
                    !guestDialog.idNumber ||
                    (guestDialog.isPrimary && !guestDialog.email)
                  }
                >
                  {isValidating ? "Validating..." : "Save Guest"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {guests.map((guest, index) => (
            <div
              key={`${guest.idType}-${guest.idNumber}-${index}`}
              className={`border rounded-lg p-4 flex justify-between items-center ${
                guest.isPrimary ? "bg-blue-50 border-blue-200" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{guest.name}</p>
                    {guest.isPrimary && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-blue-100 text-blue-700"
                      >
                        <Crown className="w-3 h-3 mr-1" />
                        Primary
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {guest.idType.toUpperCase()}: {guest.idNumber}
                  </p>
                  {guest.isPrimary && guest.email && (
                    <p className="text-sm text-blue-600">📧 {guest.email}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePrimaryGuest(index)}
                  className="text-blue-600 hover:text-blue-700"
                  disabled={guest.isPrimary}
                >
                  <Crown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveGuest(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}

          {guests.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No guests added yet</p>
              <p className="text-sm">Click "Add Guest" to get started</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              {guests.length} of {totalGuests} guests added
            </p>
            <div className="flex flex-col items-end text-sm">
              {!hasPrimaryGuest && guests.length > 0 && (
                <p className="text-amber-600 font-medium">
                  ⚠️ Please select a primary guest
                </p>
              )}
              {!hasRequiredPhotos && (
                <p className="text-red-600 font-medium">
                  ⚠️ Guest photo is required
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onComplete} disabled={!canComplete}>
          Complete Check-In
        </Button>
      </div>
    </div>
  );
};

export default CaptureDetailsForm;
