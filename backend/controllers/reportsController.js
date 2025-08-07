// controllers/reportsController.js (Enhanced Version)
const Guest = require("../models/Guest");
const Hotel = require("../models/Hotel");

// Utility: get start date for period
// In reportsController.js
function getStartOfPeriod(period) {
  const now = new Date();

  switch (period) {
    case "today": {
      const utcNow = new Date(
        now.toISOString().split("T")[0] + "T00:00:00.000Z"
      );
      return utcNow;
    }
    case "week": {
      const utcNow = new Date(
        now.toISOString().split("T")[0] + "T00:00:00.000Z"
      );
      const dayOfWeek = utcNow.getUTCDay();
      const startOfWeek = new Date(utcNow);
      startOfWeek.setUTCDate(utcNow.getUTCDate() - dayOfWeek);
      return startOfWeek;
    }
    case "month": {
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth();
      return new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    }
    case "all": {
      // Return a very old date to include all records
      return new Date(2020, 0, 1);
    }
    default:
      return new Date(2000, 0, 1);
  }
}

// Enhanced getAreaWideStats with better error handling and logging
exports.getAreaWideStats = async (req, res) => {
  try {
    console.log("getAreaWideStats called with query:", req.query);

    const { period = "today", city, category } = req.query;
    const startDate = getStartOfPeriod(period);
    const endDate = new Date();

    // Enhanced logging for debugging
    console.log("Enhanced Debug Info:", {
      period,
      requestTime: endDate.toISOString(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      startDateLocal: startDate.toString(),
      endDateLocal: endDate.toString(),
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
        },
      });
    }

    // Log some sample guest data for debugging
    const sampleGuests = await Guest.find({ hotelId: { $in: hotelIds } })
      .limit(5)
      .select("checkInTime checkOutDate status createdAt hotelId")
      .sort({ checkInTime: -1 });

    console.log(
      "Sample guest data:",
      sampleGuests.map((g) => ({
        checkInTime: g.checkInTime?.toISOString(),
        checkOutDate: g.checkOutDate?.toISOString(),
        status: g.status,
        createdAt: g.createdAt?.toISOString(),
        hotelId: g.hotelId?.toString(),
      }))
    );

    // Count all check-ins and check-outs that occurred in the period
    const [totalCheckins, totalCheckouts, totalGuests] = await Promise.all([
      // Count all guests who checked in during the period (regardless of current status)
      Guest.countDocuments({
        hotelId: { $in: hotelIds },
        checkInTime: { $gte: startDate, $lte: endDate },
      }),

      // Count all guests who checked out during the period
      Guest.countDocuments({
        hotelId: { $in: hotelIds },
        checkOutDate: { $gte: startDate, $lte: endDate },
        status: "checked-out",
      }),

      // Total unique guests in the period
      Guest.countDocuments({
        hotelId: { $in: hotelIds },
        checkInTime: { $gte: startDate, $lte: endDate },
      }),
    ]);

    const totalAccommodations = hotelIds.length;

    console.log("Stats calculated:", {
      totalCheckins,
      totalCheckouts,
      totalAccommodations,
      totalGuests,
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
        totalGuests,
        // Include metadata for debugging
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

// Enhanced getAllHotelsStats with better error handling
exports.getAllHotelsStats = async (req, res) => {
  try {
    console.log("getAllHotelsStats called with query:", req.query);

    const { period = "today", city, category } = req.query;
    const startDate = getStartOfPeriod(period);
    const endDate = new Date();

    console.log("Hotel stats date range:", {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

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
          const [checkins, checkouts, totalGuests] = await Promise.all([
            // Count all check-ins during the period
            Guest.countDocuments({
              hotelId: hotel._id,
              checkInTime: { $gte: startDate, $lte: endDate },
            }),

            // Count all check-outs during the period
            Guest.countDocuments({
              hotelId: hotel._id,
              checkOutDate: { $gte: startDate, $lte: endDate },
              status: "checked-out",
            }),

            // Total guests in the period
            Guest.countDocuments({
              hotelId: hotel._id,
              checkInTime: { $gte: startDate, $lte: endDate },
            }),
          ]);

          return {
            id: hotel._id.toString(),
            name: hotel.name,
            address: hotel.address?.street || hotel.address || "",
            city: hotel.address?.city || "",
            category: hotel.category || "Standard",
            type: "hotel",
            checkins,
            checkouts,
            totalGuests,
            // Additional metadata
            numberOfRooms: hotel.numberOfRooms || 0,
            ownerName: hotel.ownerName || "",
            phone: hotel.phone || "",
          };
        } catch (hotelError) {
          console.error(`Error processing hotel ${hotel.name}:`, hotelError);
          // Return hotel with zero stats if there's an error
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
      }),
      { checkins: 0, checkouts: 0, totalGuests: 0 }
    );

    console.log("Hotel stats summary:", {
      hotelCount: hotelStats.length,
      totalCheckins: totalStats.checkins,
      totalCheckouts: totalStats.checkouts,
      totalGuests: totalStats.totalGuests,
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
    const [guests, totalCount] = await Promise.all([
      Guest.find(query)
        .select(
          "name phone checkInTime checkOutDate status roomNumber nationality purpose guestCount totalAmount"
        )
        .sort({ checkInTime: -1 })
        .skip(skip)
        .limit(limitNum),

      Guest.countDocuments(query),
    ]);

    console.log("Found guests:", guests.length, "Total:", totalCount);

    res.json({
      success: true,
      data: guests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
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

// New function: Get detailed statistics for a specific hotel
exports.getHotelDetailedStats = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { period = "today" } = req.query;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: "Hotel ID is required",
      });
    }

    const startDate = getStartOfPeriod(period);
    const endDate = new Date();

    // Get hotel info
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    // Get detailed statistics
    const [
      checkins,
      checkouts,
      currentlyCheckedIn,
      totalRevenue,
      occupancyRate,
      averageStayDuration,
      nationalityBreakdown,
      purposeBreakdown,
    ] = await Promise.all([
      Guest.countDocuments({
        hotelId,
        checkInTime: { $gte: startDate, $lte: endDate },
      }),

      Guest.countDocuments({
        hotelId,
        checkOutDate: { $gte: startDate, $lte: endDate },
        status: "checked-out",
      }),

      Guest.countDocuments({
        hotelId,
        status: "checked-in",
      }),

      Guest.aggregate([
        {
          $match: {
            hotelId: hotel._id,
            checkOutDate: { $gte: startDate, $lte: endDate },
            status: "checked-out",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" },
          },
        },
      ]),

      // Calculate occupancy rate (if numberOfRooms is available)
      hotel.numberOfRooms
        ? Guest.countDocuments({ hotelId, status: "checked-in" }).then(
            (occupied) => Math.round((occupied / hotel.numberOfRooms) * 100)
          )
        : 0,

      // Average stay duration for checked-out guests
      Guest.aggregate([
        {
          $match: {
            hotelId: hotel._id,
            status: "checked-out",
            checkOutDate: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $project: {
            duration: {
              $divide: [
                { $subtract: ["$checkOutDate", "$checkInTime"] },
                1000 * 60 * 60 * 24, // Convert to days
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            averageDuration: { $avg: "$duration" },
          },
        },
      ]),

      // Nationality breakdown
      Guest.aggregate([
        {
          $match: {
            hotelId: hotel._id,
            checkInTime: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: "$nationality",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Purpose breakdown
      Guest.aggregate([
        {
          $match: {
            hotelId: hotel._id,
            checkInTime: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: "$purpose",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        hotel: {
          id: hotel._id,
          name: hotel.name,
          address: hotel.address,
          numberOfRooms: hotel.numberOfRooms || 0,
          category: hotel.category || "Standard",
        },
        statistics: {
          checkins,
          checkouts,
          currentlyCheckedIn,
          totalRevenue: totalRevenue[0]?.total || 0,
          occupancyRate,
          averageStayDuration: averageStayDuration[0]?.averageDuration || 0,
          nationalityBreakdown,
          purposeBreakdown,
        },
        period: {
          type: period,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Error in getHotelDetailedStats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get detailed hotel statistics",
      error: error.message,
    });
  }
};

module.exports = {
  getAreaWideStats: exports.getAreaWideStats,
  getAllHotelsStats: exports.getAllHotelsStats,
  getHotelGuests: exports.getHotelGuests,
  getHotelDetailedStats: exports.getHotelDetailedStats,
};
