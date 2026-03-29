const axios = require("axios");
const Blog = require("../models/Blog");

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:5001";

/**
 * Helper: Fetch author details from auth-service
 */
const fetchAuthorDetails = async (authorId) => {
  try {
    const response = await axios.get(
      `${AUTH_SERVICE_URL}/api/auth/users/${authorId}`,
      { timeout: 5000 }
    );
    return response.data.success ? response.data.data : null;
  } catch (error) {
    console.error(
      `[blog-service] Failed to fetch author ${authorId}:`,
      error.message
    );
    return null;
  }
};

/**
 * Helper: Fetch multiple authors from auth-service (batch)
 */
const fetchAuthorsInBatch = async (authorIds) => {
  try {
    const uniqueIds = [...new Set(authorIds)];
    const response = await axios.post(
      `${AUTH_SERVICE_URL}/api/auth/users/batch`,
      { ids: uniqueIds },
      { timeout: 5000 }
    );
    return response.data.success ? response.data.data : {};
  } catch (error) {
    console.error(
      "[blog-service] Failed to fetch authors batch:",
      error.message
    );
    return {};
  }
};

/**
 * Helper: Attach author data to blog(s)
 */
const enrichBlogWithAuthor = (blog, authorsMap) => {
  const blogObj = blog.toJSON ? blog.toJSON() : { ...blog };
  const author = authorsMap[blogObj.authorId] || {
    _id: blogObj.authorId,
    name: "Unknown User",
    email: "",
    avatar: `https://ui-avatars.com/api/?name=Unknown&background=6366f1&color=fff`,
  };
  return { ...blogObj, author };
};

/**
 * @desc    Get all blogs (paginated feed)
 * @route   GET /api/blogs
 * @access  Public
 */
const getAllBlogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const [blogs, total] = await Promise.all([
      Blog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Blog.countDocuments(),
    ]);

    // Fetch all author details in a single batch call
    const authorIds = blogs.map((blog) => blog.authorId);
    const authorsMap = await fetchAuthorsInBatch(authorIds);

    // Enrich blogs with author data
    const enrichedBlogs = blogs.map((blog) =>
      enrichBlogWithAuthor(blog, authorsMap)
    );

    res.json({
      success: true,
      data: {
        blogs: enrichedBlogs,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalBlogs: total,
      },
    });
  } catch (error) {
    console.error("[blog-service] GetAllBlogs error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @desc    Get a single blog by ID
 * @route   GET /api/blogs/:id
 * @access  Public
 */
const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).lean();
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const author = await fetchAuthorDetails(blog.authorId);
    const enrichedBlog = enrichBlogWithAuthor(blog, {
      [blog.authorId]: author,
    });

    res.json({
      success: true,
      data: enrichedBlog,
    });
  } catch (error) {
    console.error("[blog-service] GetBlogById error:", error);
    if (error.kind === "ObjectId") {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @desc    Create a new blog
 * @route   POST /api/blogs
 * @access  Private
 */
const createBlog = async (req, res) => {
  try {
    const { title, content, coverImage, tags } = req.body;

    const blog = await Blog.create({
      title: title.trim(),
      content: content.trim(),
      coverImage: coverImage?.trim() || "",
      tags: tags || [],
      authorId: req.user._id,
    });

    const enrichedBlog = enrichBlogWithAuthor(blog, {
      [req.user._id]: req.user,
    });

    res.status(201).json({
      success: true,
      message: "Blog published successfully",
      data: enrichedBlog,
    });
  } catch (error) {
    console.error("[blog-service] CreateBlog error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @desc    Delete a blog (only the author can delete)
 * @route   DELETE /api/blogs/:id
 * @access  Private
 */
const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // Authorization check: only the author can delete their blog
    if (blog.authorId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden — you can only delete your own blogs",
      });
    }

    await Blog.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Blog deleted successfully",
      data: { id: req.params.id },
    });
  } catch (error) {
    console.error("[blog-service] DeleteBlog error:", error);
    if (error.kind === "ObjectId") {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @desc    Get blogs by a specific author
 * @route   GET /api/blogs/author/:authorId
 * @access  Public
 */
const getBlogsByAuthor = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const [blogs, total] = await Promise.all([
      Blog.find({ authorId: req.params.authorId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments({ authorId: req.params.authorId }),
    ]);

    const author = await fetchAuthorDetails(req.params.authorId);
    const authorsMap = author ? { [req.params.authorId]: author } : {};
    const enrichedBlogs = blogs.map((blog) =>
      enrichBlogWithAuthor(blog, authorsMap)
    );

    res.json({
      success: true,
      data: {
        blogs: enrichedBlogs,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalBlogs: total,
      },
    });
  } catch (error) {
    console.error("[blog-service] GetBlogsByAuthor error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getAllBlogs,
  getBlogById,
  createBlog,
  deleteBlog,
  getBlogsByAuthor,
};