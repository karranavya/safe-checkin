// controllers/hotelAuthController.js - UPDATED to match new schema
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

// Register new hotel - UPDATED to match new schema
const registerHotel = async (req, res) => {
  try {
    const {
      name,
      accommodationType,
      email,
      password,
      ownerName,
      ownerPhone,
      ownerAadharNumber,
      numberOfRooms,
      address,
      gstNumber,
      labourLicenceNumber,
      hotelLicenceNumber,
      registeredByPolice,
      policeOfficerId,
      policeOfficerInfo,
    } = req.body;

    console.log("📝 Registration request received:", {
      name,
      accommodationType,
      email: email ? email.substring(0, 10) + "..." : "missing",
      ownerName,
      ownerPhone,
      numberOfRooms,
      address,
      gstNumber,
      labourLicenceNumber,
      hotelLicenceNumber,
    });

    // Validate required fields - UPDATED field names
    if (
      !name ||
      !accommodationType ||
      !email ||
      !password ||
      !ownerName ||
      !ownerPhone ||
      !ownerAadharNumber ||
      !numberOfRooms ||
      !address?.street ||
      !address?.city ||
      !address?.state ||
      !address?.zipCode ||
      !gstNumber ||
      !labourLicenceNumber ||
      !hotelLicenceNumber
    ) {
      console.log("❌ Missing required fields");
      return res.status(400).json({
        error: "All required fields must be provided",
        required: [
          "name",
          "accommodationType",
          "email",
          "password",
          "ownerName",
          "ownerPhone",
          "ownerAadharNumber",
          "numberOfRooms",
          "address.street",
          "address.city",
          "address.state",
          "address.zipCode",
          "gstNumber",
          "labourLicenceNumber",
          "hotelLicenceNumber",
        ],
        received: {
          name: !!name,
          accommodationType: !!accommodationType,
          email: !!email,
          password: !!password,
          ownerName: !!ownerName,
          ownerPhone: !!ownerPhone,
          ownerAadharNumber: !!ownerAadharNumber,
          numberOfRooms: !!numberOfRooms,
          addressStreet: !!address?.street,
          addressCity: !!address?.city,
          addressState: !!address?.state,
          addressZipCode: !!address?.zipCode,
          gstNumber: !!gstNumber,
          labourLicenceNumber: !!labourLicenceNumber,
          hotelLicenceNumber: !!hotelLicenceNumber,
        },
      });
    }

    // Check for duplicate email
    const existingHotelEmail = await Hotel.findOne({
      email: email.toLowerCase(),
    });
    if (existingHotelEmail) {
      return res.status(400).json({
        error: "Hotel with this email already exists",
        code: "EMAIL_EXISTS",
      });
    }

    // Check for duplicate GST number
    const existingGST = await Hotel.findOne({
      gstNumber: gstNumber.toUpperCase(),
    });
    if (existingGST) {
      return res.status(400).json({
        error: "Hotel with this GST number already exists",
        code: "GST_EXISTS",
      });
    }

    // Check for duplicate Aadhar number
    const existingAadhar = await Hotel.findOne({ ownerAadharNumber });
    if (existingAadhar) {
      return res.status(400).json({
        error: "Owner with this Aadhar number already exists",
        code: "AADHAR_EXISTS",
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
      actualPoliceOfficerId = req.user.policeId;
      policeOfficerData = {
        id: req.user.policeId,
        name: req.user.name || "Police Officer",
        badgeNumber: req.user.badgeNumber || "N/A",
        station: req.user.station || "N/A",
        rank: req.user.rank || "Officer",
      };
    } else if (policeOfficerInfo && policeOfficerId) {
      actualPoliceOfficerId = policeOfficerId;
      policeOfficerData = {
        id: policeOfficerId,
        name: policeOfficerInfo.name || "Police Officer",
        badgeNumber: policeOfficerInfo.badgeNumber || "N/A",
        station: policeOfficerInfo.station || "N/A",
        rank: policeOfficerInfo.rank || "Officer",
      };
    } else if (policeOfficerId) {
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

    // Create full address string
    const fullAddress = `${address.street}, ${address.city}, ${address.state} ${
      address.zipCode
    }, ${address.country || "India"}`;

    const hotel = new Hotel({
      name: name.trim(),
      accommodationType: accommodationType || "Hotel",
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      ownerName: ownerName.trim(),
      ownerPhone: ownerPhone.trim(),
      ownerAadharNumber: ownerAadharNumber.trim(),
      numberOfRooms: parseInt(numberOfRooms),
      address: {
        street: address.street.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        zipCode: address.zipCode.trim(),
        country: address.country || "India",
        fullAddress: fullAddress,
      },
      gstNumber: gstNumber.toUpperCase().trim(),
      labourLicenceNumber: labourLicenceNumber.trim(),
      hotelLicenceNumber: hotelLicenceNumber.trim(),
      registeredByPolice: registeredByPolice || false,
      registeredBy: actualPoliceOfficerId
        ? new mongoose.Types.ObjectId(actualPoliceOfficerId)
        : null,
      policeOfficer: policeOfficerData,
    });

    await hotel.save();
    console.log("✅ Hotel saved successfully:", hotel.name);

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
            accommodationType: hotel.accommodationType,
            ownerName: hotel.ownerName,
            location: hotel.address,
            numberOfRooms: hotel.numberOfRooms,
            gstNumber: hotel.gstNumber,
            registeredBy: policeOfficerData?.name || "Police Officer",
            registrationMethod: "police_portal",
          },
          req
        );
        console.log(
          `✅ Activity logged: hotel_registered by ${policeOfficerData?.name}`
        );
      } catch (logError) {
        console.error("❌ Failed to log activity:", logError);
      }
    }

    const token = generateToken(hotel._id);

    res.status(201).json({
      message: "Hotel registered successfully",
      token,
      hotel: {
        id: hotel._id,
        name: hotel.name,
        accommodationType: hotel.accommodationType,
        email: hotel.email,
        ownerName: hotel.ownerName,
        ownerPhone: hotel.ownerPhone,
        numberOfRooms: hotel.numberOfRooms,
        address: hotel.address,
        gstNumber: hotel.gstNumber,
        labourLicenceNumber: hotel.labourLicenceNumber,
        hotelLicenceNumber: hotel.hotelLicenceNumber,
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

    if (error.code === 11000) {
      // Handle duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        error: `${field} already exists`,
        code: "DUPLICATE_KEY",
      });
    }

    res.status(500).json({
      error: "Registration failed",
      message: "An error occurred during registration",
    });
  }
};

