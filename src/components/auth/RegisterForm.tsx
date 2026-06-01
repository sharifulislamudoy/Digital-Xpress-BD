"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaGoogle,
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    mobile: z
      .string()
      .min(1, "Mobile number is required")
      .regex(/^\+?[1-9]\d{1,14}$/, "Enter a valid mobile number (e.g. +1234567890)"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const AnimatedBackground = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) =>
      setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full bg-orange-600/20 blur-3xl"
        animate={{ x: mousePosition.x * 0.03, y: mousePosition.y * 0.03 }}
        transition={{ type: "spring", damping: 30, stiffness: 100 }}
        style={{ left: "10%", top: "20%" }}
      />
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full bg-orange-500/15 blur-3xl"
        animate={{ x: mousePosition.x * 0.05, y: mousePosition.y * 0.05 }}
        transition={{ type: "spring", damping: 30, stiffness: 100 }}
        style={{ right: "5%", bottom: "10%" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full bg-orange-400/10 blur-3xl"
        animate={{ x: mousePosition.x * -0.02, y: mousePosition.y * -0.02 }}
        transition={{ type: "spring", damping: 30, stiffness: 100 }}
        style={{ left: "30%", bottom: "20%" }}
      />
      <motion.div
        className="absolute left-1/4 top-1/3 w-64 h-64 rounded-full border border-orange-500/30"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-1/4 bottom-1/3 w-96 h-96 rounded-full border border-orange-500/20"
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.05, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
};

export const RegisterForm = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [formData, setFormData] = useState<RegisterFormValues | null>(null);
  const [otp, setOtp] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const onRegister = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setServerError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            mobile: data.mobile,
            password: data.password,
          }),
        }
      );
      const result = await res.json();
      if (!res.ok) {
        setServerError(result.message || "Registration failed");
        return;
      }
      // Move to OTP step
      setFormData(data);
      setStep("otp");
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!formData) return;
    setIsLoading(true);
    setServerError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, otp }),
        }
      );
      const result = await res.json();
      if (!res.ok) {
        setServerError(result.message || "Invalid OTP");
        return;
      }
      // OTP verified → sign in
      const signInResult = await signIn("credentials", {
        identifier: formData.email,
        password: formData.password,
        redirect: false,
      });
      if (signInResult?.ok) {
        router.push("/");
      } else {
        router.push("/login");
      }
    } catch {
      setServerError("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <>
      <AnimatedBackground />
      <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
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
              {step === "form"
                ? "Join Digital Xpress and start shopping"
                : "Enter the verification code sent to your email"}
            </p>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {step === "form" ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit(onRegister)}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-gray-200 text-sm font-medium mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      {...register("name")}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                      placeholder="John Doe"
                      disabled={isLoading}
                    />
                    {errors.name && (
                      <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-200 text-sm font-medium mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      {...register("email")}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                      placeholder="you@example.com"
                      disabled={isLoading}
                    />
                    {errors.email && (
                      <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-200 text-sm font-medium mb-2">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      {...register("mobile")}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                      placeholder="+1234567890"
                      disabled={isLoading}
                    />
                    {errors.mobile && (
                      <p className="text-red-400 text-xs mt-1">{errors.mobile.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-200 text-sm font-medium mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        {...register("password")}
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
                    {errors.password && (
                      <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-200 text-sm font-medium mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        {...register("confirmPassword")}
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
                    {errors.confirmPassword && (
                      <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>
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
                        <span>Sending OTP...</span>
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-gray-200 text-sm font-medium mb-2">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      maxLength={6}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-center tracking-widest"
                      placeholder="000000"
                      disabled={isLoading}
                    />
                    {serverError && (
                      <p className="text-red-400 text-xs mt-1">{serverError}</p>
                    )}
                  </div>

                  <button
                    onClick={verifyOtp}
                    disabled={otp.length !== 6 || isLoading}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-70"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      "Verify & Sign In"
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setStep("form");
                      setServerError("");
                      setOtp("");
                    }}
                    className="w-full text-gray-400 text-sm hover:text-white transition-colors"
                    disabled={isLoading}
                  >
                    ← Back to sign up
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* OAuth buttons – only show in form step */}
            {step === "form" && (
              <>
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
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 bg-gray-800/50 border border-gray-700 hover:bg-gray-700/70 text-white font-medium py-3 rounded-xl transition-all"
                  >
                    <FaGoogle className="text-red-400 text-xl" />
                    <span>Continue with Google</span>
                  </motion.button>
                </div>
              </>
            )}

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