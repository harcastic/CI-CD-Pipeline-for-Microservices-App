const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { createProxyMiddleware } = require("http-proxy-middleware");
const rateLimit = require("express-rate-limit");

dotenv.config();

const app = express();
const SERVICE_NAME = process.env.SERVICE_NAME || "api-gateway";

// Rate limiting
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

// Middleware
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : "*",
    credentials: true,
  })
);
app.use(limiter);
app.use(
  morgan("dev", {
    stream: {
      write: (message) =>
        console.log(`[${SERVICE_NAME}] ${message.trim()}`),
    },
  })
);

// Service URLs
const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || "http://localhost:5001";
const BLOG_SERVICE = process.env.BLOG_SERVICE_URL || "http://localhost:5002";

// Proxy options factory
const createProxy = (target, pathRewrite) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    timeout: 10000,
    proxyTimeout: 10000,
    onError: (err, req, res) => {
      console.error(`[${SERVICE_NAME}] Proxy error:`, err.message);
      res.status(503).json({
        success: false,
        message: "Service temporarily unavailable. Please try again later.",
      });
    },
    onProxyReq: (proxyReq, req) => {
      // Forward the original IP
      proxyReq.setHeader("X-Forwarded-For", req.ip);
      proxyReq.setHeader("X-Gateway-Source", SERVICE_NAME);

      // If the body was already parsed, restream it
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
  });
};

// Parse body for POST/PUT/PATCH before proxying
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ==========================================
// Route: Auth Service → /api/auth/*
// ==========================================
app.use(
  "/api/auth",
  createProxy(AUTH_SERVICE, { "^/api/auth": "/api/auth" })
);

// ==========================================
// Route: Blog Service → /api/blogs/*
// ==========================================
app.use(
  "/api/blogs",
  createProxy(BLOG_SERVICE, { "^/api/blogs": "/api/blogs" })
);

// ==========================================
// Gateway Health + Service Registry
// ==========================================
app.get("/health", async (req, res) => {
  const axios = require("http");

  const checkService = (url) => {
    return new Promise((resolve) => {
      const request = require("http").get(`${url}/health`, { timeout: 3000 }, (response) => {
        let data = "";
        response.on("data", (chunk) => (data += chunk));
        response.on("end", () => {
          try {
            resolve({ status: "healthy", data: JSON.parse(data) });
          } catch {
            resolve({ status: "healthy" });
          }
        });
      });
      request.on("error", () => resolve({ status: "unhealthy" }));
      request.on("timeout", () => {
        request.destroy();
        resolve({ status: "unhealthy" });
      });
    });
  };

  const [authHealth, blogHealth] = await Promise.all([
    checkService(AUTH_SERVICE),
    checkService(BLOG_SERVICE),
  ]);

  const allHealthy =
    authHealth.status === "healthy" && blogHealth.status === "healthy";

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

// Service registry endpoint
app.get("/api/services", (req, res) => {
  res.json({
    success: true,
    data: {
      gateway: `http://localhost:${process.env.PORT || 5000}`,
      auth: AUTH_SERVICE,
      blog: BLOG_SERVICE,
    },
  });
});

// 404 handler
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

// Error handler
app.use((err, req, res, next) => {
  console.error(`[${SERVICE_NAME}] Error:`, err.stack);
  res.status(500).json({
    success: false,
    message: "Gateway error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n==========================================`);
  console.log(`  🚀 ${SERVICE_NAME} running on port ${PORT}`);
  console.log(`==========================================`);
  console.log(`  Auth Service  → ${AUTH_SERVICE}`);
  console.log(`  Blog Service  → ${BLOG_SERVICE}`);
  console.log(`  Health Check  → http://localhost:${PORT}/health`);
  console.log(`==========================================\n`);
});