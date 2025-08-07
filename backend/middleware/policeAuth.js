// middleware/policeAuth.js (Fixed)
const jwt = require("jsonwebtoken");

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

      // Add user info to request
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

module.exports = { authenticatePolice };
