"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import {
  HiOutlinePencilSquare,
  HiOutlineArrowRightOnRectangle,
  HiOutlineUserCircle,
  HiOutlineHome,
  HiBars3,
  HiXMark,
  HiSparkles,
} from "react-icons/hi2";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    setMenuOpen(false);
    router.push("/login");
  };

  const isActive = (path) => pathname === path;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "py-3 glass-strong shadow-lg shadow-black/20"
          : "py-5 bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-all duration-300 group-hover:scale-110">
                <HiSparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:block">
              BlogVerse
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive("/")
                  ? "bg-indigo-500/20 text-indigo-300 shadow-lg shadow-indigo-500/10"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <HiOutlineHome className="w-4 h-4" />
              Feed
            </Link>

            {user ? (
              <>
                <Link
                  href="/create"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive("/create")
                      ? "bg-indigo-500/20 text-indigo-300 shadow-lg shadow-indigo-500/10"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <HiOutlinePencilSquare className="w-4 h-4" />
                  Write
                </Link>

                {/* Profile Dropdown */}
                <div className="relative ml-2" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-all duration-300"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-lg object-cover ring-2 ring-indigo-500/30"
                    />
                    <span className="text-sm font-medium text-gray-300">
                      {user.name}
                    </span>
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl glass-strong shadow-2xl shadow-black/40 overflow-hidden animate-slide-down">
                      <div className="p-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/30"
                          />
                          <div>
                            <p className="font-semibold text-white">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all duration-200 text-sm"
                        >
                          <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link
                  href="/login"
                  className="px-5 py-2 text-sm font-medium text-gray-300 hover:text-white rounded-xl hover:bg-white/5 transition-all duration-300"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 hover:scale-105"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            {menuOpen ? (
              <HiXMark className="w-6 h-6" />
            ) : (
              <HiBars3 className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/5 pt-4 animate-slide-down">
            <div className="flex flex-col gap-2">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-white/5 transition-all"
              >
                <HiOutlineHome className="w-5 h-5" />
                Feed
              </Link>

              {user ? (
                <>
                  <Link
                    href="/create"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-white/5 transition-all"
                  >
                    <HiOutlinePencilSquare className="w-5 h-5" />
                    Write Blog
                  </Link>
                  <div className="flex items-center gap-3 px-4 py-3 border-t border-white/5 mt-2 pt-4">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-lg ring-2 ring-indigo-500/30"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-white">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-white/5 transition-all"
                  >
                    <HiOutlineUserCircle className="w-5 h-5" />
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    className="mx-2 text-center py-3 rounded-xl font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 transition-all"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}