// src/api/hotelAuth.ts (create this file if you want to organize API calls)
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  ownerName: string;
  numberOfRooms: number;
  roomRate: number;
}

export interface AuthResponse {
  token: string;
  hotel: {
    _id: string;
    name: string;
    email: string;
    ownerName: string;
    phone: string;
    numberOfRooms: number;
    roomRate: number;
  };
}

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const hotelAuth = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/hotels/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    return response.json();
  },

  register: async (
    data: RegisterData
  ): Promise<{ message: string; hotel: any }> => {
    const response = await fetch(`${API_BASE_URL}/api/hotels/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Registration failed");
    }

    return response.json();
  },

  // Utility function to get stored token
  getToken: (): string | null => {
    return localStorage.getItem("hotelToken");
  },

  // Utility function to get stored hotel data
  getHotelData: (): any | null => {
    const data = localStorage.getItem("hotelData");
    return data ? JSON.parse(data) : null;
  },

  // Utility function to clear auth data
  logout: (): void => {
    localStorage.removeItem("hotelToken");
    localStorage.removeItem("hotelData");
  },
};
