// src/pages/HotelRegistration.tsx - ADDED: Google Maps-style location search with auto-fill
import React, { useState, useEffect, useRef } from "react";
import {
  Building,
  Mail,
  Lock,
  User,
  Phone,
  Bed,
  MapPin,
  CheckCircle,
  AlertCircle,
  FileText,
  CreditCard,
  MapIcon,
  Shield,
  Clock,
  X,
  Search,
} from "lucide-react";

interface RegisterFormData {
  name: string;
  accommodationType: string;
  email: string;
  password: string;
  confirmPassword: string;
  ownerName: string;
  ownerPhone: string;
  ownerAadharNumber: string;
  numberOfRooms: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  gstNumber: string;
  labourLicenceNumber: string;
  hotelLicenceNumber: string;
  verificationStatus: "verified" | "pending" | "unverified";
  verificationNotes: string;
}

interface MessageState {
  type: "success" | "error" | "";
  text: string;
}

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

// Shape of a single Nominatim search result (only the fields we use)
interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
  };
}

const HotelRegistration: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<MessageState>({ type: "", text: "" });
  const [currentStep, setCurrentStep] = useState<number>(1);

  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [locationCapturing, setLocationCapturing] = useState(false);

  // ✅ NEW — location search (Google Maps-style autocomplete using OpenStreetMap)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const skipSearchRef = useRef(false); // prevents re-searching right after picking a result

  const [registerForm, setRegisterForm] = useState<RegisterFormData>({
    name: "",
    accommodationType: "Hotel",
    email: "",
    password: "",
    confirmPassword: "",
    ownerName: "",
    ownerPhone: "",
    ownerAadharNumber: "",
    numberOfRooms: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "India",
    },
    gstNumber: "",
    labourLicenceNumber: "",
    hotelLicenceNumber: "",
    verificationStatus: "pending",
    verificationNotes: "",
  });

  // Indian states for dropdown
  const indianStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
  ];

  const verificationStatusOptions = [
    {
      value: "verified",
      label: "Verified",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      description: "All documents verified and approved",
    },
    {
      value: "pending",
      label: "Pending Verification",
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      description: "Documents under review, verification pending",
    },
    {
      value: "unverified",
      label: "Unverified",
      icon: X,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      description: "Documents not verified or issues found",
    },
  ];

  useEffect(() => {
    console.log("=== LOGIN STATUS DEBUG ===");
    console.log("localStorage keys:", Object.keys(localStorage));
    console.log("sessionStorage keys:", Object.keys(sessionStorage));
  }, []);

  // ✅ NEW — debounced search against OpenStreetMap's Nominatim API.
  // Waits 500ms after typing stops, requires 3+ characters, restricted to India.
  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }

    if (!searchQuery || searchQuery.trim().length < 3) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(() => {
      searchLocation(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const searchLocation = async (query: string) => {
    setSearchLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=in&limit=5&q=${encodeURIComponent(
          query,
        )}`,
      );
      const data: NominatimResult[] = await res.json();
      setSearchResults(data);
      setShowDropdown(data.length > 0);
    } catch (err) {
      console.error("Location search failed:", err);
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setSearchLoading(false);
    }
  };

  // Matches a free-text state name from Nominatim against our fixed
  // dropdown list (the <select> needs an exact string match to show correctly).
  const matchIndianState = (stateName?: string): string => {
    if (!stateName) return "";
    const found = indianStates.find(
      (s) => s.toLowerCase() === stateName.toLowerCase(),
    );
    return found || "";
  };

  // ✅ NEW — when an officer picks a search result, auto-fill every
  // address field AND the GPS coordinates in one go.
  const selectSearchResult = (result: NominatimResult) => {
    const addr = result.address || {};

    const street =
      [addr.house_number, addr.road || addr.suburb].filter(Boolean).join(" ") ||
      result.display_name.split(",")[0];

    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.suburb ||
      addr.county ||
      "";
    const state = matchIndianState(addr.state);
    const zipCode = addr.postcode || "";

    setRegisterForm((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        street,
        city,
        state,
        zipCode,
      },
    }));

    setCoordinates([parseFloat(result.lon), parseFloat(result.lat)]);

    skipSearchRef.current = true; // avoid re-triggering search on the next line
    setSearchQuery(result.display_name);
    setSearchResults([]);
    setShowDropdown(false);

    setMessage({
      type: "success",
      text: "Address auto-filled from search — please double-check the fields below, then continue.",
    });
  };

  // Handle form changes
  const handleRegisterChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setRegisterForm((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setRegisterForm({ ...registerForm, [name]: value });
    }
  };

  // Validation functions
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    return /^[0-9]{10}$/.test(phone.replace(/\D/g, ""));
  };

  const validateAadhar = (aadhar: string): boolean => {
    return /^\d{12}$/.test(aadhar.replace(/\s/g, ""));
  };

  const validateGST = (gst: string): boolean => {
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
      gst.toUpperCase(),
    );
  };

  const validateZipCode = (zip: string): boolean => {
    return /^\d{6}$/.test(zip);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage({
        type: "error",
        text: "Geolocation is not supported by this browser.",
      });
      return;
    }

    setLocationCapturing(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates([longitude, latitude]);
        setLocationCapturing(false);
        setMessage({
          type: "success",
          text: `Location captured: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        });
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocationCapturing(false);
        setMessage({
          type: "error",
          text: "Unable to get location. Please enable location services and try again.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleRegister = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

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

    let policeAuth: PoliceAuth = {};
    if (policeAuthRaw) {
      try {
        policeAuth = JSON.parse(policeAuthRaw) as PoliceAuth;
      } catch (error) {
        console.error("Error parsing auth data:", error);
      }
    }

    const authToken = policeAuth.token || token;

    if (!authToken) {
      setMessage({
        type: "error",
        text: "No authentication token found. Please log in again.",
      });
      setLoading(false);
      return;
    }

    const {
      name,
      accommodationType,
      email,
      password,
      confirmPassword,
      ownerName,
      ownerPhone,
      ownerAadharNumber,
      numberOfRooms,
      address,
      gstNumber,
      labourLicenceNumber,
      hotelLicenceNumber,
      verificationStatus,
      verificationNotes,
    } = registerForm;

    if (
      !name ||
      !accommodationType ||
      !email ||
      !password ||
      !confirmPassword ||
      !ownerName ||
      !ownerPhone ||
      !ownerAadharNumber ||
      !numberOfRooms ||
      !address.street ||
      !address.city ||
      !address.state ||
      !address.zipCode ||
      !gstNumber ||
      !labourLicenceNumber ||
      !hotelLicenceNumber ||
      !verificationStatus
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

    if (!validatePhone(ownerPhone)) {
      setMessage({
        type: "error",
        text: "Please enter a valid 10-digit owner phone number",
      });
      setLoading(false);
      return;
    }

    if (!validateAadhar(ownerAadharNumber)) {
      setMessage({
        type: "error",
        text: "Please enter a valid 12-digit Aadhar number",
      });
      setLoading(false);
      return;
    }

    if (!validateGST(gstNumber)) {
      setMessage({
        type: "error",
        text: "Please enter a valid GST number",
      });
      setLoading(false);
      return;
    }

    if (!validateZipCode(address.zipCode)) {
      setMessage({
        type: "error",
        text: "Please enter a valid 6-digit PIN code",
      });
      setLoading(false);
      return;
    }

    if (parseInt(numberOfRooms) < 1) {
      setMessage({ type: "error", text: "Number of rooms must be at least 1" });
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword: _, ...registerData } = registerForm;

      const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/hotels/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            ...registerData,
            address: {
              ...registerData.address,
              fullAddress: fullAddress,
            },
            numberOfRooms: parseInt(numberOfRooms),
            location: coordinates ? { type: "Point", coordinates } : undefined,
            registeredByPolice: true,
            isVerified: verificationStatus === "verified",
            verificationStatus: verificationStatus,
            verificationNotes: verificationNotes || undefined,
            verifiedAt:
              verificationStatus === "verified"
                ? new Date().toISOString()
                : undefined,
            policeOfficerId: policeAuth.policeId || policeAuth.officerId,
            policeOfficerInfo: {
              id: policeAuth.policeId || policeAuth.officerId,
              name: policeAuth.police?.name,
              badgeNumber: policeAuth.police?.badgeNumber,
              station: policeAuth.police?.station,
              rank: policeAuth.police?.rank,
            },
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: `Hotel registered successfully with ${verificationStatus} status!`,
        });
        setRegisterForm({
          name: "",
          accommodationType: "Hotel",
          email: "",
          password: "",
          confirmPassword: "",
          ownerName: "",
          ownerPhone: "",
          ownerAadharNumber: "",
          numberOfRooms: "",
          address: {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: "India",
          },
          gstNumber: "",
          labourLicenceNumber: "",
          hotelLicenceNumber: "",
          verificationStatus: "pending",
          verificationNotes: "",
        });
        setCoordinates(null);
        setSearchQuery("");
        setCurrentStep(1);
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

  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Register New Hotel
          </h1>
          <p className="text-gray-600">
            Complete registration for accommodation facility with all required
            documentation and verification status
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`flex items-center ${step < 5 ? "flex-1" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step}
                </div>
                {step < 5 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      currentStep > step ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Basic Info</span>
            <span>Address</span>
            <span>Legal Docs</span>
            <span>Verification</span>
            <span>Review</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
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

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Basic Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accommodation Name *
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
                    Accommodation Type *
                  </label>
                  <select
                    name="accommodationType"
                    value={registerForm.accommodationType}
                    onChange={handleRegisterChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  >
                    <option value="Hotel">Hotel</option>
                    <option value="Lodge">Lodge</option>
                    <option value="Guest House">Guest House</option>
                    <option value="Resort">Resort</option>
                    <option value="Homestay">Homestay</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Owner Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      name="ownerPhone"
                      value={registerForm.ownerPhone}
                      onChange={handleRegisterChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="9876543210"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Aadhar Card Number *
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="ownerAadharNumber"
                    value={registerForm.ownerAadharNumber}
                    onChange={handleRegisterChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123456789012"
                    maxLength={12}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

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
            </div>
          )}

          {/* Step 2: Address Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Address Information
                </h2>
                <div className="flex flex-col items-end gap-1.5">
                  <button
                    onClick={getCurrentLocation}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
                    disabled={loading || locationCapturing}
                  >
                    <MapIcon className="w-4 h-4 mr-2" />
                    {locationCapturing
                      ? "Capturing..."
                      : "Get Current Location"}
                  </button>
                  {coordinates ? (
                    <span className="text-xs text-green-700 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {coordinates[1].toFixed(5)}, {coordinates[0].toFixed(5)}
                    </span>
                  ) : (
                    <span className="text-xs text-amber-600">
                      Location not captured yet
                    </span>
                  )}
                </div>
              </div>

              {/* ✅ NEW — search-as-you-type address lookup, Google Maps style */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Location
                  <span className="text-gray-400 font-normal">
                    {" "}
                    — auto-fills the fields below
                  </span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() =>
                      searchResults.length > 0 && setShowDropdown(true)
                    }
                    onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                    placeholder="Search hotel name, road, or locality..."
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>

                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {searchResults.map((result, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onMouseDown={() => selectSearchResult(result)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-0 flex items-start gap-2 transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <span className="text-sm text-gray-700">
                          {result.display_name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <textarea
                    name="address.street"
                    value={registerForm.address.street}
                    onChange={handleRegisterChange}
                    rows={3}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Building number, street name, locality..."
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="address.city"
                    value={registerForm.address.city}
                    onChange={handleRegisterChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mumbai"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <select
                    name="address.state"
                    value={registerForm.address.state}
                    onChange={handleRegisterChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  >
                    <option value="">Select State</option>
                    {indianStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    name="address.zipCode"
                    value={registerForm.address.zipCode}
                    onChange={handleRegisterChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="400001"
                    maxLength={6}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    name="address.country"
                    value={registerForm.address.country}
                    onChange={handleRegisterChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    placeholder="India"
                    disabled={true}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Legal Documentation */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Legal Documentation
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST Number *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="gstNumber"
                    value={registerForm.gstNumber}
                    onChange={handleRegisterChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="27ABCDE1234F1Z5"
                    maxLength={15}
                    style={{ textTransform: "uppercase" }}
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Format: 2 digits (state code) + 10 characters (PAN) + 1 digit
                  + 1 character + Z + 1 character
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Labour Licence Number *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="labourLicenceNumber"
                    value={registerForm.labourLicenceNumber}
                    onChange={handleRegisterChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="LL/MH/2024/001234"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hotel Licence Number *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="hotelLicenceNumber"
                    value={registerForm.hotelLicenceNumber}
                    onChange={handleRegisterChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="HL/MH/2024/001234"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">
                  Required Documents Information
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• GST Registration Certificate</li>
                  <li>• Labour License from respective state authority</li>
                  <li>• Hotel License from tourism department</li>
                  <li>• Fire Safety Certificate</li>
                  <li>• Health/Trade License</li>
                  <li>• Building Permit</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 4: Verification Status */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-6 h-6 mr-2 text-blue-600" />
                Verification Status
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Verification Status *
                  </label>
                  <div className="space-y-3">
                    {verificationStatusOptions.map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <div
                          key={option.value}
                          className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                            registerForm.verificationStatus === option.value
                              ? `${option.borderColor} ${option.bgColor} ring-2 ring-opacity-20`
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() =>
                            setRegisterForm({
                              ...registerForm,
                              verificationStatus: option.value as
                                | "verified"
                                | "pending"
                                | "unverified",
                            })
                          }
                        >
                          <div className="flex items-start">
                            <input
                              type="radio"
                              name="verificationStatus"
                              value={option.value}
                              checked={
                                registerForm.verificationStatus === option.value
                              }
                              onChange={handleRegisterChange}
                              className="mt-1 mr-3"
                              disabled={loading}
                            />
                            <div className="flex-1">
                              <div className="flex items-center mb-1">
                                <IconComponent
                                  className={`w-5 h-5 mr-2 ${option.color}`}
                                />
                                <span className="font-medium text-gray-900">
                                  {option.label}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {option.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Notes (Optional)
                  </label>
                  <textarea
                    name="verificationNotes"
                    value={registerForm.verificationNotes}
                    onChange={handleRegisterChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Add any notes about the verification process, document issues, or special requirements..."
                    disabled={loading}
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-900 mb-2">
                    Verification Guidelines
                  </h3>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>
                      • <strong>Verified:</strong> All documents checked and
                      approved for operation
                    </li>
                    <li>
                      • <strong>Pending:</strong> Documents submitted, awaiting
                      review or missing items
                    </li>
                    <li>
                      • <strong>Unverified:</strong> Documents not submitted or
                      issues found requiring correction
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Review Registration Details
              </h2>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Name:</span>{" "}
                      {registerForm.name}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span>{" "}
                      {registerForm.accommodationType}
                    </div>
                    <div>
                      <span className="font-medium">Owner:</span>{" "}
                      {registerForm.ownerName}
                    </div>
                    <div>
                      <span className="font-medium">Owner Phone:</span>{" "}
                      {registerForm.ownerPhone}
                    </div>
                    <div>
                      <span className="font-medium">Rooms:</span>{" "}
                      {registerForm.numberOfRooms}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span>{" "}
                      {registerForm.email}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Address</h3>
                  <p className="text-sm text-gray-700">
                    {registerForm.address.street}, {registerForm.address.city},{" "}
                    {registerForm.address.state} {registerForm.address.zipCode},{" "}
                    {registerForm.address.country}
                  </p>
                  <p className="text-xs mt-2 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {coordinates ? (
                      <span className="text-green-700 font-medium">
                        GPS captured: {coordinates[1].toFixed(5)},{" "}
                        {coordinates[0].toFixed(5)}
                      </span>
                    ) : (
                      <span className="text-amber-600">
                        No GPS location captured — this hotel won't appear on
                        the jurisdiction map until location is added
                      </span>
                    )}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Legal Documentation
                  </h3>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="font-medium">GST Number:</span>{" "}
                      {registerForm.gstNumber}
                    </div>
                    <div>
                      <span className="font-medium">Labour License:</span>{" "}
                      {registerForm.labourLicenceNumber}
                    </div>
                    <div>
                      <span className="font-medium">Hotel License:</span>{" "}
                      {registerForm.hotelLicenceNumber}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Verification Status
                  </h3>
                  <div className="flex items-center mb-2">
                    {(() => {
                      const statusOption = verificationStatusOptions.find(
                        (opt) => opt.value === registerForm.verificationStatus,
                      );
                      const IconComponent = statusOption?.icon || Shield;
                      return (
                        <>
                          <IconComponent
                            className={`w-5 h-5 mr-2 ${
                              statusOption?.color || "text-gray-600"
                            }`}
                          />
                          <span className="font-medium">
                            {statusOption?.label ||
                              registerForm.verificationStatus}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  {registerForm.verificationNotes && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Notes:</span>{" "}
                      {registerForm.verificationNotes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 1 || loading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex space-x-3">
              {currentStep < 5 ? (
                <button
                  onClick={nextStep}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Registering...
                    </div>
                  ) : (
                    "Complete Registration"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelRegistration;
