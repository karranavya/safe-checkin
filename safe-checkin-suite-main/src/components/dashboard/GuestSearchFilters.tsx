import { useState } from "react";
import { Search, Filter, Download, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GuestSearchFiltersProps {
  onSearch: (filters: GuestFilters) => void;
  totalGuests: number;
}

export interface GuestFilters {
  search: string;
  status: string;
  nationality: string;
  checkInDate: string;
  roomNumber: string;
}

export function GuestSearchFilters({
  onSearch,
  totalGuests,
}: GuestSearchFiltersProps) {
  const [filters, setFilters] = useState<GuestFilters>({
    search: "",
    status: "all",
    nationality: "all",
    checkInDate: "",
    roomNumber: "",
  });

  const handleFilterChange = (key: keyof GuestFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: GuestFilters = {
      search: "",
      status: "all",
      nationality: "all",
      checkInDate: "",
      roomNumber: "",
    };
    setFilters(clearedFilters);
    onSearch(clearedFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(
    (value) => value && value !== "all" && value !== ""
  ).length;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Search and Actions Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name, phone, reference number..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearFilters}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Status
              </label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="checked-in">Checked In</SelectItem>
                  <SelectItem value="checked-out">Checked Out</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Nationality
              </label>
              <Select
                value={filters.nationality}
                onValueChange={(value) =>
                  handleFilterChange("nationality", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All nationalities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Nationalities</SelectItem>
                  <SelectItem value="indian">Indian</SelectItem>
                  <SelectItem value="american">American</SelectItem>
                  <SelectItem value="british">British</SelectItem>
                  <SelectItem value="canadian">Canadian</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Room Number
              </label>
              <Input
                placeholder="Room number"
                value={filters.roomNumber}
                onChange={(e) =>
                  handleFilterChange("roomNumber", e.target.value)
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Check-in Date
              </label>
              <Input
                type="date"
                value={filters.checkInDate}
                onChange={(e) =>
                  handleFilterChange("checkInDate", e.target.value)
                }
              />
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Showing {totalGuests} guest{totalGuests !== 1 ? "s" : ""}
              </span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  {activeFiltersCount} filter
                  {activeFiltersCount !== 1 ? "s" : ""} active
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
