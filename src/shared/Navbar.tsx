"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaFacebook,
  FaTwitter,
  FaWhatsapp,
  FaInstagram,
  FaSearch,
} from "react-icons/fa";
import { Logo } from "@/components/navbar/Logo";
import { CartIcon } from "@/components/navbar/CartIcon";
import { UserProfile } from "@/components/navbar/UserProfile";
import { NavLinks } from "@/components/navbar/NavLinks";
import { AuthButtons } from "@/components/navbar/AuthButtons";
import { useSession } from "next-auth/react";


// Animated Hamburger Button Component
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
        className={`w-6 h-0.5 bg-white rounded-full transition-all duration-300 ease-out ${isOpen ? "rotate-45 translate-y-2" : ""
          }`}
      />
      <span
        className={`w-6 h-0.5 bg-white rounded-full transition-all duration-300 ease-out ${isOpen ? "opacity-0" : ""
          }`}
      />
      <span
        className={`w-6 h-0.5 bg-white rounded-full transition-all duration-300 ease-out ${isOpen ? "-rotate-45 -translate-y-2" : ""
          }`}
      />
    </button>
  );
};

const Navbar = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Close mobile menu when a navigation link is clicked
  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
      className="bg-black sticky top-0 z-50"
    >
      {/* Mobile View */}
      <div className="lg:hidden w-11/12 mx-auto">
        {/* Top Row with Hamburger, Logo, and Actions */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <HamburgerButton
              isOpen={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            />
            <Logo imageSrc="/favicon.png" />
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <CartIcon itemCount={8} subtotal={999} />
                <UserProfile user={user} />
              </>
            ) : (
              <AuthButtons />
            )}
          </div>
        </div>

        {/* Search Field Below the Row (always visible) */}
        <div className="pb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full bg-gray-800 rounded-full py-2 px-4 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>

        {/* Mobile Dropdown Menu with Animation */}
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
              {/* Pass onLinkClick to close menu when a link is clicked */}
              <NavLinks onLinkClick={handleLinkClick} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block">
        {/* Top bar */}
        <div className="w-11/12 mx-auto">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-4">
              <motion.a
                whileHover={{ scale: 1.1, color: "#f97316" }}
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-orange-500"
              >
                <FaFacebook className="w-5 h-5" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1, color: "#f97316" }}
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-orange-500"
              >
                <FaTwitter className="w-5 h-5" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1, color: "#f97316" }}
                href="https://wa.me"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-orange-500"
              >
                <FaWhatsapp className="w-5 h-5" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1, color: "#f97316" }}
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-orange-500"
              >
                <FaInstagram className="w-5 h-5" />
              </motion.a>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <CartIcon itemCount={8} subtotal={999} />
                  <UserProfile user={user} />
                </>
              ) : (
                <AuthButtons />
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-y border-gray-800">
          <div className="w-11/12 mx-auto py-2">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Logo imageSrc="/favicon.png" className="ml-4" />
              </div>
              <div className="flex-1 flex justify-center">
                <NavLinks className="flex-row space-x-6" />
              </div>
              <div className="flex-1 flex justify-end">
                <div className="relative mr-4 w-64">
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full bg-gray-800 rounded-full py-1 px-4 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <FaSearch className="absolute left-3 top-2 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Navbar;