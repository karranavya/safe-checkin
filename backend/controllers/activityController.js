// controllers/activityController.js - NEW FILE
const ActivityLog = require("../models/ActivityLog");
const Police = require("../models/Police");

// Log activity function - to be called from other controllers
const logActivity = async (
  performedBy,
  action,
  targetType,
  targetId,
  details = {},
  req = null
) => {
  try {
    if (!performedBy || !action || !targetType || !targetId) {
      console.error("❌ Activity logging failed: Missing required parameters");
      return null;
    }
    const activityData = {
      performedBy,
      action,
      targetType,
      targetId,
      details,
    };

    // Add request metadata if available
    if (req) {
      activityData.ipAddress =
        req.ip ||
        req.connection.remoteAddress ||
        req.headers["x-forwarded-for"];
      activityData.userAgent = req.get("User-Agent");
      activityData.sessionId = req.sessionID || req.headers["x-session-id"];
    }

    const activity = new ActivityLog(activityData);
    await activity.save();

    console.log(`Activity logged: ${action} by ${performedBy}`);
    return activity;
  } catch (error) {
    console.error("Activity logging error:", error);

    // Don't throw error to prevent breaking main functionality
    try {
      await ActivityLog.create({
        performedBy: performedBy || "system",
        action: "logging_failed",
        targetType: "system",
        targetId: "system",
        details: {
          originalAction: action,
          error: error.message,
          targetType,
          targetId,
        },
        status: "failed",
        severity: "high",
      });
    } catch (fallbackError) {
      console.error("❌ Even fallback logging failed:", fallbackError);
    }
    return null;
  }
};

// Get activity logs with pagination and filters (Admin only)
const getActivityLogs = async (req, res) => {
  try {
    // Only admin police can view all activity logs
    if (req.user.policeRole !== "admin_police") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Admin police role required.",
        code: "ADMIN_ACCESS_REQUIRED",
      });
    }

    // ✅ FIX: Properly destructure severity with default value
    const {
      page = 1,
      limit = 20,
      officerId,
      action,
      targetType,
      startDate,
      endDate,
      status = "success",
      severity = null, // Add this line with default null
    } = req.query;

    // Build filter object
    const filter = {};
    if (officerId) filter.performedBy = officerId;
    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;
    if (status) filter.status = status;

    // ✅ FIX: Safely check if severity exists before adding to filter
    if (severity) filter.severity = severity;

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [activities, totalCount] = await Promise.all([
      ActivityLog.find(filter)
        .populate("performedBy", "name badgeNumber rank station role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ActivityLog.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit: parseInt(limit),
        },
        filters: {
          officerId,
          action,
          targetType,
          startDate,
          endDate,
          status,
          severity, // Now safely included
        },
      },
    });
  } catch (error) {
    console.error("Get activity logs error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch activity logs",
      message: error.message,
    });
  }
};

// Get activities for a specific officer (Admin only)
const getOfficerActivities = async (req, res) => {
  try {
    if (req.user.policeRole !== "admin_police") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Admin police role required.",
      });
    }

    const { officerId } = req.params;
    const { page = 1, limit = 10, days = 7 } = req.query;

    // Verify officer exists
    const officer = await Police.findById(officerId);
    if (!officer) {
      return res.status(404).json({
        success: false,
        error: "Officer not found",
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const filter = {
      performedBy: officerId,
      createdAt: { $gte: startDate },
    };

    const skip = (page - 1) * limit;

    const [activities, totalCount] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ActivityLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        officer: {
          id: officer._id,
          name: officer.name,
          badgeNumber: officer.badgeNumber,
          rank: officer.rank,
        },
        activities,
        totalCount,
        dateRange: {
          from: startDate,
          to: new Date(),
          days: parseInt(days),
        },
      },
    });
  } catch (error) {
    console.error("Get officer activities error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch officer activities",
    });
  }
};

// Get activity statistics (Admin only)
const getActivityStats = async (req, res) => {
  try {
    if (req.user.policeRole !== "admin_police") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Admin police role required.",
      });
    }

    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const [
      totalActivities,
      activitiesByAction,
      activitiesByOfficer,
      recentActivities,
      dailyActivities,
    ] = await Promise.all([
      // Total activities count
      ActivityLog.countDocuments({
        createdAt: { $gte: startDate },
      }),

      // Activities grouped by action
      ActivityLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$action", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Activities grouped by officer
      ActivityLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$performedBy", count: { $sum: 1 } } },
        {
          $lookup: {
            from: "polices",
            localField: "_id",
            foreignField: "_id",
            as: "officer",
          },
        },
        { $unwind: "$officer" },
        {
          $project: {
            count: 1,
            officer: {
              name: "$officer.name",
              badgeNumber: "$officer.badgeNumber",
            },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Recent activities (last 10)
      ActivityLog.find({ createdAt: { $gte: startDate } })
        .populate("performedBy", "name badgeNumber")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      // Daily activity count
      ActivityLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalActivities,
          dateRange: { from: startDate, to: new Date(), days: parseInt(days) },
        },
        activitiesByAction,
        activitiesByOfficer,
        recentActivities,
        dailyActivities,
      },
    });
  } catch (error) {
    console.error("Get activity stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch activity statistics",
    });
  }
};

// Get my activities (for sub-police to see their own activities)
const getMyActivities = async (req, res) => {
  try {
    const { page = 1, limit = 20, days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const filter = {
      performedBy: req.user.policeId,
      createdAt: { $gte: startDate },
    };

    const skip = (page - 1) * limit;

    const [activities, totalCount] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ActivityLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        activities,
        totalCount,
        dateRange: {
          from: startDate,
          to: new Date(),
          days: parseInt(days),
        },
      },
    });
  } catch (error) {
    console.error("Get my activities error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch your activities",
    });
  }
};
const determineSeverity = (action) => {
  const severityMap = {
    // Critical actions
    hotel_deleted: "critical",
    suspect_deleted: "critical",
    case_closed: "critical",

    // High importance
    hotel_registered: "high",
    hotel_verified: "high",
    suspect_added: "high",
    alert_created: "high",

    // Medium importance
    hotel_updated: "medium",
    suspect_updated: "medium",
    alert_updated: "medium",
    report_generated: "medium",

    // Low importance
    profile_updated: "low",
    login_attempt: "low",
    logout: "low",
    report_viewed: "low",
  };

  return severityMap[action] || "medium";
};
module.exports = {
  logActivity,
  getActivityLogs,
  getOfficerActivities,
  getActivityStats,
  getMyActivities,
};
