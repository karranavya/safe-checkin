// models/ActivityLog.js - NEW FILE
const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Police",
      required: true,
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
      ],
      required: true,
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
      ],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    metadata: {
      previousData: mongoose.Schema.Types.Mixed,
      newData: mongoose.Schema.Types.Mixed,
      affectedFields: [String],
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
      enum: ["success", "failed", "pending"],
      default: "success",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
activityLogSchema.index({ performedBy: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ targetType: 1, targetId: 1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
