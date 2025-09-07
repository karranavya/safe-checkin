// App.tsx - Updated with nested admin routes
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PoliceAuthProvider } from "@/contexts/PoliceAuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { LoginPage } from "@/components/Login/LoginPage";
import { DashboardLayout } from "@/components/Dashboard/DashboardLayout";
import { DashboardHome } from "@/components/Dashboard/DashboardHome";
import ReportsPage from "@/components/Dashboard/ReportsPage";
import SuspectsPage from "@/components/Dashboard/SuspectsPage";
import HotelRegistration from "@/components/Dashboard/HotelRegistration";
import HotelList from "@/components/Dashboard/HotelList";
// Import Admin Components
import { SubPoliceManagement } from "@/components/Dashboard/AdminDashboard/SubPoliceManagement";
import { ActivityMonitoring } from "@/components/Dashboard/AdminDashboard/ActivityMonitoring";
import { SystemOverview } from "@/components/Dashboard/AdminDashboard/SystemOverview";
import { AdminReports } from "@/components/Dashboard/AdminDashboard/AdminReports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <BrowserRouter>
        <PoliceAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Main Dashboard Route with Nested Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                {/* Dashboard Home */}
                <Route index element={<DashboardHome />} />

                {/* Regular Routes */}
                <Route path="reports" element={<ReportsPage />} />
                <Route path="reports/checkin" element={<ReportsPage />} />
                <Route path="suspects" element={<SuspectsPage />} />
                <Route path="hotels/register" element={<HotelRegistration />} />
                <Route path="hotels/list" element={<HotelList />} />

                {/* Admin Routes (Protected) */}
                <Route
                  path="admin"
                  element={
                    <AdminRoute>
                      <div />
                    </AdminRoute>
                  }
                >
                  <Route path="officers" element={<SubPoliceManagement />} />
                  <Route path="activities" element={<ActivityMonitoring />} />
                  <Route path="analytics" element={<SystemOverview />} />
                  <Route path="reports" element={<AdminReports />} />
                </Route>

                {/* Catch unmatched dashboard routes */}
                <Route path="*" element={<NotFound />} />
              </Route>

              {/* Catch all other routes */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </PoliceAuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
