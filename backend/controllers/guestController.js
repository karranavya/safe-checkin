const Guest = require("../models/Guest");
const Hotel = require("../models/Hotel");
const User = require("../models/User"); // Add this import
const { validationResult } = require("express-validator");

// Check in a new guest
const checkInGuest = async (req, res) => {
  try {
    const errors = validationResult(req);
    // console.log("Validation errors:", errors.array());
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const hotelId = req.user.hotelId;
    const userId = req.user.id;

    // Verify hotel exists and is active
    const hotel = await Hotel.findById(hotelId);
    if (!hotel || !hotel.isActive) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found or inactive",
      });
    }

    // Check for existing guest with same phone or ID in the hotel
    const existingGuest = await Guest.checkUniqueness(
      hotelId,
      req.body.phone,
      req.body.guests?.[0]?.idNumber
    );

    if (existingGuest) {
      return res.status(409).json({
        success: false,
        message:
          "Guest with this phone number or ID already exists in the hotel",
        existingGuest: {
          id: existingGuest._id,
          name: existingGuest.name,
          roomNumber: existingGuest.roomNumber,
          status: existingGuest.status,
        },
      });
    }

    // Check if room is already occupied
    const roomOccupied = await Guest.findByRoom(hotelId, req.body.roomNumber);
    if (roomOccupied.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Room ${req.body.roomNumber} is already occupied`,
      });
    }

    // Create new guest
    const guestData = {
      ...req.body,
      hotelId,
      createdBy: userId,
      checkInTime: new Date(),
    };

    const guest = new Guest(guestData);
    await guest.save();

    // Populate the response with proper error handling
    try {
      await guest.populate([
        { path: "hotelId", select: "name address" },
        { path: "createdBy", select: "name email", model: "User" },
      ]);
    } catch (populateError) {
      console.warn(
        "Population failed, returning guest without populated fields:",
        populateError
      );
      // Continue without population if it fails
    }

    res.status(201).json({
      success: true,
      message: "Guest checked in successfully",
      data: guest,
    });
  } catch (error) {
    console.error("Error in checkInGuest:", error);
    res.status(500).json({
      success: false,
      message: "Error checking in guest",
      error: error.message,
    });
  }
};

// Get all guests for the hotel
const getAllGuests = async (req, res) => {
  try {
    const hotelId = req.user.hotelId;
    const { status, page = 1, limit = 10, search, roomNumber } = req.query;

    // Build query
    const query = { hotelId };
    if (status) query.status = status;
    if (roomNumber) query.roomNumber = roomNumber;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { roomNumber: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    // Find guests without population first
    const guests = await Guest.find(query)
      .sort({ checkInTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Try to populate, but continue if it fails
    const populatedGuests = [];
    for (const guest of guests) {
      try {
        await guest.populate([
          { path: "createdBy", select: "name email", model: "User" },
          { path: "updatedBy", select: "name email", model: "User" },
          { path: "hotelId", select: "name" },
        ]);
        populatedGuests.push(guest);
      } catch (populateError) {
        console.warn(
          `Population failed for guest ${guest._id}:`,
          populateError
        );
        populatedGuests.push(guest); // Add unpopulated guest
      }
    }

    const total = await Guest.countDocuments(query);

    res.json({
      success: true,
      guests: populatedGuests, // Changed from 'data' to 'guests' to match your frontend
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalGuests: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error in getAllGuests:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching guests",
      error: error.message,
    });
  }
};

// Check uniqueness (for validation during form filling)
const validateUniqueness = async (req, res) => {
  try {
    const hotelId = req.user.hotelId;
    const { phone, idNumber, excludeId } = req.query;

    if (!phone && !idNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number or ID number is required",
      });
    }

    const query = {
      hotelId,
      status: { $ne: "checked-out" },
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    if (phone && idNumber) {
      query.$or = [{ phone }, { "guests.idNumber": idNumber }];
    } else if (phone) {
      query.phone = phone;
    } else {
      query["guests.idNumber"] = idNumber;
    }

    const existingGuest = await Guest.findOne(query);

    res.json({
      success: true,
      isUnique: !existingGuest,
      conflictType: existingGuest
        ? existingGuest.phone === phone
          ? "phone"
          : "id"
        : null,
      existingGuest: existingGuest
        ? {
            id: existingGuest._id,
            name: existingGuest.name,
            roomNumber: existingGuest.roomNumber,
            status: existingGuest.status,
          }
        : null,
    });
  } catch (error) {
    console.error("Error in validateUniqueness:", error);
    res.status(500).json({
      success: false,
      message: "Error validating uniqueness",
      error: error.message,
    });
  }
};

// Get guest by ID
const getGuestById = async (req, res) => {
  try {
    const hotelId = req.user.hotelId;
    const { id } = req.params;

    const guest = await Guest.findOne({ _id: id, hotelId });

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest not found",
      });
    }

    // Try to populate, but continue if it fails
    try {
      await guest.populate([
        { path: "createdBy", select: "name email", model: "User" },
        { path: "updatedBy", select: "name email", model: "User" },
        { path: "hotelId", select: "name address" },
      ]);
    } catch (populateError) {
      console.warn("Population failed for guest details:", populateError);
    }

    res.json({
      success: true,
      data: guest,
    });
  } catch (error) {
    console.error("Error in getGuestById:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching guest",
      error: error.message,
    });
  }
};

// Get guests by room number
const getGuestByRoom = async (req, res) => {
  try {
    const hotelId = req.user.hotelId;
    const { roomNumber, status = "checked-in" } = req.query;

    if (!roomNumber) {
      return res.status(400).json({
        success: false,
        message: "Room number is required",
      });
    }

    const guests = await Guest.findByRoom(hotelId, roomNumber, status);

    res.json({
      success: true,
      data: guests,
      count: guests.length,
    });
  } catch (error) {
    console.error("Error in getGuestByRoom:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching guests by room",
      error: error.message,
    });
  }
};

// Get all guests grouped by room
const getAllGuestsByRoom = async (req, res) => {
  try {
    const hotelId = req.user.hotelId;
    const { status = "checked-in" } = req.query;

    const guests = await Guest.find({ hotelId, status }).sort({
      roomNumber: 1,
      checkInTime: -1,
    });

    // Try to populate each guest
    for (const guest of guests) {
      try {
        await guest.populate("createdBy", "name email");
      } catch (populateError) {
        console.warn(
          `Population failed for guest ${guest._id}:`,
          populateError
        );
      }
    }

    // Group by room number
    const guestsByRoom = guests.reduce((acc, guest) => {
      if (!acc[guest.roomNumber]) {
        acc[guest.roomNumber] = [];
      }
      acc[guest.roomNumber].push(guest);
      return acc;
    }, {});

    res.json({
      success: true,
      data: guestsByRoom,
      totalRooms: Object.keys(guestsByRoom).length,
      totalGuests: guests.length,
    });
  } catch (error) {
    console.error("Error in getAllGuestsByRoom:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching guests by room",
      error: error.message,
    });
  }
};

// Check out guest
const checkOutGuest = async (req, res) => {
  try {
    const hotelId = req.user.hotelId;
    const userId = req.user.id;
    const { id } = req.params;
    const { checkOutDate, finalAmount, notes } = req.body;

    const guest = await Guest.findOne({ _id: id, hotelId });

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest not found",
      });
    }

    if (guest.status === "checked-out") {
      return res.status(400).json({
        success: false,
        message: "Guest is already checked out",
      });
    }

    // Update guest checkout details
    guest.status = "checked-out";
    guest.checkOutDate = checkOutDate ? new Date(checkOutDate) : new Date();
    guest.updatedBy = userId;

    if (finalAmount !== undefined) {
      guest.totalAmount = finalAmount;
      guest.updateBalance();
    }

    if (notes) {
      guest.notes = notes;
    }

    await guest.save();

    // Try to populate, but continue if it fails
    try {
      await guest.populate([
        { path: "createdBy", select: "name email", model: "User" },
        { path: "updatedBy", select: "name email", model: "User" },
      ]);
    } catch (populateError) {
      console.warn("Population failed for checkout:", populateError);
    }

    res.json({
      success: true,
      message: "Guest checked out successfully",
      data: guest,
    });
  } catch (error) {
    console.error("Error in checkOutGuest:", error);
    res.status(500).json({
      success: false,
      message: "Error checking out guest",
      error: error.message,
    });
  }
};

// Update guest information
const updateGuest = async (req, res) => {
  try {
    const hotelId = req.user.hotelId;
    const userId = req.user.id;
    const { id } = req.params;

    const guest = await Guest.findOne({ _id: id, hotelId });

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest not found",
      });
    }

    // Don't allow updating checked-out guests
    if (guest.status === "checked-out") {
      return res.status(400).json({
        success: false,
        message: "Cannot update checked-out guest",
      });
    }

    // Update fields
    Object.keys(req.body).forEach((key) => {
      if (
        req.body[key] !== undefined &&
        key !== "hotelId" &&
        key !== "createdBy"
      ) {
        guest[key] = req.body[key];
      }
    });

    guest.updatedBy = userId;
    await guest.save();

    // Try to populate, but continue if it fails
    try {
      await guest.populate([
        { path: "createdBy", select: "name email", model: "User" },
        { path: "updatedBy", select: "name email", model: "User" },
      ]);
    } catch (populateError) {
      console.warn("Population failed for update:", populateError);
    }

    res.json({
      success: true,
      message: "Guest updated successfully",
      data: guest,
    });
  } catch (error) {
    console.error("Error in updateGuest:", error);
    res.status(500).json({
      success: false,
      message: "Error updating guest",
      error: error.message,
    });
  }
};

// Legacy function for backward compatibility
const checkUnique = async (req, res) => {
  return validateUniqueness(req, res);
};

module.exports = {
  checkInGuest,
  getAllGuests,
  checkUnique,
  validateUniqueness,
  getGuestById,
  getGuestByRoom,
  getAllGuestsByRoom,
  checkOutGuest,
  updateGuest,
};
