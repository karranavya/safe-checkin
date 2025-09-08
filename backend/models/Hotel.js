// models/Hotel.js - CORRECTED VERSION
const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    ownerName: {
      type: String,
      required: true,
    },
    numberOfRooms: {
      type: Number,
      required: true,
      min: 1,
    },
    roomRate: {
      type: Number,
      required: true,
      min: 0,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: "India" },
    },
    registeredByPolice: {
      type: Boolean,
      default: false,
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Police",
      default: null,
    },
    policeOfficer: {
      id: String,
      name: String,
      badgeNumber: String,
      station: String,
      rank: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Police",
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verificationNotes: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    settings: {
      allowOnlineBooking: { type: Boolean, default: true },
      requireIdVerification: { type: Boolean, default: true },
      autoSendAlerts: { type: Boolean, default: true },
      notificationPreferences: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
    },
    category: {
      type: String,
      enum: ["Budget", "Standard", "Premium", "Luxury"],
      default: "Standard",
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    // Remove totalGuests field if it exists - it should be a virtual
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // Include virtuals in JSON output
    toObject: { virtuals: true }, // Include virtuals in object output
  }
);

// Enhanced indexes
hotelSchema.index({ isVerified: 1, isActive: 1 });
hotelSchema.index({ registeredBy: 1 });
hotelSchema.index({ verifiedBy: 1 });
hotelSchema.index({ "address.city": 1 });
hotelSchema.index({ category: 1 });

// Virtual for totalGuests (calculated field)
hotelSchema.virtual("totalGuests").get(function () {
  // This will be calculated based on related Guest documents
  // For now, return 0 or implement your calculation logic
  return 0; // You can implement actual calculation here
});

// Virtual for activeGuests (calculated field)
hotelSchema.virtual("activeGuests").get(function () {
  // This will be calculated based on related Guest documents
  return 0; // You can implement actual calculation here
});

module.exports = mongoose.model("Hotel", hotelSchema);
