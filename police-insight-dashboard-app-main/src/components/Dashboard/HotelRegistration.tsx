// src/pages/HotelRegistration.tsx
import React, { useState, useEffect } from "react";
import {
  Building,
  Mail,
  Lock,
  User,
  Phone,
  Bed,
  IndianRupee,
  MapPin,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  ownerName: string;
  numberOfRooms: string;
  roomRate: string;
  address: string;
}

interface MessageState {
  type: "success" | "error" | "";
  text: string;
}

// ✅ Define proper TypeScript interface for police auth
interface PoliceAuth {
  token?: string;
  policeId?: string;
  officerId?: string;
  police?: {
    id: string;
    name: string;
    badgeNumber: string;
    station: string;
    rank: string;
  };
  role?: string;
  loginTime?: number;
}

const HotelRegistration: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<MessageState>({ type: "", text: "" });

  const [registerForm, setRegisterForm] = useState<RegisterFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    ownerName: "",
    numberOfRooms: "",
    roomRate: "",
    address: "",
  });

  // ✅ Add useEffect to debug localStorage on component mount
  useEffect(() => {
    console.log("=== LOGIN STATUS DEBUG ===");
    console.log("localStorage keys:", Object.keys(localStorage));
    console.log("sessionStorage keys:", Object.keys(sessionStorage));

    // Check all possible storage locations
    console.log(
      "police-dashboard-auth (localStorage):",
      localStorage.getItem("police-dashboard-auth")
    );
    console.log(
      "police-dashboard-auth (sessionStorage):",
      sessionStorage.getItem("police-dashboard-auth")
    );
    console.log(
      "policeToken (localStorage):",
      localStorage.getItem("policeToken")
    );
    console.log(
      "policeToken (sessionStorage):",
      sessionStorage.getItem("policeToken")
    );

    console.log("=== END DEBUG ===");
  }, []);

  // Handle form changes
  const handleRegisterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
  };

  // Validation functions
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    return /^[0-9]{10}$/.test(phone.replace(/\D/g, ""));
  };

  // ✅ Corrected handle registration with proper authentication
  const handleRegister = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    // Debug all storage options
    console.log("=== STORAGE DEBUG ===");
    console.log(
      "localStorage police-dashboard-auth:",
      localStorage.getItem("police-dashboard-auth")
    );
    console.log(
      "sessionStorage police-dashboard-auth:",
      sessionStorage.getItem("police-dashboard-auth")
    );
    console.log(
      "localStorage policeToken:",
      localStorage.getItem("policeToken")
    );
    console.log(
      "sessionStorage policeToken:",
      sessionStorage.getItem("policeToken")
    );

    // Try both storage options
    let policeAuthRaw =
      localStorage.getItem("police-dashboard-auth") ||
      sessionStorage.getItem("police-dashboard-auth");

    let token =
      localStorage.getItem("policeToken") ||
      sessionStorage.getItem("policeToken");

    if (!policeAuthRaw && !token) {
      setMessage({
        type: "error",
        text: "Please log in as a police officer first. No authentication data found.",
      });
      setLoading(false);
      return;
    }

    // ✅ Proper typing with interface
    let policeAuth: PoliceAuth = {};
    if (policeAuthRaw) {
      try {
        policeAuth = JSON.parse(policeAuthRaw) as PoliceAuth;
      } catch (error) {
        console.error("Error parsing auth data:", error);
      }
    }

    // Use token from either source
    const authToken = policeAuth.token || token;

    if (!authToken) {
      setMessage({
        type: "error",
        text: "No authentication token found. Please log in again.",
      });
      setLoading(false);
      return;
    }

    console.log("Using token:", authToken.substring(0, 20) + "...");
    console.log("Police data:", policeAuth);

    // Destructure form data
    const {
      name,
      email,
      password,
      confirmPassword,
      phone,
      ownerName,
      numberOfRooms,
      roomRate,
      address,
    } = registerForm;

    // Validation
    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword ||
      !phone ||
      !ownerName ||
      !numberOfRooms ||
      !roomRate
    ) {
      setMessage({ type: "error", text: "Please fill in all required fields" });
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setMessage({ type: "error", text: "Please enter a valid email address" });
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters long",
      });
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      setLoading(false);
      return;
    }

    if (!validatePhone(phone)) {
      setMessage({
        type: "error",
        text: "Please enter a valid 10-digit phone number",
      });
      setLoading(false);
      return;
    }

    if (parseInt(numberOfRooms) < 1) {
      setMessage({ type: "error", text: "Number of rooms must be at least 1" });
      setLoading(false);
      return;
    }

    if (parseFloat(roomRate) < 0) {
      setMessage({
        type: "error",
        text: "Room rate must be a positive number",
      });
      setLoading(false);
      return;
    }

    try {
      // Remove confirmPassword before sending
      const { confirmPassword: _, ...registerData } = registerForm;

      console.log(
        "Making API call with token:",
        authToken.substring(0, 20) + "..."
      );

      const response = await fetch(
        "http://localhost:5000/api/hotels/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            ...registerData,
            numberOfRooms: parseInt(numberOfRooms),
            roomRate: parseFloat(roomRate),
            registeredByPolice: true,
            policeOfficerId: policeAuth.policeId || policeAuth.officerId,
            // Pass additional police info if available
            policeOfficerInfo: {
              id: policeAuth.policeId || policeAuth.officerId,
              name: policeAuth.police?.name,
              badgeNumber: policeAuth.police?.badgeNumber,
              station: policeAuth.police?.station,
              rank: policeAuth.police?.rank,
            },
          }),
        }
      );

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Hotel registered successfully!",
        });
        // Clear form
        setRegisterForm({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          phone: "",
          ownerName: "",
          numberOfRooms: "",
          roomRate: "",
          address: "",
        });
      } else {
        setMessage({
          type: "error",
          text: data.error || `Registration failed (${response.status})`,
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      setMessage({ type: "error", text: "Network error. Please try again." });
    }

    setLoading(false);
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Register New Hotel
          </h1>
          <p className="text-gray-600">
            Register a new accommodation facility in the system
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Message Display */}
          {message.text && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2" />
              )}
              {message.text}
            </div>
          )}

          {/* Registration Form */}
          <div className="space-y-6">
            {/* Hotel Name and Owner Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hotel Name *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="name"
                    value={registerForm.name}
                    onChange={handleRegisterChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Grand Hotel"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="ownerName"
                    value={registerForm.ownerName}
                    onChange={handleRegisterChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={registerForm.email}
                  onChange={handleRegisterChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="hotel@example.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  name="phone"
                  value={registerForm.phone}
                  onChange={handleRegisterChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1234567890"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Number of Rooms and Room Rate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Rooms *
                </label>
                <div className="relative">
                  <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    name="numberOfRooms"
                    value={registerForm.numberOfRooms}
                    onChange={handleRegisterChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="25"
                    min="1"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Rate (₹/night) *
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    name="roomRate"
                    value={registerForm.roomRate}
                    onChange={handleRegisterChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2500"
                    min="0"
                    step="0.01"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <textarea
                  name="address"
                  value={registerForm.address}
                  onChange={handleRegisterChange}
                  rows={3}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Complete hotel address..."
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    name="password"
                    value={registerForm.password}
                    onChange={handleRegisterChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Minimum 6 characters"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={registerForm.confirmPassword}
                    onChange={handleRegisterChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm password"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Registering Hotel...
                  </div>
                ) : (
                  "Register Hotel"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelRegistration;
