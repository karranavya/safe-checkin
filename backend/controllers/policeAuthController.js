// controllers/policeAuthController.js - UPDATED with role handling and activity logging
const Police = require("../models/Police");
const { logActivity } = require("./activityController");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT token with role information
const generatePoliceToken = (policeId, police) => {
  return jwt.sign(
    {
      policeId,
      role: "police",
      policeRole: police.role, // admin_police or sub_police
      badgeNumber: police.badgeNumber,
      name: police.name,
      station: police.station,
      rank: police.rank,
    },
    process.env.JWT_SECRET || "default-secret-change-in-production",
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

// Register new police officer with role
const registerPolice = async (req, res) => {
  try {
    const { badgeNumber, name, email, password, station, rank, role } =
      req.body;

    // Validate required fields
    if (!badgeNumber || !name || !email || !password || !station || !rank) {
      return res.status(400).json({
        success: false,
        error: "All fields are required",
        required: [
          "badgeNumber",
          "name",
          "email",
          "password",
          "station",
          "rank",
        ],
      });
    }

    // Check if police officer already exists
    const existingPolice = await Police.findOne({
      $or: [
        { email: email.toLowerCase() },
        { badgeNumber: badgeNumber.trim() },
      ],
    });

    if (existingPolice) {
      return res.status(400).json({
        success: false,
        error: "Police officer with this email or badge number already exists",
        code: "DUPLICATE_OFFICER",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create police officer
    const police = new Police({
      badgeNumber: badgeNumber.trim(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      station: station.trim(),
      rank: rank.trim(),
      role: role || "sub_police", // Default to sub_police
    });

    await police.save();

    // Log registration activity
    await logActivity(
      police._id,
      "profile_updated",
      "profile",
      police._id,
      { action: "registration", role: police.role },
      req
    );

    // Generate token
    const token = generatePoliceToken(police._id, police);

    res.status(201).json({
      success: true,
      message: "Police officer registered successfully",
      token,
      police: {
        id: police._id,
        badgeNumber: police.badgeNumber,
        name: police.name,
        email: police.email,
        station: police.station,
        rank: police.rank,
        role: police.role,
        isActive: police.isActive,
      },
    });
  } catch (error) {
    console.error("Police registration error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: messages,
      });
    }
    res.status(500).json({
      success: false,
      error: "Registration failed",
      message: "An error occurred during registration",
    });
  }
};

// Login police officer with role information and activity logging
const loginPolice = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    // Find police officer
    const police = await Police.findOne({
      email: email.toLowerCase().trim(),
      isActive: true,
    });

    if (!police) {
      // Log failed login attempt
      await logActivity(
        null,
        "login_attempt",
        "system",
        new Date(),
        { success: false, email, reason: "user_not_found" },
        req
      );

      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, police.password);
    if (!isPasswordValid) {
      // Log failed login attempt
      await logActivity(
        police._id,
        "login_attempt",
        "system",
        police._id,
        { success: false, reason: "invalid_password" },
        req
      );

      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      });
    }

    // Update login statistics
    await Police.findByIdAndUpdate(police._id, {
      lastLoginAt: new Date(),
      $inc: { loginCount: 1 },
    });

    // Log successful login
    await logActivity(
      police._id,
      "login_attempt",
      "system",
      police._id,
      { success: true, role: police.role },
      req
    );

    // Generate token
    const token = generatePoliceToken(police._id, police);

    res.json({
      success: true,
      message: "Login successful",
      token,
      police: {
        id: police._id,
        badgeNumber: police.badgeNumber,
        name: police.name,
        email: police.email,
        station: police.station,
        rank: police.rank,
        role: police.role,
        isActive: police.isActive,
        lastLoginAt: police.lastLoginAt,
        loginCount: police.loginCount,
      },
    });
  } catch (error) {
    console.error("Police login error:", error);
    res.status(500).json({
      success: false,
      error: "Login failed",
      message: "An error occurred during login",
    });
  }
};

