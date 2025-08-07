import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  UserMinus,
  Clock,
  TrendingUp,
  Building,
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import {
  GuestSearchFilters,
  GuestFilters,
} from "@/components/dashboard/GuestSearchFilters";
import { GuestTable, Guest } from "@/components/dashboard/GuestTable";
import { useToast } from "@/hooks/use-toast";
import { fetchGuests, checkOutGuest } from "@/api/guestApi";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [filteredGuests, setFilteredGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load guests from API on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchGuests();
        console.log("Fetched guest data:", data); // Debug log

        // Fix: Extract the guests array from the response object
        const guestsArray = Array.isArray(data) ? data : data.guests || [];
        setGuests(guestsArray);
        setFilteredGuests(guestsArray);
      } catch (err) {
        console.error("Error loading guests:", err);
        toast({
          title: "Error loading guests",
          description: "Could not fetch guest data from server.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  // Refresh data from API manually
  const refreshGuestsData = async () => {
    try {
      setLoading(true);
      const data = await fetchGuests();

      // Fix: Extract the guests array from the response object
      const guestsArray = Array.isArray(data) ? data : data.guests || [];
      setGuests(guestsArray);
      setFilteredGuests(guestsArray);

      toast({
        title: "Data Refreshed",
        description: "Guest data has been updated successfully.",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Failed to refresh",
        description: "Could not fetch latest guest data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: GuestFilters) => {
    let filtered = guests;

    // Search filter - added safe navigation
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (guest) =>
          (guest.name && guest.name.toLowerCase().includes(searchLower)) ||
          (guest.phone && guest.phone.includes(searchLower)) ||
          (guest.referenceNumber &&
            guest.referenceNumber.toLowerCase().includes(searchLower)) ||
          (guest.email && guest.email.toLowerCase().includes(searchLower))
      );
    }

    // Status filter
    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter((guest) => guest.status === filters.status);
    }

    // Nationality filter - added safe navigation
    if (filters.nationality && filters.nationality !== "all") {
      filtered = filtered.filter(
        (guest) =>
          guest.nationality &&
          guest.nationality.toLowerCase() === filters.nationality.toLowerCase()
      );
    }

    // Room number filter - added safe navigation
    if (filters.roomNumber) {
      filtered = filtered.filter(
        (guest) =>
          guest.roomNumber && guest.roomNumber.includes(filters.roomNumber)
      );
    }

    // Check-in date filter
    if (filters.checkInDate) {
      filtered = filtered.filter(
        (guest) => guest.checkInDate === filters.checkInDate
      );
    }

    setFilteredGuests(filtered);
  };

  const handleViewGuest = (guest: Guest) => {
    console.log("handleViewGuest called with:", guest);

    const guestId =
      guest._id || guest.id || (guest as any).userId || (guest as any).guestId;
    console.log("Guest ID:", guestId);

    if (!guestId) {
      console.error("Guest ID not found:", guest);
      toast({
        title: "Error",
        description: "Could not find guest ID",
        variant: "destructive",
      });
      return;
    }

    const navigationPath = `/guest-details/${guestId}`;
    console.log("Navigating to:", navigationPath);

    navigate(navigationPath, { state: { guest } });
  };

  const handleCheckOut = async (guestId: string) => {
    // Find guest by either _id or id
    const guest = guests.find((g) => g._id === guestId || g.id === guestId);
    if (!guest) return;

    try {
      // Make API call to check out guest
      await checkOutGuest(guestId);

      // Update local state
      const updatedGuests = guests.map((g) => {
        const currentGuestId = g._id || g.id;
        return currentGuestId === guestId
          ? {
              ...g,
              status: "checked-out" as const,
              checkOutDate: new Date().toISOString().split("T")[0],
            }
          : g;
      });

      setGuests(updatedGuests);
      setFilteredGuests(updatedGuests);

      toast({
        title: "Check-out Successful",
        description: `${guest.name} has been checked out from room ${guest.roomNumber}`,
      });
    } catch (error) {
      console.error("Error checking out guest:", error);
      toast({
        title: "Check-out Failed",
        description: "Could not update guest status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate statistics - Add safety check
  const stats = {
    totalGuests: Array.isArray(guests) ? guests.length : 0,
    checkedIn: Array.isArray(guests)
      ? guests.filter((g) => g.status === "checked-in").length
      : 0,
    checkedOut: Array.isArray(guests)
      ? guests.filter((g) => g.status === "checked-out").length
      : 0,
    pending: Array.isArray(guests)
      ? guests.filter((g) => g.status === "pending").length
      : 0,
    occupancyRate: Array.isArray(guests)
      ? Math.round(
          (guests.filter((g) => g.status === "checked-in").length / 50) * 100
        )
      : 0, // Assuming 50 total rooms
  };

  if (loading && guests.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Loading guest data...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to Safe CheckIn. Monitor your hotel operations and manage
            guest records.
          </p>
        </div>
        <button
          onClick={refreshGuestsData}
          disabled={loading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
              Refreshing...
            </>
          ) : (
            "Refresh Data"
          )}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6 px-2 sm:px-0">
        <StatsCard
          title="Total Guests"
          value={stats.totalGuests}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Checked In"
          value={stats.checkedIn}
          icon={UserPlus}
          variant="success"
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Checked Out"
          value={stats.checkedOut}
          icon={UserMinus}
          variant="info"
        />
        <StatsCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          variant="warning"
        />
      </div>

      {/* Search and Filters */}
      <GuestSearchFilters
        onSearch={handleSearch}
        totalGuests={filteredGuests.length}
      />

      {/* Guest Table */}
      <GuestTable
        guests={filteredGuests}
        onViewGuest={handleViewGuest}
        onCheckOut={handleCheckOut}
      />
    </div>
  );
}
