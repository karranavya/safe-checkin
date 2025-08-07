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

  const handleComplete = async () => {
    if (guestFormData && capturedGuestsData.length > 0) {
      // Find the primary guest from captured guests data
      const primaryGuest = capturedGuestsData.find((guest) => guest.isPrimary);

      // Use primary guest's name and email, or fallback to form data
      const finalGuestData = {
        ...guestFormData,
        // Override name and email with primary guest's data if available
        name: primaryGuest ? primaryGuest.name : guestFormData.name,
        email: primaryGuest ? primaryGuest.email : guestFormData.email,
        checkInTime: new Date().toLocaleString(),
        guests: capturedGuestsData,
      };

      console.log("Final guest data being sent:", finalGuestData); // Debug log

      try {
        await checkInGuest(finalGuestData);
        checkIn(guestFormData.roomNumber, finalGuestData);

        toast({
          title: "Check-In Complete!",
          description: `${finalGuestData.name} has been successfully checked into room ${guestFormData.roomNumber}.`,
        });

        navigate("/dashboard");
      } catch (error) {
        console.error("Check-in error:", error);
        toast({
          title: "Check-In Failed",
          description: "Something went wrong. Please try again.",
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
              primaryGuestName={guestFormData?.name} // Pass the initial name
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckInPage;
