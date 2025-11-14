// components/Evidence/EvidenceManager.tsx - VIEW & MANAGE
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface Evidence {
  _id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  files: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
  }>;
  createdAt: string;
  sharedWith: Array<any>;
}

interface EvidenceManagerProps {
  suspectId?: string;
}

export default function EvidenceManager({ suspectId }: EvidenceManagerProps) {
  const { toast } = useToast();
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (suspectId) {
      fetchEvidence();
    }
  }, [suspectId]);

  const fetchEvidence = async () => {
    try {
      setLoading(true);
      const token =
        localStorage.getItem("token") || localStorage.getItem("hotelToken");
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

      const response = await fetch(
        `${apiUrl}/api/evidence/suspect/${suspectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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

  const getStatusBadge = (status: string) => {
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
    return badges[status as keyof typeof badges] || badges["Pending Review"];
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <RefreshCw className="h-8 w-8 mx-auto animate-spin text-gray-400 mb-2" />
        <p className="text-gray-600 text-sm">Loading evidence...</p>
      </div>
    );
  }

  if (evidence.length === 0) {
    return (
      <Card className="rounded-lg">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 font-medium">No Evidence Uploaded</p>
            <p className="text-sm text-gray-500 mt-1">
              Upload evidence files to share with police
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          Uploaded Evidence ({evidence.length})
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchEvidence}
          disabled={loading}
          className="rounded-lg"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="space-y-3">
        {evidence.map((item) => (
          <Card key={item._id} className="rounded-lg">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="text-xs text-gray-600 mt-1">
                      {item.description}
                    </p>
                  )}
                </div>
                {getStatusBadge(item.status)}
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <Badge variant="outline" className="text-xs">
                  {item.category}
                </Badge>
                <span>•</span>
                <span>{item.files.length} file(s)</span>
                <span>•</span>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-xs text-gray-600">
                  Shared with {item.sharedWith.length} officer(s)
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
