// routes/activityRoutes.js - ENHANCED VERSION
const express = require("express");
const router = express.Router();
const {
  getActivityLogs,
  getOfficerActivities,
  getActivityStats,
  getMyActivities,
} = require("../controllers/activityController");
const {
  authenticatePolice,
  requireAdminPolice,
  requireAnyPolice,
} = require("../middleware/policeAuth");

// Debug middleware for activity routes
router.use((req, res, next) => {
  console.log(`Activity Route: ${req.method} ${req.originalUrl}`);
  console.log("User:", {
    policeId: req.user?.policeId,
    role: req.user?.policeRole,
  });
  next();
});

// Apply authentication to all routes
router.use(authenticatePolice);

// Admin-only routes
router.get("/logs", requireAdminPolice, getActivityLogs);
router.get("/officer/:officerId", requireAdminPolice, getOfficerActivities);
router.get("/stats", requireAdminPolice, getActivityStats);

// Any police officer can view their own activities
router.get("/my-activities", requireAnyPolice, getMyActivities);

// Health check for activity system
router.get("/health", requireAnyPolice, (req, res) => {
  res.json({
    success: true,
    message: "Activity monitoring system is working",
    user: {
      policeId: req.user.policeId,
      name: req.user.name,
      role: req.user.policeRole,
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
