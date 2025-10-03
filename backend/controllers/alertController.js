// controllers/alertController.js - COMPLETE ENHANCED VERSION WITH SUSPECT MANAGEMENT
const Alert = require("../models/Alert");
const Guest = require("../models/Guest");
const { logActivity } = require("./activityController");
const mongoose = require("mongoose");

// ⭐ NEW: Mark alert as suspect and create suspect ID
const markAsSuspect = async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await Alert.findById(alertId).populate("guestId");

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: "Alert not found",
      });
    }

    // Generate unique suspect ID
    const suspectId = `SUSPECT_${alert.guestId._id}_${Date.now()}`;

    // Create backup of suspect data
    const suspectBackup = {
      name: alert.guestId.name,
      phone: alert.guestId.phone,
      aadhar: alert.guestId.aadhar,
      vehicle: alert.guestId.vehicle || "",
      email: alert.guestId.email || "",
      address: alert.guestId.address || "",
      age: alert.guestId.age || null,
      occupation: alert.guestId.occupation || "",
    };

    // Update alert with suspect information
    alert.suspectDetails = {
      isSuspect: true,
      suspectId: suspectId,
      suspectDeleted: false,
      suspectDeletedAt: null,
      suspectDeletedBy: null,
      deletionReason: null,
      suspectBackup: suspectBackup,
    };

    await alert.save();

    // Log suspect creation activity
    await logActivity(
      req.user?.policeId || "system",
      "suspect_added",
      "suspect",
      suspectId,
      {
        alertId: alert._id,
        suspectName: alert.guestId.name,
        guestId: alert.guestId._id,
        hotelId: alert.hotelId,
        actionTaken: "marked_as_suspect",
      },
      req
    );

    res.json({
      success: true,
      message: "Guest marked as suspect successfully",
      suspectId: suspectId,
      alert: alert,
    });
  } catch (error) {
    console.error("Mark as suspect error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to mark as suspect",
      message: error.message,
    });
  }
};

// ⭐ NEW: Soft delete suspect
const deleteSuspect = async (req, res) => {
  try {
    const { suspectId } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        error: "Deletion reason is required",
      });
    }

    // Find the suspect alert to get details for logging
    const suspectAlert = await Alert.findOne({
      "suspectDetails.suspectId": suspectId,
      "suspectDetails.isSuspect": true,
    }).populate("guestId");

    if (!suspectAlert) {
      return res.status(404).json({
        success: false,
        error: "Suspect not found",
      });
    }

    const deletedBy = {
      name: req.user?.name || "Police Officer",
      role: req.user?.policeRole || "police",
      badgeNumber: req.user?.badgeNumber || "",
      policeId: req.user?.policeId?.toString() || "",
    };

    // Soft delete the suspect (update all related alerts)
    const result = await Alert.softDeleteSuspect(
      suspectId,
      deletedBy,
      reason.trim()
    );

    // Log suspect deletion activity
    await logActivity(
      req.user?.policeId?.toString() || "system",
      "suspect_deleted",
      "suspect",
      suspectId,
      {
        suspectName:
          suspectAlert.suspectDetails?.suspectBackup?.name ||
          suspectAlert.guestId?.name,
        deletionReason: reason.trim(),
        deletedBy: deletedBy.name,
        alertsAffected: result.modifiedCount,
        guestId: suspectAlert.guestId?._id,
        hotelId: suspectAlert.hotelId,
        deletionMethod: "soft_delete",
      },
      req
    );

    res.json({
      success: true,
      message: "Suspect deleted successfully",
      deletedSuspect: {
        suspectId: suspectId,
        name:
          suspectAlert.suspectDetails?.suspectBackup?.name ||
          suspectAlert.guestId?.name,
        deletedAt: new Date(),
        deletedBy: deletedBy.name,
        reason: reason.trim(),
        alertsAffected: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Delete suspect error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete suspect",
      message: error.message,
    });
  }
};

