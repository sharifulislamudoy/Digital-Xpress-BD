"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaPhoneAlt, FaEnvelope } from "react-icons/fa";

interface BannedErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  identifier: string;
  contactEmail: string;
  contactPhone: string;
}

export default function BannedErrorModal({
  isOpen,
  onClose,
  identifier,
  contactEmail,
  contactPhone,
}: BannedErrorModalProps) {
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
            className="bg-gray-900 rounded-xl max-w-md w-full border border-red-600 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 border-b border-red-600">
              <h2 className="text-xl font-bold text-red-500">Account Banned</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <FaTimes size={20} />
              </button>
            </div>
            <div className="p-5 text-white">
              <p className="mb-3">
                The identifier <span className="font-mono text-orange-400">{identifier}</span> is banned from our platform.
              </p>
              <p className="mb-4">Please use a different email or phone number, or contact support.</p>
              <div className="space-y-2 bg-gray-800 p-3 rounded-lg">
                <p className="text-sm text-gray-300">Contact us:</p>
                <a
                  href={`tel:${contactPhone}`}
                  className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition"
                >
                  <FaPhoneAlt size={14} /> {contactPhone}
                </a>
                <a
                  href={`mailto:${contactEmail}`}
                  className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition"
                >
                  <FaEnvelope size={14} /> {contactEmail}
                </a>
              </div>
            </div>
            <div className="p-5 border-t border-gray-800 flex justify-end">
              <button
                onClick={onClose}
                className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded-lg transition"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}