"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "next-auth/react";
import { FiLogOut, FiUser, FiSettings } from "react-icons/fi";

interface UserProfileProps {
  user: any; // Consider defining a proper type based on your session user
}

export const UserProfile = ({ user }: UserProfileProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" }); // redirects to home after logout
  };

  // Get user's display name initial for avatar fallback
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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full border-2 border-orange-500 overflow-hidden bg-gray-800 flex items-center justify-center text-white font-medium"
      >
        {user?.image ? (
          <img
            src={user.image}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{getInitials()}</span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 py-2 text-white"
          >
            <li className="px-4 py-2 border-b border-gray-700 mb-1">
              <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </li>
            <li>
              <Link
                href="/profile"
                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <FiUser className="w-4 h-4 text-orange-500" />
                <span>Profile</span>
                <span className="ml-auto text-xs bg-orange-500 text-white rounded-full px-2 py-0.5">
                  New
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/settings"
                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <FiSettings className="w-4 h-4 text-orange-500" />
                <span>Settings</span>
              </Link>
            </li>
            <li className="border-t border-gray-700 mt-1 pt-1">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full text-left px-4 py-2 hover:bg-gray-800 transition-colors text-red-400"
              >
                <FiLogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </li>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};