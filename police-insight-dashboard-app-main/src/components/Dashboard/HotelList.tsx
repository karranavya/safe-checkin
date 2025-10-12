// src/components/Dashboard/HotelList.tsx - UPDATED with Phone Number Update Feature
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
  Shield,
  Clock,
  AlertCircle,
  Edit,
  Save,
  RefreshCw,
} from "lucide-react";

// Updated interface to match new schema with verification status
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
  verificationStatus: "verified" | "pending" | "unverified";
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

// Updated helper function to get verification status info
const getVerificationStatusInfo = (hotel: Hotel) => {
  const status = hotel.verificationStatus || "pending";

  const statusConfig = {
    verified: {
      label: "Verified",
      color: "bg-green-100 text-green-800",
      icon: Shield,
    },
    pending: {
      label: "Pending",
      color: "bg-yellow-100 text-yellow-800",
      icon: Clock,
    },
    unverified: {
      label: "Unverified",
      color: "bg-red-100 text-red-800",
      icon: AlertCircle,
    },
  };

  return {
    status,
    ...statusConfig[status],
    isVerified: status === "verified",
  };
};

// Modal component for viewing hotel details with status and phone update
const HotelDetailsModal: React.FC<{
  hotel: Hotel;
  isOpen: boolean;
  onClose: () => void;
  onHotelUpdate: (hotelId: string, updates: any) => Promise<void>;
}> = ({ hotel, isOpen, onClose, onHotelUpdate }) => {
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(
    hotel.verificationStatus
  );
  const [statusNotes, setStatusNotes] = useState(hotel.verificationNotes || "");
  const [ownerName, setOwnerName] = useState(hotel.ownerName);
  const [ownerPhone, setOwnerPhone] = useState(hotel.ownerPhone);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  if (!isOpen) return null;

  const verificationInfo = getVerificationStatusInfo(hotel);
  const StatusIcon = verificationInfo.icon;

  const statusOptions = [
    {
      value: "verified",
      label: "Verified",
      color: "bg-green-100 text-green-800",
      icon: Shield,
      description: "All documents verified and approved",
    },
    {
      value: "pending",
      label: "Pending Verification",
      color: "bg-yellow-100 text-yellow-800",
      icon: Clock,
      description: "Documents under review, verification pending",
    },
    {
      value: "unverified",
      label: "Unverified",
      color: "bg-red-100 text-red-800",
      icon: AlertCircle,
      description: "Documents not verified or issues found",
    },
  ];

  const validatePhone = (phone: string): boolean => {
    return /^[0-9]{10}$/.test(phone.replace(/\D/g, ""));
  };

  const handleStatusUpdate = async () => {
    if (
      selectedStatus === hotel.verificationStatus &&
      statusNotes === (hotel.verificationNotes || "")
    ) {
      setIsEditingStatus(false);
      return;
    }

    setIsUpdating(true);
    setUpdateError("");

    try {
      await onHotelUpdate(hotel._id, {
        type: "status",
        verificationStatus: selectedStatus,
        verificationNotes: statusNotes,
      });
      setIsEditingStatus(false);
    } catch (error) {
      setUpdateError(
        error instanceof Error ? error.message : "Failed to update status"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOwnerUpdate = async () => {
    if (ownerName === hotel.ownerName && ownerPhone === hotel.ownerPhone) {
      setIsEditingOwner(false);
      return;
    }

    if (!ownerName.trim()) {
      setUpdateError("Owner name is required");
      return;
    }

    if (!validatePhone(ownerPhone)) {
      setUpdateError("Please enter a valid 10-digit phone number");
      return;
    }

    setIsUpdating(true);
    setUpdateError("");

    try {
      await onHotelUpdate(hotel._id, {
        type: "owner",
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim(),
      });
      setIsEditingOwner(false);
    } catch (error) {
      setUpdateError(
        error instanceof Error
          ? error.message
          : "Failed to update owner information"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusCancel = () => {
    setSelectedStatus(hotel.verificationStatus);
    setStatusNotes(hotel.verificationNotes || "");
    setIsEditingStatus(false);
    setUpdateError("");
  };

  const handleOwnerCancel = () => {
    setOwnerName(hotel.ownerName);
    setOwnerPhone(hotel.ownerPhone);
    setIsEditingOwner(false);
    setUpdateError("");
  };

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
          {/* Update Error */}
          {updateError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
              <span>{updateError}</span>
              <button
                onClick={() => setUpdateError("")}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}

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

            {/* UPDATED: Owner Information with Edit Capability */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Owner Information
                </h3>
                {!isEditingOwner && (
                  <button
                    onClick={() => setIsEditingOwner(true)}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Update Owner Info"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
              </div>

              {!isEditingOwner ? (
                // Display Mode
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {hotel.ownerName}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span>{" "}
                    {hotel.ownerPhone}
                  </div>
                  <div>
                    <span className="font-medium">Aadhar:</span>{" "}
                    {hotel.ownerAadharNumber}
                  </div>
                </div>
              ) : (
                // Edit Mode
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Owner Name
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Enter owner name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="10-digit phone number"
                      maxLength={10}
                    />
                  </div>

                  <div>
                    <span className="text-sm text-gray-600">
                      <span className="font-medium">Aadhar:</span>{" "}
                      {hotel.ownerAadharNumber} (cannot be changed)
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-3 pt-2">
                    <button
                      onClick={handleOwnerUpdate}
                      disabled={isUpdating}
                      className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      {isUpdating ? (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3 mr-1" />
                          Update
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleOwnerCancel}
                      disabled={isUpdating}
                      className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
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

            {/* Verification Status Section (same as before) */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Verification Status
                </h3>
                {!isEditingStatus && (
                  <button
                    onClick={() => setIsEditingStatus(true)}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Update Status"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
              </div>

              {!isEditingStatus ? (
                // Display Mode
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="font-medium">Status:</span>
                    <div className="ml-2 flex items-center">
                      <StatusIcon className="w-4 h-4 mr-1" />
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${verificationInfo.color}`}
                      >
                        {verificationInfo.label}
                      </span>
                    </div>
                  </div>
                  {hotel.registeredByPolice && (
                    <div>
                      <span className="font-medium">Registration Type:</span>
                      <span className="ml-2 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        Police Registered
                      </span>
                    </div>
                  )}
                  {hotel.verifiedAt && (
                    <div>
                      <span className="font-medium">Verified At:</span>{" "}
                      {new Date(hotel.verifiedAt).toLocaleDateString("en-IN")}
                    </div>
                  )}
                  {hotel.verificationNotes && (
                    <div>
                      <span className="font-medium">Notes:</span>{" "}
                      <span className="text-gray-600">
                        {hotel.verificationNotes}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                // Edit Mode (same as before)
                <div className="space-y-4">
                  {/* Status Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Update Verification Status
                    </label>
                    <div className="space-y-2">
                      {statusOptions.map((option) => {
                        const OptionIcon = option.icon;
                        return (
                          <div
                            key={option.value}
                            className={`relative border rounded-lg p-3 cursor-pointer transition-all ${
                              selectedStatus === option.value
                                ? `${option.color} ring-2 ring-opacity-20 border-transparent`
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() =>
                              setSelectedStatus(
                                option.value as
                                  | "verified"
                                  | "pending"
                                  | "unverified"
                              )
                            }
                          >
                            <div className="flex items-start">
                              <input
                                type="radio"
                                name="verificationStatus"
                                value={option.value}
                                checked={selectedStatus === option.value}
                                onChange={() =>
                                  setSelectedStatus(
                                    option.value as
                                      | "verified"
                                      | "pending"
                                      | "unverified"
                                  )
                                }
                                className="mt-1 mr-3"
                              />
                              <div className="flex-1">
                                <div className="flex items-center mb-1">
                                  <OptionIcon
                                    className={`w-4 h-4 mr-2 ${
                                      selectedStatus === option.value
                                        ? ""
                                        : "text-gray-400"
                                    }`}
                                  />
                                  <span className="font-medium text-sm">
                                    {option.label}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600">
                                  {option.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Notes (Optional)
                    </label>
                    <textarea
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                      placeholder="Add notes about the verification decision..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-3 pt-2">
                    <button
                      onClick={handleStatusUpdate}
                      disabled={isUpdating}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      {isUpdating ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Update Status
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleStatusCancel}
                      disabled={isUpdating}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
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

  // UPDATED: Handle both status and owner info updates
  const handleHotelUpdate = async (hotelId: string, updates: any) => {
    try {
      const token =
        sessionStorage.getItem("policeToken") ||
        localStorage.getItem("policeToken");

      if (!token) {
        throw new Error("Authentication required. Please login again.");
      }

      let endpoint = "";
      let payload = {};

      if (updates.type === "status") {
        endpoint = `http://localhost:5000/api/hotels/${hotelId}/verification-status`;
        payload = {
          verificationStatus: updates.verificationStatus,
          verificationNotes: updates.verificationNotes,
        };
      } else if (updates.type === "owner") {
        endpoint = `http://localhost:5000/api/hotels/${hotelId}/owner-info`;
        payload = {
          ownerName: updates.ownerName,
          ownerPhone: updates.ownerPhone,
        };
      }

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update ${updates.type}`);
      }

      // Update the hotel in the local state
      setHotels((prevHotels) =>
        prevHotels.map((hotel) =>
          hotel._id === hotelId
            ? {
                ...hotel,
                ...(updates.type === "status" && {
                  verificationStatus: updates.verificationStatus,
                  verificationNotes: updates.verificationNotes,
                  verifiedAt:
                    updates.verificationStatus === "verified"
                      ? new Date().toISOString()
                      : hotel.verifiedAt,
                  isVerified: updates.verificationStatus === "verified",
                }),
                ...(updates.type === "owner" && {
                  ownerName: updates.ownerName,
                  ownerPhone: updates.ownerPhone,
                }),
              }
            : hotel
        )
      );

      // Update selected hotel if it's the one being updated
      if (selectedHotel && selectedHotel._id === hotelId) {
        setSelectedHotel((prev) =>
          prev
            ? {
                ...prev,
                ...(updates.type === "status" && {
                  verificationStatus: updates.verificationStatus,
                  verificationNotes: updates.verificationNotes,
                  verifiedAt:
                    updates.verificationStatus === "verified"
                      ? new Date().toISOString()
                      : prev.verifiedAt,
                  isVerified: updates.verificationStatus === "verified",
                }),
                ...(updates.type === "owner" && {
                  ownerName: updates.ownerName,
                  ownerPhone: updates.ownerPhone,
                }),
              }
            : null
        );
      }
    } catch (error) {
      throw error;
    }
  };

  // ... (keep all existing functions the same: fetchHotels, handleSearch, etc.)

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
                {hotels.map((hotel) => {
                  const verificationInfo = getVerificationStatusInfo(hotel);
                  const StatusIcon = verificationInfo.icon;

                  return (
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
                            <div className="flex items-center mt-1 flex-wrap gap-1">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  hotel.isActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {hotel.isActive ? "Active" : "Inactive"}
                              </span>
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${verificationInfo.color}`}
                              >
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {verificationInfo.label}
                              </span>
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
                        <div className="flex flex-wrap gap-1 mb-1">
                          {hotel.registeredByPolice && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Police Registered
                            </span>
                          )}
                        </div>
                        {hotel.policeOfficer?.name && (
                          <p className="text-xs text-gray-500">
                            By: {hotel.policeOfficer.name}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="col-span-1">
                        <button
                          onClick={() => handleViewHotel(hotel)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details & Update Info"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
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

        {/* Hotel Details Modal with Update Capabilities */}
        {selectedHotel && (
          <HotelDetailsModal
            hotel={selectedHotel}
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
              setSelectedHotel(null);
            }}
            onHotelUpdate={handleHotelUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default HotelList;
