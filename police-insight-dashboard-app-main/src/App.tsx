// App.tsx - Updated with proper route protection
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PoliceAuthProvider } from "@/contexts/PoliceAuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute"; // New import
import { LoginPage } from "@/components/Login/LoginPage";
import { DashboardLayout } from "@/components/Dashboard/DashboardLayout";
import { DashboardHome } from "@/components/Dashboard/DashboardHome";
import ReportsPage from "@/components/Dashboard/ReportsPage";
import SuspectsPage from "@/components/Dashboard/SuspectsPage";
import HotelRegistration from "@/components/Dashboard/HotelRegistration";
import HotelList from "@/components/Dashboard/HotelList";
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
              <Route path="/" element={<LoginPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardHome />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="reports/checkin" element={<ReportsPage />} />
                <Route path="suspects" element={<SuspectsPage />} />
                <Route path="hotels/register" element={<HotelRegistration />} />
                <Route path="hotels/list" element={<HotelList />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </PoliceAuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
