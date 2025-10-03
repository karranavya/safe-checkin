// controllers/activityController.js - ENHANCED WITH REAL STATISTICS
const ActivityLog = require("../models/ActivityLog");
const Police = require("../models/Police");
const mongoose = require("mongoose");

// Action mapping for backward compatibility
const ACTION_MAPPING = {
  alert_viewed: "alert_viewed",
  alert_creation_blocked: "alert_creation_blocked",
  suspect_viewed: "suspect_viewed",
  report_viewed: "report_viewed",
  dashboard_viewed: "dashboard_viewed",
};

// Helper function to determine severity based on action
const determineSeverity = (action, details = {}) => {
  const severityMap = {
    // Critical actions
    hotel_deleted: "critical",
    suspect_deleted: "critical",
    case_closed: "critical",
    system_backup: "critical",
    login_failed: "critical",

    // High importance
    hotel_registered: "high",
    hotel_verified: "high",
    suspect_added: "high",
    alert_created: "high",
    alert_creation_blocked: "high",
    case_created: "high",
    password_changed: "high",

    // Medium importance
    hotel_updated: "medium",
    suspect_updated: "medium",
    alert_updated: "medium",
    alert_acknowledged: "medium",
    alert_resolved: "medium",
    report_generated: "medium",
    guest_flagged: "medium",

    // Low importance
    profile_updated: "low",
    login_attempt: "low",
    login_success: "low",
    logout: "low",
    report_viewed: "low",
    alert_viewed: "low",
    suspect_viewed: "low",
    dashboard_viewed: "low",
    guest_viewed: "low",
  };

  // Check if priority affects severity
  if (details.priority === "Critical") {
    return "critical";
  } else if (details.priority === "High") {
    return "high";
  }

  return severityMap[action] || "medium";
};

// Helper function to determine category based on action
const determineCategory = (action) => {
  const categoryMap = {
    // Authentication
    login_attempt: "authentication",
    login_success: "authentication",
    login_failed: "authentication",
    logout: "authentication",
    password_changed: "authentication",

    // Security
    alert_created: "security",
    alert_updated: "security",
    alert_resolved: "security",
    guest_flagged: "security",
    suspect_added: "security",
    alert_creation_blocked: "security",

    // Reporting
    report_generated: "reporting",
    report_viewed: "reporting",
    report_downloaded: "reporting",
    data_export: "reporting",

    // System
    system_backup: "system",
    system_maintenance: "system",
    logging_failed: "system",
    bulk_operation: "system",

    // Monitoring
    dashboard_viewed: "monitoring",
    statistics_viewed: "monitoring",
    alert_viewed: "monitoring",
    suspect_viewed: "monitoring",
  };

  return categoryMap[action] || "data_management";
};

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
      console.error("❌ Activity logging failed: Missing required parameters", {
        performedBy: !!performedBy,
        action: !!action,
        targetType: !!targetType,
        targetId: !!targetId,
      });
      return null;
    }

    // Convert performedBy to ObjectId if it's a valid string
    let performedByObjectId;
    try {
      performedByObjectId = new mongoose.Types.ObjectId(performedBy);
    } catch (error) {
      console.error("❌ Invalid performedBy ObjectId:", performedBy);
      performedByObjectId = performedBy; // Keep as string if conversion fails
    }

    const mappedAction = ACTION_MAPPING[action] || action;

    const activityData = {
      performedBy: performedByObjectId,
      action: mappedAction,
      targetType,
      targetId,
      details: {
        ...details,
        timestamp: new Date(),
        ...(action !== mappedAction && { originalAction: action }),
      },
      severity: determineSeverity(mappedAction, details),
      category: determineCategory(mappedAction),
      status: "success",
    };

    // Add request metadata if available
    if (req) {
      activityData.ipAddress =
        req.ip ||
        req.connection?.remoteAddress ||
        req.headers["x-forwarded-for"] ||
        req.socket?.remoteAddress;
      activityData.userAgent = req.get("User-Agent");
      activityData.sessionId = req.sessionID || req.headers["x-session-id"];
    }

    const activity = new ActivityLog(activityData);
    await activity.save();

    console.log(`✅ Activity logged: ${mappedAction} by ${performedBy}`);
    return activity;
  } catch (error) {
    console.error("❌ Activity logging error:", error.message);

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
          timestamp: new Date(),
        },
        status: "failed",
        severity: "high",
        category: "system",
        errorMessage: error.message,
      });
    } catch (fallbackError) {
      console.error("❌ Even fallback logging failed:", fallbackError.message);
    }
    return null;
  }
};

// Get activity logs with pagination and filters (Admin only)
const getActivityLogs = async (req, res) => {
  try {
    // Only admin police can view all activity logs
    if (req.user?.policeRole !== "admin_police") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Admin police role required.",
        code: "ADMIN_ACCESS_REQUIRED",
      });
    }

    const {
      page = 1,
      limit = 20,
      officerId,
      action,
      targetType,
      startDate,
      endDate,
      status = null,
      severity = null,
      category = null,
    } = req.query;

    // Build filter object
    const filter = {};
    if (officerId) filter.performedBy = new mongoose.Types.ObjectId(officerId);
    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (category) filter.category = category;

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
          severity,
          category,
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

