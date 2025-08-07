import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Home,
  FileText,
  Users,
  LogOut,
  X,
  ChevronDown,
  ChevronRight,
  Building,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ open, onOpenChange }) => {
  const [reportsExpanded, setReportsExpanded] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem("police-dashboard-auth");
    localStorage.removeItem("police-dashboard-remember");
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
    navigate("/");
  };

  const sidebarItems = [
    {
      title: "Dashboard",
      icon: Home,
      href: "/dashboard",
      exact: true,
    },
    {
      title: "Hotels",
      icon: Building, // Import Building from lucide-react
      href: "/dashboard/hotels",
      submenu: [
        { title: "Register Hotel", href: "/dashboard/hotels/register" },
        { title: "View Hotels", href: "/dashboard/hotels/list" },
      ],
    },
    {
      title: "Reports",
      icon: FileText,
      href: "/dashboard/reports",
      submenu: [
        { title: "Area CheckIn wise", href: "/dashboard/reports/checkin" },
      ],
    },
    {
      title: "Suspects",
      icon: Users,
      href: "/dashboard/suspects",
    },
  ];

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-80 bg-card shadow-card transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center space-x-2">
              <img
                src="/lovable-uploads/9d9969a7-cbda-48a5-a664-db7cd40ca9fa.png"
                alt="Safe CheckIn"
                className="h-6 w-auto"
              />
              <span className="font-semibold text-foreground">Menu</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="lg:hidden rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Theme Toggle Section */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Theme
              </span>
              <ThemeToggle />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item) => (
              <div key={item.title}>
                {item.submenu ? (
                  <>
                    <Button
                      variant="ghost"
                      className="w-full justify-between rounded-xl hover:bg-accent"
                      onClick={() => setReportsExpanded(!reportsExpanded)}
                    >
                      <div className="flex items-center">
                        <item.icon className="h-4 w-4 mr-3" />
                        {item.title}
                      </div>
                      {reportsExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    {reportsExpanded && (
                      <div className="ml-4 mt-2 space-y-1">
                        {item.submenu.map((subItem) => (
                          <NavLink
                            key={subItem.href}
                            to={subItem.href}
                            className={({ isActive }) =>
                              cn(
                                "flex items-center px-3 py-2 text-sm rounded-lg transition-colors",
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              )
                            }
                            onClick={() => onOpenChange(false)}
                          >
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
                        "flex items-center px-3 py-2 rounded-xl transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )
                    }
                    onClick={() => onOpenChange(false)}
                    end={item.exact}
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.title}
                  </NavLink>
                )}
              </div>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-border">
            <Button
              variant="destructive"
              className="w-full rounded-xl"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};
