"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  HiOutlinePencilSquare,
  HiOutlinePhoto,
  HiOutlineTag,
  HiOutlineXMark,
  HiOutlineRocketLaunch,
  HiOutlineDocumentText,
  HiOutlineEye,
} from "react-icons/hi2";

export default function CreateBlogPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      toast.error("Please sign in to write a blog");
    }
  }, [user, authLoading, router]);

  const handleAddTag = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase().replace(/,/g, "");
      if (tag && !tags.includes(tag) && tags.length < 5) {
        setTags([...tags, tag]);
        setTagInput("");
      }
    }
  };

  const removeTag = (tagToRemove) =>
    setTags(tags.filter((t) => t !== tagToRemove));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          coverImage: coverImage.trim(),
          tags,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      toast.success("Blog published successfully! 🎉");
      router.push("/");
    } catch (error) {
      toast.error(error.message || "Failed to create blog");
    } finally {
      setLoading(false);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  if (authLoading || !user)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-10 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <HiOutlinePencilSquare className="w-5 h-5 text-white" />
              </div>
              Write Your Story
            </h1>
            <p className="text-gray-400">Share your ideas with the world</p>
          </div>
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
              preview
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/20"
                : "glass text-gray-400 hover:text-white"
            }`}
          >
            {preview ? (
              <HiOutlineDocumentText className="w-4 h-4" />
            ) : (
              <HiOutlineEye className="w-4 h-4" />
            )}
            {preview ? "Edit" : "Preview"}
          </button>
        </div>

        {preview ? (
          <div className="rounded-3xl glass-strong box-glow p-8 animate-fade-in">
            {coverImage && (
              <div className="rounded-2xl overflow-hidden mb-8 h-64">
                <img
                  src={coverImage}
                  alt="Cover"
                  className="w-full h-full object-cover"
                  onError={(e) => (e.target.style.display = "none")}
                />
              </div>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-xs font-medium rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <h1 className="text-3xl font-bold text-white mb-4">
              {title || "Untitled"}
            </h1>
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/5">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-lg ring-2 ring-white/10"
              />
              <div>
                <p className="font-medium text-gray-200">{user.name}</p>
                <p className="text-xs text-gray-500">
                  {wordCount} words · {readTime} min read
                </p>
              </div>
            </div>
            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap blog-content">
              {content || "Your content will appear here..."}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
            <div className="rounded-2xl glass-strong p-6 box-glow">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                <HiOutlinePhoto className="w-4 h-4 text-indigo-400" />
                Cover Image URL
                <span className="text-xs text-gray-500 ml-1">(optional)</span>
              </label>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300"
              />
              {coverImage && (
                <div className="mt-4 rounded-xl overflow-hidden h-40">
                  <img
                    src={coverImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                </div>
              )}
            </div>

            <div className="rounded-2xl glass-strong p-6 box-glow">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                <HiOutlineDocumentText className="w-4 h-4 text-indigo-400" />
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="An amazing title for your blog..."
                required
                maxLength={200}
                className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-lg font-semibold placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300"
              />
              <p className="text-xs text-gray-500 mt-2 text-right">
                {title.length}/200
              </p>
            </div>

            <div className="rounded-2xl glass-strong p-6 box-glow">
              <label className="flex items-center justify-between text-sm font-medium text-gray-300 mb-3">
                <span className="flex items-center gap-2">
                  <HiOutlinePencilSquare className="w-4 h-4 text-indigo-400" />
                  Content
                </span>
                <span className="text-xs text-gray-500 font-normal">
                  {wordCount} words · ~{readTime} min read
                </span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your story here..."
                required
                rows={12}
                className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300 resize-y min-h-[200px] leading-relaxed"
              />
            </div>

            <div className="rounded-2xl glass-strong p-6 box-glow">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                <HiOutlineTag className="w-4 h-4 text-indigo-400" />
                Tags
                <span className="text-xs text-gray-500 ml-1">
                  (press Enter to add, max 5)
                </span>
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 animate-fade-in"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-400 transition-colors"
                    >
                      <HiOutlineXMark className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              {tags.length < 5 && (
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="technology, coding, design..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300 text-sm"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="px-6 py-3 rounded-xl glass text-gray-300 hover:text-white hover:bg-white/5 font-medium transition-all duration-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim() || !content.trim()}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Publishing...
                  </>
                ) : (
                  <>
                    <HiOutlineRocketLaunch className="w-5 h-5" />
                    Publish Blog
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}