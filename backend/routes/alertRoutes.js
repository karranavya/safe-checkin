// routes/alertRoutes.js - UPDATED with activity logging
const express = require("express");
const router = express.Router();
const {
  createAlert,
  getAllAlerts,
  getAlertById,
  updateAlertStatus,
  deleteAlert,
  getAlertStats,
  assignAlert,
  addTimelineEntry,
  checkGuestAlertStatus,
} = require("../controllers/alertController");
const { logActivity } = require("../controllers/activityController");
const {
  auth,
  validateHotelAccess,
  rateLimiter,
} = require("../middleware/auth");
const Alert = require("../models/Alert");

// All alert routes require authentication
router.use(auth);

router.get("/guest/:guestId/status", checkGuestAlertStatus);

// SPECIFIC ROUTES FIRST (before any dynamic routes)
router.post("/", createAlert);
router.get("/", getAllAlerts);
router.get("/stats", getAlertStats);

// Alert filtering and search routes with activity logging
router.get("/filter/priority/:priority", async (req, res) => {
  try {
    const { priority } = req.params;
    const { status = "active", limit = 50 } = req.query;

    const query = {
      hotelId: req.hotelId,
      priority:
        priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase(),
    };

    if (status === "active") {
      query.isActive = true;
    } else if (status === "resolved") {
      query.status = "Resolved";
    }

    const alerts = await Alert.find(query)
      .populate("guestId", "name roomNumber phone")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Log alert filtering activity if accessed by police
    if (req.user?.policeId) {
      await logActivity(
        req.user.policeId.toString(),
        "alert_viewed",
        "alert",
        `filter_priority_${priority}`,
        {
          filterType: "priority",
          priority,
          status,
          resultsCount: alerts.length,
          hotelId: req.hotelId,
        },
        req
      );
    }

    res.json({
      priority,
      alerts: alerts.map((alert) => ({
        id: alert._id,
        title: alert.title,
        description: alert.description,
        type: alert.type,
        priority: alert.priority,
        status: alert.status,
        location: alert.location,
        guest: alert.guestId,
        createdAt: alert.createdAt,
        assignedTo: alert.assignedTo,
        age: alert.age,
      })),
      totalFound: alerts.length,
    });
  } catch (error) {
    console.error("Filter alerts by priority error:", error);
    res.status(500).json({
      error: "Failed to filter alerts",
    });
  }
});

router.get("/filter/type/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const { status = "active", limit = 50 } = req.query;

    const query = {
      hotelId: req.hotelId,
      type: type.charAt(0).toUpperCase() + type.slice(1).toLowerCase(),
    };

    if (status === "active") {
      query.isActive = true;
    }

    const alerts = await Alert.find(query)
      .populate("guestId", "name roomNumber phone")
      .sort({ priority: -1, createdAt: -1 })
      .limit(parseInt(limit));

    // Log alert filtering activity if accessed by police
    if (req.user?.policeId) {
      await logActivity(
        req.user.policeId.toString(),
        "alert_viewed",
        "alert",
        `filter_type_${type}`,
        {
          filterType: "type",
          alertType: type,
          status,
          resultsCount: alerts.length,
          hotelId: req.hotelId,
        },
        req
      );
    }

    res.json({
      type,
      alerts: alerts.map((alert) => ({
        id: alert._id,
        title: alert.title,
        description: alert.description,
        priority: alert.priority,
        status: alert.status,
        location: alert.location,
        guest: alert.guestId,
        createdAt: alert.createdAt,
        responseTime: alert.responseTime,
      })),
      totalFound: alerts.length,
    });
  } catch (error) {
    console.error("Filter alerts by type error:", error);
    res.status(500).json({
      error: "Failed to filter alerts",
    });
  }
});

