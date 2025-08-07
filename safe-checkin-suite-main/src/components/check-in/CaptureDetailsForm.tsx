import React, { useState, useEffect } from "react";
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
import { Camera, UserPlus, Trash2, Crown } from "lucide-react";
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

const CaptureDetailsForm = ({
  onBack,
  onComplete,
  totalGuests,
  onCaptureChange,
  capturedGuestsData,
  primaryGuestName,
}: {
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
}) => {
  const [guests, setGuests] = useState(capturedGuestsData || []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

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
        return number.length > 0; // Basic validation for other types
    }
  };

  // Function to check if ID number already exists in database
  const checkIdUniqueness = async (idNumber: string) => {
    try {
      const result = await validateUniqueness({ idNumber });
      return result.isUnique;
    } catch (error) {
      console.error("Error checking ID uniqueness:", error);
      return false;
    }
  };

  // Function to check if phone already exists in database
  const checkPhoneUniqueness = async (phone: string) => {
    try {
      const result = await validateUniqueness({ phone });
      return result.isUnique;
    } catch (error) {
      console.error("Error checking phone uniqueness:", error);
      return false;
    }
  };

  // Note: Email uniqueness check is simplified since backend doesn't validate emails specifically
  const checkEmailUniqueness = async (email: string) => {
    try {
      // For now, just check locally within the current guests array
      // You can extend this to check against backend if needed
      return true;
    } catch (error) {
      console.error("Error checking email uniqueness:", error);
      return false;
    }
  };

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

    // Check if trying to add another primary guest
    if (isPrimary && guests.some((guest) => guest.isPrimary)) {
      setGuestError("Only one primary guest is allowed.");
      return;
    }

    // Check for local duplicates first
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
      // Check ID uniqueness in database
      const isIdUnique = await checkIdUniqueness(idNumber);
      if (!isIdUnique) {
        setGuestError(
          "This ID number is already registered with an active guest. Please use a different ID."
        );
        setIsValidating(false);
        return;
      }

      // Check email uniqueness in database (only for primary guests with email)
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

      // If this is marked as primary, update all other guests to not be primary
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

  return (
    <div className="space-y-6">
      {/* Image Capture Section */}
      <Card>
        <CardHeader>
          <CardTitle>Capture Details</CardTitle>
          <CardDescription>
            Use device camera to capture required images.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline">
            <Camera className="mr-2 h-4 w-4" /> Guest Photo
          </Button>
          <Button variant="outline">
            <Camera className="mr-2 h-4 w-4" /> ID Front
          </Button>
          <Button variant="outline">
            <Camera className="mr-2 h-4 w-4" /> ID Back
          </Button>
        </CardContent>
      </Card>

      {/* Additional Guests */}
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

                {/* Email field - only show if primary guest is selected */}
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

                {/* Primary Guest Checkbox */}
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
            {!hasPrimaryGuest && guests.length > 0 && (
              <p className="text-sm text-amber-600 font-medium">
                ⚠️ Please select a primary guest
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Footer Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onComplete} disabled={guests.length < totalGuests}>
          Complete Check-In
        </Button>
      </div>
    </div>
  );
};

export default CaptureDetailsForm;
