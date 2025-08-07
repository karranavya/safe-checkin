// models/Alert.js
const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: [true, "Hotel ID is required"],
      index: true,
    },
    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guest",
      required: [true, "Guest ID is required"],
      index: true,
    },
    type: {
      type: String,
      required: [true, "Alert type is required"],
      enum: ["Police", "Security", "Management", "Emergency", "Maintenance"],
      index: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
      index: true,
    },
    title: {
      type: String,
      required: [true, "Alert title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Alert description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    location: {
      roomNumber: {
        type: String,
        required: [true, "Room number is required"],
      },
      floor: String,
      building: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    status: {
      type: String,
      enum: ["Pending", "Acknowledged", "In Progress", "Resolved", "Cancelled"],
      default: "Pending",
      index: true,
    },
    assignedTo: {
      name: String,
      role: String,
      contactNumber: String,
      assignedAt: Date,
    },
    createdBy: {
      name: String,
      role: {
        type: String,
        enum: ["Hotel Staff", "Guest", "System", "Manager"],
        default: "Hotel Staff",
      },
    },
    timeline: [
      {
        action: {
          type: String,
          required: true,
        },
        performedBy: {
          name: String,
          role: String,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        notes: String,
      },
    ],
    attachments: [
      {
        filename: String,
        fileType: String,
        fileSize: Number,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        data: String, // Base64 encoded file data or file path
      },
    ],
    resolution: {
      summary: String,
      resolvedBy: {
        name: String,
        role: String,
      },
      resolvedAt: Date,
      actionsTaken: [String],
    },
    relatedAlerts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Alert",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      index: { expireAfterSeconds: 0 }, // TTL index for auto-deletion
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
alertSchema.index({ hotelId: 1, status: 1, createdAt: -1 });
alertSchema.index({ hotelId: 1, type: 1, priority: -1 });
alertSchema.index({ hotelId: 1, guestId: 1, createdAt: -1 });

// Virtual for age of alert
alertSchema.virtual("age").get(function () {
  return Date.now() - this.createdAt;
});

// Virtual for response time
alertSchema.virtual("responseTime").get(function () {
  if (this.status === "Pending") return null;

  const acknowledgedEntry = this.timeline.find(
    (entry) => entry.action === "Acknowledged" || entry.action === "In Progress"
  );

  if (acknowledgedEntry) {
    return acknowledgedEntry.timestamp - this.createdAt;
  }
  return null;
});

// Pre-save middleware
alertSchema.pre("save", function (next) {
  // Auto-set expiration for resolved alerts (30 days)
  if (this.status === "Resolved" && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  // Update isActive based on status
  this.isActive = !["Resolved", "Cancelled"].includes(this.status);

  next();
});

// Static methods
alertSchema.statics.getActiveAlerts = function (hotelId) {
  return this.find({
    hotelId,
    isActive: true,
  })
    .populate("guestId", "name roomNumber phone")
    .sort({ priority: -1, createdAt: -1 });
};

alertSchema.statics.getAlertsByPriority = function (hotelId, priority) {
  return this.find({
    hotelId,
    priority,
    isActive: true,
  })
    .populate("guestId", "name roomNumber phone")
    .sort({ createdAt: -1 });
};

alertSchema.statics.getAlertStats = function (hotelId) {
  return this.aggregate([
    { $match: { hotelId: mongoose.Types.ObjectId(hotelId) } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);
};

module.exports = mongoose.model("Alert", alertSchema);
