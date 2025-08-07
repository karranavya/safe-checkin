import { Menu, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface HotelData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  ownerName: string;
  numberOfRooms: number;
  roomRate: number;
}

const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const [hotelData, setHotelData] = useState<HotelData | null>(null);

  useEffect(() => {
    // Get hotel data from localStorage
    const storedHotelData = localStorage.getItem("hotelData");
    if (storedHotelData) {
      try {
        const parsedData = JSON.parse(storedHotelData);
        setHotelData(parsedData);
      } catch (error) {
        console.error("Error parsing hotel data:", error);
      }
    }
  }, []);

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
      <Button
        variant="outline"
        size="icon"
        className="shrink-0 lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle navigation menu</span>
      </Button>

      {/* Hotel Name Display */}
      {hotelData && (
        <div className="flex items-center gap-2 ml-auto">
          <Building className="h-5 w-5 text-blue-600" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900">
              {hotelData.name}
            </span>
            <span className="text-xs text-gray-500 hidden sm:block">
              {hotelData.numberOfRooms} Rooms • ₹{hotelData.roomRate}/night
            </span>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
