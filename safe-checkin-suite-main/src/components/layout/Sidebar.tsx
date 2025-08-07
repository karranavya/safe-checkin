import { NavLink, useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  Home,
  LogOut,
  FilePlus,
  FileMinus,
  ShieldAlert,
  Languages,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/check-in", label: "CheckIn", icon: FilePlus },
  { to: "/check-out", label: "CheckOut", icon: FileMinus },
  { to: "/alert-police", label: "Alert to Police", icon: ShieldAlert },
  { to: "/change-language", label: "Change Language", icon: Languages },
];

const Sidebar = ({
  isOpen,
  onNavigate,
}: {
  isOpen: boolean;
  onNavigate: () => void;
}) => {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "fixed top-0 left-0 z-50 h-screen bg-white border-r shadow transition-all duration-300",
        isOpen ? "w-64" : "w-0 overflow-hidden",
        "lg:w-64"
      )}
    >
      <div className="flex flex-col h-full p-4 overflow-y-auto">
        <div className="mb-8">
          <Logo />
        </div>

        <nav className="flex-grow space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-primary transition-all",
                  isActive && "bg-primary/10 text-primary"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto">
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={() => navigate("/login")}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
          <div className="text-center text-xs text-muted-foreground mt-4">
            <span>Powered by</span>
            <img
              src="/lovable-uploads/529a7dcc-f2a6-4ea8-98c8-eb160898776b.png"
              alt="Deltamarch Logo"
              className="h-5 mx-auto mt-1 dark:invert"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
