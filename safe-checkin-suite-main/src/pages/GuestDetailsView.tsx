// GuestDetailsView.tsx — Edit Details (payment + guest count) + unlimited Stay Extension
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Building,
  Globe,
  Camera,
  X,
  ZoomIn,
  Download,
  Eye,
  AlertTriangle,
  Upload,
  FileText,
  CalendarClock,
  IndianRupee,
  Edit2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import EvidenceUpload from "@/components/Evidence/EvidenceUpload";
import HotelEvidenceViewer from "@/components/Evidence/HotelEvidenceViewer";

const BASE = () => import.meta.env.VITE_API_URL || "http://localhost:5000";
const TOKEN = () => localStorage.getItem("hotelToken");
const authHeaders = () => ({ Authorization: `Bearer ${TOKEN()}` });

interface PhotoInfo {
  path?: string;
  filename?: string;
  originalName?: string;
  size?: number;
  uploadTime?: string;
}
interface Guest {
  id?: string;
  _id?: string;
  name?: string;
  phone?: string;
  email?: string;
  nationality?: string;
  roomNumber?: string;
  checkInDate: string;
  checkOutDate?: string;
  status: "checked-in" | "checked-out" | "pending" | "reported" | "flagged";
  purposeOfVisit?: string;
  referenceNumber?: string;
  totalGuests?: number;
  guestCount?: number;
  maleGuests?: number;
  femaleGuests?: number;
  childGuests?: number;
  bookingWebsite?: string;
  isFlagged?: boolean;
  flagReason?: string;
  totalAmount?: number;
  advanceAmount?: number;
  balanceAmount?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  photos?: { guestPhoto?: PhotoInfo; idFront?: PhotoInfo; idBack?: PhotoInfo };
  hotelId?: string;
}

