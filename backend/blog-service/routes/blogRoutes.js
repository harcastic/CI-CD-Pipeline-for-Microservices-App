const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { authenticate } = require("../middleware/auth");
const {
  getAllBlogs,
  getBlogById,
  createBlog,
  deleteBlog,
  getBlogsByAuthor,
} = require("../controllers/blogController");

const router = express.Router();

// Public routes
router.get("/", getAllBlogs);
router.get("/:id", getBlogById);
router.get("/author/:authorId", getBlogsByAuthor);

// Protected routes
router.post(
  "/",
  authenticate,
  [
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Title is required")
      .isLength({ max: 200 })
      .withMessage("Title cannot exceed 200 characters"),
    body("content").trim().notEmpty().withMessage("Content is required"),
    body("tags")
      .optional()
      .isArray({ max: 5 })
      .withMessage("Maximum 5 tags allowed"),
    body("coverImage").optional().trim(),
  ],
  validate,
  createBlog
);

router.delete("/:id", authenticate, deleteBlog);

module.exports = router;