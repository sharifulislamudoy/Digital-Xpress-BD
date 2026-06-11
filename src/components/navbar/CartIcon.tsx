"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaShoppingCart } from "react-icons/fa";

interface CartIconProps {
  itemCount?: number;
  subtotal?: number;
}

export const CartIcon = ({ itemCount = 0, subtotal = 0 }: CartIconProps) => {
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
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-full hover:bg-gray-800 transition"
        aria-label="Cart"
      >
        <span className="relative block">
          <FaShoppingCart className="h-5 w-5 text-orange-500" />

          <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full px-1 min-w-[18px] text-center border border-orange-500">
            {itemCount}
          </span>
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-56 bg-black rounded-xl shadow-xl z-50 p-4 border border-gray-800"
          >
            <div className="text-lg font-bold text-orange-500">
              {itemCount} Items
            </div>

            <div className="text-gray-300 mt-1">Subtotal: ${subtotal}</div>

            <Link
              href="/cart"
              onClick={() => setIsOpen(false)}
              className="mt-4 block w-full text-center bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition"
            >
              View Cart
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};