// Update hotel profile - UPDATED with new field names
const updateHotelProfile = async (req, res) => {
  try {
    const {
      name,
      accommodationType,
      ownerName,
      ownerPhone,
      numberOfRooms,
      address,
      settings,
    } = req.body;

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
    if (
      accommodationType &&
      accommodationType !== currentHotel.accommodationType
    ) {
      updateData.accommodationType = accommodationType;
      updatedFields.push("accommodationType");
    }
    if (ownerName && ownerName !== currentHotel.ownerName) {
      updateData.ownerName = ownerName.trim();
      updatedFields.push("ownerName");
    }
    if (ownerPhone && ownerPhone !== currentHotel.ownerPhone) {
      updateData.ownerPhone = ownerPhone.trim();
      updatedFields.push("ownerPhone");
    }
    if (numberOfRooms && numberOfRooms !== currentHotel.numberOfRooms) {
      updateData.numberOfRooms = parseInt(numberOfRooms);
      updatedFields.push("numberOfRooms");
    }
    if (address) {
      updateData.address = { ...currentHotel.address, ...address };
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
            accommodationType: currentHotel.accommodationType,
            ownerName: currentHotel.ownerName,
            ownerPhone: currentHotel.ownerPhone,
            numberOfRooms: currentHotel.numberOfRooms,
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
        accommodationType: hotel.accommodationType,
        email: hotel.email,
        ownerName: hotel.ownerName,
        ownerPhone: hotel.ownerPhone,
        numberOfRooms: hotel.numberOfRooms,
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

// Keep all other existing functions unchanged...
const loginHotel = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

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

    const isPasswordValid = await bcrypt.compare(password, hotel.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      });
    }

    hotel.lastLogin = new Date();
    await hotel.save();

    const token = generateToken(hotel._id);

    res.json({
      message: "Login successful",
      token,
      hotel: {
        id: hotel._id,
        name: hotel.name,
        accommodationType: hotel.accommodationType,
        email: hotel.email,
        ownerName: hotel.ownerName,
        ownerPhone: hotel.ownerPhone,
        numberOfRooms: hotel.numberOfRooms,
        address: hotel.address,
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

// Rest of functions remain the same...
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
        accommodationType: hotel.accommodationType,
        email: hotel.email,
        ownerName: hotel.ownerName,
        ownerPhone: hotel.ownerPhone,
        numberOfRooms: hotel.numberOfRooms,
        address: hotel.address,
        gstNumber: hotel.gstNumber,
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

// Keep all other functions as they were...
const verifyHotel = async (req, res) => {
  try {
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

    hotel.isVerified = true;
    hotel.verifiedBy = req.user.policeId;
    hotel.verifiedAt = new Date();
    hotel.verificationNotes = verificationNotes;

    await hotel.save();

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

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      hotel.password
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: "Current password is incorrect",
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

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
    const {
      page = 1,
      limit = 10,
      search = "",
      isActive = null,
      registeredByPolice = null,
    } = req.query;

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

    const skip = (page - 1) * limit;

    const [hotels, totalCount] = await Promise.all([
      Hotel.find(filter)
        .select("-password")
        .sort({ registrationDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Hotel.countDocuments(filter),
    ]);

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
  verifyHotel,
};
