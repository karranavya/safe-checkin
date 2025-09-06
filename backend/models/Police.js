// models/Police.js
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
    role: {
      type: String,
      enum: ["admin", "sub-police"], // NEW
      default: "sub-police",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Police", policeSchema);
