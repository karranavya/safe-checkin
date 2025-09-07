// routes/activityRoutes.js - NEW FILE
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

// Apply authentication to all routes
router.use(authenticatePolice);

// Admin-only routes
router.get("/logs", requireAdminPolice, getActivityLogs);
router.get("/officer/:officerId", requireAdminPolice, getOfficerActivities);
router.get("/stats", requireAdminPolice, getActivityStats);

// Any police officer can view their own activities
router.get("/my-activities", requireAnyPolice, getMyActivities);

module.exports = router;
