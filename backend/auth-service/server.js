const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

// Pre-flight check
const requiredEnv = ["MONGO_URI", "JWT_SECRET"];
const missingEnv = requiredEnv.filter(env => !process.env[env]);
if (missingEnv.length > 0) {
  console.error(`\n❌ [FATAL] Missing required environment variables: ${missingEnv.join(", ")}`);
  console.error(`Please check your GitHub Secrets and deployment configuration.\n`);
  process.exit(1);
}

connectDB();

const app = express();
const SERVICE_NAME = process.env.SERVICE_NAME || "auth-service";

// Middleware
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(
  morgan("dev", {
    stream: {
      write: (message) =>
        console.log(`[${SERVICE_NAME}] ${message.trim()}`),
    },
  })
);

// Routes
app.use("/api/auth", require("./routes/authRoutes"));

// Health check
app.get("/health", (req, res) => {
  res.json({
    service: SERVICE_NAME,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found on ${SERVICE_NAME}`,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`[${SERVICE_NAME}] Error:`, err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[${SERVICE_NAME}] Running on port ${PORT}`);
  console.log(`[${SERVICE_NAME}] Health: http://0.0.0.0:${PORT}/health`);
});