// models/Hotel.js
const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Hotel name is required"],
      trim: true,
      maxlength: [100, "Hotel name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"],
    },
    ownerName: {
      type: String,
      required: [true, "Owner name is required"],
      trim: true,
      maxlength: [50, "Owner name cannot exceed 50 characters"],
    },
    numberOfRooms: {
      type: Number,
      required: [true, "Number of rooms is required"],
      min: [1, "Hotel must have at least 1 room"],
      max: [10000, "Number of rooms cannot exceed 10000"],
    },
    roomRate: {
      type: Number,
      required: [true, "Room rate is required"],
      min: [0, "Room rate cannot be negative"],
      max: [1000000, "Room rate cannot exceed 1000000"],
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: "India",
      },
    },
    // UPDATED FIELDS - Change ObjectId to String
    registeredByPolice: {
      type: Boolean,
      default: false,
    },
    registeredBy: {
      type: String, // Changed from ObjectId to String
      default: null,
    },
    // If you want to store police officer details, add this
    policeOfficer: {
      id: String,
      name: String,
      badgeNumber: String,
      station: String,
      rank: String,
    },
    // END OF UPDATED FIELDS
    isActive: {
      type: Boolean,
      default: true,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
    },
    settings: {
      allowOnlineBooking: {
        type: Boolean,
        default: true,
      },
      alertsEnabled: {
        type: Boolean,
        default: true,
      },
      checkInTime: {
        type: String,
        default: "14:00",
      },
      checkOutTime: {
        type: String,
        default: "12:00",
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);
// Indexes for better performance
hotelSchema.index({ email: 1 });
hotelSchema.index({ isActive: 1 });
hotelSchema.index({ registrationDate: -1 });

// Virtual for total guests
hotelSchema.virtual("totalGuests", {
  ref: "Guest",
  localField: "_id",
  foreignField: "hotelId",
  count: true,
});

// Virtual for active guests
hotelSchema.virtual("activeGuests", {
  ref: "Guest",
  localField: "_id",
  foreignField: "hotelId",
  match: { checkOutDate: { $exists: false } },
  count: true,
});

module.exports = mongoose.model("Hotel", hotelSchema);