// Get police profile
const getPoliceProfile = async (req, res) => {
  try {
    const police = await Police.findById(req.user.policeId).select("-password");
    if (!police) {
      return res.status(404).json({
        success: false,
        error: "Police officer not found",
      });
    }

    res.json({
      success: true,
      police: {
        id: police._id,
        badgeNumber: police.badgeNumber,
        name: police.name,
        email: police.email,
        station: police.station,
        rank: police.rank,
        role: police.role,
        isActive: police.isActive,
        permissions: police.permissions,
        createdAt: police.createdAt,
        updatedAt: police.updatedAt,
        lastLoginAt: police.lastLoginAt,
        loginCount: police.loginCount,
      },
    });
  } catch (error) {
    console.error("Get police profile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch police profile",
    });
  }
};

// Update police profile with activity logging
const updatePoliceProfile = async (req, res) => {
  try {
    const { name, email, station, rank } = req.body;
    const updateData = {};

    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (station) updateData.station = station.trim();
    if (rank) updateData.rank = rank.trim();

    // Check if email is being changed and if it already exists
    if (email) {
      const existingPolice = await Police.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: req.user.policeId },
      });
      if (existingPolice) {
        return res.status(400).json({
          success: false,
          error: "Email already exists",
        });
      }
    }

    // Get current data for logging
    const currentPolice = await Police.findById(req.user.policeId);

    const police = await Police.findByIdAndUpdate(
      req.user.policeId,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    // Log profile update activity
    await logActivity(
      req.user.policeId,
      "profile_updated",
      "profile",
      req.user.policeId,
      {
        updatedFields: Object.keys(updateData),
        previousData: {
          name: currentPolice.name,
          email: currentPolice.email,
          station: currentPolice.station,
          rank: currentPolice.rank,
        },
        newData: updateData,
      },
      req
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      police: {
        id: police._id,
        badgeNumber: police.badgeNumber,
        name: police.name,
        email: police.email,
        station: police.station,
        rank: police.rank,
        role: police.role,
        isActive: police.isActive,
      },
    });
  } catch (error) {
    console.error("Update police profile error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: messages,
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to update profile",
    });
  }
};

// Change password with activity logging
const changePolicePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "New password must be at least 6 characters long",
      });
    }

    const police = await Police.findById(req.user.policeId);

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      police.password
    );
    if (!isCurrentPasswordValid) {
      // Log failed password change attempt
      await logActivity(
        req.user.policeId,
        "profile_updated",
        "profile",
        req.user.policeId,
        {
          action: "password_change",
          success: false,
          reason: "invalid_current_password",
        },
        req
      );

      return res.status(400).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    police.password = hashedNewPassword;
    await police.save();

    // Log successful password change
    await logActivity(
      req.user.policeId,
      "profile_updated",
      "profile",
      req.user.policeId,
      { action: "password_change", success: true },
      req
    );

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change police password error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to change password",
    });
  }
};

// Refresh token
const refreshPoliceToken = async (req, res) => {
  try {
    const police = await Police.findById(req.user.policeId);
    if (!police || !police.isActive) {
      return res.status(401).json({
        success: false,
        error: "Police officer not found or inactive",
      });
    }

    const newToken = generatePoliceToken(police._id, police);

    res.json({
      success: true,
      message: "Token refreshed successfully",
      token: newToken,
    });
  } catch (error) {
    console.error("Refresh police token error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to refresh token",
    });
  }
};

