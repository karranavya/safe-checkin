// pages/police/EvidencePage.tsx - NEW PAGE
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  RefreshCw,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
} from "lucide-react";
import EvidenceModal from "./EvidenceModal";

export default function EvidencePage() {
  const { toast } = useToast();
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchAllEvidence();
  }, []);

  const fetchAllEvidence = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("policeToken");
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

      const response = await fetch(`${apiUrl}/api/evidence/police/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEvidence(data.evidence || []);
      }
    } catch (error) {
      console.error("Error fetching evidence:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load evidence",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEvidence = evidence.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status) => {
    const badges = {
      "Pending Review": (
        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      ),
      Approved: (
        <Badge className="bg-green-100 text-green-800 text-xs">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      ),
      Rejected: (
        <Badge className="bg-red-100 text-red-800 text-xs">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      ),
    };
    return badges[status] || badges["Pending Review"];
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Evidence Management
          </h1>
          <p className="text-gray-500 mt-1">
            Review and manage submitted evidence
          </p>
        </div>
        <Button
          onClick={fetchAllEvidence}
          disabled={loading}
          variant="outline"
          className="rounded-lg"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Evidence</p>
                <p className="text-3xl font-bold">{evidence.length}</p>
              </div>
              <FileText className="h-12 w-12 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Pending Review</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {evidence.filter((e) => e.status === "Pending Review").length}
                </p>
              </div>
              <Clock className="h-12 w-12 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Approved</p>
                <p className="text-3xl font-bold text-green-600">
                  {evidence.filter((e) => e.status === "Approved").length}
                </p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Rejected</p>
                <p className="text-3xl font-bold text-red-600">
                  {evidence.filter((e) => e.status === "Rejected").length}
                </p>
              </div>
              <XCircle className="h-12 w-12 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search evidence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-lg"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending Review">Pending Review</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="CCTV">CCTV</SelectItem>
                <SelectItem value="Photo">Photo</SelectItem>
                <SelectItem value="Document">Document</SelectItem>
                <SelectItem value="Report">Report</SelectItem>
                <SelectItem value="Statement">Statement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Evidence List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredEvidence.map((item) => (
          <Card
            key={item._id}
            className="rounded-lg hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-sm">{item.title}</h3>
                    {getStatusBadge(item.status)}
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-600 mb-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                    <span>•</span>
                    <span>{item.files?.length || 0} files</span>
                    <span>•</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{item.hotelId?.name || "Unknown Hotel"}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-xs"
                  onClick={() => {
                    setSelectedEvidence(item);
                    setShowModal(true);
                  }}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Evidence Modal */}
      {showModal && selectedEvidence && (
        <EvidenceModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedEvidence(null);
          }}
          evidence={selectedEvidence}
          token={localStorage.getItem("policeToken") || ""}
          onUpdate={fetchAllEvidence}
        />
      )}
    </div>
  );
}
