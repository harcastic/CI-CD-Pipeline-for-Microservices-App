"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import {
  HiOutlineTrash,
  HiOutlineClock,
  HiOutlineBookOpen,
} from "react-icons/hi2";
import toast from "react-hot-toast";

export default function BlogCard({ blog, onDelete }) {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isAuthor = user && blog.author && user._id === blog.author._id;

  const readTime = Math.max(1, Math.ceil(blog.content.split(/\s+/).length / 200));

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/blogs/${blog._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      toast.success("Blog deleted successfully!");
      onDelete(blog._id);
    } catch (error) {
      toast.error(error.message || "Failed to delete blog");
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  const formattedDate = blog.createdAt
    ? formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })
    : "";

  const truncatedContent =
    blog.content.length > 250
      ? blog.content.substring(0, 250) + "..."
      : blog.content;

  const colors = [
    "from-indigo-500/20 to-purple-500/20",
    "from-pink-500/20 to-rose-500/20",
    "from-cyan-500/20 to-blue-500/20",
    "from-amber-500/20 to-orange-500/20",
    "from-emerald-500/20 to-teal-500/20",
  ];
  const colorIndex =
    blog.title.charCodeAt(0) % colors.length;
  const gradientColor = colors[colorIndex];

  return (
    <article
      className={`group relative rounded-2xl glass overflow-hidden transition-all duration-500 hover:scale-[1.02] box-glow-hover animate-fade-in`}
    >
      {/* Gradient accent top */}
      <div
        className={`h-1 bg-gradient-to-r ${gradientColor.replace(
          /\/20/g,
          ""
        )}`}
      />

      {/* Cover Image */}
      {blog.coverImage && (
        <div className="relative h-52 overflow-hidden">
          <img
            src={blog.coverImage}
            alt={blog.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-transparent" />
        </div>
      )}

      <div className="p-6">
        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {blog.tags.map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1 text-xs font-medium rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h2 className="text-xl font-bold text-white mb-3 leading-tight group-hover:text-indigo-300 transition-colors duration-300">
          {blog.title}
        </h2>

        {/* Content */}
        <div className="text-gray-400 text-sm leading-relaxed mb-4 blog-content">
          {expanded ? (
            <>
              <p style={{ whiteSpace: "pre-wrap" }}>{blog.content}</p>
              <button
                onClick={() => setExpanded(false)}
                className="text-indigo-400 hover:text-indigo-300 font-medium mt-2 text-sm transition-colors"
              >
                Show less
              </button>
            </>
          ) : (
            <>
              <p>{truncatedContent}</p>
              {blog.content.length > 250 && (
                <button
                  onClick={() => setExpanded(true)}
                  className="text-indigo-400 hover:text-indigo-300 font-medium mt-2 text-sm transition-colors"
                >
                  Read more →
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            {blog.author && (
              <>
                <img
                  src={blog.author.avatar}
                  alt={blog.author.name}
                  className="w-9 h-9 rounded-lg object-cover ring-2 ring-white/10"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-200">
                    {blog.author.name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <HiOutlineClock className="w-3 h-3" />
                      {formattedDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <HiOutlineBookOpen className="w-3 h-3" />
                      {readTime} min read
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Delete Button (only for author) */}
          {isAuthor && (
            <div className="relative">
              {showConfirm ? (
                <div className="flex items-center gap-2 animate-fade-in">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20 transition-all disabled:opacity-50"
                  >
                    {deleting ? (
                      <span className="flex items-center gap-1">
                        <svg
                          className="animate-spin w-3 h-3"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Deleting
                      </span>
                    ) : (
                      "Confirm"
                    )}
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 opacity-0 group-hover:opacity-100"
                  title="Delete blog"
                >
                  <HiOutlineTrash className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}