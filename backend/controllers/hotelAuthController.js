// controllers/hotelAuthController.js - UPDATED with activity logging
const Hotel = require("../models/Hotel");
const { logActivity } = require("./activityController");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// Generate JWT token
const generateToken = (hotelId) => {
  return jwt.sign({ hotelId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Register new hotel - UPDATED with activity logging
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
      policeOfficerInfo,
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

    // Enhanced police officer data handling
    let policeOfficerData = null;
    let actualPoliceOfficerId = null;

    // Check if request comes from authenticated police officer
    if (req.user && req.user.policeId) {
      // If coming from authenticated police middleware
      actualPoliceOfficerId = req.user.policeId;
      policeOfficerData = {
        id: req.user.policeId,
        name: req.user.name || "Police Officer",
        badgeNumber: req.user.badgeNumber || "N/A",
        station: req.user.station || "N/A",
        rank: req.user.rank || "Officer",
      };
    } else if (policeOfficerInfo && policeOfficerId) {
      // If police info is passed in request body
      actualPoliceOfficerId = policeOfficerId;
      policeOfficerData = {
        id: policeOfficerId,
        name: policeOfficerInfo.name || "Police Officer",
        badgeNumber: policeOfficerInfo.badgeNumber || "N/A",
        station: policeOfficerInfo.station || "N/A",
        rank: policeOfficerInfo.rank || "Officer",
      };
    } else if (policeOfficerId) {
      // Fallback: Try to fetch police officer details from database
      try {
        const Police = require("../models/Police");
        const policeOfficer = await Police.findById(policeOfficerId).select(
          "-password"
        );
        if (policeOfficer) {
          actualPoliceOfficerId = policeOfficerId;
          policeOfficerData = {
            id: policeOfficer._id.toString(),
            name: policeOfficer.name,
            badgeNumber: policeOfficer.badgeNumber,
            station: policeOfficer.station,
            rank: policeOfficer.rank,
          };
        }
      } catch (fetchError) {
        console.error("Error fetching police officer details:", fetchError);
      }
    }

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
      // Store as ObjectId for proper relationship
      registeredBy: actualPoliceOfficerId
        ? new mongoose.Types.ObjectId(actualPoliceOfficerId)
        : null,
      // Keep embedded document for quick access
      policeOfficer: policeOfficerData,
    });

    await hotel.save();

    // Log activity if registered by police
    if (actualPoliceOfficerId) {
      try {
        await logActivity(
          actualPoliceOfficerId,
          "hotel_registered",
          "hotel",
          hotel._id,
          {
            hotelName: hotel.name,
            ownerName: hotel.ownerName,
            location: hotel.address,
            numberOfRooms: hotel.numberOfRooms,
            registeredBy: policeOfficerData?.name || "Police Officer",
            registrationMethod: "police_portal", // Add method tracking
          },
          req
        );
        console.log(
          `✅ Activity logged: hotel_registered by ${policeOfficerData?.name}`
        );
      } catch (logError) {
        console.error("❌ Failed to log activity:", logError);
        // Don't fail the main operation if logging fails
      }
    }
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
        registeredBy: hotel.registeredBy,
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

// Update hotel profile - UPDATED with activity logging
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

    // Get current hotel data for logging
    const currentHotel = await Hotel.findById(req.hotelId);
    if (!currentHotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }

    const updateData = {};
    const updatedFields = [];

    if (name && name !== currentHotel.name) {
      updateData.name = name.trim();
      updatedFields.push("name");
    }
    if (phone && phone !== currentHotel.phone) {
      updateData.phone = phone.trim();
      updatedFields.push("phone");
    }
    if (ownerName && ownerName !== currentHotel.ownerName) {
      updateData.ownerName = ownerName.trim();
      updatedFields.push("ownerName");
    }
    if (numberOfRooms && numberOfRooms !== currentHotel.numberOfRooms) {
      updateData.numberOfRooms = parseInt(numberOfRooms);
      updatedFields.push("numberOfRooms");
    }
    if (roomRate && roomRate !== currentHotel.roomRate) {
      updateData.roomRate = parseFloat(roomRate);
      updatedFields.push("roomRate");
    }
    if (address) {
      updateData.address = address;
      updatedFields.push("address");
    }
    if (settings) {
      updateData.settings = { ...currentHotel.settings, ...settings };
      updatedFields.push("settings");
    }

    const hotel = await Hotel.findByIdAndUpdate(req.hotelId, updateData, {
      new: true,
      runValidators: true,
    });

    // Log activity if there were actual updates
    if (updatedFields.length > 0) {
      await logActivity(
        req.user?.policeId || "hotel_staff",
        "hotel_updated",
        "hotel",
        hotel._id,
        {
          hotelName: hotel.name,
          updatedFields,
          previousData: {
            name: currentHotel.name,
            phone: currentHotel.phone,
            ownerName: currentHotel.ownerName,
            numberOfRooms: currentHotel.numberOfRooms,
            roomRate: currentHotel.roomRate,
          },
          newData: updateData,
        },
        req
      );
    }

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

// Rest of the functions remain the same...
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

// Add hotel verification function for police
const verifyHotel = async (req, res) => {
  try {
    // Only police can verify hotels
    if (!req.user || !req.user.policeId) {
      return res.status(403).json({
        error: "Only police officers can verify hotels",
      });
    }

    const { hotelId } = req.params;
    const { verificationNotes } = req.body;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({
        error: "Hotel not found",
      });
    }

    if (hotel.isVerified) {
      return res.status(400).json({
        error: "Hotel is already verified",
      });
    }
    const previousState = {
      isVerified: hotel.isVerified,
      verifiedBy: hotel.verifiedBy,
      verifiedAt: hotel.verifiedAt,
    };
    // Update hotel verification status
    hotel.isVerified = true;
    hotel.verifiedBy = req.user.policeId;
    hotel.verifiedAt = new Date();
    hotel.verificationNotes = verificationNotes;

    await hotel.save();

    // Log the verification activity
    try {
      await logActivity(
        req.user.policeId,
        "hotel_verified",
        "hotel",
        hotel._id,
        {
          hotelName: hotel.name,
          ownerName: hotel.ownerName,
          verifiedBy: req.user.name,
          verificationNotes: verificationNotes || "Hotel verified by police",
          previousState,
          newState: {
            isVerified: true,
            verifiedAt: hotel.verifiedAt,
          },
        },
        req
      );
      console.log(
        `✅ Hotel verification logged: ${hotel.name} verified by ${req.user.name}`
      );
    } catch (logError) {
      console.error("❌ Failed to log verification activity:", logError);
    }

    res.json({
      message: "Hotel verified successfully",
      hotel: {
        id: hotel._id,
        name: hotel.name,
        isVerified: hotel.isVerified,
        verifiedAt: hotel.verifiedAt,
        verificationNotes: hotel.verificationNotes,
      },
    });
  } catch (error) {
    console.error("Hotel verification error:", error);
    res.status(500).json({
      error: "Failed to verify hotel",
    });
  }
};

// Keep all other existing functions unchanged...
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

const logoutHotel = async (req, res) => {
  try {
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

module.exports = {
  registerHotel,
  loginHotel,
  getHotelProfile,
  updateHotelProfile,
  changePassword,
  refreshToken,
  logoutHotel,
  getHotelStats,
  getAllHotels,
  verifyHotel, // Add the new verification function
};
