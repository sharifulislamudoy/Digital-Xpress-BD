"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaFacebook,
  FaTwitter,
  FaWhatsapp,
  FaInstagram,
  FaSearch,
  FaUser,
  FaTimes,
  FaBox,
  FaCog,
  FaSignOutAlt,
  FaPhoneAlt,
  FaEnvelope,
} from "react-icons/fa";
import { Logo } from "@/components/navbar/Logo";
import { CartIcon } from "@/components/navbar/CartIcon";
import { NavLinks } from "@/components/navbar/NavLinks";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { createPortal } from "react-dom";

// ============================================================================
// Animated Hamburger Button Component
// ============================================================================
const HamburgerButton = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className="relative w-6 h-5 flex flex-col justify-between items-center focus:outline-none group"
      aria-label="Menu"
    >
      <span
        className={`w-6 h-0.5 bg-white rounded-full transition-all duration-300 ease-out ${
          isOpen ? "rotate-45 translate-y-2" : ""
        }`}
      />
      <span
        className={`w-6 h-0.5 bg-white rounded-full transition-all duration-300 ease-out ${
          isOpen ? "opacity-0" : ""
        }`}
      />
      <span
        className={`w-6 h-0.5 bg-white rounded-full transition-all duration-300 ease-out ${
          isOpen ? "-rotate-45 -translate-y-2" : ""
        }`}
      />
    </button>
  );
};

// ============================================================================
// Fullscreen Search Modal (bottom to top animation)
// ============================================================================
const SearchModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search logic here
    console.log("Searching for:", searchQuery);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-start pt-20 px-4"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-white hover:text-orange-500 transition"
          >
            <FaTimes size={28} />
          </button>
          <div className="w-full max-w-2xl">
            <form onSubmit={handleSubmit} className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search products, categories, or brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 rounded-full py-4 px-6 pl-14 text-white text-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            </form>
            <div className="mt-8 text-center text-gray-400">
              <p>Popular searches: Laptop, Smartphone, Headphones</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// Right Side Drawer for User Profile / Auth (with fixed logout modal using Portal)
