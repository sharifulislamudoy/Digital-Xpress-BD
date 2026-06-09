"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "danger" | "warning" | "success";
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "danger",
  isLoading = false,
}: ConfirmationModalProps) {
  const confirmColors = {
    danger: "bg-red-600 hover:bg-red-700",
    warning: "bg-orange-600 hover:bg-orange-700",
    success: "bg-green-600 hover:bg-green-700",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-900 rounded-xl max-w-md w-full border border-gray-700 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="text-gray-400 hover:text-white transition"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="p-5 text-gray-300">{message}</div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-700">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`px-4 py-2 rounded-lg text-white transition ${confirmColors[confirmVariant]} disabled:opacity-50`}
              >
                {isLoading ? "Processing..." : confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}