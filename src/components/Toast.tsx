"use client";

import { Toaster, toast as hotToast } from "react-hot-toast";

// Re‑export the toast function so you can import from here
export const useToast = () => hotToast;

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      containerStyle={{ margin: "8px" }}
      toastOptions={{
        duration: 4000,
        // ── Default styling for all toasts ──
        style: {
          background: "#0a0a0a",
          color: "#f1f5f9",
          border: "1px solid #27272a",
          borderRadius: "14px",
          padding: "14px 20px",
          fontSize: "14px",
          fontWeight: 500,
          boxShadow:
            "0 10px 25px -5px rgba(0,0,0,0.7), 0 0 0 1px rgba(249,115,22,0.1)",
          backdropFilter: "blur(12px)",
          lineHeight: "1.4",
        },

        // ── Success toasts ──
        success: {
          style: {
            background: "linear-gradient(145deg, #0a0a0a 0%, #0f0f0f 100%)",
            border: "1px solid #f97316",
            boxShadow:
              "0 10px 25px -5px rgba(249,115,22,0.25), 0 0 0 1px rgba(249,115,22,0.4)",
          },
          iconTheme: {
            primary: "#f97316",
            secondary: "#0a0a0a",
          },
        },

        // ── Error toasts ──
        error: {
          style: {
            background: "linear-gradient(145deg, #140a0a 0%, #0a0a0a 100%)",
            border: "1px solid #ef4444",
            boxShadow:
              "0 10px 25px -5px rgba(239,68,68,0.25), 0 0 0 1px rgba(239,68,68,0.4)",
          },
          iconTheme: {
            primary: "#ef4444",
            secondary: "#0a0a0a",
          },
        },

        // ── Loading toasts ──
        loading: {
          style: {
            background: "#1a1a1a",
            border: "1px solid #374151",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.6)",
          },
          iconTheme: {
            primary: "#f97316",
            secondary: "#1a1a1a",
          },
        },
      }}
    />
  );
}