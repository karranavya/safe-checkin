import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  User,
  Phone,
  CreditCard,
  Car,
  Calendar,
  MapPin,
  AlertTriangle,
  Clock,
  Eye,
  FileText,
  Activity,
} from "lucide-react";

interface SuspectDetails {
  id: string | number;
  name: string;
  aadhar: string;
  phone: string;
  vehicle?: string;
  photo?: string;
  dateAdded: string;
  address?: string;
  email?: string;
  age?: number;
  occupation?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  criminalHistory?: Array<{
    case: string;
    date: string;
    status: string;
    description: string;
  }>;
  associatedAlerts?: Array<{
    id: string;
    title: string;
    type: string;
    priority: string;
    status: string;
    date: string;
    location?: string;
  }>;
  physicalDescription?: {
    height?: string;
    weight?: string;
    eyeColor?: string;
    hairColor?: string;
    distinguishingMarks?: string;
  };
  lastSeen?: {
    location: string;
    date: string;
    reportedBy: string;
  };
}

interface ViewSuspectProps {
  isOpen: boolean;
  onClose: () => void;
  suspect: SuspectDetails | null;
  onUpdateSuspect?: (suspect: SuspectDetails) => void;
}

export default function ViewSuspect({
  isOpen,
  onClose,
  suspect,
  onUpdateSuspect,
}: ViewSuspectProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(false);

  // Reset active tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab("details");
    }
  }, [isOpen]);

  const fetchSuspectDetails = async (suspectId: string | number) => {
    setLoading(true);
    try {
      // This would be your API call to get detailed suspect information
      const response = await fetch(`/api/suspects/${suspectId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("policeToken")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.suspect;
      }
    } catch (error) {
      console.error("Failed to fetch suspect details:", error);
    } finally {
      setLoading(false);
    }
    return null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "critical":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-500 text-black";
      case "low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in progress":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!suspect) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-xl">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <span>{suspect.name}</span>
              <p className="text-sm text-gray-500 font-normal">
                Suspect Profile
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 bg-gray-100">
              <TabsTrigger value="details" className="text-sm">
                Basic Details
              </TabsTrigger>
              <TabsTrigger value="alerts" className="text-sm">
                Associated Alerts
              </TabsTrigger>
              <TabsTrigger value="history" className="text-sm">
                Criminal History
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-sm">
                Recent Activity
              </TabsTrigger>
            </TabsList>

            {/* Basic Details Tab */}
            <TabsContent value="details" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <Card className="rounded-xl shadow-sm border border-gray-200">
                  <CardHeader className="bg-gray-50 rounded-t-xl">
                    <CardTitle className="flex items-center space-x-2 text-gray-900">
                      <User className="h-5 w-5" />
                      <span>Personal Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Full Name
                        </Label>
                        <p className="text-base text-gray-900">
                          {suspect.name}
                        </p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Aadhar Number
                        </Label>
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4 text-gray-400" />
                          <p className="text-base font-mono text-gray-900">
                            {suspect.aadhar}
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Phone Number
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <p className="text-base text-gray-900">
                            {suspect.phone}
                          </p>
                        </div>
                      </div>

                      {suspect.email && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Email Address
                          </Label>
                          <p className="text-base text-gray-900">
                            {suspect.email}
                          </p>
                        </div>
                      )}

                      {suspect.age && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Age
                          </Label>
                          <p className="text-base text-gray-900">
                            {suspect.age} years
                          </p>
                        </div>
                      )}

                      {suspect.occupation && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Occupation
                          </Label>
                          <p className="text-base text-gray-900">
                            {suspect.occupation}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Vehicle & Location Information */}
                <Card className="rounded-xl shadow-sm border border-gray-200">
                  <CardHeader className="bg-gray-50 rounded-t-xl">
                    <CardTitle className="flex items-center space-x-2 text-gray-900">
                      <Car className="h-5 w-5" />
                      <span>Vehicle & Location</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4">
                    <div className="space-y-3">
                      {suspect.vehicle && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Vehicle Number
                          </Label>
                          <div className="flex items-center space-x-2">
                            <Car className="h-4 w-4 text-gray-400" />
                            <p className="text-base font-mono text-gray-900">
                              {suspect.vehicle}
                            </p>
                          </div>
                        </div>
                      )}

                      {suspect.address && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Address
                          </Label>
                          <div className="flex items-start space-x-2">
                            <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                            <p className="text-base text-gray-900">
                              {suspect.address}
                            </p>
                          </div>
                        </div>
                      )}

                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Date Added to Database
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <p className="text-base text-gray-900">
                            {formatDate(suspect.dateAdded)}
                          </p>
                        </div>
                      </div>

                      {suspect.lastSeen && (
                        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <Label className="text-sm font-medium text-orange-800">
                            Last Seen
                          </Label>
                          <div className="mt-1 space-y-1">
                            <p className="text-sm text-orange-900">
                              <strong>Location:</strong>{" "}
                              {suspect.lastSeen.location}
                            </p>
                            <p className="text-sm text-orange-900">
                              <strong>Date:</strong>{" "}
                              {formatDate(suspect.lastSeen.date)}
                            </p>
                            <p className="text-sm text-orange-900">
                              <strong>Reported by:</strong>{" "}
                              {suspect.lastSeen.reportedBy}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Physical Description */}
                {suspect.physicalDescription && (
                  <Card className="rounded-xl shadow-sm border border-gray-200">
                    <CardHeader className="bg-gray-50 rounded-t-xl">
                      <CardTitle className="flex items-center space-x-2 text-gray-900">
                        <Eye className="h-5 w-5" />
                        <span>Physical Description</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-4">
                      {suspect.physicalDescription.height && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Height
                          </Label>
                          <p className="text-base text-gray-900">
                            {suspect.physicalDescription.height}
                          </p>
                        </div>
                      )}
                      {suspect.physicalDescription.weight && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Weight
                          </Label>
                          <p className="text-base text-gray-900">
                            {suspect.physicalDescription.weight}
                          </p>
                        </div>
                      )}
                      {suspect.physicalDescription.eyeColor && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Eye Color
                          </Label>
                          <p className="text-base text-gray-900">
                            {suspect.physicalDescription.eyeColor}
                          </p>
                        </div>
                      )}
                      {suspect.physicalDescription.hairColor && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Hair Color
                          </Label>
                          <p className="text-base text-gray-900">
                            {suspect.physicalDescription.hairColor}
                          </p>
                        </div>
                      )}
                      {suspect.physicalDescription.distinguishingMarks && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Distinguishing Marks
                          </Label>
                          <p className="text-base text-gray-900">
                            {suspect.physicalDescription.distinguishingMarks}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Emergency Contact */}
                {suspect.emergencyContact && (
                  <Card className="rounded-xl shadow-sm border border-gray-200">
                    <CardHeader className="bg-gray-50 rounded-t-xl">
                      <CardTitle className="flex items-center space-x-2 text-gray-900">
                        <Phone className="h-5 w-5" />
                        <span>Emergency Contact</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Name
                        </Label>
                        <p className="text-base text-gray-900">
                          {suspect.emergencyContact.name}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Phone
                        </Label>
                        <p className="text-base text-gray-900">
                          {suspect.emergencyContact.phone}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Relation
                        </Label>
                        <p className="text-base text-gray-900">
                          {suspect.emergencyContact.relation}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Associated Alerts Tab */}
            <TabsContent value="alerts" className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Associated Alerts
                </h3>
                <Badge variant="outline" className="bg-white">
                  {suspect.associatedAlerts?.length || 0} Alert(s)
                </Badge>
              </div>

              {suspect.associatedAlerts &&
              suspect.associatedAlerts.length > 0 ? (
                <div className="space-y-4">
                  {suspect.associatedAlerts.map((alert, index) => (
                    <Card
                      key={index}
                      className="rounded-xl shadow-sm border border-gray-200"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-gray-900">
                                {alert.title}
                              </h4>
                              <Badge
                                className={`text-xs ${getPriorityColor(
                                  alert.priority
                                )}`}
                              >
                                {alert.priority}
                              </Badge>
                              <Badge className={getStatusColor(alert.status)}>
                                {alert.status}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Type: {alert.type}</span>
                              <span>•</span>
                              <span>{formatDate(alert.date)}</span>
                              {alert.location && (
                                <>
                                  <span>•</span>
                                  <span>{alert.location}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg border-gray-300"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No associated alerts found</p>
                </div>
              )}
            </TabsContent>

            {/* Criminal History Tab */}
            <TabsContent value="history" className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Criminal History
                </h3>
                <Badge variant="outline" className="bg-white">
                  {suspect.criminalHistory?.length || 0} Case(s)
                </Badge>
              </div>

              {suspect.criminalHistory && suspect.criminalHistory.length > 0 ? (
                <div className="space-y-4">
                  {suspect.criminalHistory.map((record, index) => (
                    <Card
                      key={index}
                      className="rounded-xl shadow-sm border border-gray-200"
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-gray-900">
                              {record.case}
                            </h4>
                            <Badge className={getStatusColor(record.status)}>
                              {record.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {record.description}
                          </p>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(record.date)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No criminal history on record</p>
                </div>
              )}
            </TabsContent>

            {/* Recent Activity Tab */}
            <TabsContent value="activity" className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Activity
                </h3>
                <Badge variant="outline" className="bg-white">
                  <Clock className="h-3 w-3 mr-1" />
                  Last 30 days
                </Badge>
              </div>

              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">
                  Activity tracking will be available soon
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
