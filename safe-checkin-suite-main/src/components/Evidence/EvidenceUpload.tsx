// components/Evidence/EvidenceUpload.tsx - IMAGE ONLY VERSION
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image, X, AlertTriangle } from "lucide-react";

interface EvidenceUploadProps {
  suspectId: string;
  alertId?: string;
  guestId?: string;
  onUploadSuccess?: () => void;
}

export default function EvidenceUpload({
  suspectId,
  alertId,
  guestId,
  onUploadSuccess,
}: EvidenceUploadProps) {
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);

      // Validate only images
      const invalidFiles = selectedFiles.filter(
        (file) => !file.type.startsWith("image/")
      );

      if (invalidFiles.length > 0) {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Only image files are allowed",
        });
        return;
      }

      // Validate file size (50MB max per file)
      const oversizedFiles = selectedFiles.filter(
        (file) => file.size > 50 * 1024 * 1024
      );

      if (oversizedFiles.length > 0) {
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: `${oversizedFiles.length} file(s) exceed 50MB limit`,
        });
        return;
      }

      // Limit to 5 files
      if (selectedFiles.length > 5) {
        toast({
          variant: "destructive",
          title: "Too Many Files",
          description: "Maximum 5 images allowed",
        });
        return;
      }

      setFiles(selectedFiles);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUploadEvidence = async () => {
    // Validation
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a title",
      });
      return;
    }

    if (files.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one image",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();

      // Add form fields
      formData.append("suspectId", suspectId);
      if (alertId) formData.append("alertId", alertId);
      if (guestId) formData.append("guestId", guestId);
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("category", "Photo");
      formData.append("severity", "Medium");
      formData.append("evidenceType", "Image");

      // Get hotel ID from localStorage
      const hotelData = localStorage.getItem("hotelData");
      if (hotelData) {
        try {
          const parsed = JSON.parse(hotelData);
          formData.append("hotelId", parsed._id || parsed.id || "");
        } catch {
          formData.append("hotelId", "");
        }
      }

      // Add files
      files.forEach((file) => {
        formData.append("files", file);
      });

      const token =
        localStorage.getItem("hotelToken") ||
        localStorage.getItem("token") ||
        "";

      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch(
        `${apiUrl}/api/evidence/upload/${suspectId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Upload success:", data);

        toast({
          title: "✅ Evidence Uploaded",
          description: `${files.length} image(s) uploaded successfully`,
        });

        // Reset form
        setTitle("");
        setDescription("");
        setFiles([]);
        setUploadProgress(0);

        // Callback
        onUploadSuccess?.();
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.error || "Upload failed"
        );
      }
    } catch (error) {
      console.error("❌ Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description:
          error instanceof Error ? error.message : "Failed to upload evidence",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Image className="h-5 w-5 text-blue-600" />
          Upload Evidence Images
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title */}
        <div>
          <Label className="text-sm font-medium">Title *</Label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Suspicious Activity - Room 201"
            className="mt-1 rounded-lg"
            disabled={isUploading}
          />
        </div>

        {/* Description */}
        <div>
          <Label className="text-sm font-medium">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional details about this evidence..."
            className="mt-1 rounded-lg"
            rows={3}
            disabled={isUploading}
          />
        </div>

        {/* File Upload */}
        <div>
          <Label className="text-sm font-medium">
            Images * (Max 5 images, 50MB each)
          </Label>
          <div className="mt-1">
            <label
              htmlFor="file-upload"
              className={`flex items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                isUploading
                  ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                  : "border-blue-300 hover:border-blue-500 bg-blue-50 hover:bg-blue-100"
              }`}
            >
              <div className="text-center">
                <Image className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium text-gray-700">
                  Click to upload images
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, WEBP up to 50MB
                </p>
              </div>
              <input
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>
        </div>

        {/* Selected Files - Image Previews */}
        {files.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Selected Images ({files.length}/5)
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors"
                >
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-xs font-medium truncate">
                      {file.name}
                    </p>
                    <p className="text-white text-xs opacity-80">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(idx)}
                    disabled={isUploading}
                    className="absolute top-2 right-2 h-7 w-7 p-0 rounded-full bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Uploading...</span>
              <span className="text-gray-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUploadEvidence}
          disabled={isUploading || !title.trim() || files.length === 0}
          className="w-full rounded-lg bg-blue-600 hover:bg-blue-700"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Images
            </>
          )}
        </Button>

        {/* Info Notice */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Evidence Upload Guidelines:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Images will be automatically shared with police</li>
                <li>Maximum 50MB per image, 5 images total</li>
                <li>Supported formats: JPG, PNG, WEBP</li>
                <li>Evidence cannot be deleted once uploaded</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
