// server.js — v2.1.0 (Fixed)
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Route imports
const hotelRoutes = require("./routes/hotelRoutes");
const guestRoutes = require("./routes/guestRoutes");
const alertRoutes = require("./routes/alertRoutes");
const reportRoutes = require("./routes/reportRoutes");
const policeRoutes = require("./routes/policeRoutes");
const policeAlertRoutes = require("./routes/policeAlertRoutes");
// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ─────────────────────────────  MIDDLEWARE  ───────────────────────────── */
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:8081",
      "http://localhost:8082",
    ],
    credentials: true,
  })
);

// Add request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ───────────────────────────  DATABASE SET-UP  ────────────────────────── */
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/safecheckin";

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB successfully"))
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  });

/* ──────────────────────────────  ROUTES  ─────────────────────────────── */
// Root route - MUST return JSON
app.get("/", (_req, res) => {
  res.json({
    message: "SafeCheckIn Multi-Hotel API is running!",
    version: "2.1.0",
    timestamp: new Date().toISOString(),
    availableRoutes: [
      "/api/hotels",
      "/api/guests",
      "/api/alerts",
      "/api/reports",
      "/api/police",
    ],
  });
});

// API Routes
app.use("/api/hotels", hotelRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/police", policeRoutes);
app.use("/api/police/alerts", policeAlertRoutes);

/* ───────────────────────  404 HANDLER - JSON ONLY  ───────────────────────────── */
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
    message: `The route ${req.method} ${req.originalUrl} does not exist`,
  });
});

/* ─────────────────────────  GLOBAL ERROR HANDLER - JSON ONLY  ─────────────────────── */
app.use((error, req, res, next) => {
  console.error("❌ Server Error:", {
    path: req.originalUrl,
    method: req.method,
    error: error.message,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });

  // Ensure we always return JSON
  res.setHeader("Content-Type", "application/json");

  // Duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      error: `${field} already exists`,
      code: "DUPLICATE_KEY",
    });
  }

  // Validation error
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err) => err.message);
    return res.status(400).json({
      success: false,
      error: messages.join(", "),
      code: "VALIDATION_ERROR",
    });
  }

  // JWT error
  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: "Invalid token",
      code: "INVALID_TOKEN",
    });
  }

  // JWT expired error
  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: "Token expired",
      code: "TOKEN_EXPIRED",
    });
  }

  // Default server error
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
    code: "INTERNAL_ERROR",
  });
});

/* ───────────────────────  GRACEFUL SHUT-DOWN  ─────────────────────────── */
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received, shutting down gracefully");
  mongoose.connection.close(() => {
    console.log("📦 MongoDB connection closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("👋 SIGINT received, shutting down gracefully");
  mongoose.connection.close(() => {
    console.log("📦 MongoDB connection closed");
    process.exit(0);
  });
});

/* ───────────────────────────────  LISTEN  ─────────────────────────────── */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  // console.log(`📋 Available routes:`);
  // console.log(`   GET  / (API info)`);
});
