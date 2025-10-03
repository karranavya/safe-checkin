// src/pages/HotelRegistration.tsx - UPDATED VERSION
import React, { useState, useEffect } from "react";
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

const HotelRegistration: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<MessageState>({ type: "", text: "" });
  const [currentStep, setCurrentStep] = useState<number>(1);

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

  useEffect(() => {
    console.log("=== LOGIN STATUS DEBUG ===");
    console.log("localStorage keys:", Object.keys(localStorage));
    console.log("sessionStorage keys:", Object.keys(sessionStorage));
  }, []);

  // Handle form changes
  const handleRegisterChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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
      gst.toUpperCase()
    );
  };

  const validateZipCode = (zip: string): boolean => {
    return /^\d{6}$/.test(zip);
  };

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Location:", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setMessage({
            type: "success",
            text: "Location captured successfully!",
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setMessage({
            type: "error",
            text: "Unable to get location. Please enable location services.",
          });
        }
      );
    } else {
      setMessage({
        type: "error",
        text: "Geolocation is not supported by this browser.",
      });
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    // Get authentication data
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

    // Comprehensive validation
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
    } = registerForm;

    // Required field validation
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
      !hotelLicenceNumber
    ) {
      setMessage({ type: "error", text: "Please fill in all required fields" });
      setLoading(false);
      return;
    }

    // Format validation
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

      // Create full address string
      const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`;

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
            address: {
              ...registerData.address,
              fullAddress: fullAddress,
            },
            numberOfRooms: parseInt(numberOfRooms),
            registeredByPolice: true,
            policeOfficerId: policeAuth.policeId || policeAuth.officerId,
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

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Hotel registered successfully!",
        });
        // Reset form
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
        });
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
    if (currentStep < 4) setCurrentStep(currentStep + 1);
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
            documentation
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex items-center ${step < 4 ? "flex-1" : ""}`}
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
                {step < 4 && (
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
            <span>Review</span>
          </div>
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

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Basic Information
              </h2>

              {/* Hotel Name and Type */}
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

              {/* Owner Information */}
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

              {/* Contact and Property Information */}
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
            </div>
          )}

          {/* Step 2: Address Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Address Information
                </h2>
                <button
                  onClick={getCurrentLocation}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  disabled={loading}
                >
                  <MapIcon className="w-4 h-4 mr-2" />
                  Get Current Location
                </button>
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

          {/* Step 4: Review */}
          {currentStep === 4 && (
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
              {currentStep < 4 ? (
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
