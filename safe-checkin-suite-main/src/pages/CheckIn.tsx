// CheckIn.tsx - Updated with guest count validation and auto-correction
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { checkInGuest } from "@/api/guestApi";
import GuestDetailsForm from "@/components/check-in/GuestDetailsForm";
import CaptureDetailsForm from "@/components/check-in/CaptureDetailsForm";
import { useToast } from "@/hooks/use-toast";
import { useRooms } from "@/contexts/RoomContext";

const CheckInPage = () => {
  const [step, setStep] = useState(1);
  const [guestFormData, setGuestFormData] = useState<any>(null);
  const [capturedGuestsData, setCapturedGuestsData] = useState<any[]>([]);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { checkIn } = useRooms();

  const handleNext = (formData: any) => {
    setGuestFormData(formData);
    setStep(2);
  };

  const handleBack = () => setStep(1);

  // Updated validation function to match backend requirements
  const validateGuestData = (data: any) => {
    const errors: string[] = [];

    // Check required fields based on backend validation
    if (
      !data.name ||
      data.name.trim().length < 2 ||
      data.name.trim().length > 100
    ) {
      errors.push("Name must be between 2 and 100 characters");
    }

    if (!data.phone || !/^[\+]?[1-9][\d]{9,14}$/.test(data.phone)) {
      errors.push("Please provide a valid phone number");
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push("Please provide a valid email address");
    }

    if (!data.nationality || data.nationality.trim().length === 0) {
      errors.push("Nationality is required");
    }

    if (!data.purpose || data.purpose.trim().length === 0) {
      errors.push("Purpose of visit is required");
    }

    const guestCount = parseInt(data.guestCount);
    if (!guestCount || guestCount < 1 || guestCount > 20) {
      errors.push("Guest count must be between 1 and 20");
    }

    // Validate guest count breakdown
    const totalBreakdown =
      (data.maleGuests || 0) +
      (data.femaleGuests || 0) +
      (data.childGuests || 0);
    if (totalBreakdown !== guestCount) {
      errors.push(
        `Guest breakdown (${totalBreakdown}) must equal total guests (${guestCount})`
      );
    }

    if (
      data.maleGuests !== undefined &&
      (isNaN(data.maleGuests) || data.maleGuests < 0)
    ) {
      errors.push("Male guests count must be a non-negative number");
    }

    if (
      data.femaleGuests !== undefined &&
      (isNaN(data.femaleGuests) || data.femaleGuests < 0)
    ) {
      errors.push("Female guests count must be a non-negative number");
    }

    if (
      data.childGuests !== undefined &&
      (isNaN(data.childGuests) || data.childGuests < 0)
    ) {
      errors.push("Child guests count must be a non-negative number");
    }

    if (!["Direct", "Online", "Travel Agent"].includes(data.bookingMode)) {
      errors.push("Booking mode must be Direct, Online, or Travel Agent");
    }

    if (
      data.bookingMode === "Online" &&
      (!data.bookingWebsite || data.bookingWebsite.trim().length === 0)
    ) {
      errors.push("Booking website is required for online bookings");
    }

    if (!data.roomNumber || data.roomNumber.trim().length === 0) {
      errors.push("Room number is required");
    }

    if (!Array.isArray(data.guests) || data.guests.length === 0) {
      errors.push("At least one guest detail is required");
    } else {
      data.guests.forEach((guest: any, index: number) => {
        if (!guest.name || guest.name.trim().length === 0) {
          errors.push(`Guest ${index + 1}: Name is required`);
        }

        if (
          ![
            "Passport",
            "National ID",
            "Driver License",
            "Voter ID",
            "Other",
          ].includes(guest.idType)
        ) {
          errors.push(`Guest ${index + 1}: Invalid ID type`);
        }

        if (!guest.idNumber || guest.idNumber.trim().length === 0) {
          errors.push(`Guest ${index + 1}: ID number is required`);
        }

        if (guest.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) {
          errors.push(
            `Guest ${index + 1}: Please provide a valid email address`
          );
        }
      });
    }

    if (data.totalAmount !== undefined && isNaN(data.totalAmount)) {
      errors.push("Total amount must be a number");
    }

    if (data.advanceAmount !== undefined && isNaN(data.advanceAmount)) {
      errors.push("Advance amount must be a number");
    }

    return errors;
  };

  const handleComplete = async () => {
    if (guestFormData && capturedGuestsData.length > 0) {
      // Find the primary guest from captured guests data
      const primaryGuest = capturedGuestsData.find((guest) => guest.isPrimary);

      // Parse and validate guest counts
      const totalGuestCount = parseInt(guestFormData.guestCount) || 1;
      let maleGuests = parseInt(guestFormData.maleGuests) || 0;
      let femaleGuests = parseInt(guestFormData.femaleGuests) || 0;
      let childGuests = parseInt(guestFormData.childGuests) || 0;

      console.log("Original guest counts:", {
        total: totalGuestCount,
        male: maleGuests,
        female: femaleGuests,
        child: childGuests,
        originalSum: maleGuests + femaleGuests + childGuests,
      });

      // Auto-correct guest counts if they don't match
      const currentSum = maleGuests + femaleGuests + childGuests;
      if (currentSum !== totalGuestCount) {
        console.warn(
          `Guest count mismatch detected: total=${totalGuestCount}, sum=${currentSum}`
        );

        if (currentSum === 0) {
          // If no breakdown provided, distribute guests intelligently
          // Default strategy: assume mixed adults with slight male preference
          if (totalGuestCount === 1) {
            maleGuests = 1;
            femaleGuests = 0;
            childGuests = 0;
          } else if (totalGuestCount === 2) {
            maleGuests = 1;
            femaleGuests = 1;
            childGuests = 0;
          } else {
            // For more than 2 guests, distribute evenly with male preference for odd numbers
            maleGuests = Math.ceil(totalGuestCount / 2);
            femaleGuests = Math.floor(totalGuestCount / 2);
            childGuests = 0;
          }
        } else if (currentSum < totalGuestCount) {
          // If sum is less than total, add to the largest category
          const diff = totalGuestCount - currentSum;
          if (maleGuests >= femaleGuests && maleGuests >= childGuests) {
            maleGuests += diff;
          } else if (femaleGuests >= childGuests) {
            femaleGuests += diff;
          } else {
            childGuests += diff;
          }
        } else {
          // If sum is greater than total, reduce from the largest category
          const diff = currentSum - totalGuestCount;
          if (
            maleGuests >= femaleGuests &&
            maleGuests >= childGuests &&
            maleGuests >= diff
          ) {
            maleGuests -= diff;
          } else if (femaleGuests >= childGuests && femaleGuests >= diff) {
            femaleGuests -= diff;
          } else if (childGuests >= diff) {
            childGuests -= diff;
          } else {
            // Edge case: reset to default distribution
            maleGuests = Math.ceil(totalGuestCount / 2);
            femaleGuests = Math.floor(totalGuestCount / 2);
            childGuests = 0;
          }
        }

        // Ensure no negative values
        maleGuests = Math.max(0, maleGuests);
        femaleGuests = Math.max(0, femaleGuests);
        childGuests = Math.max(0, childGuests);

        console.log("Corrected guest counts:", {
          total: totalGuestCount,
          male: maleGuests,
          female: femaleGuests,
          child: childGuests,
          correctedSum: maleGuests + femaleGuests + childGuests,
        });
      }

      // Ensure all required fields are properly formatted
      const finalGuestData = {
        ...guestFormData,
        // Override name and email with primary guest's data if available
        name:
          (primaryGuest ? primaryGuest.name : guestFormData.name)
            ?.toString()
            .trim() || "",
        email:
          (primaryGuest ? primaryGuest.email : guestFormData.email)
            ?.toString()
            .trim() || "",
        phone: guestFormData.phone?.toString().replace(/\D/g, "") || "",
        nationality: guestFormData.nationality?.toString().trim() || "",
        purpose: guestFormData.purpose?.toString().trim() || "",
        roomNumber: guestFormData.roomNumber?.toString().trim() || "",
        bookingMode: guestFormData.bookingMode || "Direct",
        bookingWebsite: guestFormData.bookingWebsite?.toString().trim() || "",
        guestCount: totalGuestCount,
        maleGuests: maleGuests,
        femaleGuests: femaleGuests,
        childGuests: childGuests,
        totalAmount: parseFloat(guestFormData.totalAmount) || 0,
        advanceAmount: parseFloat(guestFormData.advanceAmount) || 0,
        checkInTime: new Date().toISOString(),
        guests: capturedGuestsData.map((guest) => ({
          name: guest.name?.toString().trim() || "",
          idType: guest.idType || "Other",
          idNumber: guest.idNumber?.toString().trim() || "",
          email:
            guest.email && guest.email.trim() ? guest.email.trim() : undefined, // Fix for empty email validation
          isPrimary: guest.isPrimary || false,
        })),
      };

      // Final validation check
      const finalSum =
        finalGuestData.maleGuests +
        finalGuestData.femaleGuests +
        finalGuestData.childGuests;
      if (finalSum !== finalGuestData.guestCount) {
        toast({
          title: "Data Error",
          description: `Guest count still doesn't match after correction: Total (${finalGuestData.guestCount}) vs Sum (${finalSum})`,
          variant: "destructive",
        });
        return;
      }

      // Validate data before sending
      const validationErrors = validateGuestData(finalGuestData);
      if (validationErrors.length > 0) {
        console.error("Validation errors:", validationErrors);
        toast({
          title: "Validation Error",
          description: validationErrors.join(", "),
          variant: "destructive",
        });
        return;
      }

      console.log("Final guest data being sent:", finalGuestData); // Debug log

      try {
        const response = await checkInGuest(finalGuestData);
        console.log("Check-in response:", response);

        checkIn(guestFormData.roomNumber, finalGuestData);

        toast({
          title: "Check-In Complete!",
          description: `${finalGuestData.name} has been successfully checked into room ${guestFormData.roomNumber}.`,
        });

        navigate("/dashboard");
      } catch (error: any) {
        console.error("Check-in error:", error);

        // Enhanced error handling
        let errorMessage = "Something went wrong. Please try again.";

        if (error.response?.data?.errors) {
          // Handle express-validator errors
          const validationErrors = error.response.data.errors.map(
            (err: any) => `${err.path}: ${err.msg}`
          );
          errorMessage = `Validation errors: ${validationErrors.join(", ")}`;
          console.error(
            "Backend validation errors:",
            error.response.data.errors
          );
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast({
          title: "Check-In Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Incomplete Data",
        description: "Please ensure all guest details are captured.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Guest Check-In</h1>
      <Card>
        <CardHeader>
          <CardTitle>
            Step {step}: {step === 1 ? "Guest Details" : "Capture & Verify"}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? "Please fill in the primary guest information."
              : "Capture photos and add guest details. Mark one as primary guest."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <GuestDetailsForm onNext={handleNext} formData={guestFormData} />
          )}
          {step === 2 && (
            <CaptureDetailsForm
              onBack={handleBack}
              onComplete={handleComplete}
              totalGuests={Number(guestFormData.guestCount)}
              onCaptureChange={(data) => setCapturedGuestsData(data)}
              capturedGuestsData={capturedGuestsData}
              primaryGuestName={guestFormData?.name}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckInPage;
