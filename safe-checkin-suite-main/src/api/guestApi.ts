// src/api/guestApi.ts - Updated with proper FormData handling
import axios from "axios";
import { Guest } from "@/components/dashboard/GuestTable";

const API_BASE = "http://localhost:5000/api/guests";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("hotelToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData - let browser handle it
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
      config.timeout = 120000;
    } else {
      config.headers["Content-Type"] = "application/json";
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
      localStorage.removeItem("hotelToken");
      localStorage.removeItem("hotelData");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// UPDATED: Check-in function to handle FormData properly
export const checkInGuest = async (formData: FormData | any) => {
  try {
    console.log("=== CheckIn API Call ===");

    // Create custom config for file uploads
    const config = {
      timeout: formData instanceof FormData ? 120000 : 30000, // 2 min for files, 30s for regular
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    };

    if (formData instanceof FormData) {
      console.log("Sending FormData with files...");

      // Log FormData contents for debugging
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File - ${value.name} (${value.size} bytes)`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      const response = await api.post("/checkin", formData, config);
      return response.data;
    } else {
      console.log("Sending JSON data...");
      const response = await api.post("/checkin", formData, config);
      return response.data;
    }
  } catch (error: any) {
    console.error("=== CheckIn API Error ===");
    console.error("Full error:", error);

    if (error.code === "ECONNABORTED") {
      console.error("Request timeout - file upload took too long");
    }

    throw error;
  }
};

// Keep all other existing functions unchanged...
export const fetchGuestById = async (id: string) => {
  const response = await api.get(`/${id}`);
  return response.data.data;
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

  let data, pagination;

  if (response.data.success) {
    data = response.data.guests;
    pagination = response.data.pagination;
  } else if (Array.isArray(response.data)) {
    data = response.data;
    pagination = {};
  } else if (response.data.guests) {
    data = response.data.guests;
    pagination = response.data.pagination;
  } else {
    data = response.data;
    pagination = {};
  }

  if (!Array.isArray(data)) {
    console.warn("Data is not an array, converting to empty array");
    data = [];
  }

  const transformedData = data.map((guest: any) => ({
    id: guest._id,
    _id: guest._id,
    name: guest.name || guest.guests?.[0]?.name || "Unknown Guest",
    phone: guest.phone,
    email: guest.email || "No email provided",
    nationality:
      guest.nationality?.charAt(0).toUpperCase() + guest.nationality?.slice(1),
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
    photos: guest.photos, // Add photos support
  }));

  return { guests: transformedData, pagination: pagination || {} };
};

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
    return response.data;
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

export const deleteGuest = async (guestId: string) => {
  try {
    const response = await api.delete(`/${guestId}`);
    return response.data;
  } catch (error) {
    throw new Error("Failed to delete guest");
  }
};