// Alert analytics with activity logging
router.get("/analytics/summary", async (req, res) => {
  try {
    const { period = "30" } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const [
      totalAlerts,
      activeAlerts,
      resolvedAlerts,
      criticalAlerts,
      avgResponseTime,
      alertsByType,
    ] = await Promise.all([
      Alert.countDocuments({ hotelId: req.hotelId }),
      Alert.countDocuments({ hotelId: req.hotelId, isActive: true }),
      Alert.countDocuments({
        hotelId: req.hotelId,
        status: "Resolved",
        createdAt: { $gte: startDate },
      }),
      Alert.countDocuments({
        hotelId: req.hotelId,
        priority: "Critical",
        isActive: true,
      }),
      Alert.aggregate([
        {
          $match: {
            hotelId: req.hotelId,
            status: { $ne: "Pending" },
            createdAt: { $gte: startDate },
          },
        },
        {
          $addFields: {
            responseTimeMs: {
              $subtract: [
                { $arrayElemAt: ["$timeline.timestamp", 0] },
                "$createdAt",
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgResponse: { $avg: "$responseTimeMs" },
          },
        },
      ]),
      Alert.aggregate([
        { $match: { hotelId: req.hotelId } },
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Log analytics viewing
    if (req.user?.policeId) {
      await logActivity(
        req.user.policeId.toString(),
        "report_viewed",
        "report",
        `alert_analytics_${req.hotelId}`,
        {
          reportType: "alert_analytics",
          period,
          hotelId: req.hotelId,
          totalAlerts,
          activeAlerts,
        },
        req
      );
    }

    res.json({
      period: `${period} days`,
      summary: {
        totalAlerts,
        activeAlerts,
        resolvedAlerts,
        criticalAlerts,
        averageResponseTime: avgResponseTime[0]?.avgResponse || 0,
      },
      alertsByType: alertsByType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error("Alert analytics error:", error);
    res.status(500).json({
      error: "Failed to fetch alert analytics",
    });
  }
});

// Bulk operations with activity logging
router.post("/bulk/resolve", async (req, res) => {
  try {
    const { alertIds, resolution } = req.body;

    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      return res.status(400).json({
        error: "Alert IDs array is required",
      });
    }

    const results = [];
    const errors = [];

    for (const alertId of alertIds) {
      try {
        const alert = await Alert.findOne({
          _id: alertId,
          hotelId: req.hotelId,
          isActive: true,
        });

        if (!alert) {
          errors.push({
            alertId,
            error: "Alert not found or already resolved",
          });
          continue;
        }

        alert.status = "Resolved";
        alert.resolution = {
          summary: resolution?.summary || "Bulk resolved",
          resolvedBy: {
            name: req.user?.name || "Hotel Staff",
            role: req.user?.policeRole
              ? `Police - ${req.user.rank}`
              : "Hotel Staff",
          },
          resolvedAt: new Date(),
          actionsTaken: resolution?.actionsTaken || ["Bulk resolution"],
        };

        alert.timeline.push({
          action: "Resolved",
          performedBy: {
            name: req.user?.name || "Hotel Staff",
            role: req.user?.policeRole
              ? `Police - ${req.user.rank}`
              : "Hotel Staff",
          },
          timestamp: new Date(),
          notes: "Bulk resolution",
        });

        await alert.save();
        results.push({
          alertId: alert._id,
          title: alert.title,
          resolvedAt: alert.resolution.resolvedAt,
        });
      } catch (error) {
        errors.push({ alertId, error: error.message });
      }
    }

    // Log bulk resolution activity
    if (results.length > 0) {
      await logActivity(
        req.user?.policeId?.toString() || "hotel_staff",
        "alert_updated",
        "alert",
        "bulk_resolution",
        {
          action: "bulk_resolve",
          resolvedCount: results.length,
          failedCount: errors.length,
          hotelId: req.hotelId,
          performedBy: req.user?.name || "Hotel Staff",
        },
        req
      );
    }

    res.json({
      message: `Bulk resolution completed. ${results.length} alerts resolved.`,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Bulk resolve alerts error:", error);
    res.status(500).json({
      error: "Bulk resolution failed",
    });
  }
});

// DYNAMIC ROUTES LAST
router.get("/:id", getAlertById);
router.put("/:id/status", updateAlertStatus);
router.put("/:id/assign", assignAlert);
router.post("/:id/timeline", addTimelineEntry);
router.delete("/:id", deleteAlert);

module.exports = router;
