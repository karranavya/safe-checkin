// controllers/reportsController.js (FIXED VERSION)
const Guest = require("../models/Guest");
const Hotel = require("../models/Hotel");

// Utility: get start date for period
function getStartOfPeriod(period) {
  const now = new Date();

  switch (period) {
    case "today": {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case "week": {
      const start = new Date();
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case "month": {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case "all": {
      return new Date(2020, 0, 1); // January 1, 2020
    }
    default:
      return new Date(2020, 0, 1);
  }
}

// FIXED: Enhanced getAreaWideStats with correct guest counting
exports.getAreaWideStats = async (req, res) => {
  try {
    console.log("getAreaWideStats called with query:", req.query);

    const { period = "today", city, category } = req.query;
    const startDate = getStartOfPeriod(period);
    const endDate = new Date();

    console.log("Enhanced Debug Info:", {
      period,
      requestTime: endDate.toISOString(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    // Build hotel query
    const hotelQuery = { isActive: true };

    if (city && city !== "all") {
      hotelQuery["address.city"] = city;
    }

    if (category && category !== "all") {
      hotelQuery.category = category;
    }

    console.log("Hotel query:", hotelQuery);

    const hotels = await Hotel.find(hotelQuery).select("_id");
    const hotelIds = hotels.map((h) => h._id);

    console.log("Found hotels:", hotelIds.length);

    if (hotelIds.length === 0) {
      return res.json({
        success: true,
        data: {
          totalCheckins: 0,
          totalCheckouts: 0,
          totalAccommodations: 0,
          totalGuests: 0,
          totalGuestRecords: 0,
        },
      });
    }

    // FIXED: Count check-ins (guest records), check-outs (guest records), and ACTUAL guests (sum of guestCount)
    const [
      checkinsResult,
      checkoutsResult,
      totalGuestsResult,
      guestRecordsCount,
    ] = await Promise.all([
      // Count check-in records
      Guest.countDocuments({
        hotelId: { $in: hotelIds },
        checkInTime: { $gte: startDate, $lte: endDate },
      }),

      // Count check-out records
      Guest.countDocuments({
        hotelId: { $in: hotelIds },
        checkOutDate: { $gte: startDate, $lte: endDate },
        status: "checked-out",
      }),

      // FIXED: Sum the guestCount field to get actual number of guests
      Guest.aggregate([
        {
          $match: {
            hotelId: { $in: hotelIds },
            checkInTime: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalGuests: { $sum: { $ifNull: ["$guestCount", 1] } }, // Use guestCount or default to 1
          },
        },
      ]),

      // For debugging: also count total guest records
      Guest.countDocuments({
        hotelId: { $in: hotelIds },
        checkInTime: { $gte: startDate, $lte: endDate },
      }),
    ]);

    const totalCheckins = checkinsResult;
    const totalCheckouts = checkoutsResult;
    const totalGuests = totalGuestsResult[0]?.totalGuests || 0; // FIXED: Use aggregated sum
    const totalAccommodations = hotelIds.length;

    console.log("FIXED Stats calculated:", {
      totalCheckins,
      totalCheckouts,
      totalAccommodations,
      totalGuests, // This should now be 2 instead of 1
      guestRecordsCount, // This will be 1 (for debugging)
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });

    res.json({
      success: true,
      data: {
        totalCheckins,
        totalCheckouts,
        totalAccommodations,
        totalGuests, // FIXED: Now correctly sums guestCount
        totalGuestRecords: guestRecordsCount, // For debugging
        metadata: {
          period,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          hotelCount: hotelIds.length,
        },
      },
    });
  } catch (error) {
    console.error("Error in getAreaWideStats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching area-wide statistics",
      error: error.message,
    });
  }
};

// FIXED: Enhanced getAllHotelsStats with correct guest counting
exports.getAllHotelsStats = async (req, res) => {
  try {
    console.log("getAllHotelsStats called with query:", req.query);

    const { period = "today", city, category } = req.query;
    const startDate = getStartOfPeriod(period);
    const endDate = new Date();

    let hotelQuery = { isActive: true };

    if (city && city !== "all") {
      hotelQuery["address.city"] = city;
    }

    if (category && category !== "all") {
      hotelQuery.category = category;
    }

    const hotels = await Hotel.find(hotelQuery).select(
      "name address ownerName phone numberOfRooms category"
    );

    console.log("Found hotels for stats:", hotels.length);

    if (hotels.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const hotelStats = await Promise.all(
      hotels.map(async (hotel) => {
        try {
          const [checkins, checkouts, totalGuestsResult, guestRecords] =
            await Promise.all([
              // Count check-in records
              Guest.countDocuments({
                hotelId: hotel._id,
                checkInTime: { $gte: startDate, $lte: endDate },
              }),

              // Count check-out records
              Guest.countDocuments({
                hotelId: hotel._id,
                checkOutDate: { $gte: startDate, $lte: endDate },
                status: "checked-out",
              }),

              // FIXED: Sum guestCount to get actual number of guests
              Guest.aggregate([
                {
                  $match: {
                    hotelId: hotel._id,
                    checkInTime: { $gte: startDate, $lte: endDate },
                  },
                },
                {
                  $group: {
                    _id: null,
                    totalGuests: { $sum: { $ifNull: ["$guestCount", 1] } },
                  },
                },
              ]),

              // For debugging: count guest records
              Guest.countDocuments({
                hotelId: hotel._id,
                checkInTime: { $gte: startDate, $lte: endDate },
              }),
            ]);

          const totalGuests = totalGuestsResult[0]?.totalGuests || 0;

          console.log(`Hotel ${hotel.name} stats:`, {
            checkins,
            checkouts,
            totalGuests, // FIXED: Should be 2 for your sample data
            guestRecords, // Will be 1 for debugging
          });

          return {
            id: hotel._id.toString(),
            name: hotel.name,
            address: hotel.address?.street || hotel.address || "",
            city: hotel.address?.city || "",
            category: hotel.category || "Standard",
            type: "hotel",
            checkins,
            checkouts,
            totalGuests, // FIXED: Now correctly sums guestCount
            totalGuestRecords: guestRecords, // For debugging
            numberOfRooms: hotel.numberOfRooms || 0,
            ownerName: hotel.ownerName || "",
            phone: hotel.phone || "",
          };
        } catch (hotelError) {
          console.error(`Error processing hotel ${hotel.name}:`, hotelError);
          return {
            id: hotel._id.toString(),
            name: hotel.name,
            address: hotel.address?.street || hotel.address || "",
            city: hotel.address?.city || "",
            category: hotel.category || "Standard",
            type: "hotel",
            checkins: 0,
            checkouts: 0,
            totalGuests: 0,
            totalGuestRecords: 0,
            error: "Failed to calculate stats",
          };
        }
      })
    );

    // Log summary for debugging
    const totalStats = hotelStats.reduce(
      (acc, hotel) => ({
        checkins: acc.checkins + hotel.checkins,
        checkouts: acc.checkouts + hotel.checkouts,
        totalGuests: acc.totalGuests + hotel.totalGuests,
        totalGuestRecords:
          acc.totalGuestRecords + (hotel.totalGuestRecords || 0),
      }),
      { checkins: 0, checkouts: 0, totalGuests: 0, totalGuestRecords: 0 }
    );

    console.log("FIXED Hotel stats summary:", {
      hotelCount: hotelStats.length,
      totalCheckins: totalStats.checkins,
      totalCheckouts: totalStats.checkouts,
      totalGuests: totalStats.totalGuests, // Should now be correct
      totalGuestRecords: totalStats.totalGuestRecords,
    });

    res.json({
      success: true,
      data: hotelStats,
      metadata: {
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        summary: totalStats,
      },
    });
  } catch (error) {
    console.error("Error in getAllHotelsStats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching hotel statistics",
      error: error.message,
    });
  }
};

// Enhanced getHotelGuests with filtering and pagination
exports.getHotelGuests = async (req, res) => {
  try {
    console.log("getHotelGuests called for hotel:", req.params.hotelId);

    const { hotelId } = req.params;
    const {
      period = "all",
      status = "all",
      page = 1,
      limit = 50,
      search = "",
    } = req.query;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: "Hotel ID is required",
      });
    }

    // Verify hotel exists
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    // Build query
    const query = { hotelId };

    // Add date filtering if period is specified
    if (period !== "all") {
      const startDate = getStartOfPeriod(period);
      const endDate = new Date();
      query.checkInTime = { $gte: startDate, $lte: endDate };
    }

    // Add status filtering
    if (status !== "all") {
      query.status = status;
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { roomNumber: { $regex: search, $options: "i" } },
        { nationality: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const limitNum = parseInt(limit);

    // Get guests and total count
    const [guests, totalCount, totalGuestsSum] = await Promise.all([
      Guest.find(query)
        .select(
          "name phone checkInTime checkOutDate status roomNumber nationality purpose guestCount totalAmount"
        )
        .sort({ checkInTime: -1 })
        .skip(skip)
        .limit(limitNum),

      Guest.countDocuments(query),

      // FIXED: Also get the sum of actual guests
      Guest.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalActualGuests: { $sum: { $ifNull: ["$guestCount", 1] } },
          },
        },
      ]),
    ]);

    const totalActualGuests = totalGuestsSum[0]?.totalActualGuests || 0;

    console.log("Found guests:", {
      guestRecords: guests.length,
      totalRecords: totalCount,
      totalActualGuests, // FIXED: Sum of guestCount
    });

    res.json({
      success: true,
      data: guests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
        totalActualGuests, // FIXED: Include actual guest count
        limit: limitNum,
        hasNext: skip + guests.length < totalCount,
        hasPrev: page > 1,
      },
      hotel: {
        id: hotel._id,
        name: hotel.name,
        address: hotel.address,
      },
      filters: {
        period,
        status,
        search,
      },
    });
  } catch (error) {
    console.error("Error in getHotelGuests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get guests",
      error: error.message,
    });
  }
};

module.exports = {
  getAreaWideStats: exports.getAreaWideStats,
  getAllHotelsStats: exports.getAllHotelsStats,
  getHotelGuests: exports.getHotelGuests,
};