// Get all police officers (Admin only)
const getAllPoliceOfficers = async (req, res) => {
  try {
    // Only admin police can access this
    if (req.user.policeRole !== "admin_police") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Admin police role required.",
      });
    }

    const {
      page = 1,
      limit = 10,
      search = "",
      isActive = null,
      station = null,
      role = null,
    } = req.query;

    // Build filter object
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { badgeNumber: { $regex: search, $options: "i" } },
        { station: { $regex: search, $options: "i" } },
      ];
    }
    if (isActive !== null) {
      filter.isActive = isActive === "true";
    }
    if (station) {
      filter.station = { $regex: station, $options: "i" };
    }
    if (role) {
      filter.role = role;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get police officers with pagination
    const [officers, totalCount] = await Promise.all([
      Police.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Police.countDocuments(filter),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        officers,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit),
        },
        filters: {
          search,
          isActive,
          station,
          role,
        },
      },
    });
  } catch (error) {
    console.error("Get all police officers error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch police officers",
      message: error.message,
    });
  }
};

// Get sub-police officers (Admin only)
// In policeAuthController.js - Add this to getSubPoliceOfficers function
const getSubPoliceOfficers = async (req, res) => {
  try {
    console.log("=== SUB-POLICE DEBUG ===");
    console.log("User role:", req.user.policeRole);
    console.log("Query params:", req.query);

    // Only admin police can access this
    if (req.user.policeRole !== "admin_police") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Admin police role required.",
      });
    }

    const { page = 1, limit = 10, isActive = null, station = null } = req.query;

    const filter = {
      role: "sub_police",
    };

    if (isActive !== null && isActive !== undefined) {
      filter.isActive = isActive === "true";
    }
    if (station) {
      filter.station = { $regex: station, $options: "i" };
    }

    console.log("Filter being used:", filter);

    const skip = (page - 1) * limit;

    const [subPolice, totalCount] = await Promise.all([
      Police.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Police.countDocuments(filter),
    ]);

    console.log("Found sub-police count:", totalCount);
    console.log("Sub-police officers:", subPolice);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: {
        officers: subPolice,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get sub-police officers error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch sub-police officers",
    });
  }
};

// Get officer by ID (Admin only)
const getOfficerById = async (req, res) => {
  try {
    if (req.user.policeRole !== "admin_police") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Admin police role required.",
      });
    }

    const { officerId } = req.params;

    const officer = await Police.findById(officerId).select("-password");
    if (!officer) {
      return res.status(404).json({
        success: false,
        error: "Officer not found",
      });
    }

    res.json({
      success: true,
      data: officer,
    });
  } catch (error) {
    console.error("Get officer by ID error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch officer details",
    });
  }
};

// Update officer status (Admin only)
const updateOfficerStatus = async (req, res) => {
  try {
    if (req.user.policeRole !== "admin_police") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Admin police role required.",
      });
    }

    const { officerId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        error: "isActive must be a boolean value",
      });
    }

    const officer = await Police.findByIdAndUpdate(
      officerId,
      { isActive },
      { new: true }
    ).select("-password");

    if (!officer) {
      return res.status(404).json({
        success: false,
        error: "Officer not found",
      });
    }

    // Log status update activity
    await logActivity(
      req.user.policeId,
      "profile_updated",
      "profile",
      officerId,
      {
        action: "status_update",
        targetOfficer: officer.name,
        newStatus: isActive ? "active" : "inactive",
        performedBy: req.user.name,
      },
      req
    );

    res.json({
      success: true,
      message: `Officer ${isActive ? "activated" : "deactivated"} successfully`,
      data: officer,
    });
  } catch (error) {
    console.error("Update officer status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update officer status",
    });
  }
};

// Logout with activity logging
const logoutPolice = async (req, res) => {
  try {
    // Log logout activity
    await logActivity(
      req.user.policeId,
      "logout",
      "system",
      req.user.policeId,
      { timestamp: new Date() },
      req
    );

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      error: "Logout failed",
    });
  }
};

module.exports = {
  registerPolice,
  loginPolice,
  getPoliceProfile,
  updatePoliceProfile,
  changePolicePassword,
  refreshPoliceToken,
  getAllPoliceOfficers,
  getSubPoliceOfficers,
  getOfficerById,
  updateOfficerStatus,
  logoutPolice,
};
