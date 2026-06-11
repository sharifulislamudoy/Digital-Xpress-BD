"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { FaSearch, FaTimes } from "react-icons/fa";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;

    const timeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 120);

    return () => clearTimeout(timeout);
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const query = searchQuery.trim();

    if (query) {
      router.push(`/products?search=${encodeURIComponent(query)}`);
    }

    onClose();
  };

  const popularSearches = ["iPhone", "Laptop", "Headphone", "Smart Watch"];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 260 }}
          className="fixed inset-0 z-[220] bg-black/95 backdrop-blur-md flex flex-col items-center justify-start pt-20 px-4"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-white hover:text-orange-500 transition"
            aria-label="Close search"
          >
            <FaTimes size={28} />
          </button>

          <div className="w-full max-w-2xl">
            <form onSubmit={handleSubmit} className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-full py-4 px-6 pl-14 text-white text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />

              <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            </form>

            <div className="mt-8">
              <p className="text-gray-400 mb-3">Popular searches</p>

              <div className="flex flex-wrap gap-3">
                {popularSearches.map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      router.push(
                        `/products?search=${encodeURIComponent(item)}`
                      );
                      onClose();
                    }}
                    className="rounded-full bg-gray-900 border border-gray-800 px-4 py-2 text-sm text-gray-200 hover:border-orange-500 hover:text-orange-400 transition"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};