// components/Dashboard/AdminDashboard/SubPoliceManagement.tsx
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, RefreshCw, Filter, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubPoliceCard } from "./SubPoliceCard";
import { useToast } from "@/hooks/use-toast";

interface SubPoliceOfficer {
  _id: string;
  name: string;
  badgeNumber: string;
  email: string;
  station: string;
  rank: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string;
  loginCount: number;
  createdAt: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export const SubPoliceManagement = () => {
  const [officers, setOfficers] = useState<SubPoliceOfficer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    isActive: "all",
    station: "all",
  });
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = async (page = 1, customFilters = filters) => {
    try {
      setIsLoading(page === 1);
      setIsRefreshing(page !== 1);

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const token =
        localStorage.getItem("policeToken") ||
        sessionStorage.getItem("policeToken");

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (customFilters.isActive !== "all")
        queryParams.append("isActive", customFilters.isActive);
      if (customFilters.station !== "all")
        queryParams.append("station", customFilters.station);

      console.log("Fetching sub-police officers...");

      const response = await fetch(
        `${apiUrl}/api/police/sub-police?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Sub-police data:", data);

        if (page === 1) {
          setOfficers(data.data.officers || []);
        } else {
          setOfficers((prev) => [...prev, ...(data.data.officers || [])]);
        }

        setPagination(data.data.pagination);
      } else {
        throw new Error("Failed to fetch officers");
      }
    } catch (error) {
      console.error("Error fetching officers:", error);
      toast({
        title: "Error",
        description: "Failed to load officers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchOfficers(1, newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: "",
      isActive: "all",
      station: "all",
    };
    setFilters(clearedFilters);
    fetchOfficers(1, clearedFilters);
  };

  const refreshOfficers = () => {
    fetchOfficers(1, filters);
  };

  const handleToggleStatus = async (
    officerId: string,
    currentStatus: boolean
  ) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const token =
        localStorage.getItem("policeToken") ||
        sessionStorage.getItem("policeToken");

      const response = await fetch(
        `${apiUrl}/api/police/officer/${officerId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isActive: !currentStatus }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: `Officer ${
            currentStatus ? "deactivated" : "activated"
          } successfully`,
        });
        fetchOfficers(1, filters);
      }
    } catch (error) {
      console.error("Error updating officer status:", error);
      toast({
        title: "Error",
        description: "Failed to update officer status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sub-Police Management</h2>
          <p className="text-muted-foreground">
            Monitor and manage {pagination.totalCount} sub-police officers
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={refreshOfficers}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Officer
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search officers..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.isActive}
              onValueChange={(value) => handleFilterChange("isActive", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.station}
              onValueChange={(value) => handleFilterChange("station", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Stations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stations</SelectItem>
                <SelectItem value="District Police Station">
                  District Police Station
                </SelectItem>
                <SelectItem value="Central Police Station">
                  Central Police Station
                </SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={clearFilters} className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Officers Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Officers</span>
            <Badge variant="secondary">
              {pagination.totalCount} total officers
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : officers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {officers.map((officer) => (
                <SubPoliceCard
                  key={officer._id}
                  officer={officer}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                No officers found matching your criteria
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
