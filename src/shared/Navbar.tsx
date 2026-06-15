"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  FaEnvelope,
  FaFacebook,
  FaInstagram,
  FaPhoneAlt,
  FaSearch,
  FaShoppingCart,
  FaTwitter,
  FaUser,
  FaWhatsapp,
  FaHeart,
} from "react-icons/fa";
import { Logo } from "@/components/navbar/Logo";
import { NavLinks } from "@/components/navbar/NavLinks";
import { AuthButtons } from "@/components/navbar/AuthButtons";
import { MobileDrawer } from "@/components/navbar/MobileDrawer";
import { SearchModal } from "@/components/navbar/SearchModal";
import { AccountDrawer } from "@/components/navbar/AccountDrawer";
import { BottomNav } from "@/components/navbar/BottomNav";
import { CartDrawer } from "@/components/navbar/CartDrawer";

interface NavbarProps {
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
      className="relative h-4 flex flex-col justify-between items-center focus:outline-none"
      aria-label="Open menu"
    >
      <span
        className={`w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${
          isOpen ? "rotate-45 translate-y-[11px]" : ""
        }`}
      />
      <span
        className={`w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${
          isOpen ? "opacity-0" : ""
        }`}
      />
      <span
        className={`w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${
          isOpen ? "-rotate-45 -translate-y-[11px]" : ""
        }`}
      />
    </button>
  );
};

const Navbar = ({ logoSrc = "/favicon.png" }: NavbarProps) => {
  const { data: session } = useSession();
  const user = session?.user ?? null;

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);

  // Load cart count from localStorage
  useEffect(() => {
    const loadCartCount = () => {
      if (typeof window === "undefined") return;
      try {
        const cart = localStorage.getItem("digital-xpress-cart");
        if (cart) {
          const items = JSON.parse(cart);
          const count = items.reduce(
            (sum: number, item: any) => sum + (item.quantity || 1),
            0
          );
          setCartItemCount(count);
        } else {
          setCartItemCount(0);
        }
      } catch {
        setCartItemCount(0);
      }
    };

    loadCartCount();

    const handleCartUpdate = () => {
      loadCartCount();
    };

    window.addEventListener("digital-xpress-cart-updated", handleCartUpdate);
    return () =>
      window.removeEventListener("digital-xpress-cart-updated", handleCartUpdate);
  }, []);

  // Load favorite count from localStorage
  useEffect(() => {
    const loadFavoriteCount = () => {
      if (typeof window === "undefined") return;
      try {
        const wishlist = localStorage.getItem("digital-xpress-wishlist");
        if (wishlist) {
          const items = JSON.parse(wishlist);
          setFavoriteCount(items.length);
        } else {
          setFavoriteCount(0);
        }
      } catch {
        setFavoriteCount(0);
      }
    };

    loadFavoriteCount();

    const handleWishlistUpdate = () => {
      loadFavoriteCount();
    };

    window.addEventListener(
      "digital-xpress-wishlist-updated",
      handleWishlistUpdate
    );
    return () =>
      window.removeEventListener(
        "digital-xpress-wishlist-updated",
        handleWishlistUpdate
      );
  }, []);

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
            className={`flex items-center justify-between transition-all duration-300 ${
              isScrolled ? "py-2" : "py-3"
            }`}
          >
            <div className="flex items-center gap-2">
              <HamburgerButton
                isOpen={isMobileDrawerOpen}
                onClick={() => setIsMobileDrawerOpen(true)}
              />

              <Logo imageSrc={logoSrc} className="scale-95" />
            </div>

            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative p-2 rounded-full hover:bg-gray-800 transition text-white"
              aria-label="Open cart"
            >
              <FaShoppingCart size={20} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center border border-black">
                  {cartItemCount > 99 ? "99+" : cartItemCount}
                </span>
              )}
            </button>
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

              <button
                onClick={() => setIsCartDrawerOpen(true)}
                className="relative p-2 rounded-full hover:bg-gray-800 transition text-white"
                aria-label="Cart"
              >
                <FaShoppingCart size={20} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center border border-black">
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </span>
                )}
              </button>

              {/* Favorite Button (Desktop) with badge */}
              <Link
                href="/favorites"
                className="relative p-2 rounded-full hover:bg-gray-800 transition text-white"
                aria-label="Favorites"
              >
                <FaHeart size={20} />
                {favoriteCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center border border-black">
                    {favoriteCount > 99 ? "99+" : favoriteCount}
                  </span>
                )}
              </Link>

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

      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
      />

      <BottomNav
        onSearchClick={() => setIsSearchModalOpen(true)}
        onAccountClick={() => setIsAccountDrawerOpen(true)}
        onCartClick={() => setIsCartDrawerOpen(true)}
      />
    </>
  );
};

export default Navbar;