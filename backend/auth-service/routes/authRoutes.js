const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const {
  register,
  login,
  getMe,
  verifyTokenEndpoint,
  getUserById,
  getUsersByIds,
} = require("../controllers/authController");

const router = express.Router();

// Public routes
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  validate,
  register
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  login
);

// Protected route
router.get("/me", getMe);

// Internal service-to-service routes
router.post("/verify-token", verifyTokenEndpoint);
router.get("/users/:id", getUserById);
router.post("/users/batch", getUsersByIds);

module.exports = router;