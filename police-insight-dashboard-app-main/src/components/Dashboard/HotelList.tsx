// src/components/Dashboard/HotelList.tsx
import React, { useState, useEffect } from "react";
import {
  Building,
  Search,
  Eye,
  Phone,
  Mail,
  User,
  Bed,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  FileText,
  CreditCard,
  X,
  Building2,
} from "lucide-react";

// Updated interface to match new schema
interface Hotel {
  _id: string;
  name: string;
  accommodationType: string;
  email: string;
  ownerName: string;
  ownerPhone: string;
  ownerAadharNumber: string;
  numberOfRooms: number;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    fullAddress?: string;
  };
  gstNumber: string;
  labourLicenceNumber: string;
  hotelLicenceNumber: string;
  isActive: boolean;
  isVerified?: boolean;
  registrationDate: string;
  registeredByPolice?: boolean;
  verifiedAt?: string;
  verificationNotes?: string;
  policeOfficer?: {
    id?: string;
    name?: string;
    badgeNumber?: string;
    station?: string;
    rank?: string;
  };
  category?: string;
  settings?: {
    allowOnlineBooking?: boolean;
    requireIdVerification?: boolean;
    autoSendAlerts?: boolean;
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

// Modal component for viewing hotel details
const HotelDetailsModal: React.FC<{
  hotel: Hotel;
  isOpen: boolean;
  onClose: () => void;
}> = ({ hotel, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {hotel.name}
              </h2>
              <p className="text-sm text-gray-500">{hotel.accommodationType}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Building2 className="w-4 h-4 mr-2" />
                Basic Information
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {hotel.name}
                </div>
                <div>
                  <span className="font-medium">Type:</span>{" "}
                  {hotel.accommodationType}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {hotel.email}
                </div>
                <div>
                  <span className="font-medium">Rooms:</span>{" "}
                  {hotel.numberOfRooms}
                </div>
                <div>
                  <span className="font-medium">Category:</span>{" "}
                  {hotel.category || "Standard"}
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      hotel.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {hotel.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Owner Information
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {hotel.ownerName}
                </div>
                <div>
                  <span className="font-medium">Phone:</span> {hotel.ownerPhone}
                </div>
                <div>
                  <span className="font-medium">Aadhar:</span>{" "}
                  {hotel.ownerAadharNumber}
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Address Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Street:</span>{" "}
                {hotel.address.street}
              </div>
              <div>
                <span className="font-medium">City:</span> {hotel.address.city}
              </div>
              <div>
                <span className="font-medium">State:</span>{" "}
                {hotel.address.state}
              </div>
              <div>
                <span className="font-medium">PIN Code:</span>{" "}
                {hotel.address.zipCode}
              </div>
              <div>
                <span className="font-medium">Country:</span>{" "}
                {hotel.address.country}
              </div>
              {hotel.address.fullAddress && (
                <div className="md:col-span-2">
                  <span className="font-medium">Full Address:</span>{" "}
                  {hotel.address.fullAddress}
                </div>
              )}
            </div>
          </div>

          {/* Legal Documentation */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Legal Documentation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">GST Number:</span>{" "}
                {hotel.gstNumber}
              </div>
              <div>
                <span className="font-medium">Labour License:</span>{" "}
                {hotel.labourLicenceNumber}
              </div>
              <div className="md:col-span-2">
                <span className="font-medium">Hotel License:</span>{" "}
                {hotel.hotelLicenceNumber}
              </div>
            </div>
          </div>

          {/* Registration & Verification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Registration Details
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Registered:</span>{" "}
                  {new Date(hotel.registrationDate).toLocaleDateString("en-IN")}
                </div>
                <div>
                  <span className="font-medium">Police Registered:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      hotel.registeredByPolice
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {hotel.registeredByPolice ? "Yes" : "No"}
                  </span>
                </div>
                {hotel.policeOfficer?.name && (
                  <>
                    <div>
                      <span className="font-medium">Registered By:</span>{" "}
                      {hotel.policeOfficer.name}
                    </div>
                    <div>
                      <span className="font-medium">Badge Number:</span>{" "}
                      {hotel.policeOfficer.badgeNumber}
                    </div>
                    <div>
                      <span className="font-medium">Station:</span>{" "}
                      {hotel.policeOfficer.station}
                    </div>
                    <div>
                      <span className="font-medium">Rank:</span>{" "}
                      {hotel.policeOfficer.rank}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <CreditCard className="w-4 h-4 mr-2" />
                Verification Status
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Verified:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      hotel.isVerified
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {hotel.isVerified ? "Verified" : "Pending"}
                  </span>
                </div>
                {hotel.verifiedAt && (
                  <div>
                    <span className="font-medium">Verified At:</span>{" "}
                    {new Date(hotel.verifiedAt).toLocaleDateString("en-IN")}
                  </div>
                )}
                {hotel.verificationNotes && (
                  <div>
                    <span className="font-medium">Notes:</span>{" "}
                    {hotel.verificationNotes}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Settings */}
          {hotel.settings && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Online Booking:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      hotel.settings.allowOnlineBooking
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {hotel.settings.allowOnlineBooking ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <div>
                  <span className="font-medium">ID Verification:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      hotel.settings.requireIdVerification
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {hotel.settings.requireIdVerification
                      ? "Required"
                      : "Optional"}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Auto Alerts:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      hotel.settings.autoSendAlerts
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {hotel.settings.autoSendAlerts ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const HotelList: React.FC = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [filters, setFilters] = useState({
    isActive: "",
    registeredByPolice: "true",
  });

  // Fetch hotels
  const fetchHotels = async (page = 1, search = "", filterParams = filters) => {
    setLoading(true);
    setError("");

    try {
      const token =
        sessionStorage.getItem("policeToken") ||
        localStorage.getItem("policeToken");

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
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 401) {
        setError("Session expired. Please login again.");
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

  // Handle view hotel details
  const handleViewHotel = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setShowModal(true);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format address
  const formatAddress = (address: Hotel["address"]) => {
    if (!address) return "Not provided";

    const parts = [
      address.street,
      address.city,
      address.state,
      address.country,
    ].filter((part) => part && part.trim() !== "");

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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading hotels...</span>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Registered Hotels
            </h1>
            <p className="text-gray-600">
              View and manage registered accommodation facilities
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search hotels by name, email, or owner..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </form>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
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
        <div className="bg-white rounded-lg shadow border">
          {hotels.length === 0 && !loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Hotels Found
                </h3>
                <p className="text-gray-600">
                  {searchTerm
                    ? "No hotels match your search criteria."
                    : "No hotels have been registered yet."}
                </p>
                <button
                  onClick={handleRefresh}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Refresh List
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 bg-gray-50 font-semibold text-sm">
                <div className="col-span-3">Hotel Details</div>
                <div className="col-span-2">Owner Info</div>
                <div className="col-span-2">Contact</div>
                <div className="col-span-2">Capacity</div>
                <div className="col-span-2">Registration</div>
                <div className="col-span-1">Actions</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {hotels.map((hotel) => (
                  <div
                    key={hotel._id}
                    className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* Hotel Details */}
                    <div className="col-span-3">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {hotel.name}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {hotel.accommodationType}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {formatAddress(hotel.address)}
                          </p>
                          <div className="flex items-center mt-1">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                hotel.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {hotel.isActive ? "Active" : "Inactive"}
                            </span>
                            {hotel.isVerified && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2">
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Owner Info */}
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <span className="text-sm text-gray-900 block">
                            {hotel.ownerName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {hotel.ownerAadharNumber}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="col-span-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {hotel.ownerPhone}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-500 truncate">
                            {hotel.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Capacity */}
                    <div className="col-span-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Bed className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {hotel.numberOfRooms} rooms
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          GST: {hotel.gstNumber}
                        </div>
                      </div>
                    </div>

                    {/* Registration */}
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2 mb-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {formatDate(hotel.registrationDate)}
                        </span>
                      </div>
                      {hotel.registeredByPolice && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Police Registered
                        </span>
                      )}
                      {hotel.policeOfficer?.name && (
                        <p className="text-xs text-gray-500 mt-1">
                          By: {hotel.policeOfficer.name}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-1">
                      <button
                        onClick={() => handleViewHotel(hotel)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <div className="text-sm text-gray-600">
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
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-sm text-gray-900">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hotel Details Modal */}
        {selectedHotel && (
          <HotelDetailsModal
            hotel={selectedHotel}
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
              setSelectedHotel(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default HotelList;
