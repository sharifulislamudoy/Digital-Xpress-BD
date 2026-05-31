"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaGoogle,
  FaFacebook,
  FaArrowLeft,
  FaPhoneAlt,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

// ===== Zod Schemas =====
const emailSchema = z
  .object({
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[0-9]{10,15}$/, "Enter a valid phone number (10-15 digits)"),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type PhoneFormValues = z.infer<typeof phoneSchema>;

// Animated Background Component
const AnimatedBackground = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden -z-10">
      {/* Base dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />

      {/* Animated orange gradient orbs */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full bg-orange-600/20 blur-3xl"
        animate={{
          x: mousePosition.x * 0.03,
          y: mousePosition.y * 0.03,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 100 }}
        style={{ left: "10%", top: "20%" }}
      />
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full bg-orange-500/15 blur-3xl"
        animate={{
          x: mousePosition.x * 0.05,
          y: mousePosition.y * 0.05,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 100 }}
        style={{ right: "5%", bottom: "10%" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full bg-orange-400/10 blur-3xl"
        animate={{
          x: mousePosition.x * -0.02,
          y: mousePosition.y * -0.02,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 100 }}
        style={{ left: "30%", bottom: "20%" }}
      />

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-orange-400/60 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: 0.3 + Math.random() * 0.5,
          }}
          animate={{
            y: [null, Math.random() * window.innerHeight],
            x: [null, Math.random() * window.innerWidth],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 10 + Math.random() * 15,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear",
          }}
          style={{
            width: 2 + Math.random() * 4,
            height: 2 + Math.random() * 4,
          }}
        />
      ))}

      {/* Pulsing rings */}
      <motion.div
        className="absolute left-1/4 top-1/3 w-64 h-64 rounded-full border border-orange-500/30"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute right-1/4 bottom-1/3 w-96 h-96 rounded-full border border-orange-500/20"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.05, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

export const RegisterForm = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"phone" | "email">("email");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // Email form
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
    reset: resetEmail,
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  // Phone form
  const {
    register: registerPhone,
    handleSubmit: handlePhoneSubmit,
    formState: { errors: phoneErrors },
    reset: resetPhone,
  } = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phoneNumber: "" },
  });

  const handleTabChange = (tab: "phone" | "email") => {
    setActiveTab(tab);
    setServerError("");
    resetEmail();
    resetPhone();
  };

  const onEmailRegister = async (data: EmailFormValues) => {
    setIsLoading(true);
    setServerError("");
    // Simulate API call
    setTimeout(() => {
      console.log("Email Registration:", data);
      alert("✅ Account created successfully! (Demo)");
      setIsLoading(false);
      router.push("/");
    }, 1000);
  };

  const onPhoneRegister = async (data: PhoneFormValues) => {
    setIsLoading(true);
    setServerError("");
    setTimeout(() => {
      console.log("Phone Registration:", data);
      alert("📱 Verification code sent (Demo)");
      setIsLoading(false);
    }, 1000);
  };

  const handleGoogleAuth = () => {
    setIsLoading(true);
    setTimeout(() => {
      alert("🔐 Google sign up (Demo)");
      setIsLoading(false);
      router.push("/");
    }, 800);
  };

  const handleFacebookAuth = () => {
    setIsLoading(true);
    setTimeout(() => {
      alert("🔐 Facebook sign up (Demo)");
      setIsLoading(false);
      router.push("/");
    }, 800);
  };

  return (
    <>
      <AnimatedBackground />
      <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
        {/* Back Button */}
        <Link
          href="/"
          className="fixed top-6 left-4 z-50 bg-gray-800/80 backdrop-blur-sm p-2 rounded-full hover:bg-gray-700 transition-all duration-300 group"
        >
          <FaArrowLeft className="text-white text-xl group-hover:-translate-x-1 transition-transform" />
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
          className="w-full max-w-md bg-gray-900/60 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden"
        >
          <div className="px-6 pt-8 pb-4 text-center">
            <motion.h1
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent"
            >
              Create Account
            </motion.h1>
            <p className="text-gray-300 mt-2 text-sm">
              Join Digital Xpress and start shopping
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-700/50 mx-6">
            <button
              onClick={() => handleTabChange("email")}
              className={`flex-1 py-3 text-center font-medium transition-all duration-300 relative ${
                activeTab === "email"
                  ? "text-orange-500"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FaEnvelope className="text-sm" />
                <span>Email</span>
              </div>
              {activeTab === "email" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => handleTabChange("phone")}
              className={`flex-1 py-3 text-center font-medium transition-all duration-300 relative ${
                activeTab === "phone"
                  ? "text-orange-500"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FaPhoneAlt className="text-sm" />
                <span>Phone</span>
              </div>
              {activeTab === "phone" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === "email" ? (
                <motion.form
                  key="email-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleEmailSubmit(onEmailRegister)}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-gray-200 text-sm font-medium mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      {...registerEmail("email")}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                      placeholder="you@example.com"
                      disabled={isLoading}
                    />
                    {emailErrors.email && (
                      <p className="text-red-400 text-xs mt-1">
                        {emailErrors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-200 text-sm font-medium mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        {...registerEmail("password")}
                        className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="••••••••"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {emailErrors.password && (
                      <p className="text-red-400 text-xs mt-1">
                        {emailErrors.password.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-200 text-sm font-medium mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        {...registerEmail("confirmPassword")}
                        className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="••••••••"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {emailErrors.confirmPassword && (
                      <p className="text-red-400 text-xs mt-1">
                        {emailErrors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  {serverError && (
                    <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded-lg text-center">
                      {serverError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-70"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Creating account...</span>
                      </div>
                    ) : (
                      "Sign Up with Email"
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="phone-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handlePhoneSubmit(onPhoneRegister)}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-gray-200 text-sm font-medium mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <FaPhoneAlt className="text-sm" />
                      </div>
                      <input
                        type="tel"
                        {...registerPhone("phoneNumber")}
                        className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="+880 1XXX XXXXXX"
                        disabled={isLoading}
                      />
                    </div>
                    {phoneErrors.phoneNumber && (
                      <p className="text-red-400 text-xs mt-1">
                        {phoneErrors.phoneNumber.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      We'll send a verification code (demo)
                    </p>
                  </div>

                  {serverError && (
                    <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded-lg text-center">
                      {serverError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-70"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending code...</span>
                      </div>
                    ) : (
                      "Sign Up with Phone"
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700/50" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-gray-900/80 px-3 py-1 text-gray-300 rounded-full backdrop-blur-sm">
                  OR SIGN UP WITH
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-gray-800/50 border border-gray-700 hover:bg-gray-700/70 text-white font-medium py-3 rounded-xl transition-all"
              >
                <FaGoogle className="text-red-400 text-xl" />
                <span>Continue with Google</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFacebookAuth}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-gray-800/50 border border-gray-700 hover:bg-gray-700/70 text-white font-medium py-3 rounded-xl transition-all"
              >
                <FaFacebook className="text-blue-500 text-xl" />
                <span>Continue with Facebook</span>
              </motion.button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-300 text-sm">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-orange-500 font-semibold hover:text-orange-400 transition-colors"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};