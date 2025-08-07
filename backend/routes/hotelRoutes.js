// routes/hotelRoutes.js
const express = require("express");
const router = express.Router();

// const { authenticatePolice } = require("../middleware/policeAuth");
const {
  registerHotel,
  loginHotel,
  getHotelProfile,
  updateHotelProfile,
  changePassword,
  refreshToken,
  logoutHotel,
  getHotelStats,
  getAllHotels,
} = require("../controllers/hotelAuthController");
const { auth, rateLimiter } = require("../middleware/auth");

// Public routes (no authentication required)

router.post("/login", loginHotel);
router.post("/register", registerHotel); // Add middleware
router.get("/all", getAllHotels);
// Protected routes (authentication required)
router.use(auth); // All routes below require authentication

// Hotel profile management
router.get("/profile", getHotelProfile);
router.put("/profile", updateHotelProfile);

// Authentication management
router.post("/change-password", changePassword);
router.post("/refresh-token", refreshToken);
router.post("/logout", logoutHotel);

// Hotel statistics and analytics
router.get("/stats", getHotelStats);

// Health check for authenticated hotels
router.get("/health", (req, res) => {
  res.json({
    message: "Hotel authentication is working",
    hotelId: req.hotelId,
    timestamp: new Date().toISOString(),
  });
});
// router.get("/all", getAllHotels); // Add this route

module.exports = router;
