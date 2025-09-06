import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { usePoliceAuth } from "@/contexts/PoliceAuthContext";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AutoRefresh } from "@/components/ui/auto-refresh";
import { Sidebar } from "./Sidebar";
import { LogOut, Menu, X, User, Shield, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout, isAuthenticated, isLoading } = usePoliceAuth();

  // Police jurisdiction information
  const jurisdiction = {
    district: "Mumbai Central",
    zone: "Zone II",
    division: "Division 3",
    area: "Colaba Area",
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("Not authenticated in DashboardLayout, redirecting...");
      navigate("/", { replace: true });
      return;
    }
  }, [navigate, isAuthenticated, isLoading]);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
    navigate("/", { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AutoRefresh />

      {/* Fixed Sidebar */}
      <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content - adjusted for fixed sidebar */}
      <div className="flex-1 flex flex-col lg:ml-80">
        {/* Header */}
        <header className="bg-gradient-to-r from-[#1e3a5f] to-[#0ea5e9] shadow-2xl border-b border-blue-800/20">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden text-white hover:bg-white/10"
                >
                  {sidebarOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/10 rounded-full">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-white">
                    <h1 className="text-xl font-bold">Police Command Center</h1>
                    <div className="flex items-center space-x-2 text-sm text-white/80">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {jurisdiction.district} • {jurisdiction.zone} •{" "}
                        {jurisdiction.division}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {/* User Info */}
                {user && (
                  <div className="hidden md:flex items-center space-x-3 text-white">
                    <div className="p-2 bg-white/10 rounded-full">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-white/80">
                        {user.rank} • Badge #{user.badgeNumber}
                      </div>
                    </div>
                  </div>
                )}
                <ThemeToggle />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 shadow-lg"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
            {/* Jurisdiction Info Bar */}
            <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6 text-white/90">
                  <div className="text-center">
                    <div className="text-xs font-medium text-white/70">
                      DISTRICT
                    </div>
                    <div className="text-sm font-semibold">
                      {jurisdiction.district}
                    </div>
                  </div>
                  <div className="w-px h-8 bg-white/30"></div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-white/70">
                      ZONE
                    </div>
                    <div className="text-sm font-semibold">
                      {jurisdiction.zone}
                    </div>
                  </div>
                  <div className="w-px h-8 bg-white/30"></div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-white/70">
                      DIVISION
                    </div>
                    <div className="text-sm font-semibold">
                      {jurisdiction.division}
                    </div>
                  </div>
                  <div className="w-px h-8 bg-white/30"></div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-white/70">
                      AREA
                    </div>
                    <div className="text-sm font-semibold">
                      {jurisdiction.area}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-white/80">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium">SYSTEM ONLINE</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
