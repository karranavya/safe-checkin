// components/AdminRoute.tsx
import { usePoliceAuth } from "@/contexts/PoliceAuthContext";
import { Navigate, Outlet } from "react-router-dom";

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = usePoliceAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "admin_police") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />; // Use Outlet for nested routes
};
