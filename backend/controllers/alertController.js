// controllers/alertController.js - UPDATED with activity logging
const Alert = require("../models/Alert");
const Guest = require("../models/Guest");
const { logActivity } = require("./activityController");

// Create new alert - UPDATED with activity logging
const createAlert = async (req, res) => {
  try {
    const {
      guestId,
      type,
      priority = "Medium",
      title,
      description,
      location,
      attachments,
      assignedTo,
    } = req.body;

    // Validate required fields
    if (!guestId || !type || !title || !description || !location?.roomNumber) {
      return res.status(400).json({
        error: "Missing required fields",
        required: [
          "guestId",
          "type",
          "title",
          "description",
          "location.roomNumber",
        ],
      });
    }

    // Verify guest belongs to hotel
    const guest = await Guest.findOne({
      _id: guestId,
      hotelId: req.hotelId,
    });

    if (!guest) {
      return res.status(404).json({
        error: "Guest not found or doesn't belong to your hotel",
      });
    }

    // Create alert
    const alert = new Alert({
      hotelId: req.hotelId,
      guestId,
      type,
      priority,
      title: title.trim(),
      description: description.trim(),
      location: {
        roomNumber: location.roomNumber,
        floor: location.floor,
        building: location.building,
        coordinates: location.coordinates,
      },
      attachments: attachments || [],
      assignedTo,
      createdBy: {
        name: "Hotel Staff",
        role: "Hotel Staff",
      },
      timeline: [
        {
          action: "Created",
          performedBy: {
            name: "Hotel Staff",
            role: "Hotel Staff",
          },
          timestamp: new Date(),
          notes: "Alert created",
        },
      ],
    });

    // If assigned to someone, add assignment to timeline
    if (assignedTo) {
      alert.timeline.push({
        action: "Assigned",
        performedBy: {
          name: "Hotel Staff",
          role: "Hotel Staff",
        },
        timestamp: new Date(),
        notes: `Assigned to ${assignedTo.name}`,
      });
    }

    await alert.save();

    // Log alert creation activity
    await logActivity(
      req.user?.policeId || "hotel_staff",
      "alert_created",
      "alert",
      alert._id,
      {
        alertType: alert.type,
        priority: alert.priority,
        title: alert.title,
        guestName: guest.name,
        roomNumber: location.roomNumber,
        assignedTo: assignedTo?.name,
        hotelId: req.hotelId,
      },
      req
    );

    // Add alert to guest's record - Initialize alertsSent if it doesn't exist
    if (!guest.alertsSent) {
      guest.alertsSent = [];
    }

    guest.alertsSent.push({
      type,
      sentAt: new Date(),
      reason: title,
      status: "Sent",
    });

    await guest.save();

    // Populate guest info for response
    await alert.populate("guestId", "name roomNumber phone");

    res.status(201).json({
      message: "Alert created successfully",
      alert: {
        id: alert._id,
        type: alert.type,
        priority: alert.priority,
        title: alert.title,
        description: alert.description,
        status: alert.status,
        location: alert.location,
        guest: {
          id: alert.guestId._id,
          name: alert.guestId.name,
          roomNumber: alert.guestId.roomNumber,
          phone: alert.guestId.phone,
        },
        assignedTo: alert.assignedTo,
        createdAt: alert.createdAt,
      },
    });
  } catch (error) {
    console.error("Create alert error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        error: "Validation failed",
        details: messages,
      });
    }

    res.status(500).json({
      error: "Failed to create alert",
      details: error.message,
    });
  }
};

// Update alert status - UPDATED with activity logging
const updateAlertStatus = async (req, res) => {
  try {
    const { status, notes, resolution } = req.body;

    if (!status) {
      return res.status(400).json({
        error: "Status is required",
      });
    }

    const validStatuses = [
      "Pending",
      "Acknowledged",
      "In Progress",
      "Resolved",
      "Cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status",
        validStatuses,
      });
    }

    const alert = await Alert.findOne({
      _id: req.params.id,
      hotelId: req.hotelId,
    });

    if (!alert) {
      return res.status(404).json({
        error: "Alert not found",
      });
    }

    const previousStatus = alert.status;

    // Update status
    alert.status = status;

    // Add timeline entry
    alert.timeline.push({
      action: status,
      performedBy: {
        name: req.user?.name || "Hotel Staff",
        role: req.user?.policeRole
          ? `Police - ${req.user.rank}`
          : "Hotel Staff",
      },
      timestamp: new Date(),
      notes: notes || `Status changed to ${status}`,
    });

    // Handle resolution
    if (status === "Resolved") {
      alert.resolution = {
        summary: resolution?.summary || "Alert resolved",
        resolvedBy: {
          name: req.user?.name || "Hotel Staff",
          role: req.user?.policeRole
            ? `Police - ${req.user.rank}`
            : "Hotel Staff",
        },
        resolvedAt: new Date(),
        actionsTaken: resolution?.actionsTaken || [],
      };
    }

    await alert.save();

    // Log alert status update activity
    await logActivity(
      req.user?.policeId || "hotel_staff",
      "alert_updated",
      "alert",
      alert._id,
      {
        alertTitle: alert.title,
        previousStatus,
        newStatus: status,
        notes: notes,
        resolvedBy: req.user?.name,
        isResolution: status === "Resolved",
      },
      req
    );

    res.json({
      message: `Alert status updated to ${status}`,
      alert: {
        id: alert._id,
        title: alert.title,
        status: alert.status,
        updatedAt: alert.updatedAt,
        resolution: alert.resolution,
      },
    });
  } catch (error) {
    console.error("Update alert status error:", error);
    res.status(500).json({
      error: "Failed to update alert status",
    });
  }
};

