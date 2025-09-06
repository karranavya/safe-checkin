// src/components/Dashboard/HotelList.tsx
import React, { useState, useEffect } from "react";
import {
  Building,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  User,
  Bed,
  IndianRupee,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Hotel {
  _id: string;
  name: string;
  email: string;
  ownerName: string;
  phone: string;
  numberOfRooms: number;
  roomRate: number;
  address?: {
    // Make address optional
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  isActive: boolean;
  registrationDate: string;
  registeredByPolice?: boolean;
  policeOfficer?: {
    id?: string;
    name?: string;
    badgeNumber?: string;
    station?: string;
    rank?: string;
  };
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

interface HotelsResponse {
  success: boolean;
  data: {
    hotels: Hotel[];
    pagination: PaginationInfo;
  };
}

const HotelList: React.FC = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [filters, setFilters] = useState({
    isActive: "",
    registeredByPolice: "true",
  });

  // Fetch hotels
  // Fetch hotels
  const fetchHotels = async (page = 1, search = "", filterParams = filters) => {
    setLoading(true);
    setError("");

    try {
      // FIXED: Get token from the correct locations
      const token =
        sessionStorage.getItem("policeToken") ||
        localStorage.getItem("policeToken");

      // Check if token exists
      if (!token) {
        setError("Authentication required. Please login again.");
        setLoading(false);
        return;
      }

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search: search,
        ...(filterParams.isActive && { isActive: filterParams.isActive }),
        ...(filterParams.registeredByPolice && {
          registeredByPolice: filterParams.registeredByPolice,
        }),
      });

      const response = await fetch(
        `http://localhost:5000/api/hotels/all?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`, // FIXED: Use token directly
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 401) {
        setError("Session expired. Please login again.");
        // Clear both possible token locations
        localStorage.removeItem("policeToken");
        sessionStorage.removeItem("policeToken");
        localStorage.removeItem("police-dashboard-auth");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch hotels: ${response.statusText}`);
      }

      const data: HotelsResponse = await response.json();

      if (data.success) {
        setHotels(data.data.hotels);
        setPagination(data.data.pagination);
      } else {
        setError("Failed to fetch hotels");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Fetch hotels error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchHotels();
  }, []);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchHotels(1, searchTerm, filters);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchHotels(page, searchTerm, filters);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // FIXED: Format address with proper null/undefined checks
  const formatAddress = (address?: Hotel["address"]) => {
    if (!address) return "Not provided";

    const parts = [
      address.street,
      address.city,
      address.state,
      address.country,
    ].filter((part) => part && part.trim() !== ""); // Filter out null, undefined, and empty strings

    return parts.length > 0 ? parts.join(", ") : "Not provided";
  };

  // Handle refresh after registration
  const handleRefresh = () => {
    fetchHotels(currentPage, searchTerm, filters);
  };

  if (loading && hotels.length === 0) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">
              Loading hotels...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Registered Hotels
            </h1>
            <p className="text-muted-foreground">
              View and manage registered accommodation facilities
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-card rounded-lg shadow border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search hotels by name, email, or owner..."
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                />
              </div>
            </form>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 dark:bg-red-950 dark:border-red-800 dark:text-red-400">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button
                onClick={() => setError("")}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Hotels List */}
        <div className="bg-card rounded-lg shadow border">
          {hotels.length === 0 && !loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Hotels Found
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "No hotels match your search criteria."
                    : "No hotels have been registered yet."}
                </p>
                <button
                  onClick={handleRefresh}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Refresh List
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/50 font-semibold text-sm">
                <div className="col-span-3">Hotel Details</div>
                <div className="col-span-2">Owner Info</div>
                <div className="col-span-2">Contact</div>
                <div className="col-span-2">Capacity</div>
                <div className="col-span-2">Registration</div>
                <div className="col-span-1">Status</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-border">
                {hotels.map((hotel) => (
                  <div
                    key={hotel._id}
                    className="grid grid-cols-12 gap-4 p-4 hover:bg-muted/30 transition-colors"
                  >
                    {/* Hotel Details */}
                    <div className="col-span-3">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Building className="w-5 h-5 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {hotel.name}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {hotel.email}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatAddress(hotel.address)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Owner Info */}
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">
                          {hotel.ownerName}
                        </span>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="col-span-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            {hotel.phone}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground truncate">
                            {hotel.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Capacity */}
                    <div className="col-span-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Bed className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            {hotel.numberOfRooms} rooms
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <IndianRupee className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            {hotel.roomRate}/night
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Registration */}
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2 mb-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">
                          {formatDate(hotel.registrationDate)}
                        </span>
                      </div>
                      {hotel.registeredByPolice && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Police Verified
                        </span>
                      )}
                      {hotel.policeOfficer?.name && (
                        <p className="text-xs text-muted-foreground mt-1">
                          By: {hotel.policeOfficer.name}
                        </p>
                      )}
                    </div>

                    {/* Status */}
                    <div className="col-span-1">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          hotel.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {hotel.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{" "}
                {Math.min(
                  pagination.currentPage * pagination.limit,
                  pagination.totalCount
                )}{" "}
                of {pagination.totalCount} hotels
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-sm text-foreground">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelList;
