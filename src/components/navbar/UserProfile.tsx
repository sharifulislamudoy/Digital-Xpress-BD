// components/UserProfile.tsx
"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface UserProfileProps {
  user: any;
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full border-2 border-orange-500 overflow-hidden"
      >
        <img
          src={
            user?.photoURL ||
            "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
          }
          alt="Profile"
          className="w-full h-full object-cover"
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-52 bg-white rounded-lg shadow-lg z-50 py-2"
          >
            <li>
              <Link
                href="/profile"
                className="block px-4 py-2 hover:bg-gray-100"
              >
                Profile{" "}
                <span className="text-xs bg-orange-500 text-white rounded-full px-2 ml-2">
                  New
                </span>
              </Link>
            </li>
            <li>
              <Link href="/settings" className="block px-4 py-2 hover:bg-gray-100">
                Settings
              </Link>
            </li>
            <li>
              <Link href="/logout" className="block px-4 py-2 hover:bg-gray-100">
                Logout
              </Link>
            </li>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};