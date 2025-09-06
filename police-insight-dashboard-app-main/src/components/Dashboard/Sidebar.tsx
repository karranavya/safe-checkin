import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Home,
  FileText,
  Users,
  LogOut,
  X,
  ChevronDown,
  ChevronRight,
  Building,
  Shield,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePoliceAuth } from "@/contexts/PoliceAuthContext";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ open, onOpenChange }) => {
  const [reportsExpanded, setReportsExpanded] = useState(false);
  const [hotelsExpanded, setHotelsExpanded] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = usePoliceAuth();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
    navigate("/");
  };

  const sidebarItems = [
    {
      title: "Command Center",
      icon: Home,
      href: "/dashboard",
      exact: true,
      color: "text-white",
    },
    {
      title: "Hotel Registry",
      icon: Building,
      href: "/dashboard/hotels",
      color: "text-white",
      submenu: [
        {
          title: "Register New Hotel",
          href: "/dashboard/hotels/register",
          icon: Building,
        },
        {
          title: "All Registered Hotels",
          href: "/dashboard/hotels/list",
          icon: FileText,
        },
      ],
    },
    {
      title: "Intelligence Reports",
      icon: FileText,
      href: "/dashboard/reports",
      color: "text-white",
      submenu: [
        {
          title: "Area Check-In Analysis",
          href: "/dashboard/reports/checkin",
          icon: AlertTriangle,
        },
      ],
    },
    {
      title: "Suspect Database",
      icon: Users,
      href: "/dashboard/suspects",
      color: "text-white",
    },
  ];

  return (
    <>
      {/* Fixed Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-80 shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          // Gradient from dark blue (top) to light blue (bottom) matching dashboard header
          "bg-gradient-to-b from-[#1e3a5f] to-[#0ea5e9]",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full text-white">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-full">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg text-white">
                  Police Portal
                </span>
                <div className="text-xs text-white/70">Command & Control</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="lg:hidden text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Status Indicator */}
          <div className="p-4 border-b border-white/20">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white/90">System Status</span>
              </div>
              <span className="text-yellow-300 font-medium">OPERATIONAL</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {sidebarItems.map((item) => (
              <div key={item.title}>
                {item.submenu ? (
                  <>
                    <Button
                      variant="ghost"
                      className="w-full justify-between text-white hover:bg-white/10 border border-white/20 mb-2"
                      onClick={() => {
                        if (item.title === "Hotel Registry") {
                          setHotelsExpanded(!hotelsExpanded);
                        } else {
                          setReportsExpanded(!reportsExpanded);
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <item.icon className="h-5 w-5 mr-3 text-white" />
                        <span className="font-medium">{item.title}</span>
                      </div>
                      {(
                        item.title === "Hotel Registry"
                          ? hotelsExpanded
                          : reportsExpanded
                      ) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    {((item.title === "Hotel Registry" && hotelsExpanded) ||
                      (item.title === "Intelligence Reports" &&
                        reportsExpanded)) && (
                      <div className="ml-4 mt-2 space-y-1 border-l border-white/20 pl-4">
                        {item.submenu.map((subItem) => (
                          <NavLink
                            key={subItem.href}
                            to={subItem.href}
                            className={({ isActive }) =>
                              cn(
                                "flex items-center px-3 py-2 text-sm rounded-lg transition-colors",
                                isActive
                                  ? "bg-yellow-400 text-blue-900 shadow-lg font-medium"
                                  : "text-white/80 hover:bg-white/10 hover:text-white"
                              )
                            }
                            onClick={() => onOpenChange(false)}
                          >
                            <subItem.icon className="h-4 w-4 mr-3" />
                            {subItem.title}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center px-4 py-3 rounded-lg transition-colors border border-white/20 mb-2",
                        isActive
                          ? "bg-yellow-400 text-blue-900 shadow-lg font-medium"
                          : "text-white hover:bg-white/10 hover:border-white/40"
                      )
                    }
                    onClick={() => onOpenChange(false)}
                    end={item.exact}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    <span className="font-medium">{item.title}</span>
                  </NavLink>
                )}
              </div>
            ))}
          </nav>

          {/* System Time */}
          <div className="p-4 border-t border-white/20">
            <div className="flex items-center space-x-2 text-white/80 text-xs mb-4">
              <Clock className="h-3 w-3" />
              <span>System Time: {new Date().toLocaleTimeString()}</span>
            </div>

            {/* Logout Button */}
            <Button
              variant="destructive"
              className="w-full bg-red-600 hover:bg-red-700 shadow-lg"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Secure Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};
