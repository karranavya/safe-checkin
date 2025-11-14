// contexts/RoomContext.tsx - Updated with photo support
import { createContext, useContext, useState, ReactNode } from "react";

interface GuestInfo {
  name: string;
  idType: string;
  idNumber: string; // Changed from aadhar to match your backend
  isPrimary?: boolean;
  email?: string;
}

interface PhotoFiles {
  guestPhoto: File | null;
  idFront: File | null;
  idBack: File | null;
}

interface Guest {
  id: string;
  name: string;
  phone: string;
  email: string;
  nationality: string;
  purpose: string;
  guestCount: number;
  maleGuests: number;
  femaleGuests: number;
  childGuests: number;
  checkInTime: string;
  bookingWebsite?: string;
  referenceNumber?: string;
  guests: GuestInfo[];
  // Add photo support
  photos?: {
    guestPhoto: { fileId: string | null; filename: string | null };
    idFront: { fileId: string | null; filename: string | null };
    idBack: { fileId: string | null; filename: string | null };
  };
}

interface RoomData {
  roomNumber: string;
  guest: Guest;
  isOccupied: boolean;
}

interface RoomContextType {
  checkedIn: number;
  incomplete: number;
  available: number;
  total: number;
  rooms: Record<string, RoomData>;
  checkIn: (roomNumber: string, guestData: Guest) => void;
  checkOut: (roomNumber: string) => void;
  getRoomData: (roomNumber: string) => RoomData | null;
  getAllOccupiedRooms: () => RoomData[];
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider = ({ children }: { children: ReactNode }) => {
  const totalRooms = 10;
  const [rooms, setRooms] = useState<Record<string, RoomData>>({});
  const [incomplete, setIncomplete] = useState(0);

  const checkedIn = Object.values(rooms).filter(
    (room) => room.isOccupied
  ).length;
  const available = totalRooms - checkedIn - incomplete;

  const checkIn = (roomNumber: string, guestData: Guest) => {
    setRooms((prev) => ({
      ...prev,
      [roomNumber]: {
        roomNumber,
        guest: guestData,
        isOccupied: true,
      },
    }));
  };

  const checkOut = (roomNumber: string) => {
    setRooms((prev) => {
      const newRooms = { ...prev };
      delete newRooms[roomNumber];
      return newRooms;
    });
  };

  const getRoomData = (roomNumber: string): RoomData | null => {
    return rooms[roomNumber] || null;
  };

  const getAllOccupiedRooms = (): RoomData[] => {
    return Object.values(rooms).filter((room) => room.isOccupied);
  };

  const value = {
    checkedIn,
    incomplete,
    available,
    total: totalRooms,
    rooms,
    checkIn,
    checkOut,
    getRoomData,
    getAllOccupiedRooms,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
};

export const useRooms = () => {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error("useRooms must be used within a RoomProvider");
  }
  return context;
};
