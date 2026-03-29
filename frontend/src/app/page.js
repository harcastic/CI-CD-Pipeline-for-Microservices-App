"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import BlogCard from "@/components/BlogCard";
import Link from "next/link";
import {
  HiOutlinePencilSquare,
  HiOutlineRocketLaunch,
  HiOutlineSparkles,
  HiOutlineNewspaper,
} from "react-icons/hi2";

export default function Home() {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBlogs, setTotalBlogs] = useState(0);

  useEffect(() => {
    fetchBlogs();
  }, [page]);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/blogs?page=${page}&limit=9`
      );
      const result = await res.json();

      if (res.ok && result.success) {
        const data = result.data;
        setBlogs(data.blogs);
        setTotalPages(data.totalPages);
        setTotalBlogs(data.totalBlogs);
      }
    } catch (error) {
      console.error("Fetch blogs error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (blogId) => {
    setBlogs((prev) => prev.filter((b) => b._id !== blogId));
    setTotalBlogs((prev) => prev - 1);
  };

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-indigo-300 mb-6 animate-float">
            <HiOutlineSparkles className="w-4 h-4" />
            <span>Welcome to BlogVerse</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black mb-6 tracking-tight">
            <span className="text-white">Discover </span>
            <span className="gradient-text text-glow">Amazing</span>
            <br />
            <span className="text-white">Stories & Ideas</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            A space where creators share their thoughts, ideas, and stories.
            Read, write, and connect with a community of passionate bloggers.
          </p>
          {user ? (
            <Link
              href="/create"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105"
            >
              <HiOutlinePencilSquare className="w-5 h-5 transition-transform group-hover:rotate-12" />
              Write a New Blog
              <HiOutlineRocketLaunch className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          ) : (
            <Link
              href="/register"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105"
            >
              Get Started — It&apos;s Free
              <HiOutlineRocketLaunch className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>

        {totalBlogs > 0 && (
          <div className="flex items-center justify-center gap-2 mb-10 animate-fade-in">
            <HiOutlineNewspaper className="w-5 h-5 text-indigo-400" />
            <span className="text-gray-400">
              <span className="font-bold text-white">{totalBlogs}</span>{" "}
              {totalBlogs === 1 ? "story" : "stories"} published
            </span>
          </div>
        )}

        {/* Blog Feed */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl glass overflow-hidden">
                <div className="h-1 skeleton" />
                <div className="p-6">
                  <div className="flex gap-2 mb-4">
                    <div className="h-6 w-16 rounded-lg skeleton" />
                    <div className="h-6 w-20 rounded-lg skeleton" />
                  </div>
                  <div className="h-7 w-3/4 rounded-lg skeleton mb-3" />
                  <div className="space-y-2 mb-4">
                    <div className="h-4 w-full rounded skeleton" />
                    <div className="h-4 w-full rounded skeleton" />
                    <div className="h-4 w-2/3 rounded skeleton" />
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                    <div className="w-9 h-9 rounded-lg skeleton" />
                    <div>
                      <div className="h-4 w-24 rounded skeleton mb-1" />
                      <div className="h-3 w-32 rounded skeleton" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl glass flex items-center justify-center">
              <HiOutlineNewspaper className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-300 mb-3">
              No stories yet
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Be the first to share your thoughts with the world.
            </p>
            {user && (
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-medium text-white hover:shadow-lg hover:shadow-indigo-500/25 transition-all hover:scale-105"
              >
                <HiOutlinePencilSquare className="w-5 h-5" />
                Write First Blog
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog, index) => (
                <div
                  key={blog._id}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  className="animate-slide-up"
                >
                  <BlogCard blog={blog} onDelete={handleDelete} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-12 animate-fade-in">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-5 py-2.5 rounded-xl glass text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                        page === i + 1
                          ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                          : "glass text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={page === totalPages}
                  className="px-5 py-2.5 rounded-xl glass text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}