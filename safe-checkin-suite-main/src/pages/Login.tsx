// src/pages/Login.tsx
import React, { useState } from "react";
import {
  Building,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LoginFormData {
  email: string;
  password: string;
}

interface MessageState {
  type: "success" | "error" | "";
  text: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<MessageState>({ type: "", text: "" });

  // Form state
  const [loginForm, setLoginForm] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  // Handle form changes
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  // Validation function
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Handle login submission
  const handleLogin = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    // Basic validation
    if (!loginForm.email || !loginForm.password) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      setLoading(false);
      return;
    }

    if (!validateEmail(loginForm.email)) {
      setMessage({ type: "error", text: "Please enter a valid email address" });
      setLoading(false);
      return;
    }

    try {
      // API call to login endpoint
      const response = await fetch("http://localhost:5000/api/hotels/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and hotel data
        localStorage.setItem("hotelToken", data.token);
        localStorage.setItem("hotelData", JSON.stringify(data.hotel));
        setMessage({
          type: "success",
          text: "Login successful! Redirecting...",
        });

        // Navigate to dashboard
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        setMessage({ type: "error", text: data.error || "Login failed" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." });
      console.error("Login error:", error);
    }

    setLoading(false);
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Building className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SafeCheckIn</h1>
          <p className="text-gray-600">Hotel Management Portal</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
              Welcome Back
            </h2>

            {/* Message Display */}
            {message.text && (
              <div
                className={`mb-4 p-3 rounded-lg flex items-center ${
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

            {/* Login Form */}
            <div className="space-y-4" onKeyPress={handleKeyPress}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={loginForm.email}
                    onChange={handleLoginChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="hotel@example.com"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={loginForm.password}
                    onChange={handleLoginChange}
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>

              {/* Registration Info */}
              <div className="text-center mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Building className="w-5 h-5 text-blue-600 mt-0.5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-blue-800 mb-1">
                      New Hotel Registration
                    </p>
                    <p className="text-xs text-blue-700">
                      To register your hotel with SafeCheckIn, please contact
                      your local police station. Only authorized personnel can
                      register new accommodation facilities.
                    </p>
                  </div>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="text-center mt-4">
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  onClick={() => {
                    // You can implement forgot password functionality here
                    setMessage({
                      type: "error",
                      text: "Please contact your local police station for password recovery.",
                    });
                  }}
                >
                  Forgot your password?
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>&copy; 2025 SafeCheckIn. All rights reserved.</p>
          <p className="mt-1">Secure accommodation management system</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
