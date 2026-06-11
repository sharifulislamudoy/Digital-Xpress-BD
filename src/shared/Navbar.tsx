"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  FaEnvelope,
  FaFacebook,
  FaInstagram,
  FaPhoneAlt,
  FaSearch,
  FaTwitter,
  FaUser,
  FaWhatsapp,
} from "react-icons/fa";
import { Logo } from "@/components/navbar/Logo";
import { NavLinks } from "@/components/navbar/NavLinks";
import { CartIcon } from "@/components/navbar/CartIcon";
import { AuthButtons } from "@/components/navbar/AuthButtons";
import { MobileDrawer } from "@/components/navbar/MobileDrawer";
import { SearchModal } from "@/components/navbar/SearchModal";
import { AccountDrawer } from "@/components/navbar/AccountDrawer";
import { BottomNav } from "@/components/navbar/BottomNav";




interface NavbarProps {
  cartItemCount?: number;
  cartSubtotal?: number;
  logoSrc?: string;
}

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
      className="relative w-7 h-6 flex flex-col justify-between items-center focus:outline-none"
      aria-label="Open menu"
    >
      <span
        className={`w-7 h-0.5 bg-white rounded-full transition-all duration-300 ${
          isOpen ? "rotate-45 translate-y-[11px]" : ""
        }`}
      />

      <span
        className={`w-7 h-0.5 bg-white rounded-full transition-all duration-300 ${
          isOpen ? "opacity-0" : ""
        }`}
      />

      <span
        className={`w-7 h-0.5 bg-white rounded-full transition-all duration-300 ${
          isOpen ? "-rotate-45 -translate-y-[11px]" : ""
        }`}
      />
    </button>
  );
};

const Navbar = ({
  cartItemCount = 0,
  cartSubtotal = 0,
  logoSrc = "/favicon.png",
}: NavbarProps) => {
  const { data: session } = useSession();

  const user = session?.user ?? null;

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-black sticky top-0 z-50 border-b border-gray-900"
      >
        {/* Mobile top navbar */}
        <div className="lg:hidden max-w-7xl mx-auto px-4">
          <div
            className={`flex items-center gap-4 transition-all duration-300 ${
              isScrolled ? "py-2" : "py-3"
            }`}
          >
            <HamburgerButton
              isOpen={isMobileDrawerOpen}
              onClick={() => setIsMobileDrawerOpen(true)}
            />

            <Logo imageSrc={logoSrc} className="scale-95 origin-left" />
          </div>
        </div>

        {/* Desktop navbar */}
        <div className="hidden lg:block max-w-7xl mx-auto px-4">
          <div
            className={`flex items-center justify-between text-sm border-b border-gray-800 transition-all duration-300 ${
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

            <div className="flex items-center gap-4">
              <a
                href="https://www.facebook.com/digitalxpressbd1/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-orange-500 transition"
              >
                <FaFacebook />
              </a>

              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-orange-500 transition"
              >
                <FaTwitter />
              </a>

              <a
                href="https://wa.me/8801995322033"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-orange-500 transition"
              >
                <FaWhatsapp />
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-orange-500 transition"
              >
                <FaInstagram />
              </a>
            </div>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex-shrink-0">
              <Logo imageSrc={logoSrc} />
            </div>

            <nav className="flex-1 flex justify-center">
              <NavLinks />
            </nav>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="p-2 rounded-full hover:bg-gray-800 transition text-white"
                aria-label="Search"
              >
                <FaSearch size={20} />
              </button>

              <CartIcon itemCount={cartItemCount} subtotal={cartSubtotal} />

              {user ? (
                <button
                  onClick={() => setIsAccountDrawerOpen(true)}
                  className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-white hover:bg-orange-500 transition overflow-hidden"
                  aria-label="Account"
                >
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FaUser size={18} />
                  )}
                </button>
              ) : (
                <AuthButtons />
              )}
            </div>
          </div>
        </div>
      </motion.header>

      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        logoSrc={logoSrc}
        user={user}
      />

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

      <AccountDrawer
        isOpen={isAccountDrawerOpen}
        onClose={() => setIsAccountDrawerOpen(false)}
        user={user}
      />

      <BottomNav
        itemCount={cartItemCount}
        onSearchClick={() => setIsSearchModalOpen(true)}
        onAccountClick={() => setIsAccountDrawerOpen(true)}
      />
    </>
  );
};

export default Navbar;