// ⭐ NEW: Get all suspects (for police dashboard)
const getAllSuspects = async (req, res) => {
  try {
    const { includeDeleted = "false", page = 1, limit = 20 } = req.query;
    const showDeleted = includeDeleted === "true";

    // Only admin police can see deleted suspects
    if (showDeleted && req.user?.policeRole !== "admin_police") {
      return res.status(403).json({
        success: false,
        error:
          "Access denied. Admin police role required to view deleted suspects.",
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let suspects;
    if (showDeleted) {
      suspects = await Alert.getAllSuspectsForAdmin();
    } else {
      suspects = await Alert.getActiveSuspects();
    }

    // Transform suspects data for frontend
    const transformedSuspects = suspects
      .slice(skip, skip + parseInt(limit))
      .map((alert) => {
        const guestData =
          alert.guestId || alert.suspectDetails?.suspectBackup || {};
        const suspectData = alert.suspectDetails || {};

        return {
          id: suspectData.suspectId || alert._id,
          name: guestData.name || "Unknown",
          aadhar: guestData.aadhar || "Not Available",
          phone: guestData.phone || "Not Available",
          vehicle: guestData.vehicle || "",
          photo: guestData.photo || "/placeholder-avatar.jpg",
          email: guestData.email || "",
          age: guestData.age || null,
          occupation: guestData.occupation || "",
          address: guestData.address || "",
          dateAdded: alert.createdAt,

          // Suspect-specific fields
          isSuspect: suspectData.isSuspect || false,
          isDeleted: suspectData.suspectDeleted || false,
          deletedAt: suspectData.suspectDeletedAt,
          deletedBy: suspectData.suspectDeletedBy,
          deletionReason: suspectData.deletionReason,

          // Alert information
          alertStatus: alert.status,
          alertPriority: alert.priority,
          alertId: alert._id,

          // Associated alerts
          associatedAlerts: [
            {
              id: alert._id,
              title: alert.title,
              type: alert.type,
              priority: alert.priority,
              status: alert.status,
              date: alert.createdAt,
              location: alert.location
                ? `Room ${alert.location.roomNumber}${
                    alert.location.floor
                      ? `, Floor ${alert.location.floor}`
                      : ""
                  }`
                : "Unknown",
            },
          ],

          // Last seen information
          lastSeen: {
            location: alert.location
              ? `Room ${alert.location.roomNumber}`
              : "Unknown",
            date: alert.createdAt,
            reportedBy: alert.createdBy?.name || "System",
          },
        };
      });

    const totalCount = suspects.length;
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      data: {
        suspects: transformedSuspects,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          limit: parseInt(limit),
        },
        showingDeleted: showDeleted,
      },
    });
  } catch (error) {
    console.error("Get all suspects error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch suspects",
      message: error.message,
    });
  }
};

// ⭐ NEW: Restore deleted suspect (Admin only)
const restoreSuspect = async (req, res) => {
  try {
    if (req.user?.policeRole !== "admin_police") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Admin police role required.",
      });
    }

    const { suspectId } = req.params;

    const suspectAlert = await Alert.findOne({
      "suspectDetails.suspectId": suspectId,
      "suspectDetails.suspectDeleted": true,
    });

    if (!suspectAlert) {
      return res.status(404).json({
        success: false,
        error: "Deleted suspect not found",
      });
    }

    const result = await Alert.restoreSuspect(suspectId);

    // Log suspect restoration activity
    await logActivity(
      req.user.policeId.toString(),
      "suspect_restored",
      "suspect",
      suspectId,
      {
        suspectName: suspectAlert.suspectDetails?.suspectBackup?.name,
        restoredBy: req.user.name,
        alertsAffected: result.modifiedCount,
      },
      req
    );

    res.json({
      success: true,
      message: "Suspect restored successfully",
      restoredSuspect: {
        suspectId: suspectId,
        name: suspectAlert.suspectDetails?.suspectBackup?.name,
        restoredAt: new Date(),
        restoredBy: req.user.name,
        alertsAffected: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Restore suspect error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to restore suspect",
      message: error.message,
    });
  }
};

