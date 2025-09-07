// models/Police.js - UPDATED with role fields
const mongoose = require("mongoose");

const policeSchema = new mongoose.Schema(
  {
    badgeNumber: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    station: {
      type: String,
      required: true,
    },
    rank: {
      type: String,
      required: true,
    },
    // NEW FIELDS FOR ROLE-BASED ACCESS
    role: {
      type: String,
      enum: ["admin_police", "sub_police"],
      default: "sub_police",
      required: true,
    },
    managedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Police",
      default: null,
    },
    permissions: {
      canManageHotels: { type: Boolean, default: true },
      canManageSuspects: { type: Boolean, default: true },
      canCreateAlerts: { type: Boolean, default: true },
      canViewReports: { type: Boolean, default: true },
      canDeleteRecords: { type: Boolean, default: false },
    },
    // END NEW FIELDS
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    loginCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
policeSchema.index({ role: 1, isActive: 1 });
policeSchema.index({ managedBy: 1 });
policeSchema.index({ email: 1 });
policeSchema.index({ badgeNumber: 1 });

module.exports = mongoose.model("Police", policeSchema);
