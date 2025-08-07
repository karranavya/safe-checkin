// routes/reportRoutes.js (Fixed)
const express = require("express");
const router = express.Router();
const { authenticatePolice } = require("../middleware/policeAuth");
const {
  getAllHotelsStats,
  getAreaWideStats,
  getHotelGuests,
} = require("../controllers/reportsController");

// Debug middleware to log all requests to reports routes
router.use((req, res, next) => {
  console.log(`Reports Route: ${req.method} ${req.originalUrl}`);
  console.log("Headers:", req.headers);
  next();
});

// Apply police authentication to all report routes
router.use(authenticatePolice);

// Routes
router.get("/hotels-stats", getAllHotelsStats); // GET /api/reports/hotels-stats
router.get("/area-stats", getAreaWideStats); // GET /api/reports/area-stats
router.get("/hotel/:hotelId/guests", getHotelGuests); // GET /api/reports/hotel/:hotelId/guests

// Add a test route to verify the reports endpoint is working
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Reports API is working",
    user: req.user,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
