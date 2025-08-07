// middleware/auth.js (Simplified version to avoid route parsing issues)
const jwt = require("jsonwebtoken");
const Hotel = require("../models/Hotel");

// Simple authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hotel = await Hotel.findById(decoded.hotelId);

    if (!hotel) {
      return res.status(401).json({ error: "Invalid token." });
    }

    req.hotelId = hotel._id;
    req.hotel = hotel;
    req.user = { hotelId: hotel._id, id: hotel._id }; // For backward compatibility

    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token." });
  }
};

// Simple rate limiter (avoiding complex route parsing)
const rateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!requests.has(clientId)) {
      requests.set(clientId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const clientData = requests.get(clientId);

    if (now > clientData.resetTime) {
      requests.set(clientId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (clientData.count >= maxRequests) {
      return res.status(429).json({ error: "Too many requests" });
    }

    clientData.count++;
    next();
  };
};

// Simple hotel access validator (avoiding route parsing)
const validateHotelAccess = (Model) => {
  return async (req, res, next) => {
    try {
      const document = await Model.findById(req.params.id);

      if (!document) {
        return res.status(404).json({ error: "Resource not found" });
      }

      if (document.hotelId.toString() !== req.hotelId.toString()) {
        return res.status(403).json({ error: "Access denied" });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  };
};

module.exports = {
  auth,
  rateLimiter,
  validateHotelAccess,
};
