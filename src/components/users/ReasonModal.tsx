"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { useState } from "react";

interface ReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export default function ReasonModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
}: ReasonModalProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (reason.trim() === "") return;
    onConfirm(reason.trim());
    setReason("");
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
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <FaTimes size={20} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-gray-300 mb-4">{message}</p>
              <label className="block text-white text-sm font-medium mb-2">Reason *</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter the reason for this action..."
                disabled={isLoading}
              />
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-700">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                disabled={reason.trim() === "" || isLoading}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50"
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