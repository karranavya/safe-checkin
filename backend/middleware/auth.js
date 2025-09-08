// middleware/auth.js - ENHANCED VERSION
const jwt = require("jsonwebtoken");
const Hotel = require("../models/Hotel");
const { logActivity } = require("../controllers/activityController");

// Enhanced authentication middleware with activity logging
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Access denied. No token provided.",
        code: "NO_TOKEN",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hotel = await Hotel.findById(decoded.hotelId);

    if (!hotel) {
      return res.status(401).json({
        success: false,
        error: "Invalid token - hotel not found.",
        code: "INVALID_TOKEN",
      });
    }

    if (!hotel.isActive) {
      return res.status(401).json({
        success: false,
        error: "Hotel account is inactive.",
        code: "INACTIVE_ACCOUNT",
      });
    }

    // Update hotel's last activity
    hotel.lastActivityAt = new Date();
    await hotel.save();

    req.hotelId = hotel._id;
    req.hotel = hotel;
    req.user = {
      hotelId: hotel._id,
      id: hotel._id,
      name: hotel.name,
      type: "hotel",
    };

    next();
  } catch (error) {
    console.error("Hotel auth error:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token expired. Please login again.",
        code: "TOKEN_EXPIRED",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Invalid token format.",
        code: "INVALID_TOKEN",
      });
    }

    res.status(401).json({
      success: false,
      error: "Authentication failed.",
      code: "AUTH_FAILED",
    });
  }
};

// Enhanced rate limiter with better tracking
const rateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  // Cleanup expired entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [clientId, data] of requests.entries()) {
      if (now > data.resetTime) {
        requests.delete(clientId);
      }
    }
  }, windowMs);

  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress || "unknown";
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
      return res.status(429).json({
        success: false,
        error: "Too many requests. Please try again later.",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
      });
    }

    clientData.count++;
    next();
  };
};

// Enhanced hotel access validator
const validateHotelAccess = (Model) => {
  return async (req, res, next) => {
    try {
      const resourceId =
        req.params.id || req.params.guestId || req.params.alertId;

      if (!resourceId) {
        return res.status(400).json({
          success: false,
          error: "Resource ID is required",
          code: "MISSING_RESOURCE_ID",
        });
      }

      const document = await Model.findById(resourceId);

      if (!document) {
        return res.status(404).json({
          success: false,
          error: "Resource not found",
          code: "RESOURCE_NOT_FOUND",
        });
      }

      if (document.hotelId.toString() !== req.hotelId.toString()) {
        return res.status(403).json({
          success: false,
          error: "Access denied. Resource belongs to different hotel.",
          code: "ACCESS_DENIED",
        });
      }

      req.resource = document;
      next();
    } catch (error) {
      console.error("Hotel access validation error:", error);
      res.status(500).json({
        success: false,
        error: "Server error during access validation",
        code: "SERVER_ERROR",
      });
    }
  };
};

// Activity logging middleware for hotel actions
const logHotelActivity = (action, targetType) => {
  return async (req, res, next) => {
    const originalJson = res.json;

    res.json = function (data) {
      // Log activity after successful response
      if (data.success && req.user) {
        const targetId =
          req.params.id ||
          req.params.guestId ||
          req.params.alertId ||
          (data.data && data.data.id) ||
          `hotel_action_${Date.now()}`;

        // Log asynchronously (don't block response)
        logActivity(
          req.user.id.toString(),
          action,
          targetType,
          targetId.toString(),
          {
            method: req.method,
            path: req.path,
            hotelName: req.hotel?.name,
            timestamp: new Date(),
          },
          req
        ).catch((err) => console.error("Hotel activity logging failed:", err));
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

module.exports = {
  auth,
  rateLimiter,
  validateHotelAccess,
  logHotelActivity,
};
