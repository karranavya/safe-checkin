// routes/guestRoutes.js
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
  checkInGuest,
  getAllGuests,
  checkUnique,
  validateUniqueness,
  getGuestById,
  getGuestByRoom,
  getAllGuestsByRoom,
  checkOutGuest,
  updateGuest,
} = require("../controllers/guestController");

// Import authentication middleware
const { auth } = require("../middleware/auth");

// Apply authentication to all routes
router.use(auth);

// Validation middleware for check-in
const checkInValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[\+]?[1-9][\d]{9,14}$/)
    .withMessage("Please provide a valid phone number"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address"),

  body("nationality").trim().notEmpty().withMessage("Nationality is required"),

  body("purpose").trim().notEmpty().withMessage("Purpose of visit is required"),

  body("guestCount")
    .isInt({ min: 1, max: 20 })
    .withMessage("Guest count must be between 1 and 20"),

  body("maleGuests")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Male guests count must be a non-negative number"),

  body("femaleGuests")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Female guests count must be a non-negative number"),

  body("childGuests")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Child guests count must be a non-negative number"),

  body("bookingMode")
    .isIn(["Direct", "Online", "Travel Agent"])
    .withMessage("Booking mode must be Direct, Online, or Travel Agent"),

  body("bookingWebsite")
    .if(body("bookingMode").equals("Online"))
    .trim()
    .notEmpty()
    .withMessage("Booking website is required for online bookings"),

  body("roomNumber").trim().notEmpty().withMessage("Room number is required"),

  body("guests")
    .isArray({ min: 1 })
    .withMessage("At least one guest detail is required"),

  body("guests.*.name").trim().notEmpty().withMessage("Guest name is required"),

  body("guests.*.idType")
    .isIn(["Passport", "National ID", "Driver License", "Voter ID", "Other"])
    .withMessage("Invalid ID type"),

  body("guests.*.idNumber")
    .trim()
    .notEmpty()
    .withMessage("ID number is required"),

  body("guests.*.email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address for guest"),

  body("totalAmount")
    .optional()
    .isNumeric()
    .withMessage("Total amount must be a number"),

  body("advanceAmount")
    .optional()
    .isNumeric()
    .withMessage("Advance amount must be a number"),
];

// Check-out validation
const checkOutValidation = [
  body("checkOutDate")
    .optional()
    .isISO8601()
    .withMessage("Please provide a valid checkout date"),

  body("finalAmount")
    .optional()
    .isNumeric()
    .withMessage("Final amount must be a number"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes cannot exceed 500 characters"),
];

// Update validation
const updateValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("phone")
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{9,14}$/)
    .withMessage("Please provide a valid phone number"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address"),

  body("totalAmount")
    .optional()
    .isNumeric()
    .withMessage("Total amount must be a number"),

  body("advanceAmount")
    .optional()
    .isNumeric()
    .withMessage("Advance amount must be a number"),
];

// SPECIFIC ROUTES FIRST (before any dynamic routes)
router.post("/checkin", checkInValidation, checkInGuest);
router.get("/validate", validateUniqueness);
router.get("/room", getGuestByRoom);
router.get("/all-by-room", getAllGuestsByRoom);
router.get("/check-unique", checkUnique); // Legacy endpoint
router.get("/", getAllGuests);

// DYNAMIC ROUTES LAST (these must come after all specific routes)
router.get("/:id", getGuestById);
router.put("/:id/checkout", checkOutValidation, checkOutGuest);
router.put("/:id", updateValidation, updateGuest);

// Error handling middleware for this router
router.use((error, req, res, next) => {
  console.error("Guest routes error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error in guest operations",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

module.exports = router;
