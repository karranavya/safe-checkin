import { useState, useEffect, useCallback } from "react";
import {
  Download,
  FileText,
  Building2,
  Filter,
  RefreshCw,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

const PERIOD_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
];

// Types for better TypeScript support
interface Hotel {
  id: string;
  name: string;
  city?: string;
  category?: string;
  address?: string;
  type?: string;
  checkins: number;
  checkouts: number;
  totalGuests: number;
}

interface Guest {
  _id?: string;
  name: string;
  phone: string;
  roomNumber?: string;
  status: string;
  checkInTime: string;
  nationality?: string;
  purpose?: string;
  guestCount?: number;
}

interface AreaStats {
  totalCheckins: number;
  totalCheckouts: number;
  totalAccommodations: number;
  totalGuests: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"area" | "specific">("area");
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [period, setPeriod] = useState("all");
  const [city, setCity] = useState("all");
  const [category, setCategory] = useState("all");

  const [areaStats, setAreaStats] = useState<AreaStats | null>(null);
  const [hotelsData, setHotelsData] = useState<Hotel[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState("");

  const [guestModal, setGuestModal] = useState<{
    open: boolean;
    hotel: Hotel | null;
  }>({
    open: false,
    hotel: null,
  });
  const [hotelGuests, setHotelGuests] = useState<Guest[]>([]);
  const [loadingGuests, setLoadingGuests] = useState(false);

  // Check authentication
  // In your reports component, update the checkAuth function:
  const checkAuth = (): boolean => {
    const token =
      sessionStorage.getItem("policeToken") ||
      localStorage.getItem("policeToken");
    if (!token) {
      setError("No authentication token found. Please login again.");
      // Redirect to login
      window.location.href = "/login"; // or use navigate("/login")
      return false;
    }
    return true;
  };

  // API helper function with better error handling
  const apiCall = async <T,>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    const token =
      sessionStorage.getItem("policeToken") ||
      localStorage.getItem("policeToken");

    // Get API base URL
    // With this:
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const fullUrl = endpoint.startsWith("http")
      ? endpoint
      : `${baseUrl}${endpoint}`;

    const defaultOptions: RequestInit = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`API Call: ${fullUrl}`, { headers: defaultOptions.headers });

      const response = await fetch(fullUrl, defaultOptions);

