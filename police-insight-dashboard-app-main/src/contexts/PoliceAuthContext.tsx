// contexts/PoliceAuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
// import { useNavigate, useLocation } from "react-router-dom";
interface PoliceUser {
  id: string;
  badgeNumber: string;
  name: string;
  email: string;
  station: string;
  rank: string;
  isActive: boolean;
  role: "admin_police" | "sub_police"; // ADD THIS LINE
  lastLoginAt?: string;
  loginCount?: number;
}

interface PoliceAuthContextType {
  user: PoliceUser | null;
  token: string | null;
  login: (token: string, user: PoliceUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const PoliceAuthContext = createContext<PoliceAuthContextType | undefined>(
  undefined
);

export const usePoliceAuth = () => {
  const context = useContext(PoliceAuthContext);
  if (context === undefined) {
    throw new Error("usePoliceAuth must be used within a PoliceAuthProvider");
  }
  return context;
};

interface PoliceAuthProviderProps {
  children: ReactNode;
}

// contexts/PoliceAuthContext.tsx - Updated
export const PoliceAuthProvider: React.FC<PoliceAuthProviderProps> = ({
  children,
}) => {
  const [user, setUser] = useState<PoliceUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on app load
    const savedToken =
      localStorage.getItem("policeToken") ||
      sessionStorage.getItem("policeToken");
    const savedAuthData =
      localStorage.getItem("police-dashboard-auth") ||
      sessionStorage.getItem("police-dashboard-auth");

    console.log("Checking saved auth:", {
      savedToken: !!savedToken,
      savedAuthData: !!savedAuthData,
    });

    if (savedToken && savedAuthData) {
      try {
        const authData = JSON.parse(savedAuthData);
        setToken(savedToken);
        setUser(authData.police);
        console.log("Auth restored from storage:", authData.police.name);
      } catch (error) {
        console.error("Error parsing saved user data:", error);
        // Clean up invalid data
        localStorage.removeItem("policeToken");
        localStorage.removeItem("police-dashboard-auth");
        sessionStorage.removeItem("policeToken");
        sessionStorage.removeItem("police-dashboard-auth");
      }
    }

    setIsLoading(false); // This is crucial - always set loading to false
  }, []);

  const login = (newToken: string, newUser: PoliceUser) => {
    console.log("Login called with user:", newUser.name);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    console.log("Logout called");
    localStorage.removeItem("policeToken");
    localStorage.removeItem("police-dashboard-auth");
    sessionStorage.removeItem("policeToken");
    sessionStorage.removeItem("police-dashboard-auth");
    setToken(null);
    setUser(null);
  };

  const value: PoliceAuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    isLoading,
  };

  console.log("Auth context state:", {
    hasUser: !!user,
    hasToken: !!token,
    isAuthenticated: !!token && !!user,
    isLoading,
  });

  return (
    <PoliceAuthContext.Provider value={value}>
      {children}
    </PoliceAuthContext.Provider>
  );
};
