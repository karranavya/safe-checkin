// routes/hotelRoutes.js - FIXED hotel verification route placement
const express = require("express");
const router = express.Router();

const { authenticatePolice } = require("../middleware/policeAuth");
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
  verifyHotel,
} = require("../controllers/hotelAuthController");
const { auth, rateLimiter } = require("../middleware/auth");

// Public routes (no authentication required)
router.post("/login", loginHotel);
router.post(
  "/register",
  (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      // If police token is present, authenticate as police
      authenticatePolice(req, res, next);
    } else {
      // Allow public registration
      next();
    }
  },
  registerHotel
);
router.get("/all", getAllHotels);

// Police-only routes (before hotel auth middleware)
router.post("/verify/:hotelId", authenticatePolice, verifyHotel);

// Protected routes (hotel authentication required)
router.use(auth); // All routes below require hotel authentication

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

module.exports = router;
