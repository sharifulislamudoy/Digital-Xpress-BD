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
  FaHeart,
  FaChevronDown,
  FaChevronUp,
  FaTachometerAlt,
} from "react-icons/fa";
import { Logo } from "@/components/navbar/Logo";
import { CartIcon } from "@/components/navbar/CartIcon";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
// User Icon Button with Animated Login Tooltip (Shakes periodically)
// ============================================================================
const UserButtonWithTooltip = ({
  user,
  onClick,
  className = "",
}: {
  user: any;
  onClick: () => void;
  className?: string;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [shake, setShake] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shakeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Show tooltip when user is not logged in, with a slight delay
  useEffect(() => {
    if (!user) {
      tooltipTimeoutRef.current = setTimeout(() => {
        setShowTooltip(true);
      }, 1000);
    } else {
      setShowTooltip(false);
    }

    return () => {
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    };
  }, [user]);

  // Periodic shake effect every 3 seconds while tooltip is visible
  useEffect(() => {
    if (showTooltip) {
      shakeIntervalRef.current = setInterval(() => {
        setShake(true);
        setTimeout(() => setShake(false), 300);
      }, 3000);
    } else {
      if (shakeIntervalRef.current) clearInterval(shakeIntervalRef.current);
    }

    return () => {
      if (shakeIntervalRef.current) clearInterval(shakeIntervalRef.current);
    };
  }, [showTooltip]);

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

  return (
    <div className="relative inline-block">
      <button
        onClick={onClick}
        className={`${className} w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-orange-500 transition overflow-hidden`}
        aria-label="User account"
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

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0, ...(shake ? { x: [-2, 2, -2, 2, 0] } : {}) }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2, x: { duration: 0.2 } }}
            className="absolute right-0 top-full mt-2 z-50"
          >
            <div className="relative bg-orange-500 text-white text-sm font-medium py-1.5 px-3 rounded-md shadow-lg whitespace-nowrap">
              <div className="absolute -top-1 right-3 w-2 h-2 rotate-45 bg-orange-500"></div>
              Login
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !showLogoutConfirm) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, showLogoutConfirm, onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        !showLogoutConfirm &&
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
    setShowLogoutConfirm(false);
    onClose();
    await signOut({ callbackUrl: "/" });
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

  // Determine which dashboard links to show based on user role
  const getDashboardLinks = () => {
    const role = user?.role;
    
    if (role === "admin") {
      return {
        href: "/admin",
        label: "Admin Dashboard",
        icon: <FaTachometerAlt className="text-orange-500" />,
      };
    } else if (role === "moderator") {
      return {
        href: "/moderator",
        label: "Moderator Dashboard",
        icon: <FaTachometerAlt className="text-orange-500" />,
      };
    } else {
      // customer or any other role - show orders and wishlist
      return null;
    }
  };

  const dashboardLink = getDashboardLinks();

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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[150]"
              onClick={() => {
                if (!showLogoutConfirm) onClose();
              }}
            />
            <motion.div
              ref={drawerRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-[#141414] shadow-2xl z-[160] flex flex-col"
            >
              <div className="p-5 border-b border-orange-500 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Account</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition"
                >
                  <FaTimes size={22} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                {user ? (
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
                        {user?.role && (
                          <p className="text-orange-400 text-xs capitalize mt-1">
                            {user.role}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {/* Role-based dashboard links */}
                      {dashboardLink ? (
                        <Link
                          href={dashboardLink.href}
                          onClick={onClose}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition text-white"
                        >
                          {dashboardLink.icon}
                          <span>{dashboardLink.label}</span>
                        </Link>
                      ) : (
                        // Customer links: Orders and Wishlist
                        <>
                          <Link
                            href="/orders"
                            onClick={onClose}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition text-white"
                          >
                            <FaBox className="text-orange-500" />
                            <span>My Orders</span>
                          </Link>
                          <Link
                            href="/wishlist"
                            onClick={onClose}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition text-white"
                          >
                            <FaHeart className="text-orange-500" />
                            <span>Wishlist</span>
                          </Link>
                        </>
                      )}
                      
                      {/* Settings link - show for all logged-in users */}
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
// Mobile Left Drawer Navigation
// ============================================================================
const MobileDrawer = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [isMoreExpanded, setIsMoreExpanded] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // More submenu items
  const moreItems = [
    { name: "Blog", href: "/blog" },
    { name: "About Us", href: "/about" },
    { name: "Contact Us", href: "/contact" },
    { name: "Refund and Return Policy", href: "/refund-policy" },
    { name: "Shipping and Delivery Policy", href: "/shipping-policy" },
    { name: "Terms of Service", href: "/terms" },
  ];

  // Main nav items
  const mainNavItems = [
    { name: "Home", href: "/" },
    { name: "Products", href: "/products" },
  ];

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
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
  }, [isOpen, onClose]);

  const handleLinkClick = () => {
    setIsMoreExpanded(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[140]"
            onClick={onClose}
          />
          <motion.div
            ref={drawerRef}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-full max-w-xs bg-[#141414] shadow-2xl z-[150] flex flex-col"
          >
            <div className="p-5 border-b border-orange-500 flex justify-between items-center">
              <Logo imageSrc="/favicon.png" />
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition"
              >
                <FaTimes size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <ul className="space-y-4">
                {mainNavItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={handleLinkClick}
                      className={`block py-2 text-lg transition-colors ${
                        pathname === item.href
                          ? "text-orange-500 font-semibold"
                          : "text-white hover:text-orange-400"
                      }`}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}

                {/* More Item with Expandable Submenu */}
                <li>
                  <button
                    onClick={() => setIsMoreExpanded(!isMoreExpanded)}
                    className="w-full flex items-center justify-between py-2 text-lg text-white hover:text-orange-400 transition-colors"
                  >
                    <span>More</span>
                    {isMoreExpanded ? (
                      <FaChevronUp className="text-orange-500" />
                    ) : (
                      <FaChevronDown className="text-gray-400" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isMoreExpanded && (
                      <motion.ul
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="mt-2 ml-4 space-y-2 overflow-hidden"
                      >
                        {moreItems.map((item) => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={handleLinkClick}
                              className={`block py-2 text-sm transition-colors ${
                                pathname === item.href
                                  ? "text-orange-500 font-semibold"
                                  : "text-gray-300 hover:text-orange-400"
                              }`}
                            >
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </li>
              </ul>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// Desktop Navigation Links with More Dropdown
// ============================================================================
const DesktopNavLinks = ({ className = "" }: { className?: string }) => {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const moreItems = [
    { name: "Blog", href: "/blog" },
    { name: "About Us", href: "/about" },
    { name: "Contact Us", href: "/contact" },
    { name: "Refund and Return Policy", href: "/refund-policy" },
    { name: "Shipping and Delivery Policy", href: "/shipping-policy" },
    { name: "Terms of Service", href: "/terms" },
  ];

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsMoreOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsMoreOpen(false);
    }, 150);
  };

  return (
    <ul className={`flex items-center space-x-6 ${className}`}>
      <li>
        <Link
          href="/"
          className={`transition-colors ${
            pathname === "/"
              ? "text-orange-500 font-semibold"
              : "text-white hover:text-orange-400"
          }`}
        >
          Home
        </Link>
      </li>
      <li>
        <Link
          href="/products"
          className={`transition-colors ${
            pathname === "/products"
              ? "text-orange-500 font-semibold"
              : "text-white hover:text-orange-400"
          }`}
        >
          Products
        </Link>
      </li>

      {/* More Dropdown */}
      <li
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          className={`flex items-center gap-1 transition-colors ${
            moreItems.some((item) => pathname === item.href)
              ? "text-orange-500 font-semibold"
              : "text-white hover:text-orange-400"
          }`}
        >
          <span>More</span>
          <FaChevronDown
            className={`text-xs transition-transform duration-200 ${
              isMoreOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        <AnimatePresence>
          {isMoreOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 mt-2 w-64 bg-[#141414] border border-gray-800 rounded-lg shadow-xl z-50"
            >
              <ul className="py-2">
                {moreItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        pathname === item.href
                          ? "text-orange-500 bg-gray-800/50"
                          : "text-gray-300 hover:text-orange-400 hover:bg-gray-800/30"
                      }`}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </li>
    </ul>
  );
};

// ============================================================================
// Main Navbar Component with scroll‑driven bounce and Left Drawer for Mobile
// ============================================================================
const Navbar = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // For mobile, we need a smaller icon size, so we pass a custom className
  const mobileUserButtonClass = "w-8 h-8";
  const desktopUserButtonClass = "w-10 h-10";

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
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`flex items-center justify-between transition-all duration-300 ${
              isScrolled ? "py-1" : "py-2"
            }`}
          >
            <div className="flex items-center gap-2">
              <HamburgerButton
                isOpen={isMobileDrawerOpen}
                onClick={() => setIsMobileDrawerOpen(true)}
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
              <UserButtonWithTooltip
                user={user}
                onClick={() => setIsDrawerOpen(true)}
                className={mobileUserButtonClass}
              />
            </div>
          </motion.div>
        </div>

        {/* ==================== DESKTOP VIEW ==================== */}
        <div className="hidden lg:block max-w-7xl mx-auto px-4">
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* TOP ROW: hides when scrolled */}
            <div
              className={`flex items-center justify-between text-sm border-b border-gray-800 transition-all duration-300 ease-in-out ${
                isScrolled
                  ? "max-h-0 opacity-0 py-0 border-b-0 overflow-hidden"
                  : "max-h-12 opacity-100 py-2"
              }`}
            >
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

            {/* BOTTOM ROW: always visible, shifts up with bounce when top row collapses */}
            <div className="flex items-center justify-between py-3">
              <div className="flex-shrink-0">
                <Logo imageSrc="/favicon.png" />
              </div>

              <div className="flex-1 flex justify-center">
                <DesktopNavLinks />
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => setIsSearchModalOpen(true)}
                  className="p-2 rounded-full hover:bg-gray-800 transition text-white"
                  aria-label="Search"
                >
                  <FaSearch size={20} />
                </button>
                <CartIcon itemCount={8} subtotal={999} />
                <UserButtonWithTooltip
                  user={user}
                  onClick={() => setIsDrawerOpen(true)}
                  className={desktopUserButtonClass}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Mobile Left Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
      />

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