// middleware/policeAuth.js - UPDATED with role-based access and activity logging
const jwt = require("jsonwebtoken");
const { logActivity } = require("../controllers/activityController");

const authenticatePolice = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Access denied. No token provided or invalid format.",
        code: "NO_TOKEN",
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Access denied. Token is empty.",
        code: "EMPTY_TOKEN",
      });
    }

    // Verify token
    const JWT_SECRET =
      process.env.JWT_SECRET || "default-secret-change-in-production";

    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      // Check if user has police role/permissions
      if (!decoded.role || decoded.role !== "police") {
        return res.status(403).json({
          success: false,
          error: "Access denied. Police role required.",
          code: "INSUFFICIENT_PERMISSIONS",
        });
      }

      // Add user info to request (INCLUDING ROLE)
      req.user = decoded;
      next();
    } catch (jwtError) {
      console.error("JWT Verification Error:", jwtError.message);

      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          error: "Token expired. Please login again.",
          code: "TOKEN_EXPIRED",
        });
      }

      if (jwtError.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          error: "Invalid token format.",
          code: "INVALID_TOKEN",
        });
      }

      return res.status(401).json({
        success: false,
        error: "Token verification failed.",
        code: "TOKEN_VERIFICATION_FAILED",
      });
    }
  } catch (error) {
    console.error("Police Auth Middleware Error:", error);
    return res.status(500).json({
      success: false,
      error: "Authentication server error.",
      code: "AUTH_SERVER_ERROR",
    });
  }
};

// Role-based middleware functions
const requireAdminPolice = (req, res, next) => {
  if (req.user.policeRole !== "admin_police") {
    return res.status(403).json({
      success: false,
      error: "Access denied. Admin police role required.",
      code: "ADMIN_ACCESS_REQUIRED",
    });
  }
  next();
};

const requireSubPolice = (req, res, next) => {
  if (req.user.policeRole !== "sub_police") {
    return res.status(403).json({
      success: false,
      error: "Access denied. Sub police role required.",
      code: "SUB_POLICE_ACCESS_REQUIRED",
    });
  }
  next();
};

const requireAnyPolice = (req, res, next) => {
  if (!["admin_police", "sub_police"].includes(req.user.policeRole)) {
    return res.status(403).json({
      success: false,
      error: "Access denied. Police role required.",
      code: "POLICE_ACCESS_REQUIRED",
    });
  }
  next();
};

// Activity logging middleware for sub-police actions
const logSubPoliceActivity = (action, targetType) => {
  return async (req, res, next) => {
    // Store original res.json to intercept successful responses
    const originalJson = res.json;

    res.json = function (data) {
      // Only log if the operation was successful and user is sub-police
      if (data.success && req.user && req.user.policeRole === "sub_police") {
        // Extract target ID from request or response
        const targetId =
          req.params.id ||
          req.params.hotelId ||
          req.params.suspectId ||
          req.params.alertId ||
          (data.data && data.data.id) ||
          new Date();

        // Log the activity asynchronously (don't wait for it)
        logActivity(
          req.user.policeId,
          action,
          targetType,
          targetId,
          {
            method: req.method,
            path: req.path,
            body: req.body,
            timestamp: new Date(),
          },
          req
        ).catch((err) => console.error("Activity logging failed:", err));
      }

      // Call original res.json
      return originalJson.call(this, data);
    };

    next();
  };
};

module.exports = {
  authenticatePolice,
  requireAdminPolice,
  requireSubPolice,
  requireAnyPolice,
  logSubPoliceActivity,
};
