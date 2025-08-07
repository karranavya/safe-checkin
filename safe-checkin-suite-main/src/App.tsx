import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SplashScreen from "./pages/Index";
import LoginPage from "./pages/Login";
import DashboardPage from "./pages/Dashboard";
import CheckInPage from "./pages/CheckIn";
import CheckOutPage from "./pages/CheckOut";
import AlertPolicePage from "./pages/AlertPolice";
import ChangeLanguagePage from "./pages/ChangeLanguage";
import GuestDetailsView from "./pages/GuestDetailsView";
import NotFound from "./pages/NotFound";
import MainLayout from "./components/layout/MainLayout";
import { RoomProvider } from "./contexts/RoomContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <RoomProvider>
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/login" element={<LoginPage />} />

            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/check-in" element={<CheckInPage />} />
              <Route path="/check-out" element={<CheckOutPage />} />
              <Route path="/alert-police" element={<AlertPolicePage />} />
              <Route path="/change-language" element={<ChangeLanguagePage />} />
              <Route path="/guest-details/:id" element={<GuestDetailsView />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </RoomProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
