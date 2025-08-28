// routes/policeAlertRoutes.js
const express = require("express");
const router = express.Router();
const { authenticatePolice } = require("../middleware/policeAuth");
const Alert = require("../models/Alert");

// All police alert routes require police authentication
router.use(authenticatePolice);

// Get all alerts for police dashboard
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = "all",
      priority = "all",
      type = "all",
      sortBy = "createdAt",
      sortOrder = "desc",
      search = "",
    } = req.query;

    // Build query - police can see all alerts across hotels
    const query = {};

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

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Sorting
    const sort = {};
    if (sortBy === "priority") {
      // Custom priority sorting: Critical > High > Medium > Low
      const priorityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      sort.priority = sortOrder === "asc" ? 1 : -1;
      sort.createdAt = -1;
    } else {
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [alerts, totalCount] = await Promise.all([
      Alert.find(query)
        .populate("guestId", "name roomNumber phone email address")
        .populate("hotelId", "name address phone")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Alert.countDocuments(query),
    ]);

    res.json({
      success: true,
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
              email: alert.guestId.email,
              address: alert.guestId.address,
            }
          : null,
        hotel: alert.hotelId
          ? {
              id: alert.hotelId._id,
              name: alert.hotelId.name,
              address: alert.hotelId.address,
              phone: alert.hotelId.phone,
            }
          : null,
        assignedTo: alert.assignedTo,
        createdAt: alert.createdAt,
        updatedAt: alert.updatedAt,
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
    console.error("Get police alerts error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch alerts",
    });
  }
});

// Get alert details by ID
router.get("/:id", async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate("guestId", "name roomNumber phone email address aadharNumber")
      .populate("hotelId", "name address phone email");

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: "Alert not found",
      });
    }

    res.json({
      success: true,
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
              aadharNumber: alert.guestId.aadharNumber,
            }
          : null,
        hotel: alert.hotelId
          ? {
              id: alert.hotelId._id,
              name: alert.hotelId.name,
              address: alert.hotelId.address,
              phone: alert.hotelId.phone,
              email: alert.hotelId.email,
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
    console.error("Get police alert by ID error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch alert details",
    });
  }
});

// Update alert status (police can acknowledge/update alerts)
router.put("/:id/status", async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
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
        success: false,
        error: "Invalid status",
        validStatuses,
      });
    }

    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: "Alert not found",
      });
    }

    // Update status
    alert.status = status;

    // Add timeline entry
    alert.timeline.push({
      action: status,
      performedBy: {
        name: req.user.name,
        role: `Police Officer - ${req.user.rank}`,
      },
      timestamp: new Date(),
      notes: notes || `Status changed to ${status} by police`,
    });

    // Handle resolution by police
    if (status === "Resolved") {
      alert.resolution = {
        summary: notes || "Resolved by police department",
        resolvedBy: {
          name: req.user.name,
          role: `Police Officer - ${req.user.rank}`,
        },
        resolvedAt: new Date(),
        actionsTaken: ["Police intervention"],
      };
    }

    await alert.save();

    res.json({
      success: true,
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
    console.error("Update police alert status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update alert status",
    });
  }
});

// Get police-specific alert statistics
router.get("/stats/summary", async (req, res) => {
  try {
    const { period = "30" } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const [
      totalAlerts,
      activeAlerts,
      policeAlerts,
      criticalAlerts,
      resolvedByPolice,
      alertsByType,
    ] = await Promise.all([
      Alert.countDocuments({}),
      Alert.countDocuments({ isActive: true }),
      Alert.countDocuments({ type: "Police" }),
      Alert.countDocuments({ priority: "Critical", isActive: true }),
      Alert.countDocuments({
        status: "Resolved",
        "resolution.resolvedBy.role": { $regex: "Police", $options: "i" },
        createdAt: { $gte: startDate },
      }),
      Alert.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      success: true,
      period: `${period} days`,
      summary: {
        totalAlerts,
        activeAlerts,
        policeAlerts,
        criticalAlerts,
        resolvedByPolice,
      },
      alertsByType: alertsByType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error("Police alert stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch alert statistics",
    });
  }
});

module.exports = router;