// ── Checkout Confirmation Modal ──────────────────────────────────────────────
const CheckOutModal = ({
  guest,
  onClose,
  onSuccess,
}: {
  guest: Guest;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    setError("");
    setLoading(true);
    try {
      const guestId = guest._id || guest.id;
      await axios.put(
        `${BASE()}/api/guests/${guestId}/checkout`,
        {
          checkOutDate: new Date().toISOString(),
          finalAmount: guest.totalAmount,
          notes: notes.trim() || undefined,
        },
        { headers: { ...authHeaders(), "Content-Type": "application/json" } },
      );
      toast({
        title: "Checked Out",
        description: `${guest.name} has been checked out successfully.`,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to check out guest.");
    } finally {
      setLoading(false);
    }
  };

  const fmtShort = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "N/A";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Confirm Check Out</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-muted/50 rounded-xl p-4 mb-5 space-y-1">
          <p className="font-medium">{guest.name}</p>
          <p className="text-xs text-muted-foreground">
            Room {guest.roomNumber} · Checked in {fmtShort(guest.checkInDate)}
          </p>
          {guest.checkOutDate && (
            <p className="text-xs text-amber-600">
              Scheduled checkout: {fmtShort(guest.checkOutDate)}
            </p>
          )}
          {(guest.balanceAmount ?? 0) > 0 && (
            <p className="text-xs text-red-600 font-medium">
              ⚠️ Balance due: ₹{(guest.balanceAmount ?? 0).toFixed(2)}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1.5">
            Notes <span className="text-muted-foreground">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any remarks about this checkout..."
            rows={3}
            maxLength={300}
            className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg mb-4">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Checking out...
              </span>
            ) : (
              "Confirm Check Out"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Stay Extension Modal (unlimited, no "already extended" check) ────────────
const ExtendStayModal = ({
  guest,
  onClose,
  onSuccess,
}: {
  guest: Guest;
  onClose: () => void;
  onSuccess: (newDate: string) => void;
}) => {
  const { toast } = useToast();
  const [newDate, setNewDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  useEffect(() => {
    if (guest.checkOutDate) {
      const existing = new Date(guest.checkOutDate);
      const today = new Date();
      // Pre-fill: one day after CURRENT checkout date (so each extension adds on top)
      const suggest = existing > today ? existing : today;
      suggest.setDate(suggest.getDate() + 1);
      setNewDate(suggest.toISOString().split("T")[0]);
    } else {
      setNewDate(minDate);
    }
  }, [guest.checkOutDate]);

  const fmtShort = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const handleSubmit = async () => {
    setError("");
    if (!newDate) {
      setError("Please select a new checkout date.");
      return;
    }
    const selected = new Date(newDate);
    if (selected <= new Date()) {
      setError("New checkout date must be in the future.");
      return;
    }
    // No longer enforcing "must be after existing checkout" — hotel can freely set any future date
    setLoading(true);
    try {
      const guestId = guest._id || guest.id;
      await axios.patch(
        `${BASE()}/api/guests/${guestId}/extend-stay`,
        {
          newCheckOutDate: selected.toISOString(),
          reason: reason.trim() || "Stay extension",
        },
        { headers: { ...authHeaders(), "Content-Type": "application/json" } },
      );
      toast({
        title: "Stay Extended",
        description: `New checkout: ${fmtShort(newDate)}`,
      });
      onSuccess(selected.toISOString());
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to extend stay.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Extend Stay</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-muted/50 rounded-xl p-4 mb-5 space-y-1">
          <p className="font-medium text-sm">{guest.name}</p>
          <p className="text-xs text-muted-foreground">
            Room {guest.roomNumber}
          </p>
          {guest.checkOutDate ? (
            <p className="text-xs text-amber-600 font-medium">
              Current checkout: {fmtShort(guest.checkOutDate)}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No checkout date set
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              New Checkout Date <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              value={newDate}
              min={minDate}
              onChange={(e) => {
                setNewDate(e.target.value);
                setError("");
              }}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Reason <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Business trip extended, family visit..."
              rows={3}
              maxLength={300}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {reason.length}/300
            </p>
          </div>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={loading || !newDate}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Saving...
              </span>
            ) : (
              "Confirm Extension"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Edit Details Modal (payment amounts + guest count) ───────────────────────
const EditDetailsModal = ({
  guest,
  onClose,
  onSuccess,
}: {
  guest: Guest;
  onClose: () => void;
  onSuccess: (updates: Partial<Guest>) => void;
}) => {
  const { toast } = useToast();
  const [totalAmount, setTotalAmount] = useState(
    String(guest.totalAmount ?? 0),
  );
  const [advanceAmount, setAdvanceAmount] = useState(
    String(guest.advanceAmount ?? 0),
  );
  const [paymentMethod, setPaymentMethod] = useState(
    guest.paymentMethod || "Cash",
  );
  const [guestCount, setGuestCount] = useState(
    String(guest.guestCount ?? guest.totalGuests ?? 1),
  );
  const [maleGuests, setMaleGuests] = useState(String(guest.maleGuests ?? 0));
  const [femaleGuests, setFemaleGuests] = useState(
    String(guest.femaleGuests ?? 0),
  );
  const [childGuests, setChildGuests] = useState(
    String(guest.childGuests ?? 0),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = Number(totalAmount) || 0;
  const advance = Number(advanceAmount) || 0;
  const balance = total - advance;

  const handleSubmit = async () => {
    setError("");

    const gc = Number(guestCount);
    const male = Number(maleGuests);
    const female = Number(femaleGuests);
    const child = Number(childGuests);

    if (gc < 1) {
      setError("Guest count must be at least 1.");
      return;
    }
    if (male + female + child !== gc) {
      setError(
        `Guest breakdown (${male + female + child}) must equal total guests (${gc}).`,
      );
      return;
    }
    if (advance > total) {
      setError("Advance paid cannot exceed total amount.");
      return;
    }

    setLoading(true);
    try {
      const guestId = guest._id || guest.id;
      await axios.patch(
        `${BASE()}/api/guests/${guestId}/update-details`,
        {
          totalAmount: total,
          advanceAmount: advance,
          paymentMethod,
          guestCount: gc,
          maleGuests: male,
          femaleGuests: female,
          childGuests: child,
        },
        { headers: { ...authHeaders(), "Content-Type": "application/json" } },
      );
      toast({
        title: "Details Updated",
        description: "Guest information saved successfully.",
      });
      onSuccess({
        totalAmount: total,
        advanceAmount: advance,
        balanceAmount: balance,
        paymentMethod,
        guestCount: gc,
        totalGuests: gc,
        maleGuests: male,
        femaleGuests: female,
        childGuests: child,
        paymentStatus:
          advance >= total && total > 0
            ? "Paid"
            : advance > 0
              ? "Partial"
              : "Pending",
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Edit Details</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Payment */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-muted-foreground" /> Payment
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Total Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Advance Paid (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              >
                {["Cash", "Card", "UPI", "Bank Transfer", "Cheque"].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-5 px-3 py-2 bg-muted/50 rounded-lg text-xs">
              <span>
                Total: <strong>₹{total.toFixed(2)}</strong>
              </span>
              <span>
                Advance:{" "}
                <strong className="text-green-600">
                  ₹{advance.toFixed(2)}
                </strong>
              </span>
              <span>
                Balance:{" "}
                <strong
                  className={balance > 0 ? "text-amber-600" : "text-green-600"}
                >
                  ₹{balance.toFixed(2)}
                </strong>
              </span>
            </div>
          </div>

          {/* Guest Count */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
              <User className="w-4 h-4 text-muted-foreground" /> Guest Count
            </h3>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Total</label>
                <input
                  type="number"
                  min="1"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Male</label>
                <input
                  type="number"
                  min="0"
                  value={maleGuests}
                  onChange={(e) => setMaleGuests(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Female</label>
                <input
                  type="number"
                  min="0"
                  value={femaleGuests}
                  onChange={(e) => setFemaleGuests(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Child</label>
                <input
                  type="number"
                  min="0"
                  value={childGuests}
                  onChange={(e) => setChildGuests(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                />
              </div>
            </div>
            {(() => {
              const sum =
                Number(maleGuests) + Number(femaleGuests) + Number(childGuests);
              const total = Number(guestCount);
              if (sum !== total && (sum > 0 || total > 0)) {
                return (
                  <p className="text-xs text-amber-600 mt-1">
                    Breakdown ({sum}) must equal total ({total})
                  </p>
                );
              }
              return null;
            })()}
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Photo Modal ──────────────────────────────────────────────────────────────
const PhotoModal = ({
  isOpen,
  onClose,
  photoUrl,
  title,
  filename,
}: {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string;
  title: string;
  filename?: string;
}) => {
  if (!isOpen) return null;
  const handleDownload = async () => {
    try {
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `${title}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed:", e);
    }
  };
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-4xl max-h-[90vh] w-full">
        <div className="absolute top-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-4 flex justify-between items-center z-10 rounded-t-lg">
          <h3 className="text-white font-semibold">{title}</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="text-white hover:bg-white/10"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <img
          src={photoUrl}
          alt={title}
          className="w-full h-full object-contain rounded-lg shadow-2xl"
          style={{ maxHeight: "calc(90vh - 4rem)" }}
        />
        {filename && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-3 rounded-b-lg">
            <p className="text-white text-sm text-center">{filename}</p>
          </div>
        )}
      </div>
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};

// ── Photo Gallery ────────────────────────────────────────────────────────────
const PhotoGallery = ({
  photos,
  guestName,
}: {
  photos: Guest["photos"];
  guestName: string;
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<{
    url: string;
    title: string;
    filename?: string;
  } | null>(null);
  const [imageLoadStates, setImageLoadStates] = useState<{
    [key: string]: "loading" | "loaded" | "error";
  }>({});

  const getPhotoUrl = (photoInfo: PhotoInfo) => {
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    const photoPath = photoInfo.path || photoInfo.filename || "";
    const cleanPath = photoPath.startsWith("uploads")
      ? photoPath
      : `uploads/${photoPath}`;
    return `${baseUrl}/${cleanPath}`;
  };

  const photoItems = [
    {
      key: "guestPhoto",
      title: "Guest Photo",
      icon: User,
      photo: photos?.guestPhoto,
      description: "Primary guest photograph",
    },
    {
      key: "idFront",
      title: "ID Front",
      icon: Camera,
      photo: photos?.idFront,
      description: "Front side of ID document",
    },
    {
      key: "idBack",
      title: "ID Back",
      icon: Camera,
      photo: photos?.idBack,
      description: "Back side of ID document",
    },
  ];
  const availablePhotos = photoItems.filter((item) => item.photo?.filename);

  if (availablePhotos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Guest Photos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No photos available for this guest</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Guest Photos ({availablePhotos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photoItems.map(
              ({ key, title, icon: Icon, photo, description }) => {
                if (!photo?.filename) {
                  return (
                    <div
                      key={key}
                      className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center"
                    >
                      <Icon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <h4 className="font-medium text-gray-500 mb-1">
                        {title}
                      </h4>
                      <p className="text-xs text-gray-400">{description}</p>
                      <Badge variant="outline" className="text-xs mt-2">
                        Not Available
                      </Badge>
                    </div>
                  );
                }
                const photoUrl = getPhotoUrl(photo);
                const loadState = imageLoadStates[key] || "loading";
                return (
                  <div
                    key={key}
                    className="relative group border rounded-lg overflow-hidden hover:shadow-md transition-all cursor-pointer bg-white"
                    onClick={() =>
                      setSelectedPhoto({
                        url: photoUrl,
                        title: `${title} - ${guestName}`,
                        filename: photo.filename,
                      })
                    }
                  >
                    <div className="aspect-square overflow-hidden bg-gray-100 relative">
                      {loadState === "loading" && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                        </div>
                      )}
                      <img
                        src={photoUrl}
                        alt={title}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform ${loadState === "loaded" ? "opacity-100" : "opacity-0"}`}
                        onLoad={() =>
                          setImageLoadStates((p) => ({ ...p, [key]: "loaded" }))
                        }
                        onError={() =>
                          setImageLoadStates((p) => ({ ...p, [key]: "error" }))
                        }
                      />
                      {loadState === "error" && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Icon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      {loadState === "loaded" && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 bg-white rounded-full px-3 py-1">
                            <ZoomIn className="w-4 h-4" />
                            <span className="text-sm font-medium">View</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-primary" />
                        <h4 className="font-medium text-sm">{title}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {description}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="secondary" className="text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          {loadState === "loaded"
                            ? "Available"
                            : loadState === "loading"
                              ? "Loading..."
                              : "Error"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {photo.size && `${Math.round(photo.size / 1024)} KB`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              📸 {availablePhotos.length} of 3 photos captured
            </span>
            <span className="text-blue-600">
              Click any photo to view full size
            </span>
          </div>
        </CardContent>
      </Card>
      <PhotoModal
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        photoUrl={selectedPhoto?.url || ""}
        title={selectedPhoto?.title || ""}
        filename={selectedPhoto?.filename}
      />
    </>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
const GuestDetailsView = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (location.state?.guest) {
      setGuest(location.state.guest);
      setLoading(false);
      return;
    }
    if (!id || id === "undefined") {
      setError("Invalid guest ID provided");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${BASE()}/api/guests/${id}`, {
          headers: authHeaders(),
        });
        setGuest(data.data || data);
      } catch {
        setError("Failed to load guest details");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, location.state]);

  const getStatusBadge = (status: Guest["status"]) => {
    const map: Record<string, JSX.Element> = {
      "checked-in": (
        <Badge className="bg-green-500 text-white">Checked In</Badge>
      ),
      "checked-out": <Badge variant="secondary">Checked Out</Badge>,
      pending: (
        <Badge variant="outline" className="border-yellow-500 text-yellow-600">
          Pending
        </Badge>
      ),
      flagged: (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Flagged
        </Badge>
      ),
    };
    return map[status] || <Badge variant="outline">Unknown</Badge>;
  };

  const fmtDate = (d?: string) => {
    if (!d) return "N/A";
    const dt = new Date(d);
    return isNaN(dt.getTime())
      ? "N/A"
      : dt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
  };

  const getInitials = (name?: string) =>
    (name || "NA")
      .trim()
      .split(" ")
      .map((n) => n[0] || "")
      .join("")
      .toUpperCase();

  if (loading)
    return (
      <div className="space-y-6 p-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
        </div>
      </div>
    );

  if (error || !guest)
    return (
      <div className="space-y-6 p-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              {error || "Guest not found."}
            </p>
          </CardContent>
        </Card>
      </div>
    );

  const guestId = guest._id || guest.id || "";
  const isCheckedIn = guest.status === "checked-in";
  const total = guest.totalAmount ?? 0;
  const advance = guest.advanceAmount ?? 0;
  const balance = guest.balanceAmount ?? total - advance;
  const guestCount = guest.guestCount ?? guest.totalGuests ?? 1;

  return (
    <div className="space-y-6 p-6">
      {showCheckoutModal && (
        <CheckOutModal
          guest={guest}
          onClose={() => setShowCheckoutModal(false)}
          onSuccess={() => {
            setGuest((p) =>
              p
                ? {
                    ...p,
                    status: "checked-out",
                    checkOutDate: new Date().toISOString(),
                  }
                : p,
            );
            setShowCheckoutModal(false);
          }}
        />
      )}
      {showExtendModal && (
        <ExtendStayModal
          guest={guest}
          onClose={() => setShowExtendModal(false)}
          onSuccess={(newDate) => {
            setGuest((p) => (p ? { ...p, checkOutDate: newDate } : p));
            setShowExtendModal(false);
          }}
        />
      )}
      {showEditModal && (
        <EditDetailsModal
          guest={guest}
          onClose={() => setShowEditModal(false)}
          onSuccess={(updates) => {
            setGuest((p) => (p ? { ...p, ...updates } : p));
            setShowEditModal(false);
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Guest Details</h1>
            <p className="text-muted-foreground">
              {guest.name || "Unnamed Guest"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(guest.status)}
          {guest.referenceNumber && (
            <Badge variant="outline">Ref: {guest.referenceNumber}</Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 rounded-lg">
          <TabsTrigger value="details">
            <User className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="photos">
            <Camera className="h-4 w-4 mr-2" />
            Photos
          </TabsTrigger>
          <TabsTrigger value="upload-evidence">
            <Upload className="h-4 w-4 mr-2" />
            Upload Evidence
          </TabsTrigger>
          <TabsTrigger value="view-evidence">
            <Eye className="h-4 w-4 mr-2" />
            View Evidence
          </TabsTrigger>
        </TabsList>

        {/* ── DETAILS TAB ── */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-lg bg-primary/10 text-primary">
                        {getInitials(guest.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-xl">
                        {guest.name || "Unnamed Guest"}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusBadge(guest.status)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Contact */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{guest.phone || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{guest.email || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{guest.nationality || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stay */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Stay Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Room Number
                        </label>
                        <p className="text-lg font-semibold">
                          {guest.roomNumber || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Total Guests
                        </label>
                        <p className="text-lg font-semibold">
                          {guestCount} guest{guestCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      {guest.maleGuests !== undefined && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Breakdown
                          </label>
                          <p className="text-sm">
                            {guest.maleGuests}M · {guest.femaleGuests}F ·{" "}
                            {guest.childGuests}C
                          </p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Check-in Date
                        </label>
                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {fmtDate(guest.checkInDate)}
                        </p>
                      </div>
                      {guest.checkOutDate && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Check-out Date
                          </label>
                          <p className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {fmtDate(guest.checkOutDate)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <IndianRupee className="w-4 h-4" />
                      Payment
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Total
                        </label>
                        <p className="text-lg font-semibold">
                          ₹{total.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Advance
                        </label>
                        <p className="text-lg font-semibold text-green-600">
                          ₹{advance.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Balance
                        </label>
                        <p
                          className={`text-lg font-semibold ${balance > 0 ? "text-amber-600" : "text-green-600"}`}
                        >
                          ₹{balance.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Status
                        </label>
                        <Badge
                          className={`mt-1 ${guest.paymentStatus === "Paid" ? "bg-green-100 text-green-800" : guest.paymentStatus === "Partial" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}
                        >
                          {guest.paymentStatus || "Pending"}
                        </Badge>
                      </div>
                    </div>
                    {guest.paymentMethod && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Method: <strong>{guest.paymentMethod}</strong>
                      </p>
                    )}
                  </div>

                  {/* Visit */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Visit Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Purpose of Visit
                        </label>
                        <p>{guest.purposeOfVisit || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Booking Website
                        </label>
                        <p>{guest.bookingWebsite || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar — Quick Actions */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isCheckedIn && (
                    <Button
                      className="w-full bg-red-50 hover:bg-red-100 border-red-200 text-red-700 hover:text-red-800"
                      variant="outline"
                      onClick={() => setShowCheckoutModal(true)}
                    >
                      Check Out Guest
                    </Button>
                  )}
                  {isCheckedIn && (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => setShowExtendModal(true)}
                    >
                      <CalendarClock className="w-4 h-4 mr-2" />
                      Extend Stay
                    </Button>
                  )}
                  {/* Edit Details — available for all statuses */}
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setShowEditModal(true)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Details
                  </Button>
                  <Button className="w-full" variant="outline">
                    Print Details
                  </Button>
                  {guest.phone && (
                    <Button className="w-full" variant="outline">
                      <Phone className="w-4 h-4 mr-2" />
                      Call Guest
                    </Button>
                  )}
                  {guest.email && (
                    <Button className="w-full" variant="outline">
                      <Mail className="w-4 h-4 mr-2" />
                      Send Email
                    </Button>
                  )}
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setActiveTab("upload-evidence")}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Evidence
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="photos" className="space-y-6">
          <PhotoGallery
            photos={guest.photos}
            guestName={guest.name || "Unknown Guest"}
          />
        </TabsContent>

        <TabsContent value="upload-evidence" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Upload Evidence for Guest
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700 mb-1">
                    Uploading evidence for:
                  </p>
                  <p className="font-semibold text-blue-900 text-lg">
                    {guest.name}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-sm text-blue-700">
                      <Phone className="h-3 w-3" />
                      {guest.phone}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-blue-700">
                      <MapPin className="h-3 w-3" />
                      Room {guest.roomNumber || "N/A"}
                    </div>
                  </div>
                </div>
                <EvidenceUpload
                  suspectId={guestId}
                  guestId={guestId}
                  onUploadSuccess={() =>
                    toast({
                      title: "✅ Success",
                      description: "Evidence uploaded and shared with police",
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view-evidence" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Evidence Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HotelEvidenceViewer suspectId={guestId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GuestDetailsView;
