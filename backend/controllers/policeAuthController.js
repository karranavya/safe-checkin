// controllers/policeAuthController.js
const Police = require("../models/Police");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT token for police
const generatePoliceToken = (policeId, police) => {
  return jwt.sign(
    {
      policeId,
      role: "police",
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

// Register new police officer
const registerPolice = async (req, res) => {
  try {
    const { badgeNumber, name, email, password, station, rank } = req.body;

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
    });

    await police.save();

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

// Login police officer
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
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, police.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      });
    }

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
        isActive: police.isActive,
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
        isActive: police.isActive,
        createdAt: police.createdAt,
        updatedAt: police.updatedAt,
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

// Update police profile
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

    const police = await Police.findByIdAndUpdate(
      req.user.policeId,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

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

// Change password
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

// Get all police officers (for admin use)
const getAllPoliceOfficers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      isActive = null,
      station = null,
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

module.exports = {
  registerPolice,
  loginPolice,
  getPoliceProfile,
  updatePoliceProfile,
  changePolicePassword,
  refreshPoliceToken,
  getAllPoliceOfficers,
};
