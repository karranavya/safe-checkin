// controllers/hotelAuthController.js
const Hotel = require("../models/Hotel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT token
const generateToken = (hotelId) => {
  return jwt.sign({ hotelId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Register new hotel
const registerHotel = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      ownerName,
      numberOfRooms,
      roomRate,
      address,
      registeredByPolice,
      policeOfficerId,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !email ||
      !password ||
      !phone ||
      !ownerName ||
      !numberOfRooms ||
      !roomRate
    ) {
      return res.status(400).json({
        error: "All required fields must be provided",
        required: [
          "name",
          "email",
          "password",
          "phone",
          "ownerName",
          "numberOfRooms",
          "roomRate",
        ],
      });
    }

    // Check if hotel already exists
    const existingHotel = await Hotel.findOne({ email: email.toLowerCase() });
    if (existingHotel) {
      return res.status(400).json({
        error: "Hotel with this email already exists",
        code: "EMAIL_EXISTS",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Get police officer info from the middleware (if authenticated)
    let policeOfficerData = null;
    if (req.police) {
      policeOfficerData = {
        id: req.police.policeId || policeOfficerId,
        name: req.police.name || "Police Officer",
        badgeNumber: req.police.badgeNumber || "N/A",
        station: req.police.station || "N/A",
        rank: req.police.rank || "Officer",
      };
    }

    // Create hotel with updated structure
    const hotel = new Hotel({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone.trim(),
      ownerName: ownerName.trim(),
      numberOfRooms: parseInt(numberOfRooms),
      roomRate: parseFloat(roomRate),
      address: address || {},
      registeredByPolice: registeredByPolice || false,
      registeredBy:
        policeOfficerId || (req.police ? req.police.policeId : null),
      policeOfficer: policeOfficerData, // Store complete police officer info
    });

    await hotel.save();

    // Generate token
    const token = generateToken(hotel._id);

    res.status(201).json({
      message: "Hotel registered successfully",
      token,
      hotel: {
        id: hotel._id,
        name: hotel.name,
        email: hotel.email,
        ownerName: hotel.ownerName,
        phone: hotel.phone,
        numberOfRooms: hotel.numberOfRooms,
        roomRate: hotel.roomRate,
        registrationDate: hotel.registrationDate,
        registeredByPolice: hotel.registeredByPolice,
        policeOfficer: hotel.policeOfficer,
      },
    });
  } catch (error) {
    console.error("Hotel registration error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        error: "Validation failed",
        details: messages,
      });
    }

    res.status(500).json({
      error: "Registration failed",
      message: "An error occurred during registration",
    });
  }
};

// Login hotel
const loginHotel = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // Find hotel
    const hotel = await Hotel.findOne({
      email: email.toLowerCase().trim(),
      isActive: true,
    });

    if (!hotel) {
      return res.status(401).json({
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, hotel.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      });
    }

    // Update last login
    hotel.lastLogin = new Date();
    await hotel.save();

    // Generate token
    const token = generateToken(hotel._id);

    res.json({
      message: "Login successful",
      token,
      hotel: {
        id: hotel._id,
        name: hotel.name,
        email: hotel.email,
        ownerName: hotel.ownerName,
        phone: hotel.phone,
        numberOfRooms: hotel.numberOfRooms,
        roomRate: hotel.roomRate,
        lastLogin: hotel.lastLogin,
        settings: hotel.settings,
      },
    });
  } catch (error) {
    console.error("Hotel login error:", error);
    res.status(500).json({
      error: "Login failed",
      message: "An error occurred during login",
    });
  }
};

// Get hotel profile
const getHotelProfile = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.hotelId)
      .populate("totalGuests")
      .populate("activeGuests");

    if (!hotel) {
      return res.status(404).json({
        error: "Hotel not found",
      });
    }

    res.json({
      hotel: {
        id: hotel._id,
        name: hotel.name,
        email: hotel.email,
        ownerName: hotel.ownerName,
        phone: hotel.phone,
        numberOfRooms: hotel.numberOfRooms,
        roomRate: hotel.roomRate,
        address: hotel.address,
        registrationDate: hotel.registrationDate,
        lastLogin: hotel.lastLogin,
        settings: hotel.settings,
        totalGuests: hotel.totalGuests,
        activeGuests: hotel.activeGuests,
      },
    });
  } catch (error) {
    console.error("Get hotel profile error:", error);
    res.status(500).json({
      error: "Failed to fetch hotel profile",
    });
  }
};

