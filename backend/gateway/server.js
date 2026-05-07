const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { createProxyMiddleware } = require("http-proxy-middleware");
const http = require("http");

dotenv.config();

const app = express();

const SERVICE_NAME = process.env.SERVICE_NAME || "api-gateway";
const PORT = process.env.PORT || 5000;

// ======================================================
// Trust proxy (important when using NGINX)
// ======================================================
app.set("trust proxy", 1);

// ======================================================
// Security Middleware
// ======================================================
app.use(helmet());

// ======================================================
// Body Parsers
// ======================================================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ======================================================
// CORS Configuration
// ======================================================
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [];

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : "*",
    credentials: true,
  })
);

// ======================================================
// Rate Limiter
// ======================================================
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,

  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// ======================================================
// Logging
// ======================================================
app.use(
  morgan("dev", {
    stream: {
      write: (message) =>
        console.log(`[${SERVICE_NAME}] ${message.trim()}`),
    },
  })
);

// ======================================================
// Service URLs
// ======================================================
const AUTH_SERVICE =
  process.env.AUTH_SERVICE_URL || "http://localhost:5001";

const BLOG_SERVICE =
  process.env.BLOG_SERVICE_URL || "http://localhost:5002";

// ======================================================
// Proxy Factory
// ======================================================
const createProxy = (target) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    xfwd: true,
    timeout: 10000,
    proxyTimeout: 10000,

    onProxyReq: (proxyReq, req) => {
      proxyReq.setHeader("X-Forwarded-For", req.ip);
      proxyReq.setHeader("X-Gateway-Source", SERVICE_NAME);

      // Restream body if needed
      if (
        req.body &&
        Object.keys(req.body).length > 0 &&
        ["POST", "PUT", "PATCH"].includes(req.method)
      ) {
        try {
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader("Content-Type", "application/json");
          proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        } catch (err) {
          console.error(`[${SERVICE_NAME}] Error restreaming body:`, err);
        }
      }
    },

    onError: (err, req, res) => {
      console.error(
        `[${SERVICE_NAME}] Proxy Error -> ${err.message}`
      );

      res.status(503).json({
        success: false,
        message: "Service temporarily unavailable",
        target: target,
        error: err.message
      });
    },
  });
};

// ======================================================
// Proxy Routes
// ======================================================

// Auth Service
app.use("/api/auth", createProxy(AUTH_SERVICE));

// Blog Service
app.use("/api/blogs", createProxy(BLOG_SERVICE));

// ======================================================
// Health Check
// ======================================================
const checkServiceHealth = (url) => {
  return new Promise((resolve) => {
    const request = http.get(
      `${url}/health`,
      { timeout: 3000 },

      (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          try {
            resolve({
              status: "healthy",
              data: JSON.parse(data),
            });
          } catch {
            resolve({
              status: "healthy",
            });
          }
        });
      }
    );

    request.on("error", () => {
      resolve({
        status: "unhealthy",
      });
    });

    request.on("timeout", () => {
      request.destroy();

      resolve({
        status: "unhealthy",
      });
    });
  });
};

app.get("/health", async (req, res) => {
  const [authHealth, blogHealth] = await Promise.all([
    checkServiceHealth(AUTH_SERVICE),
    checkServiceHealth(BLOG_SERVICE),
  ]);

  const allHealthy =
    authHealth.status === "healthy" &&
    blogHealth.status === "healthy";

  res.status(allHealthy ? 200 : 207).json({
    service: SERVICE_NAME,
    status: allHealthy ? "healthy" : "degraded",

    timestamp: new Date().toISOString(),

    uptime: process.uptime(),

    services: {
      auth: {
        url: AUTH_SERVICE,
        ...authHealth,
      },

      blog: {
        url: BLOG_SERVICE,
        ...blogHealth,
      },
    },
  });
});

// ======================================================
// Service Registry Endpoint
// ======================================================
app.get("/api/services", (req, res) => {
  res.json({
    success: true,

    data: {
      gateway: SERVICE_NAME,
      auth: AUTH_SERVICE,
      blog: BLOG_SERVICE,
    },
  });
});

// ======================================================
// 404 Handler
// ======================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,

    message: `Route ${req.method} ${req.originalUrl} not found`,

    availableRoutes: {
      auth: "/api/auth/*",
      blogs: "/api/blogs/*",
      health: "/health",
      services: "/api/services",
    },
  });
});

// ======================================================
// Global Error Handler
// ======================================================
app.use((err, req, res, next) => {
  console.error(`[${SERVICE_NAME}] Error:`, err.stack);

  res.status(500).json({
    success: false,

    message:
      process.env.NODE_ENV === "production"
        ? "Gateway error"
        : err.message,
  });
});

// ======================================================
// Start Server
// ======================================================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n==========================================`);
  console.log(`🚀 ${SERVICE_NAME} running on port ${PORT}`);
  console.log(`==========================================`);
  console.log(`Auth Service  → ${AUTH_SERVICE}`);
  console.log(`Blog Service  → ${BLOG_SERVICE}`);
  console.log(`Health Check  → http://localhost:${PORT}/health`);
  console.log(`==========================================\n`);
});