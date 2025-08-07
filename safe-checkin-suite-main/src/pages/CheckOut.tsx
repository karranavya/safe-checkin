import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { checkGuestByRoom, checkOutGuest } from "@/api/guestApi";
import dayjs from "dayjs";

const CheckOutPage = () => {
  const [roomNumber, setRoomNumber] = useState("");
  const [guestData, setGuestData] = useState(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFindGuest = async () => {
    setSearchAttempted(true);
    setLoading(true);

    if (!roomNumber) {
      toast({
        variant: "destructive",
        title: "Room number required",
        description: "Please enter a room number.",
      });
      setLoading(false);
      return;
    }

    // Trim whitespace from room number
    const trimmedRoomNumber = roomNumber.trim();

    try {
      // Use the API function from guestApi.ts
      const response = await checkGuestByRoom(trimmedRoomNumber, "checked-in");

      // Check if response has data
      if (response.success && response.data && response.data.length > 0) {
        // Find the exact room match
        const foundGuest = response.data.find(
          (guest) =>
            guest.roomNumber.toString() === trimmedRoomNumber.toString()
        );

        if (foundGuest) {
          setGuestData(foundGuest);
          toast({
            title: "Guest found",
            description: `Found ${foundGuest.name} in room ${trimmedRoomNumber}.`,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Guest not found",
            description: `No checked-in guest found for room ${trimmedRoomNumber}.`,
          });
          setGuestData(null);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Guest not found",
          description: `No checked-in guest found for room ${trimmedRoomNumber}.`,
        });
        setGuestData(null);
      }
    } catch (error) {
      console.error("Full error object:", error);
      toast({
        variant: "destructive",
        title: "Error fetching guest",
        description:
          error.response?.data?.message ||
          error.message ||
          "Please try again later.",
      });
      setGuestData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!guestData?._id) return;

    setLoading(true);

    try {
      // Use the checkOutGuest function from guestApi.ts
      const checkOutData = {
        checkOutDate: dayjs().format("YYYY-MM-DD"),
        checkOutTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        notes: `Checked out from room ${roomNumber}`,
      };

      const response = await checkOutGuest(guestData._id, checkOutData);

      if (response.success) {
        toast({
          title: "Checked Out Successfully",
          description: `${guestData.name} has been checked out from room ${roomNumber}.`,
        });

        // Reset form
        setRoomNumber("");
        setGuestData(null);
        setSearchAttempted(false);
      } else {
        throw new Error(response.message || "Checkout failed");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        variant: "destructive",
        title: "Checkout failed",
        description: error.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRoomNumber("");
    setGuestData(null);
    setSearchAttempted(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Guest Check-Out</h1>
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Check Out a Guest</CardTitle>
          <CardDescription>
            Search by room number, then confirm check-out.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!guestData ? (
            <div className="flex items-end gap-2">
              <div className="flex-grow space-y-2">
                <Label htmlFor="roomNumber">Room Number</Label>
                <Input
                  id="roomNumber"
                  placeholder="e.g., 101"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !loading) {
                      handleFindGuest();
                    }
                  }}
                  disabled={loading}
                />
              </div>
              <Button onClick={handleFindGuest} disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  "Find Guest"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold">Guest Details</h3>
              <div className="grid grid-cols-2 gap-4 border rounded-lg p-4 bg-muted/50">
                <p>
                  <strong>Name:</strong> {guestData.name ?? "N/A"}
                </p>
                <p>
                  <strong>Phone:</strong> {guestData.phone ?? "N/A"}
                </p>
                <p>
                  <strong>Email:</strong> {guestData.email ?? "N/A"}
                </p>
                <p>
                  <strong>Nationality:</strong> {guestData.nationality ?? "N/A"}
                </p>
                <p>
                  <strong>Purpose:</strong> {guestData.purpose ?? "N/A"}
                </p>
                <p>
                  <strong>Guests:</strong> {guestData.guestCount ?? "N/A"}
                </p>
                <p>
                  <strong>Room:</strong> {guestData.roomNumber ?? "N/A"}
                </p>
                <p>
                  <strong>Check-in:</strong>{" "}
                  {guestData.checkInTime
                    ? dayjs(guestData.checkInTime).format("MMM DD, YYYY HH:mm")
                    : "N/A"}
                </p>
                {guestData.bookingWebsite && (
                  <p>
                    <strong>Website:</strong> {guestData.bookingWebsite}
                  </p>
                )}
                {guestData.referenceNumber && (
                  <p>
                    <strong>Ref No.:</strong> {guestData.referenceNumber}
                  </p>
                )}
                {guestData.totalAmount !== undefined &&
                  guestData.totalAmount !== null &&
                  guestData.totalAmount !== "" && (
                    <p>
                      <strong>Total Amount:</strong> ₹{guestData.totalAmount}
                    </p>
                  )}
                {guestData.advanceAmount !== undefined &&
                  guestData.advanceAmount !== null &&
                  guestData.advanceAmount !== "" && (
                    <p>
                      <strong>Advance Paid:</strong> ₹{guestData.advanceAmount}
                    </p>
                  )}
                {guestData.balanceAmount !== undefined &&
                  guestData.balanceAmount !== null &&
                  guestData.balanceAmount !== "" && (
                    <p>
                      <strong>Balance:</strong> ₹{guestData.balanceAmount}
                    </p>
                  )}
              </div>
            </div>
          )}
        </CardContent>
        {guestData && (
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleReset} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleCheckOut} disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Checking out...
                </>
              ) : (
                "Confirm Check Out"
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default CheckOutPage;
