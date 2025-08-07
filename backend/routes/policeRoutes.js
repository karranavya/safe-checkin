const express = require("express");
const router = express.Router();
const {
  registerPolice,
  loginPolice,
  getPoliceProfile,
  updatePoliceProfile,
  changePolicePassword,
  refreshPoliceToken,
  getAllPoliceOfficers,
} = require("../controllers/policeAuthController");
const { authenticatePolice } = require("../middleware/policeAuth");

// Public routes (no authentication required)
router.post("/login", loginPolice);
router.post("/register", registerPolice);

// Protected routes (authentication required)
router.use(authenticatePolice); // All routes below require authentication

// Police profile management
router.get("/profile", getPoliceProfile);
router.put("/profile", updatePoliceProfile);

// Authentication management
router.post("/change-password", changePolicePassword);
router.post("/refresh-token", refreshPoliceToken);

// Admin routes
router.get("/all", getAllPoliceOfficers);

// Health check for authenticated police
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Police authentication is working",
    policeId: req.user.policeId,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
