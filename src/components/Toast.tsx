"use client";

import { Toaster, toast as hotToast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

// Custom hook to use toast with animation
export const useToast = () => {
  return hotToast;
};

// Toast container with custom styling
export const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#141414",
          color: "#fff",
          border: "1px solid #f97316",
          borderRadius: "12px",
          padding: "12px 20px",
          fontSize: "14px",
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
        },
        success: {
          iconTheme: {
            primary: "#f97316",
            secondary: "#fff",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#fff",
          },
        },
        loading: {
          style: {
            background: "#1f2937",
          },
        },
      }}
    />
  );
};