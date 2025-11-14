// pages/police/SuspectsPage.jsx - FIXED VERSION
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePoliceAuth } from "@/contexts/PoliceAuthContext";
import SuspectManagement from "./SuspectManagement";
import AlertManagement from "./AlertManagement";
import { useToast } from "@/hooks/use-toast";

export default function SuspectsPage() {
  // ========== STATE ========== //
  const [verifiedSuspects, setVerifiedSuspects] = useState([]); // ✅ ONLY VERIFIED
  const [alerts, setAlerts] = useState([]); // ✅ ONLY ALERTS
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("alerts");
  const { token, user, isAuthenticated, isLoading } = usePoliceAuth();
  const { toast } = useToast();

  // ========== FETCH ON MOUNT ========== //
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchVerifiedSuspects();
      fetchAlerts();
    }
  }, [isAuthenticated, token]);

  // ========== FETCH VERIFIED SUSPECTS ========== //
  const fetchVerifiedSuspects = async () => {
    try {
      if (!token || !isAuthenticated) {
        console.error("No valid police token found");
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/api/suspects?limit=50`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVerifiedSuspects(data.suspects || []);
        console.log("✅ Verified Suspects loaded:", data.suspects?.length);
      } else {
        console.error("Failed to fetch verified suspects:", response.status);
      }
    } catch (error) {
      console.error("Error fetching verified suspects:", error);
    }
  };

  // ========== FETCH ALERTS (ONLY UNVERIFIED) ========== //
  const fetchAlerts = async () => {
    setLoading(true);
    try {
      if (!token || !isAuthenticated) {
        console.error("No valid police token found");
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(
        `${apiUrl}/api/police/alerts?limit=50&sortBy=createdAt&sortOrder=desc`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        // ⭐ FILTER OUT ALERTS THAT ARE ALREADY VERIFIED AS SUSPECTS
        const unverifiedAlerts = (data.alerts || []).filter(
          (alert) => !alert.suspectVerification?.isVerifiedSuspect
        );

        setAlerts(unverifiedAlerts);
        console.log("✅ Alerts loaded (unverified):", unverifiedAlerts?.length);
      } else {
        console.error("HTTP error:", response.status);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch alerts",
        });
      }
    } catch (error) {
      console.error("Network error:", error);
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Failed to fetch alerts from server",
      });
    } finally {
      setLoading(false);
    }
  };

  // ========== UPDATE ALERT STATUS ========== //
  const updateAlertStatus = async (
    alertId: string,
    status: string,
    notes?: string
  ) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(
        `${apiUrl}/api/police/alerts/${alertId}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status, notes }),
        }
      );

      if (response.ok) {
        await fetchAlerts();
        toast({
          title: "Success!",
          description: `Alert status updated to ${status}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update alert status",
        });
      }
    } catch (error) {
      console.error("Failed to update alert status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update alert status",
      });
    }
  };

  // ========== HANDLE SUSPECT VERIFICATION ========== //
  const handleSuspectVerified = (newSuspect: any) => {
    // Add new suspect to verified suspects
    setVerifiedSuspects((prev) => [newSuspect, ...prev]);

    // Remove from alerts
    setAlerts((prev) =>
      prev.filter(
        (alert) =>
          alert.guestId?._id !== newSuspect.guestId?._id &&
          alert.guestId?.phone !== newSuspect.suspectData?.phone
      )
    );

    toast({
      title: "Success! ✅",
      description: "Suspect verified and moved to Suspect Management",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Please log in to access this page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Police Dashboard - Suspects & Alerts
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome, {user?.name} ({user?.rank})
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          {/* ⭐ VERIFIED SUSPECTS ONLY */}
          <TabsTrigger value="suspects">
            🔐 Verified Suspects ({verifiedSuspects.length})
          </TabsTrigger>

          {/* ⭐ UNVERIFIED ALERTS ONLY */}
          <TabsTrigger value="alerts">
            🚨 Active Alerts ({alerts.length})
          </TabsTrigger>
        </TabsList>

        {/* ========== VERIFIED SUSPECTS TAB ========== */}
        <TabsContent value="suspects" className="space-y-6">
          <SuspectManagement
            suspects={verifiedSuspects}
            setSuspects={setVerifiedSuspects}
            loading={loading}
            updateAlertStatus={updateAlertStatus}
          />
        </TabsContent>

        {/* ========== UNVERIFIED ALERTS TAB ========== */}
        <TabsContent value="alerts" className="space-y-6">
          <AlertManagement
            alerts={alerts}
            setAlerts={setAlerts}
            loading={loading}
            fetchAlerts={fetchAlerts}
            updateAlertStatus={updateAlertStatus}
            token={token}
            onSuspectVerified={handleSuspectVerified}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
