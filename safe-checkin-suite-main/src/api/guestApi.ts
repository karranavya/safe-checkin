// src/api/guestApi.ts
import axios from "axios";
import { Guest } from "@/components/dashboard/GuestTable";

const API_BASE = "http://localhost:5000/api/guests";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("hotelToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling and auth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);

    // Handle authentication errors
    if (error.response?.status === 401) {
      // Clear stored auth data
      localStorage.removeItem("hotelToken");
      localStorage.removeItem("hotelData");

      // Redirect to login page
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// Guest API functions with updated response handling
export const fetchGuestById = async (id: string) => {
  const response = await api.get(`/${id}`);
  return response.data.data; // Backend returns { success: true, data: guest }
};

export const fetchGuests = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
  roomNumber?: string;
}): Promise<{ guests: Guest[]; pagination: any }> => {
  const queryParams = new URLSearchParams();

  if (params?.status) queryParams.append("status", params.status);
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.search) queryParams.append("search", params.search);
  if (params?.roomNumber) queryParams.append("roomNumber", params.roomNumber);

  const response = await api.get(`/?${queryParams.toString()}`);

  console.log("Full API response:", response.data);

  // Handle different possible response structures
  let data, pagination;

  if (response.data.success) {
    // If backend returns { success: true, guests: [...], pagination: {...} }
    data = response.data.guests;
    pagination = response.data.pagination;
  } else if (Array.isArray(response.data)) {
    // If backend returns array directly
    data = response.data;
    pagination = {};
  } else if (response.data.guests) {
    // If backend returns { guests: [...], pagination: {...} }
    data = response.data.guests;
    pagination = response.data.pagination;
  } else {
    // Fallback - assume the response.data is the array
    data = response.data;
    pagination = {};
  }

  console.log("Extracted data:", data);
  console.log("Data type:", typeof data, "Is array:", Array.isArray(data));

  // Ensure data is an array
  if (!Array.isArray(data)) {
    console.warn("Data is not an array, converting to empty array");
    data = [];
  }

  // Transform MongoDB data to Guest interface
  const transformedData = data.map((guest: any) => {
    console.log("Processing guest:", guest);

    return {
      id: guest._id,
      _id: guest._id,
      name: guest.name || guest.guests?.[0]?.name || "Unknown Guest",
      phone: guest.phone,
      email: guest.email || "No email provided",
      nationality:
        guest.nationality?.charAt(0).toUpperCase() +
        guest.nationality?.slice(1),
      roomNumber: guest.roomNumber,
      checkInDate: new Date(guest.checkInTime).toISOString().split("T")[0],
      checkInTime: guest.checkInTime,
      checkOutDate: guest.checkOutDate
        ? new Date(guest.checkOutDate).toISOString().split("T")[0]
        : undefined,
      status: guest.status || "checked-in",
      purposeOfVisit:
        guest.purpose?.charAt(0).toUpperCase() + guest.purpose?.slice(1),
      purpose: guest.purpose,
      referenceNumber: guest.referenceNumber,
      totalGuests: guest.guestCount,
      guestCount: guest.guestCount,
      maleGuests: guest.maleGuests,
      femaleGuests: guest.femaleGuests,
      childGuests: guest.childGuests,
      bookingMode: guest.bookingMode,
      bookingWebsite: guest.bookingWebsite,
      totalAmount: guest.totalAmount,
      advanceAmount: guest.advanceAmount,
      balanceAmount: guest.balanceAmount,
      notes: guest.notes,
    };
  });

  console.log("Transformed data:", transformedData);
  return { guests: transformedData, pagination: pagination || {} };
};
export const checkInGuest = async (guestData: any) => {
  const response = await api.post("/checkin", guestData);
  return response.data; // Backend returns { success: true, message: "...", data: guest }
};

export const checkOutGuest = async (
  guestId: string,
  checkoutData?: {
    checkOutDate?: string;
    finalAmount?: number;
    notes?: string;
  }
) => {
  try {
    const response = await api.put(`/${guestId}/checkout`, checkoutData || {});
    return response.data;
  } catch (error) {
    throw new Error("Failed to check out guest");
  }
};

export const updateGuest = async (
  guestId: string,
  guestData: Partial<Guest>
) => {
  try {
    const response = await api.put(`/${guestId}`, guestData);
    return response.data;
  } catch (error) {
    throw new Error("Failed to update guest");
  }
};

// Updated validation functions to work with new backend API
export const validateUniqueness = async (params: {
  phone?: string;
  idNumber?: string;
  excludeId?: string;
}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.phone) queryParams.append("phone", params.phone);
    if (params.idNumber) queryParams.append("idNumber", params.idNumber);
    if (params.excludeId) queryParams.append("excludeId", params.excludeId);

    const response = await api.get(`/validate?${queryParams.toString()}`);
    return response.data; // Backend returns { success: true, isUnique: boolean, conflictType: string, existingGuest: object }
  } catch (error) {
    console.error("Error validating uniqueness:", error);
    throw error;
  }
};

export const checkGuestByRoom = async (
  roomNumber: string,
  status = "checked-in"
) => {
  try {
    const response = await api.get(
      `/room?roomNumber=${roomNumber}&status=${status}`
    );
    return response.data;
  } catch (error) {
    console.error("Error checking room:", error);
    throw error;
  }
};

export const getAllGuestsByRoom = async (status = "checked-in") => {
  try {
    const response = await api.get(`/all-by-room?status=${status}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching guests by room:", error);
    throw error;
  }
};

// Legacy function for backward compatibility
export const deleteGuest = async (guestId: string) => {
  try {
    // Note: Delete functionality might not be implemented in backend
    // Consider using status update instead
    const response = await api.delete(`/${guestId}`);
    return response.data;
  } catch (error) {
    throw new Error("Failed to delete guest");
  }
};
