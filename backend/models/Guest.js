const mongoose = require("mongoose");

const guestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    nationality: {
      type: String,
      required: true,
      trim: true,
    },
    purpose: {
      type: String,
      required: true,
      trim: true,
    },
    guestCount: {
      type: Number,
      required: true,
      min: 1,
    },
    maleGuests: {
      type: Number,
      default: 0,
      min: 0,
    },
    femaleGuests: {
      type: Number,
      default: 0,
      min: 0,
    },
    childGuests: {
      type: Number,
      default: 0,
      min: 0,
    },
    checkInTime: {
      type: Date,
      default: Date.now,
    },
    bookingMode: {
      type: String,
      enum: ["Direct", "Online", "Travel Agent"],
      required: true,
    },
    bookingWebsite: {
      type: String,
      required: function () {
        return this.bookingMode === "Online";
      },
      trim: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["checked-in", "checked-out", "reported"],
      default: "checked-in",
    },
    checkOutDate: {
      type: Date,
      default: null,
    },
    guests: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        idType: {
          type: String,
          required: true,
          enum: [
            "Passport",
            "National ID",
            "Driver License",
            "Voter ID",
            "Other",
          ],
        },
        idNumber: {
          type: String,
          required: true,
          trim: true,
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
        email: {
          type: String,
          trim: true,
          lowercase: true,
        },
        age: {
          type: Number,
          min: 0,
        },
        gender: {
          type: String,
          enum: ["Male", "Female", "Other"],
        },
      },
    ],
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    // Additional fields for better tracking
    totalAmount: {
      type: Number,
      default: 0,
    },
    advanceAmount: {
      type: Number,
      default: 0,
    },
    balanceAmount: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
guestSchema.index({ hotelId: 1, roomNumber: 1 });
guestSchema.index({ hotelId: 1, status: 1 });
guestSchema.index({ hotelId: 1, checkInTime: 1 });
guestSchema.index({ phone: 1, hotelId: 1 });
guestSchema.index({ "guests.idNumber": 1, hotelId: 1 });

// Validation middleware
guestSchema.pre("save", function (next) {
  // Ensure guest count matches individual counts
  const totalIndividual =
    this.maleGuests + this.femaleGuests + this.childGuests;
  if (totalIndividual > 0 && totalIndividual !== this.guestCount) {
    return next(
      new Error(
        "Guest count mismatch: total should equal sum of male, female, and child guests"
      )
    );
  }

  // Ensure at least one primary guest
  const primaryGuests = this.guests.filter((guest) => guest.isPrimary);
  if (primaryGuests.length === 0 && this.guests.length > 0) {
    this.guests[0].isPrimary = true;
  } else if (primaryGuests.length > 1) {
    return next(new Error("Only one primary guest is allowed"));
  }

  next();
});

// Instance methods
guestSchema.methods.checkOut = function (checkOutDate = new Date()) {
  this.status = "checked-out";
  this.checkOutDate = checkOutDate;
  return this.save();
};

guestSchema.methods.updateBalance = function () {
  this.balanceAmount = this.totalAmount - this.advanceAmount;
  return this;
};

// Static methods
guestSchema.statics.findByHotel = function (hotelId, status = null) {
  const query = { hotelId };
  if (status) query.status = status;
  return this.find(query)
    .populate("createdBy", "name email")
    .sort({ checkInTime: -1 });
};

guestSchema.statics.findByRoom = function (
  hotelId,
  roomNumber,
  status = "checked-in"
) {
  return this.find({ hotelId, roomNumber, status });
};

guestSchema.statics.checkUniqueness = function (hotelId, phone, idNumber) {
  return this.findOne({
    hotelId,
    $or: [{ phone }, { "guests.idNumber": idNumber }],
    status: { $ne: "checked-out" },
  });
};

module.exports = mongoose.model("Guest", guestSchema);
