import { useState } from "react";
import {
  Eye,
  Phone,
  MapPin,
  Calendar,
  MoreHorizontal,
  UserCheck,
  UserX,
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
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// ... [imports unchanged]

export interface Guest {
  id: string;
  _id?: string;
  name?: string;
  phone?: string;
  email?: string;
  nationality?: string;
  roomNumber?: string;
  checkInDate: string;
  checkInTime?: string; // Added from schema
  checkOutDate?: string;
  status: "checked-in" | "checked-out" | "pending" | "reported"; // Added "reported" from schema
  purposeOfVisit?: string;
  purpose?: string; // From schema
  referenceNumber?: string;
  totalGuests?: number;
  guestCount?: number; // From schema
  maleGuests?: number; // From schema
  femaleGuests?: number; // From schema
  childGuests?: number; // From schema
  bookingWebsite?: string; // From schema
  bookingMode?: "Direct" | "Online" | "Travel Agent"; // From schema with exact enum values
}

interface GuestTableProps {
  guests: Guest[];
  onViewGuest: (guest: Guest) => void;
  onCheckOut: (guestId: string) => void;
}

export function GuestTable({
  guests,
  onViewGuest,
  onCheckOut,
}: GuestTableProps) {
  const getStatusBadge = (status: Guest["status"]) => {
    switch (status) {
      case "checked-in":
        return (
          <Badge
            variant="default"
            className="bg-success text-success-foreground"
          >
            Checked In
          </Badge>
        );
      case "checked-out":
        return <Badge variant="secondary">Checked Out</Badge>;
      case "pending":
        return (
          <Badge variant="outline" className="border-warning text-warning">
            Pending
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
    console.log("Guest booking data:", {
      bookingMode: guest.bookingMode,
      bookingWebsite: guest.bookingWebsite,
    });

    const bookingMode = guest.bookingMode;
    const bookingWebsite = guest.bookingWebsite;

    // Check if booking mode is "Online" (case-insensitive)
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Guest Records
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
                    No guests found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                guests.map((guest) => (
                  <TableRow
                    key={guest._id || guest.id}
                    className="hover:bg-muted/50"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(guest.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {guest.name || "Unnamed"}
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
                        <div className="text-sm text-muted-foreground">
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
                      <div className="text-sm">{getPurposeOfVisit(guest)}</div>
                      <div className="text-xs text-muted-foreground">
                        {getBookingDisplay(guest)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewGuest(guest)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {guest.status === "checked-in" && (
                            <DropdownMenuItem
                              onClick={() =>
                                onCheckOut(guest._id || guest.id || "")
                              }
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Check Out
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
