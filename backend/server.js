// server.js - FIXED CORS configuration
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const {
  securityHeaders,
  sanitizeInput,
  apiRateLimit,
} = require("./middleware/security");

// Route imports
const hotelRoutes = require("./routes/hotelRoutes");
const guestRoutes = require("./routes/guestRoutes");
const alertRoutes = require("./routes/alertRoutes");
const reportRoutes = require("./routes/reportRoutes");
const policeRoutes = require("./routes/policeRoutes");
const policeAlertRoutes = require("./routes/policeAlertRoutes");
const activityRoutes = require("./routes/activityRoutes");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ─────────────────────────────  SECURITY MIDDLEWARE  ───────────────────────────── */
app.use(securityHeaders);
app.use(sanitizeInput);

/* ─────────────────────────────  CORS & BASIC MIDDLEWARE  ───────────────────────────── */
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:8081",
      "http://localhost:8082",
    ],
    credentials: true,
    // FIXED: Added PATCH method to allowed methods
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Enhanced request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const userAgent = req.get("User-Agent") || "Unknown";
  const ip = req.ip || req.connection.remoteAddress;

  console.log(
    `[${timestamp}] ${req.method} ${
      req.path
    } - IP: ${ip} - UA: ${userAgent.substring(0, 50)}`
  );
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Apply rate limiting to API routes
app.use("/api", apiRateLimit);

/* ───────────────────────────  DATABASE SET-UP  ────────────────────────── */
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/safecheckin";

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    // ADD: Connection monitoring options
    heartbeatFrequencyMS: 10000,
    maxIdleTimeMS: 30000,
  })
  .then(() => console.log("✅ Connected to MongoDB successfully"))
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  });

// ADD: MongoDB connection event listeners
mongoose.connection.on("connected", () => {
  console.log("✅ Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("📦 Mongoose disconnected");
});

/* ──────────────────────────────  ROUTES  ─────────────────────────────── */
// Health check route
app.get("/", (_req, res) => {
  res.json({
    message: "SafeCheckIn Multi-Hotel API is running!",
    version: "2.2.0",
    timestamp: new Date().toISOString(),
    status: "healthy",
    availableRoutes: [
      "/api/hotels",
      "/api/guests",
      "/api/alerts",
      "/api/reports",
      "/api/police",
      "/api/activities",
    ],
  });
});

// API Routes with enhanced logging
app.use("/api/hotels", hotelRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/police", policeRoutes);
app.use("/api/police/alerts", policeAlertRoutes);
app.use("/api/activities", activityRoutes);

/* ───────────────────────  ERROR HANDLERS  ───────────────────────────── */
// 404 handler
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("❌ Server Error:", {
    path: req.originalUrl,
    method: req.method,
    error: error.message,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });

  res.setHeader("Content-Type", "application/json");

  // Handle specific error types
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      error: `${field} already exists`,
      code: "DUPLICATE_KEY",
    });
  }

  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err) => err.message);
    return res.status(400).json({
      success: false,
      error: messages.join(", "),
      code: "VALIDATION_ERROR",
    });
  }

  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: "Invalid token",
      code: "INVALID_TOKEN",
    });
  }

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
    timestamp: new Date().toISOString(),
  });
});

/* ───────────────────────  GRACEFUL SHUTDOWN  ─────────────────────────── */
const gracefulShutdown = (signal) => {
  console.log(`👋 ${signal} received, shutting down gracefully`);
  mongoose.connection.close(() => {
    console.log("📦 MongoDB connection closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

/* ───────────────────────────────  LISTEN  ─────────────────────────────── */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔒 Security headers enabled`);
  console.log(`⏱️  Rate limiting active`);
  console.log(`🌐 CORS enabled for PATCH method`);
});
