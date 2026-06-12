// components/navbar/CartDrawer.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaMinus, FaPlus, FaTrashAlt, FaTimes } from "react-icons/fa";
import Link from "next/link";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  inStock: boolean;
  originalPrice?: number;
  discount?: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CART_STORAGE_KEY = "digital-xpress-cart";

const readCartFromStorage = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const writeCartToStorage = (cart: CartItem[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(
    new CustomEvent("digital-xpress-cart-updated", { detail: cart })
  );
};

export const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadCart = useCallback(() => {
    setCartItems(readCartFromStorage());
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadCart();
    }
  }, [isOpen, loadCart]);

  useEffect(() => {
    const handleCartUpdate = () => {
      loadCart();
    };
    window.addEventListener("digital-xpress-cart-updated", handleCartUpdate);
    return () => window.removeEventListener("digital-xpress-cart-updated", handleCartUpdate);
  }, [loadCart]);

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setIsUpdating(true);
    const updatedCart = cartItems.map((item) =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    writeCartToStorage(updatedCart);
    setCartItems(updatedCart);
    setTimeout(() => setIsUpdating(false), 100);
  };

  const removeItem = (id: string) => {
    setIsUpdating(true);
    const updatedCart = cartItems.filter((item) => item.id !== id);
    writeCartToStorage(updatedCart);
    setCartItems(updatedCart);
    setTimeout(() => setIsUpdating(false), 100);
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150]"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-black border-l border-gray-800 shadow-2xl z-[151] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-xl font-semibold text-white">
                Your Cart ({totalItems})
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-800 transition text-gray-400 hover:text-white"
                aria-label="Close cart"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-2">Your cart is empty</div>
                  <button
                    onClick={onClose}
                    className="text-orange-500 hover:text-orange-400 transition"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 bg-gray-900/50 rounded-xl p-3 border border-gray-800"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg bg-gray-800"
                    />
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.id}`}
                        onClick={onClose}
                        className="font-medium text-white hover:text-orange-500 transition line-clamp-2"
                      >
                        {item.name}
                      </Link>
                      <div className="text-orange-500 font-semibold mt-1">
                        ${item.price.toFixed(2)}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 bg-gray-800 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={isUpdating}
                            className="p-1.5 hover:bg-gray-700 transition disabled:opacity-50 rounded-l-lg"
                            aria-label="Decrease quantity"
                          >
                            <FaMinus size={12} />
                          </button>
                          <span className="w-8 text-center text-sm text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={isUpdating}
                            className="p-1.5 hover:bg-gray-700 transition disabled:opacity-50 rounded-r-lg"
                            aria-label="Increase quantity"
                          >
                            <FaPlus size={12} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={isUpdating}
                          className="p-2 text-gray-400 hover:text-red-500 transition disabled:opacity-50"
                          aria-label="Remove item"
                        >
                          <FaTrashAlt size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="border-t border-gray-800 p-4 space-y-3">
                <div className="flex justify-between text-white">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl text-center transition shadow-lg shadow-orange-500/20"
                >
                  Checkout → ${subtotal.toFixed(2)}
                </Link>
                <button
                  onClick={onClose}
                  className="w-full text-center text-gray-400 hover:text-white text-sm transition"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};