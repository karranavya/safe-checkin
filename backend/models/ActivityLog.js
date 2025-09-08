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
        "hotel_verified",
        "hotel_registered",
        "hotel_updated",
        "hotel_deleted",
        "suspect_added",
        "suspect_updated",
        "suspect_deleted",
        "suspect_viewed",
        "alert_created",
        "alert_updated",
        "alert_removed",
        "case_handled",
        "case_updated",
        "case_closed",
        "report_generated",
        "report_viewed",
        "guest_checked",
        "guest_flagged",
        "profile_updated",
        "login_attempt",
        "logout",
        // Add new actions
        "bulk_operation",
        "data_export",
        "system_backup",
        "password_changed",
        "role_updated",
        "status_changed",
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
        "user", // Add user type
      ],
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
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
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
    sessionId: String,
    status: {
      type: String,
      enum: ["success", "failed", "pending", "cancelled"],
      default: "success",
      index: true,
    },
    // Add severity level for better filtering
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    // Add category for grouping
    category: {
      type: String,
      enum: [
        "authentication",
        "data_management",
        "security",
        "reporting",
        "system",
      ],
      default: "data_management",
      index: true,
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

// Virtual for activity age
activityLogSchema.virtual("age").get(function () {
  return Date.now() - this.createdAt;
});

module.exports = mongoose.model("ActivityLog", activityLogSchema);
