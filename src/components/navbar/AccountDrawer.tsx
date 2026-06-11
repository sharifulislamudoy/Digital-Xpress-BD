"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaBox,
  FaCog,
  FaHeart,
  FaSignOutAlt,
  FaTimes,
  FaUser,
} from "react-icons/fa";

interface AccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export const AccountDrawer = ({
  isOpen,
  onClose,
  user,
}: AccountDrawerProps) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) onClose();
    };

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
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const getInitials = () => {
    if (!user?.name) return "U";

    return user.name
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    onClose();
    await signOut({ callbackUrl: "/" });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/65 z-[180]"
            onClick={onClose}
          />

          <motion.aside
            ref={drawerRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className="fixed top-0 right-0 bottom-0 w-[86%] max-w-sm bg-black shadow-2xl z-[190] flex flex-col border-l border-gray-900"
          >
            <div className="p-5 border-b border-gray-900 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Account</h2>

              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition"
                aria-label="Close account drawer"
              >
                <FaTimes size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {user ? (
                <>
                  <div className="flex items-center gap-4 mb-7 rounded-2xl bg-gray-950 border border-gray-800 p-4">
                    <div className="w-16 h-16 rounded-full bg-orange-500/15 border-2 border-orange-500 flex items-center justify-center text-orange-500 text-2xl font-bold overflow-hidden">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name || "User"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitials()
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-white font-semibold text-lg truncate">
                        {user.name || "User"}
                      </p>

                      <p className="text-gray-400 text-sm truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Link
                      href="/profile"
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-900 transition text-white"
                    >
                      <FaUser className="text-orange-500" />
                      <span>Profile</span>
                    </Link>

                    <Link
                      href="/orders"
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-900 transition text-white"
                    >
                      <FaBox className="text-orange-500" />
                      <span>My Orders</span>
                    </Link>

                    <Link
                      href="/wishlist"
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-900 transition text-white"
                    >
                      <FaHeart className="text-orange-500" />
                      <span>Wishlist</span>
                    </Link>

                    <Link
                      href="/settings"
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-900 transition text-white"
                    >
                      <FaCog className="text-orange-500" />
                      <span>Settings</span>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-20 h-20 mx-auto bg-gray-900 rounded-full flex items-center justify-center mb-4 border border-gray-800">
                    <FaUser size={34} className="text-gray-500" />
                  </div>

                  <p className="text-white text-lg mb-2">Not Logged In</p>

                  <p className="text-gray-400 mb-6">
                    Login to manage orders, wishlist, and profile.
                  </p>

                  <Link
                    href="/login"
                    onClick={onClose}
                    className="block w-full bg-orange-500 text-white py-3 rounded-xl hover:bg-orange-600 transition mb-3"
                  >
                    Login
                  </Link>

                  <Link
                    href="/register"
                    onClick={onClose}
                    className="block w-full bg-gray-900 border border-gray-800 text-white py-3 rounded-xl hover:bg-gray-800 transition"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>

            {user && (
              <div className="p-5 border-t border-gray-900">
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full bg-red-600/15 text-red-400 py-3 rounded-xl hover:bg-red-600 hover:text-white transition"
                >
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};