// ============================================================================
const UserDrawer = ({
  isOpen,
  onClose,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Close drawer on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !showLogoutConfirm) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, showLogoutConfirm, onClose]);

  // Handle click outside drawer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        !showLogoutConfirm && // Don't close drawer if logout modal is open
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, showLogoutConfirm, onClose]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setShowLogoutConfirm(false); // Close the confirmation modal
    onClose(); // Close the drawer
    await signOut({ callbackUrl: "/" });
    // No need to call anything else as signOut will redirect
  };

  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "U";
  };

  // Logout confirmation modal - rendered via portal to avoid event bubbling issues
  const LogoutConfirmModal = () => {
    if (!mounted) return null;
    return createPortal(
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4"
            onClick={(e) => {
              // Only close if clicking the backdrop, not the modal content
              if (e.target === e.currentTarget) {
                setShowLogoutConfirm(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl max-w-sm w-full p-6 border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-2">Logout</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to logout?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 transition"
                  disabled={isLoggingOut}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? "Logging out..." : "Confirm"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    );
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop - only closes drawer if logout modal is NOT open */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[150]"
              onClick={() => {
                if (!showLogoutConfirm) onClose();
              }}
            />
            {/* Drawer */}
            <motion.div
              ref={drawerRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-gray-950 shadow-2xl z-[160] flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-gray-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Account</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition"
                >
                  <FaTimes size={22} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5">
                {user ? (
                  // Logged In User
                  <div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-full bg-orange-500/20 border-2 border-orange-500 flex items-center justify-center text-orange-500 text-2xl font-bold overflow-hidden">
                        {user?.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitials()
                        )}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-lg">
                          {user?.name || "User"}
                        </p>
                        <p className="text-gray-400 text-sm">{user?.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Link
                        href="/orders"
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition text-white"
                      >
                        <FaBox className="text-orange-500" />
                        <span>My Orders</span>
                      </Link>
                      <Link
                        href="/settings"
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition text-white"
                      >
                        <FaCog className="text-orange-500" />
                        <span>Settings</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  // Not Logged In
                  <div className="text-center py-8">
                    <div className="w-20 h-20 mx-auto bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      <FaUser size={36} className="text-gray-500" />
                    </div>
                    <p className="text-white text-lg mb-2">Not Logged In</p>
                    <p className="text-gray-400 mb-6">
                      Please login to access your account.
                    </p>
                    <Link
                      href="/login"
                      onClick={onClose}
                      className="block w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition mb-3"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={onClose}
                      className="block w-full bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 transition"
                    >
                      Create Account
                    </Link>
                  </div>
                )}
              </div>

              {/* Drawer Footer - Logout button only if logged in */}
              {user && (
                <div className="p-5 border-t border-gray-800">
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="flex items-center justify-center gap-2 w-full bg-red-600/20 text-red-400 py-3 rounded-lg hover:bg-red-600 hover:text-white transition"
                  >
                    <FaSignOutAlt />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <LogoutConfirmModal />
    </>
  );
};

// ============================================================================
// Main Navbar Component
// ============================================================================
const Navbar = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
        className="bg-black sticky top-0 z-50"
      >
        {/* ==================== MOBILE VIEW ==================== */}
        <div className="lg:hidden max-w-7xl mx-auto px-4">
          {/* Top Row: Hamburger + Logo + Icons (Cart, User, Search) */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <HamburgerButton
                isOpen={mobileMenuOpen}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              />
              <Logo imageSrc="/favicon.png" />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="p-2 rounded-full hover:bg-gray-800 transition text-white"
              >
                <FaSearch size={18} />
              </button>
              <CartIcon itemCount={8} subtotal={999} />
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-orange-500 transition overflow-hidden"
              >
                {user?.image ? (
                  <img
                    src={user.image}
                    alt="profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaUser size={14} />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Menu (NavLinks) */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                ref={mobileMenuRef}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute left-0 right-0 bg-black border-t border-gray-800 shadow-lg z-50 p-4 overflow-hidden"
                style={{ top: "100%" }}
              >
                <NavLinks onLinkClick={handleLinkClick} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ==================== DESKTOP VIEW ==================== */}
        <div className="hidden lg:block max-w-7xl mx-auto px-4">
          {/* TOP ROW: Phone & Email (Left) | Social Icons (Right) */}
          <div className="flex items-center justify-between py-2 text-sm border-b border-gray-800">
            <div className="flex items-center gap-6 text-gray-300">
              <a
                href="tel:+8801995322033"
                className="flex items-center gap-2 hover:text-orange-500 transition"
              >
                <FaPhoneAlt size={12} />
                <span>+8801995322033</span>
              </a>
              <a
                href="mailto:info@digital-xpress.com"
                className="flex items-center gap-2 hover:text-orange-500 transition"
              >
                <FaEnvelope size={12} />
                <span>info@digital-xpress.com</span>
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <motion.a
                whileHover={{ scale: 1.1, color: "#f97316" }}
                href="https://www.facebook.com/digitalxpressbd1/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-orange-500"
              >
                <FaFacebook className="w-4 h-4" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1, color: "#f97316" }}
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-orange-500"
              >
                <FaTwitter className="w-4 h-4" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1, color: "#f97316" }}
                href="https://wa.me"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-orange-500"
              >
                <FaWhatsapp className="w-4 h-4" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1, color: "#f97316" }}
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-orange-500"
              >
                <FaInstagram className="w-4 h-4" />
              </motion.a>
            </div>
          </div>

          {/* BOTTOM ROW: Logo (Left) | NavLinks (Center) | Search + Cart + User (Right) */}
          <div className="flex items-center justify-between py-3">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Logo imageSrc="/favicon.png" />
            </div>

            {/* Navigation Links - Center */}
            <div className="flex-1 flex justify-center">
              <NavLinks className="flex-row space-x-6" />
            </div>

            {/* Right Actions: Search Button, Cart, User Icon */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="p-2 rounded-full hover:bg-gray-800 transition text-white"
                aria-label="Search"
              >
                <FaSearch size={20} />
              </button>
              <CartIcon itemCount={8} subtotal={999} />
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-orange-500 transition overflow-hidden"
              >
                {user?.image ? (
                  <img
                    src={user.image}
                    alt="profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaUser size={18} />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Global Modals / Drawers */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
      <UserDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={user}
      />
    </>
  );
};

export default Navbar;