      console.log(
        `Response status: ${response.status}`,
        response.headers.get("content-type")
      );

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        const htmlText = await response.text();
        console.error(
          "Received HTML instead of JSON:",
          htmlText.substring(0, 200)
        );
        throw new Error(
          `Server returned HTML instead of JSON. Status: ${response.status}. This usually means the API endpoint doesn't exist or authentication failed.`
        );
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        throw new Error(
          `Empty response from server. Status: ${response.status}`
        );
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        console.error("JSON Parse Error:", parseErr);
        console.error("Response text:", responseText);
        throw new Error(
          `Invalid JSON response: ${
            parseErr instanceof Error ? parseErr.message : "Unknown parse error"
          }`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return data;
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        throw new Error(
          `Network error: Cannot connect to ${fullUrl}. Make sure your backend server is running.`
        );
      }
      throw err;
    }
  };

  // Load initial data to get cities and categories
  useEffect(() => {
    const loadInitialData = async () => {
      if (!checkAuth()) return;

      try {
        setDebugInfo("Loading initial data...");

        const response = await apiCall<Hotel[]>(
          "/api/reports/hotels-stats?period=today"
        );

        if (response.success && response.data) {
          const hotels = response.data;

          // Extract unique cities and categories
          const uniqueCities = [
            ...new Set(hotels.map((h) => h.city).filter(Boolean)),
          ] as string[];
          const uniqueCategories = [
            ...new Set(hotels.map((h) => h.category).filter(Boolean)),
          ] as string[];

          setCities(uniqueCities);
          setCategories(uniqueCategories);
          setDebugInfo(
            `Found ${uniqueCities.length} cities and ${uniqueCategories.length} categories`
          );
        } else {
          setDebugInfo("No data returned from initial API call");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.error("Failed to load initial data:", err);
        setError(`Initial load failed: ${errorMessage}`);
        setDebugInfo(`Initial load error: ${errorMessage}`);
      }
    };

    loadInitialData();
  }, []);

  // Load reports data
  const loadData = useCallback(async () => {
    if (!checkAuth()) return;

    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const queryParams = new URLSearchParams({ period });
      if (city !== "all") queryParams.set("city", city);
      if (category !== "all") queryParams.set("category", category);

      const queryString = queryParams.toString();

      setDebugInfo(`Loading data with: ${queryString}`);

      // Fetch both area stats and hotel stats
      const [areaResponse, hotelsResponse] = await Promise.all([
        apiCall<AreaStats>(`/api/reports/area-stats?${queryString}`),
        apiCall<Hotel[]>(`/api/reports/hotels-stats?${queryString}`),
      ]);

      if (areaResponse.success) {
        setAreaStats(
          areaResponse.data || {
            totalCheckins: 0,
            totalCheckouts: 0,
            totalAccommodations: 0,
            totalGuests: 0,
          }
        );
      } else {
        setAreaStats({
          totalCheckins: 0,
          totalCheckouts: 0,
          totalAccommodations: 0,
          totalGuests: 0,
        });
      }

      if (hotelsResponse.success) {
        setHotelsData(hotelsResponse.data || []);
      } else {
        setHotelsData([]);
      }

      setDebugInfo(
        `Data loaded successfully: ${
          hotelsResponse.data?.length || 0
        } hotels found`
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setDebugInfo(`Error: ${errorMessage}`);
      console.error("Data loading error:", err);

      // Set fallback empty data
      setAreaStats({
        totalCheckins: 0,
        totalCheckouts: 0,
        totalAccommodations: 0,
        totalGuests: 0,
      });
      setHotelsData([]);
    } finally {
      setLoading(false);
    }
  }, [period, city, category]);

  // Load data on component mount and when filters change
  useEffect(() => {
    loadData();

    // Set up auto-refresh every 60 seconds
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  const toggleHotel = (id: string) => {
    setSelectedHotels((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleDrilldown = async (hotel: Hotel) => {
    setGuestModal({ open: true, hotel });
    setLoadingGuests(true);

    try {
      const response = await apiCall<Guest[]>(
        `/api/reports/hotel/${hotel.id}/guests`
      );

      if (response.success) {
        setHotelGuests(response.data || []);
      } else {
        setHotelGuests([]);
      }
    } catch (err) {
      console.error("Failed to load guests:", err);
      setHotelGuests([]);
    } finally {
      setLoadingGuests(false);
    }
  };

  const handleCloseGuestModal = () => {
    setGuestModal({ open: false, hotel: null });
    setHotelGuests([]);
  };
  // Add this at the top of your HotelRegistration component
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

  // Calculate totals based on report type
  const totalCheckins =
    reportType === "area"
      ? areaStats?.totalCheckins ?? 0
      : hotelsData
          .filter((h) => selectedHotels.includes(h.id))
          .reduce((sum, h) => sum + h.checkins, 0);

  const totalCheckouts =
    reportType === "area"
      ? areaStats?.totalCheckouts ?? 0
      : hotelsData
          .filter((h) => selectedHotels.includes(h.id))
          .reduce((sum, h) => sum + h.checkouts, 0);

  const totalAccommodations =
    reportType === "area"
      ? areaStats?.totalAccommodations ?? 0
      : selectedHotels.length;

  const totalGuests =
    reportType === "area"
      ? areaStats?.totalGuests ?? 0
      : hotelsData
          .filter((h) => selectedHotels.includes(h.id))
          .reduce((sum, h) => sum + h.totalGuests, 0);

  const displayHotels =
    reportType === "area"
      ? hotelsData
      : hotelsData.filter((h) => selectedHotels.includes(h.id));

  // Generate report summary text
  const getReportSummary = () => {
    const periodText =
      PERIOD_OPTIONS.find((p) => p.value === period)?.label || period;
    const cityText = city === "all" ? "all cities" : city;
    const categoryText = category === "all" ? "all categories" : category;

    return `Report for ${periodText.toLowerCase()} covering ${cityText} (${categoryText}). 
    ${
      reportType === "area"
        ? "All hotels"
        : `${selectedHotels.length} selected hotels`
    } 
    showing ${totalCheckins} check-ins, ${totalCheckouts} check-outs across ${totalAccommodations} accommodations 
    with ${totalGuests} total guests.`;
  };
  const debugData = () => {
    console.log("=== HOTEL REPORTS DEBUG ===");
    console.log("Hotels fetched from API:", hotelsData.length);
    console.log("Raw hotels data:", hotelsData);

    // Detailed hotel analysis
    hotelsData.forEach((hotel, index) => {
      console.log(`Hotel ${index + 1}:`, {
        id: hotel.id,
        name: hotel.name,
        city: hotel.city,
        checkins: hotel.checkins,
        checkouts: hotel.checkouts,
        totalGuests: hotel.totalGuests,
        category: hotel.category,
        type: hotel.type,
      });
    });

    console.log("Current filters:", { period, city, category });
    console.log("Report type:", reportType);
    console.log("Selected hotels:", selectedHotels);
    console.log("Area stats:", areaStats);

    // Calculate totals manually for verification
    const manualCheckins = hotelsData.reduce((sum, h) => sum + h.checkins, 0);
    const manualCheckouts = hotelsData.reduce((sum, h) => sum + h.checkouts, 0);
    const manualTotalGuests = hotelsData.reduce(
      (sum, h) => sum + h.totalGuests,
      0
    );

    console.log("Manual calculations:", {
      totalHotels: hotelsData.length,
      totalCheckins: manualCheckins,
      totalCheckouts: manualCheckouts,
      totalGuests: manualTotalGuests,
    });

    console.log("Displayed totals:", {
      totalCheckins,
      totalCheckouts,
      totalAccommodations,
      totalGuests,
    });

    console.log("=== END DEBUG ===");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Hotel Check-in Reports
            </h1>
            <p className="text-gray-600 mt-1">
              {PERIOD_OPTIONS.find((p) => p.value === period)?.label} •{" "}
              {city === "all" ? "All Cities" : city} •{" "}
              {category === "all" ? "All Categories" : category}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Loading..." : "Refresh"}
            </button>
            <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm">
              <Clock className="h-4 w-4" />
              Auto-refresh: 60s
            </div>
          </div>
        </div>

        {/* Debug Info */}
        {/* {debugInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-700 text-sm">
              <AlertCircle className="h-4 w-4" />
              Debug: {debugInfo}
            </div>
          </div>
        )}
        <button
          onClick={debugData}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm"
        >
          Debug Data
        </button> */}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
            <div className="mt-2 text-sm text-red-600">
              Please check your authentication and try again.
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-lg mb-4">Filters</h3>
          <div className="flex flex-wrap gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Cities</option>
              {cities.map((cityName) => (
                <option key={cityName} value={cityName}>
                  {cityName}
                </option>
              ))}
            </select>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Report Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              type: "area" as const,
              icon: Building2,
              title: "All Hotels Overview",
              desc: "View statistics for all hotels in the area",
            },
            {
              type: "specific" as const,
              icon: Filter,
              title: "Specific Hotel Analysis",
              desc: "Select specific hotels for detailed comparison",
            },
          ].map(({ type, icon: Icon, title, desc }) => (
            <div
              key={type}
              onClick={() => setReportType(type)}
              className={`cursor-pointer rounded-xl border-2 p-6 transition-all ${
                reportType === type
                  ? "border-blue-500 bg-blue-50 shadow-lg"
                  : "border-gray-200 hover:border-blue-300 bg-white"
              }`}
            >
              <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-3 bg-blue-100">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-gray-600 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Hotel Selection (for specific reports) */}
        {reportType === "specific" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="font-semibold text-lg">
                Select Hotels for Analysis
              </h3>
              <p className="text-gray-600 text-sm">
                Choose hotels to compare their statistics
              </p>
            </div>
            <div className="p-6">
              {hotelsData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No hotels found matching your criteria.</p>
                  <p className="text-sm">Try adjusting your filters above.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hotelsData.map((hotel) => (
                    <div
                      key={hotel.id}
                      className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedHotels.includes(hotel.id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                      }`}
                      onClick={() => toggleHotel(hotel.id)}
                    >
                      <input
                        type="checkbox"
                        id={`hotel-${hotel.id}`}
                        checked={selectedHotels.includes(hotel.id)}
                        onChange={() => toggleHotel(hotel.id)}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`hotel-${hotel.id}`}
                          className="font-medium cursor-pointer block"
                        >
                          {hotel.name}
                        </label>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <span className="font-medium">Check-Ins:</span>{" "}
                            {hotel.checkins} |
                            <span className="font-medium"> Check-Outs:</span>{" "}
                            {hotel.checkouts}
                          </p>
                          <p>
                            <span className="font-medium">Total Guests:</span>{" "}
                            {hotel.totalGuests}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {hotel.address && `${hotel.address} • `}
                          {hotel.city && `${hotel.city} • `}
                          {hotel.category || "Standard"}
                        </p>
                      </div>
                      <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {hotel.type || "Hotel"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Check-Ins
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {totalCheckins}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {reportType === "area"
                ? "From all hotels"
                : `From ${selectedHotels.length} selected hotels`}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Check-Outs
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {totalCheckouts}
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Completed stays</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {reportType === "area" ? "Total Hotels" : "Selected Hotels"}
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {totalAccommodations}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Active accommodations</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Guests
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {totalGuests}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Unique visitors</p>
          </div>
        </div>

        {/* Report Preview */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {reportType === "area"
                  ? "Area-Wide Hotel Report"
                  : "Specific Hotel Comparison"}
              </h3>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                onClick={() => {
                  // You can implement export functionality here
                  console.log("Export report", {
                    reportType,
                    period,
                    city,
                    category,
                    selectedHotels,
                  });
                }}
              >
                <Download className="h-4 w-4" />
                Export Report
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">{getReportSummary()}</p>
          </div>

          <div className="p-6">
            {/* Hotels Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Hotel Name
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">
                      Check-Ins
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">
                      Check-Outs
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">
                      Total Guests
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">
                      Location
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayHotels.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-gray-500"
                      >
                        <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="font-medium text-lg mb-2">
                          No Hotels Found
                        </h3>
                        <p>
                          {reportType === "specific" &&
                          selectedHotels.length === 0
                            ? "Please select hotels above to view their statistics"
                            : "No hotels match your current filter criteria"}
                        </p>
                        {reportType === "area" && (
                          <p className="text-sm mt-1">
                            Try adjusting your time period or location filters
                          </p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    displayHotels.map((hotel, index) => (
                      <tr
                        key={hotel.id}
                        className={`hover:bg-gray-50 ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        <td className="px-4 py-4">
                          <div>
                            <div className="font-medium text-gray-900">
                              {hotel.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {hotel.category || "Standard"} •{" "}
                              {hotel.type || "Hotel"}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {hotel.checkins}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {hotel.checkouts}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {hotel.totalGuests}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-sm text-gray-600">
                          {hotel.city || "Not specified"}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => handleDrilldown(hotel)}
                            className="inline-flex items-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View guest details"
                          >
                            <Users className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            {displayHotels.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {totalCheckins}
                    </p>
                    <p className="text-sm text-gray-600">Total Check-ins</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {totalCheckouts}
                    </p>
                    <p className="text-sm text-gray-600">Total Check-outs</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {totalAccommodations}
                    </p>
                    <p className="text-sm text-gray-600">Hotels Included</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {totalGuests}
                    </p>
                    <p className="text-sm text-gray-600">Total Guests</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Guest Details Modal */}
        {guestModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-6xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    Guest Details - {guestModal.hotel?.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {guestModal.hotel?.city && `${guestModal.hotel.city} • `}
                    {guestModal.hotel?.category || "Standard Hotel"}
                  </p>
                </div>
                <button
                  onClick={handleCloseGuestModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  ×
                </button>
              </div>
              <div className="p-6 overflow-auto" style={{ maxHeight: "60vh" }}>
                {loadingGuests ? (
                  <div className="text-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
                    <div className="text-gray-500">
                      Loading guest details...
                    </div>
                  </div>
                ) : hotelGuests.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="font-medium text-lg mb-2">
                      No Guests Found
                    </h3>
                    <p>
                      This hotel has no guest records for the selected period.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="mb-4 text-sm text-gray-600">
                      Found {hotelGuests.length} guest
                      {hotelGuests.length !== 1 ? "s" : ""} for this hotel
                    </div>
                    <table className="w-full border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">
                            Guest Name
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">
                            Phone Number
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">
                            Room Number
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">
                            Check-in Time
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">
                            Nationality
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">
                            Purpose
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {hotelGuests.map((guest, index) => (
                          <tr
                            key={guest._id || index}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {guest.name}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {guest.phone}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {guest.roomNumber || "-"}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  guest.status === "checked-in"
                                    ? "bg-green-100 text-green-800"
                                    : guest.status === "checked-out"
                                    ? "bg-gray-100 text-gray-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {guest.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-sm">
                              {new Date(guest.checkInTime).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {guest.nationality || "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {guest.purpose || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