// Update hotel profile
const updateHotelProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      ownerName,
      numberOfRooms,
      roomRate,
      address,
      settings,
    } = req.body;

    const updateData = {};

    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone.trim();
    if (ownerName) updateData.ownerName = ownerName.trim();
    if (numberOfRooms) updateData.numberOfRooms = parseInt(numberOfRooms);
    if (roomRate) updateData.roomRate = parseFloat(roomRate);
    if (address) updateData.address = address;
    if (settings) updateData.settings = { ...req.hotel.settings, ...settings };

    const hotel = await Hotel.findByIdAndUpdate(req.hotelId, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({
      message: "Profile updated successfully",
      hotel: {
        id: hotel._id,
        name: hotel.name,
        email: hotel.email,
        ownerName: hotel.ownerName,
        phone: hotel.phone,
        numberOfRooms: hotel.numberOfRooms,
        roomRate: hotel.roomRate,
        address: hotel.address,
        settings: hotel.settings,
      },
    });
  } catch (error) {
    console.error("Update hotel profile error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        error: "Validation failed",
        details: messages,
      });
    }

    res.status(500).json({
      error: "Failed to update profile",
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "New password must be at least 6 characters long",
      });
    }

    const hotel = await Hotel.findById(req.hotelId);

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      hotel.password
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: "Current password is incorrect",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    hotel.password = hashedNewPassword;
    await hotel.save();

    res.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      error: "Failed to change password",
    });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.hotelId);

    if (!hotel || !hotel.isActive) {
      return res.status(401).json({
        error: "Hotel not found or inactive",
      });
    }

    const newToken = generateToken(hotel._id);

    res.json({
      message: "Token refreshed successfully",
      token: newToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      error: "Failed to refresh token",
    });
  }
};

// Logout (optional - mainly for clearing server-side sessions if implemented)
const logoutHotel = async (req, res) => {
  try {
    // For JWT tokens, logout is typically handled client-side
    // But we can log the logout event or invalidate refresh tokens if implemented

    res.json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: "Logout failed",
    });
  }
};

// Get hotel statistics
const getHotelStats = async (req, res) => {
  try {
    const Guest = require("../models/Guest");
    const Alert = require("../models/Alert");

    const [
      totalGuests,
      activeGuests,
      todayCheckIns,
      todayCheckOuts,
      pendingAlerts,
      totalRevenue,
    ] = await Promise.all([
      Guest.countDocuments({ hotelId: req.hotelId }),
      Guest.countDocuments({ hotelId: req.hotelId, isActive: true }),
      Guest.countDocuments({
        hotelId: req.hotelId,
        checkInDate: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      }),
      Guest.countDocuments({
        hotelId: req.hotelId,
        checkOutDate: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      }),
      Alert.countDocuments({
        hotelId: req.hotelId,
        status: { $in: ["Pending", "In Progress"] },
      }),
      Guest.aggregate([
        { $match: { hotelId: req.hotel._id } },
        { $group: { _id: null, total: { $sum: "$amountPaid" } } },
      ]),
    ]);

    res.json({
      stats: {
        totalGuests,
        activeGuests,
        todayCheckIns,
        todayCheckOuts,
        pendingAlerts,
        totalRevenue: totalRevenue[0]?.total || 0,
        occupancyRate: Math.round(
          (activeGuests / req.hotel.numberOfRooms) * 100
        ),
      },
    });
  } catch (error) {
    console.error("Get hotel stats error:", error);
    res.status(500).json({
      error: "Failed to fetch hotel statistics",
    });
  }
};
const getAllHotels = async (req, res) => {
  try {
    // Get query parameters for filtering and pagination
    const {
      page = 1,
      limit = 10,
      search = "",
      isActive = null,
      registeredByPolice = null,
    } = req.query;

    // Build filter object
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { ownerName: { $regex: search, $options: "i" } },
      ];
    }

    if (isActive !== null) {
      filter.isActive = isActive === "true";
    }

    if (registeredByPolice !== null) {
      filter.registeredByPolice = registeredByPolice === "true";
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get hotels with pagination
    const [hotels, totalCount] = await Promise.all([
      Hotel.find(filter)
        .select("-password") // Exclude password field
        .sort({ registrationDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(), // Use lean() for better performance
      Hotel.countDocuments(filter),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        hotels,
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
    console.error("Get hotels error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch hotels",
      message: error.message,
    });
  }
};

// Add this to your exports
module.exports = {
  registerHotel,
  loginHotel,
  getHotelProfile,
  updateHotelProfile,
  changePassword,
  refreshToken,
  logoutHotel,
  getHotelStats,
  getAllHotels, // Add this new function
};