// Delete alert - UPDATED with activity logging
const deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findOneAndDelete({
      _id: req.params.id,
      hotelId: req.hotelId,
    });

    if (!alert) {
      return res.status(404).json({
        error: "Alert not found",
      });
    }

    // Log alert deletion activity
    await logActivity(
      req.user?.policeId || "hotel_staff",
      "alert_removed",
      "alert",
      alert._id,
      {
        alertTitle: alert.title,
        alertType: alert.type,
        priority: alert.priority,
        deletedBy: req.user?.name || "Hotel Staff",
      },
      req
    );

    res.json({
      message: "Alert deleted successfully",
      deletedAlert: {
        id: alert._id,
        title: alert.title,
        deletedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Delete alert error:", error);
    res.status(500).json({
      error: "Failed to delete alert",
    });
  }
};

// Keep all other existing functions unchanged...
const getAllAlerts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = "all",
      priority = "all",
      type = "all",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = { hotelId: req.hotelId };

    // Filter by status
    if (status === "active") {
      query.isActive = true;
    } else if (status === "resolved") {
      query.status = "Resolved";
    } else if (status === "pending") {
      query.status = "Pending";
    }

    // Filter by priority
    if (priority !== "all") {
      query.priority =
        priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
    }

    // Filter by type
    if (type !== "all") {
      query.type = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    }

    // Sorting
    const sort = {};
    if (sortBy === "priority") {
      // Custom priority sorting: Critical > High > Medium > Low
      sort.priority = sortOrder === "asc" ? 1 : -1;
      sort.createdAt = -1; // Secondary sort by creation date
    } else {
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [alerts, totalCount] = await Promise.all([
      Alert.find(query)
        .populate("guestId", "name roomNumber phone")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Alert.countDocuments(query),
    ]);

    res.json({
      alerts: alerts.map((alert) => ({
        id: alert._id,
        type: alert.type,
        priority: alert.priority,
        title: alert.title,
        description: alert.description,
        status: alert.status,
        location: alert.location,
        guest: alert.guestId
          ? {
              id: alert.guestId._id,
              name: alert.guestId.name,
              roomNumber: alert.guestId.roomNumber,
              phone: alert.guestId.phone,
            }
          : null,
        assignedTo: alert.assignedTo,
        createdAt: alert.createdAt,
        age: alert.age,
        responseTime: alert.responseTime,
        isActive: alert.isActive,
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalAlerts: totalCount,
        hasNext: skip + parseInt(limit) < totalCount,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Get all alerts error:", error);
    res.status(500).json({
      error: "Failed to fetch alerts",
    });
  }
};

const getAlertById = async (req, res) => {
  try {
    const alert = await Alert.findOne({
      _id: req.params.id,
      hotelId: req.hotelId,
    }).populate("guestId", "name roomNumber phone email address");

    if (!alert) {
      return res.status(404).json({
        error: "Alert not found",
      });
    }

    res.json({
      alert: {
        id: alert._id,
        type: alert.type,
        priority: alert.priority,
        title: alert.title,
        description: alert.description,
        status: alert.status,
        location: alert.location,
        guest: alert.guestId
          ? {
              id: alert.guestId._id,
              name: alert.guestId.name,
              roomNumber: alert.guestId.roomNumber,
              phone: alert.guestId.phone,
              email: alert.guestId.email,
              address: alert.guestId.address,
            }
          : null,
        assignedTo: alert.assignedTo,
        createdBy: alert.createdBy,
        timeline: alert.timeline,
        attachments: alert.attachments,
        resolution: alert.resolution,
        relatedAlerts: alert.relatedAlerts,
        createdAt: alert.createdAt,
        updatedAt: alert.updatedAt,
        age: alert.age,
        responseTime: alert.responseTime,
        isActive: alert.isActive,
      },
    });
  } catch (error) {
    console.error("Get alert by ID error:", error);
    res.status(500).json({
      error: "Failed to fetch alert details",
    });
  }
};

const assignAlert = async (req, res) => {
  try {
    const { assignedTo, notes } = req.body;

    if (!assignedTo || !assignedTo.name) {
      return res.status(400).json({
        error: "Assigned person's name is required",
      });
    }

    const alert = await Alert.findOne({
      _id: req.params.id,
      hotelId: req.hotelId,
    });

    if (!alert) {
      return res.status(404).json({
        error: "Alert not found",
      });
    }

    // Update assignment
    alert.assignedTo = {
      name: assignedTo.name,
      role: assignedTo.role || "Staff",
      contactNumber: assignedTo.contactNumber,
      assignedAt: new Date(),
    };

    // Add timeline entry
    alert.timeline.push({
      action: "Assigned",
      performedBy: {
        name: req.user?.name || "Hotel Staff",
        role: req.user?.policeRole
          ? `Police - ${req.user.rank}`
          : "Hotel Staff",
      },
      timestamp: new Date(),
      notes: notes || `Assigned to ${assignedTo.name}`,
    });

    await alert.save();

    res.json({
      message: "Alert assigned successfully",
      alert: {
        id: alert._id,
        title: alert.title,
        assignedTo: alert.assignedTo,
        updatedAt: alert.updatedAt,
      },
    });
  } catch (error) {
    console.error("Assign alert error:", error);
    res.status(500).json({
      error: "Failed to assign alert",
    });
  }
};

const addTimelineEntry = async (req, res) => {
  try {
    const { action, notes } = req.body;

    if (!action) {
      return res.status(400).json({
        error: "Action is required",
      });
    }

    const alert = await Alert.findOne({
      _id: req.params.id,
      hotelId: req.hotelId,
    });

    if (!alert) {
      return res.status(404).json({
        error: "Alert not found",
      });
    }

    // Add timeline entry
    alert.timeline.push({
      action,
      performedBy: {
        name: req.user?.name || "Hotel Staff",
        role: req.user?.policeRole
          ? `Police - ${req.user.rank}`
          : "Hotel Staff",
      },
      timestamp: new Date(),
      notes: notes || "",
    });

    await alert.save();

    res.json({
      message: "Timeline entry added successfully",
      timelineEntry: alert.timeline[alert.timeline.length - 1],
    });
  } catch (error) {
    console.error("Add timeline entry error:", error);
    res.status(500).json({
      error: "Failed to add timeline entry",
    });
  }
};

const getAlertStats = async (req, res) => {
  try {
    const { period = "30" } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const [
      totalAlerts,
      activeAlerts,
      alertsByStatus,
      alertsByPriority,
      alertsByType,
      responseTimeStats,
    ] = await Promise.all([
      Alert.countDocuments({ hotelId: req.hotelId }),
      Alert.countDocuments({ hotelId: req.hotelId, isActive: true }),
      Alert.aggregate([
        { $match: { hotelId: req.hotelId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Alert.aggregate([
        { $match: { hotelId: req.hotelId } },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
      Alert.aggregate([
        { $match: { hotelId: req.hotelId } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
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
            firstResponse: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$timeline",
                    cond: {
                      $in: ["$$this.action", ["Acknowledged", "In Progress"]],
                    },
                  },
                },
                0,
              ],
            },
          },
        },
        {
          $addFields: {
            responseTimeHours: {
              $divide: [
                { $subtract: ["$firstResponse.timestamp", "$createdAt"] },
                1000 * 60 * 60,
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgResponseTime: { $avg: "$responseTimeHours" },
            minResponseTime: { $min: "$responseTimeHours" },
            maxResponseTime: { $max: "$responseTimeHours" },
          },
        },
      ]),
    ]);

    // Format the statistics
    const statusStats = alertsByStatus.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const priorityStats = alertsByPriority.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const typeStats = alertsByType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.json({
      period: `${period} days`,
      summary: {
        totalAlerts,
        activeAlerts,
        resolvedAlerts: statusStats.Resolved || 0,
        pendingAlerts: statusStats.Pending || 0,
        criticalAlerts: priorityStats.Critical || 0,
      },
      breakdown: {
        byStatus: statusStats,
        byPriority: priorityStats,
        byType: typeStats,
      },
      responseTime: responseTimeStats[0] || {
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
      },
    });
  } catch (error) {
    console.error("Get alert stats error:", error);
    res.status(500).json({
      error: "Failed to fetch alert statistics",
    });
  }
};

module.exports = {
  createAlert,
  getAllAlerts,
  getAlertById,
  updateAlertStatus,
  assignAlert,
  addTimelineEntry,
  deleteAlert,
  getAlertStats,
};
