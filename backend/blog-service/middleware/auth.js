const axios = require("axios");

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:5001";

/**
 * Middleware to authenticate requests by calling the auth-service
 * This keeps services decoupled — blog-service doesn't know JWT secrets
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please provide a valid token.",
      });
    }

    const token = authHeader.split(" ")[1];

    // Call auth-service to verify token
    const response = await axios.post(
      `${AUTH_SERVICE_URL}/api/auth/verify-token`,
      { token },
      { timeout: 5000 }
    );

    if (response.data.success) {
      req.user = response.data.data;
      next();
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  } catch (error) {
    console.error(
      "[blog-service] Auth middleware error:",
      error.response?.data?.message || error.message
    );

    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.message || "Authentication failed",
      });
    }

    // Auth service is down
    if (error.code === "ECONNREFUSED" || error.code === "ECONNABORTED") {
      return res.status(503).json({
        success: false,
        message: "Authentication service is unavailable. Please try again later.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};

module.exports = { authenticate };