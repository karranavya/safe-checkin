// GuestTable.tsx - COMPLETE with working dropdown menus
import { useState } from "react";
import {
  Eye,
  Phone,
  MapPin,
  Calendar,
  MoreHorizontal,
  UserCheck,
  UserX,
  Edit,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface Guest {
  id: string;
  _id?: string;
  name?: string;
  phone?: string;
  email?: string;
  nationality?: string;
  roomNumber?: string;
  checkInDate: string;
  checkInTime?: string;
  checkOutDate?: string;
  status: "checked-in" | "checked-out" | "pending" | "reported" | "flagged";
  purposeOfVisit?: string;
  purpose?: string;
  referenceNumber?: string;
  totalGuests?: number;
  guestCount?: number;
  maleGuests?: number;
  femaleGuests?: number;
  childGuests?: number;
  bookingWebsite?: string;
  bookingMode?: "Direct" | "Online" | "Travel Agent";
  isFlagged?: boolean;
  // Updated photo interface for file paths
  photos?: {
    guestPhoto?: {
      path?: string;
      filename?: string;
      originalName?: string;
    };
    idFront?: {
      path?: string;
      filename?: string;
      originalName?: string;
    };
    idBack?: {
      path?: string;
      filename?: string;
      originalName?: string;
    };
  };
}

interface GuestTableProps {
  guests: Guest[];
  onViewGuest: (guest: Guest) => void;
  onCheckOut: (guestId: string) => void;
  onEditGuest?: (guest: Guest) => void;
  onFlagGuest?: (guest: Guest) => void;
}

export function GuestTable({
  guests,
  onViewGuest,
  onCheckOut,
  onEditGuest,
  onFlagGuest,
}: GuestTableProps) {
  // Track which dropdown is open to prevent conflicts
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const getStatusBadge = (status: Guest["status"]) => {
    switch (status) {
      case "checked-in":
        return (
          <Badge variant="default" className="bg-green-500 text-white">
            Checked In
          </Badge>
        );
      case "checked-out":
        return <Badge variant="secondary">Checked Out</Badge>;
      case "pending":
        return (
          <Badge
            variant="outline"
            className="border-yellow-500 text-yellow-600"
          >
            Pending
          </Badge>
        );
      case "reported":
        return (
          <Badge variant="outline" className="border-red-500 text-red-600">
            Reported
          </Badge>
        );
      case "flagged":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Flagged
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Invalid date"
      : date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  };

  const getInitials = (name?: string) => {
    if (!name || typeof name !== "string") return "NA";
    const nameParts = name.trim().split(" ");
    return nameParts
      .map((n) => n[0] || "")
      .join("")
      .toUpperCase();
  };

  // Helper function to get the booking display text
  const getBookingDisplay = (guest: Guest) => {
    const bookingMode = guest.bookingMode;
    const bookingWebsite = guest.bookingWebsite;

    if (bookingMode && bookingMode.toLowerCase() === "online") {
      if (bookingWebsite && bookingWebsite.trim() !== "") {
        return bookingWebsite;
      } else {
        return "Online (No website specified)";
      }
    } else if (bookingMode) {
      return bookingMode;
    } else {
      return "N/A";
    }
  };

  // Helper function to get purpose of visit
  const getPurposeOfVisit = (guest: Guest) => {
    return guest.purposeOfVisit || guest.purpose || "N/A";
  };

  // Helper function to get total guests count
  const getTotalGuests = (guest: Guest) => {
    return guest.totalGuests ?? guest.guestCount ?? 0;
  };

  // Handle dropdown actions
  const handleDropdownAction = (action: string, guest: Guest) => {
    console.log(`Action: ${action} for guest:`, guest.name);
    setOpenDropdown(null); // Close dropdown after action

    switch (action) {
      case "view":
        onViewGuest(guest);
        break;
      case "checkout":
        onCheckOut(guest._id || guest.id || "");
        break;
      case "edit":
        onEditGuest?.(guest);
        break;
      case "flag":
        onFlagGuest?.(guest);
        break;
      default:
        console.warn("Unknown action:", action);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Guest Records ({guests.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guests.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <UserCheck className="w-12 h-12 opacity-20" />
                      <p>No guests found matching your criteria</p>
                      <p className="text-sm">
                        New guest registrations will appear here
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                guests.map((guest) => {
                  const guestId = guest._id || guest.id;
                  return (
                    <TableRow
                      key={guestId}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback
                              className={`text-xs ${
                                guest.isFlagged
                                  ? "bg-red-100 text-red-700 border-red-300"
                                  : "bg-primary/10 text-primary"
                              }`}
                            >
                              {getInitials(guest.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {guest.name || "Unnamed"}
                              {guest.isFlagged && (
                                <AlertTriangle className="w-3 h-3 text-red-500" />
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {guest.nationality || "Unknown"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3" />
                            {guest.phone || "N/A"}
                          </div>
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {guest.email || "N/A"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {guest.roomNumber || "N/A"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {getTotalGuests(guest)} guest
                          {getTotalGuests(guest) !== 1 ? "s" : ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3" />
                          {formatDate(guest.checkInDate)}
                        </div>
                        {guest.checkOutDate && (
                          <div className="text-sm text-muted-foreground">
                            Out: {formatDate(guest.checkOutDate)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(guest.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {getPurposeOfVisit(guest)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getBookingDisplay(guest)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu
                          open={openDropdown === guestId}
                          onOpenChange={(open) => {
                            setOpenDropdown(open ? guestId : null);
                          }}
                        >
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log(
                                  "Dropdown trigger clicked for guest:",
                                  guest.name
                                );
                              }}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48"
                            sideOffset={5}
                          >
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                handleDropdownAction("view", guest);
                              }}
                              className="cursor-pointer"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>

                            {guest.status === "checked-in" && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDropdownAction("checkout", guest);
                                }}
                                className="cursor-pointer"
                              >
                                <UserX className="w-4 h-4 mr-2" />
                                Check Out
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                handleDropdownAction("edit", guest);
                              }}
                              className="cursor-pointer"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>

                            {!guest.isFlagged && onFlagGuest && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDropdownAction("flag", guest);
                                  }}
                                  className="cursor-pointer text-red-600 focus:text-red-600"
                                >
                                  <AlertTriangle className="w-4 h-4 mr-2" />
                                  Flag Guest
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
