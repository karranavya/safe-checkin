import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LoginPage } from "@/components/Login/LoginPage";
import { DashboardLayout } from "@/components/Dashboard/DashboardLayout";
import { DashboardHome } from "@/components/Dashboard/DashboardHome";
import ReportsPage from "@/components/Dashboard/ReportsPage";
import { SuspectsPage } from "@/components/Dashboard/SuspectsPage";
import HotelRegistration from "@/components/Dashboard/HotelRegistration"; // Add this import
import HotelList from "@/components/Dashboard/HotelList"; // Add this import
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="reports/checkin" element={<ReportsPage />} />
              <Route path="suspects" element={<SuspectsPage />} />

              {/* Add hotel routes here */}
              <Route path="hotels/register" element={<HotelRegistration />} />
              <Route path="hotels/list" element={<HotelList />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