// Create new alert - UPDATED with duplicate prevention
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

    // Check for existing unresolved alerts for this guest
    const existingUnresolvedAlerts = await Alert.find({
      guestId: guestId,
      hotelId: req.hotelId,
      status: {
        $nin: ["Resolved", "Cancelled"],
      },
      isActive: true,
    }).populate("guestId", "name roomNumber phone");

    if (existingUnresolvedAlerts.length > 0) {
      // Log the attempt to create duplicate alert
      await logActivity(
        req.user?.policeId || "hotel_staff",
        "alert_creation_blocked",
        "alert",
        `blocked_${guestId}`,
        {
          reason: "existing_unresolved_alerts",
          guestName: guest.name,
          guestId: guestId,
          existingAlertsCount: existingUnresolvedAlerts.length,
          existingAlerts: existingUnresolvedAlerts.map((alert) => ({
            id: alert._id,
            title: alert.title,
            status: alert.status,
            priority: alert.priority,
            createdAt: alert.createdAt,
          })),
          attemptedAlert: {
            type,
            priority,
            title: title.trim(),
          },
          hotelId: req.hotelId,
        },
        req
      );

      return res.status(409).json({
        error: "Cannot create new alert",
        message: `Guest ${guest.name} already has ${existingUnresolvedAlerts.length} unresolved alert(s). Please resolve existing alerts before creating a new one.`,
        existingAlerts: existingUnresolvedAlerts.map((alert) => ({
          id: alert._id,
          title: alert.title,
          status: alert.status,
          priority: alert.priority,
          type: alert.type,
          createdAt: alert.createdAt,
          location: alert.location,
        })),
        guest: {
          id: guest._id,
          name: guest.name,
          roomNumber: guest.roomNumber,
          phone: guest.phone,
        },
      });
    }

    // Continue with alert creation
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
          notes: "Alert created - no existing unresolved alerts found",
        },
      ],
      // ⭐ Initialize suspect details
      suspectDetails: {
        isSuspect: false,
        suspectId: null,
        suspectDeleted: false,
        suspectDeletedAt: null,
        suspectDeletedBy: null,
        deletionReason: null,
        suspectBackup: null,
      },
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

    // Log successful alert creation
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
        isNewGuest: !guest.alertsSent || guest.alertsSent.length === 0,
      },
      req
    );

    // Add alert to guest's record
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
        suspectDetails: alert.suspectDetails,
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

// Get all alerts
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
        // ⭐ Include suspect information
        suspectDetails: alert.suspectDetails,
        suspectStatus: alert.suspectStatus,
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

// Get alert by ID
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
        // ⭐ Include suspect information
        suspectDetails: alert.suspectDetails,
        suspectStatus: alert.suspectStatus,
      },
    });
  } catch (error) {
    console.error("Get alert by ID error:", error);
    res.status(500).json({
      error: "Failed to fetch alert details",
    });
  }
};

// Assign alert
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

// Add timeline entry
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

// Get alert statistics
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

// Check guest alert status
const checkGuestAlertStatus = async (req, res) => {
  try {
    const { guestId } = req.params;

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

    // Get all alerts for this guest
    const alerts = await Alert.find({
      guestId: guestId,
      hotelId: req.hotelId,
    }).sort({ createdAt: -1 });

    const unresolvedAlerts = alerts.filter(
      (alert) =>
        !["Resolved", "Cancelled"].includes(alert.status) && alert.isActive
    );

    const resolvedAlerts = alerts.filter((alert) =>
      ["Resolved", "Cancelled"].includes(alert.status)
    );

    res.json({
      guest: {
        id: guest._id,
        name: guest.name,
        roomNumber: guest.roomNumber,
        phone: guest.phone,
      },
      canCreateNewAlert: unresolvedAlerts.length === 0,
      alertsSummary: {
        total: alerts.length,
        unresolved: unresolvedAlerts.length,
        resolved: resolvedAlerts.length,
      },
      unresolvedAlerts: unresolvedAlerts.map((alert) => ({
        id: alert._id,
        title: alert.title,
        status: alert.status,
        priority: alert.priority,
        type: alert.type,
        createdAt: alert.createdAt,
      })),
      lastResolvedAlert:
        resolvedAlerts.length > 0
          ? {
              id: resolvedAlerts[0]._id,
              title: resolvedAlerts[0].title,
              resolvedAt: resolvedAlerts[0].resolution?.resolvedAt,
            }
          : null,
    });
  } catch (error) {
    console.error("Check guest alert status error:", error);
    res.status(500).json({
      error: "Failed to check guest alert status",
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
  checkGuestAlertStatus,
  // ⭐ NEW: Export suspect management functions
  markAsSuspect,
  deleteSuspect,
  getAllSuspects,
  restoreSuspect,
};
