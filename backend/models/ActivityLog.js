// models/ActivityLog.js - ENHANCED VERSION
const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Police",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        // Authentication actions
        "login_attempt",
        "login_success",
        "login_failed",
        "logout",
        "password_changed",
        "role_updated",

        // Hotel actions
        "hotel_verified",
        "hotel_registered",
        "hotel_updated",
        "hotel_deleted",
        "hotel_viewed",

        // Suspect actions
        "suspect_added",
        "suspect_updated",
        "suspect_deleted",
        "suspect_viewed",
        "suspect_searched",

        // Alert actions
        "alert_created",
        "alert_updated",
        "alert_viewed",
        "alert_removed",
        "alert_resolved",
        "alert_acknowledged",
        "alert_cancelled",
        "alert_assigned",
        "alert_creation_blocked", // ⭐ For duplicate prevention

        // Case actions
        "case_handled",
        "case_updated",
        "case_closed",
        "case_created",

        // Report actions
        "report_generated",
        "report_viewed",
        "report_downloaded",
        "report_exported",

        // Guest actions
        "guest_checked",
        "guest_flagged",
        "guest_viewed",
        "guest_searched",
        "guest_updated",

        // Profile actions
        "profile_updated",
        "profile_viewed",

        // System actions
        "bulk_operation",
        "data_export",
        "data_import",
        "system_backup",
        "system_maintenance",
        "system_event",
        "logging_failed",
        "status_changed",

        // Dashboard actions
        "dashboard_viewed",
        "statistics_viewed",

        // Generic actions
        "created",
        "updated",
        "deleted",
        "viewed",
        "searched",
        "exported",
        "imported",
      ],
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: [
        "hotel",
        "suspect",
        "alert",
        "case",
        "report",
        "guest",
        "profile",
        "system",
        "user",
        "dashboard",
        "auth",
        "activity",
      ],
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    metadata: {
      previousData: mongoose.Schema.Types.Mixed,
      newData: mongoose.Schema.Types.Mixed,
      affectedFields: [String],
      recordCount: Number, // For bulk operations
      duration: Number, // For timed operations
      originalAction: String, // For mapped actions
    },
    ipAddress: {
      type: String,
      default: null,
      index: true,
    },
    userAgent: {
      type: String,
      default: null,
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
      country: String,
      city: String,
    },
    sessionId: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ["success", "failed", "pending", "cancelled"],
      default: "success",
      index: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    category: {
      type: String,
      enum: [
        "authentication",
        "data_management",
        "security",
        "reporting",
        "system",
        "monitoring",
      ],
      default: "data_management",
      index: true,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Enhanced indexes for better query performance
activityLogSchema.index({ performedBy: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ targetType: 1, targetId: 1 });
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ status: 1, severity: 1 });
activityLogSchema.index({ category: 1, action: 1 });
activityLogSchema.index({ ipAddress: 1, createdAt: -1 });

// TTL index to automatically delete old logs (optional - keeps logs for 90 days)
activityLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

// Add text index for searching
activityLogSchema.index({
  action: "text",
  "details.description": "text",
  "details.notes": "text",
});

// Static methods for common queries
activityLogSchema.statics.getRecentActivities = function (
  performedBy,
  limit = 10
) {
  return this.find({ performedBy })
    .populate("performedBy", "name badgeNumber rank station")
    .sort({ createdAt: -1 })
    .limit(limit);
};

activityLogSchema.statics.getActivitiesByType = function (
  targetType,
  days = 7
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    targetType,
    createdAt: { $gte: startDate },
  })
    .populate("performedBy", "name badgeNumber rank")
    .sort({ createdAt: -1 });
};

activityLogSchema.statics.getUserActivity = function (userId, limit = 50) {
  return this.find({ performedBy: userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

activityLogSchema.statics.getSecurityEvents = function (limit = 50) {
  return this.find({
    $or: [
      { action: "login_failed" },
      { severity: "high" },
      { severity: "critical" },
      { status: "failed" },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Virtual for activity age
activityLogSchema.virtual("age").get(function () {
  return Date.now() - this.createdAt;
});

module.exports = mongoose.model("ActivityLog", activityLogSchema);