// Enhanced getOfficerActivities with comprehensive statistics [web:64][web:65]
const getOfficerActivities = async (req, res) => {
  try {
    if (req.user?.policeRole !== "admin_police") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Admin police role required.",
      });
    }

    const { officerId } = req.params;
    const {
      page = 1,
      limit = 50,
      days = 7,
      action,
      targetType,
      severity,
    } = req.query;

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

    // Build filter for activities
    const filter = {
      performedBy: new mongoose.Types.ObjectId(officerId),
      createdAt: { $gte: startDate },
    };

    if (action && action !== "all") filter.action = action;
    if (targetType && targetType !== "all") filter.targetType = targetType;
    if (severity && severity !== "all") filter.severity = severity;

    const skip = (page - 1) * limit;

    // Get activities with comprehensive statistics [web:64][web:65]
    const [activities, totalCount, recentCount, activityStats] =
      await Promise.all([
        ActivityLog.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),

        // Total count for this officer (all time)
        ActivityLog.countDocuments({
          performedBy: new mongoose.Types.ObjectId(officerId),
        }),

        // Count for the filtered period
        ActivityLog.countDocuments(filter),

        // Detailed statistics using aggregation [web:64][web:65]
        ActivityLog.aggregate([
          {
            $match: {
              performedBy: new mongoose.Types.ObjectId(officerId),
              createdAt: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: null,
              totalActivities: { $sum: 1 },
              categoryBreakdown: {
                $push: "$category",
              },
              severityBreakdown: {
                $push: "$severity",
              },
              actionBreakdown: {
                $push: "$action",
              },
              dailyCount: {
                $push: {
                  date: {
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                  },
                  count: 1,
                },
              },
            },
          },
          {
            $addFields: {
              // Count by category
              authenticationCount: {
                $size: {
                  $filter: {
                    input: "$categoryBreakdown",
                    cond: { $eq: ["$$this", "authentication"] },
                  },
                },
              },
              securityCount: {
                $size: {
                  $filter: {
                    input: "$categoryBreakdown",
                    cond: { $eq: ["$$this", "security"] },
                  },
                },
              },
              // Count by severity
              lowSeverityCount: {
                $size: {
                  $filter: {
                    input: "$severityBreakdown",
                    cond: { $eq: ["$$this", "low"] },
                  },
                },
              },
              mediumSeverityCount: {
                $size: {
                  $filter: {
                    input: "$severityBreakdown",
                    cond: { $eq: ["$$this", "medium"] },
                  },
                },
              },
              highSeverityCount: {
                $size: {
                  $filter: {
                    input: "$severityBreakdown",
                    cond: { $eq: ["$$this", "high"] },
                  },
                },
              },
              criticalSeverityCount: {
                $size: {
                  $filter: {
                    input: "$severityBreakdown",
                    cond: { $eq: ["$$this", "critical"] },
                  },
                },
              },
              // Alert activities
              alertActivitiesCount: {
                $size: {
                  $filter: {
                    input: "$actionBreakdown",
                    cond: {
                      $regexMatch: {
                        input: "$$this",
                        regex: "alert",
                      },
                    },
                  },
                },
              },
            },
          },
        ]),
      ]);

    const stats =
      activityStats.length > 0
        ? activityStats[0]
        : {
            totalActivities: 0,
            authenticationCount: 0,
            securityCount: 0,
            lowSeverityCount: 0,
            mediumSeverityCount: 0,
            highSeverityCount: 0,
            criticalSeverityCount: 0,
            alertActivitiesCount: 0,
          };

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
        totalCount, // Total activities for this officer (all time)
        recentCount, // Activities in the filtered period
        statistics: {
          ...stats,
          // Additional calculated metrics
          averageActivitiesPerDay:
            Math.round((recentCount / parseInt(days)) * 10) / 10,
          activityTrend:
            recentCount > totalCount * 0.1 ? "increasing" : "stable",
        },
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
      message: error.message,
    });
  }
};

// Get activity statistics (Admin only)
const getActivityStats = async (req, res) => {
  try {
    if (req.user?.policeRole !== "admin_police") {
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
      activitiesByCategory,
      activitiesBySeverity,
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
        { $limit: 10 },
      ]),

      // Activities grouped by officer [web:64][web:65]
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

      // Activities grouped by category
      ActivityLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Activities grouped by severity
      ActivityLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$severity", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Recent activities (last 10)
      ActivityLog.find({ createdAt: { $gte: startDate } })
        .populate("performedBy", "name badgeNumber")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      // Daily activity count [web:67]
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
        activitiesByCategory,
        activitiesBySeverity,
        recentActivities,
        dailyActivities,
      },
    });
  } catch (error) {
    console.error("Get activity stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch activity statistics",
      message: error.message,
    });
  }
};

// Get my activities (for sub-police to see their own activities)
const getMyActivities = async (req, res) => {
  try {
    const { page = 1, limit = 20, days = 7, category, severity } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const filter = {
      performedBy: new mongoose.Types.ObjectId(req.user.policeId),
      createdAt: { $gte: startDate },
    };

    if (category) filter.category = category;
    if (severity) filter.severity = severity;

    const skip = (page - 1) * limit;

    const [activities, totalCount, myStats] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ActivityLog.countDocuments({
        performedBy: new mongoose.Types.ObjectId(req.user.policeId),
      }), // Total count all time
      ActivityLog.aggregate([
        {
          $match: {
            performedBy: new mongoose.Types.ObjectId(req.user.policeId),
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        activities,
        totalCount, // All-time count
        recentCount: activities.length, // Count in the filtered period
        myStats,
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
      message: error.message,
    });
  }
};

module.exports = {
  logActivity,
  getActivityLogs,
  getOfficerActivities,
  getActivityStats,
  getMyActivities,
  determineSeverity,
  determineCategory,
};
