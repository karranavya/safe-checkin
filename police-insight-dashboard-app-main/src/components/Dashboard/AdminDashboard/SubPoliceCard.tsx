// components/Dashboard/AdminDashboard/SubPoliceCard.tsx - NEW FILE
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  MapPin,
  Shield,
  Mail,
  Clock,
  Activity,
  Eye,
  MoreHorizontal,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface SubPoliceCardProps {
  officer: SubPoliceOfficer;
  onToggleStatus: (officerId: string, currentStatus: boolean) => void;
}

export const SubPoliceCard: React.FC<SubPoliceCardProps> = ({
  officer,
  onToggleStatus,
}) => {
  const formatLastLogin = (dateString: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg">{officer.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Badge #{officer.badgeNumber}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Activity className="h-4 w-4 mr-2" />
              View Activities
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onToggleStatus(officer._id, officer.isActive)}
            >
              {officer.isActive ? (
                <>
                  <UserX className="h-4 w-4 mr-2" />
                  Deactivate
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <Badge className={getStatusColor(officer.isActive)}>
            {officer.isActive ? "Active" : "Inactive"}
          </Badge>
          <div className="text-sm text-muted-foreground">{officer.rank}</div>
        </div>

        {/* Officer Details */}
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-3 w-3 mr-2" />
            {officer.station}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Mail className="h-3 w-3 mr-2" />
            {officer.email}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-3 w-3 mr-2" />
            Last login: {formatLastLogin(officer.lastLoginAt)}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold">
              {officer.loginCount || 0}
            </div>
            <div className="text-xs text-muted-foreground">Total Logins</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">24</div>
            <div className="text-xs text-muted-foreground">Activities</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Activity className="h-3 w-3 mr-1" />
            Activities
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
