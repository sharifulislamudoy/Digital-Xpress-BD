"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  FaGoogle,
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

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

export const LoginForm = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onLogin = async (data: FormValues) => {
    setIsLoading(true);
    setServerError("");
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setServerError("Invalid email or password");
      } else if (result?.ok) {
        router.push("/");
        router.refresh();
      }
    } catch {
      setServerError("Something went wrong. Please try again.");
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
          <div className="px-6 pt-8 pb-6 text-center">
            <motion.h1
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent"
            >
              Welcome Back
            </motion.h1>
            <p className="text-gray-300 mt-2 text-sm">
              Sign in to your Digital Xpress account
            </p>
          </div>

          <div className="px-6 pb-6">
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit(onLogin)}
              className="space-y-5"
            >
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
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-gray-200 text-sm font-medium">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-orange-500 hover:text-orange-400 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
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
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
            </motion.form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700/50" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-gray-900/80 px-3 py-1 text-gray-300 rounded-full backdrop-blur-sm">
                  OR SIGN IN WITH
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

            <div className="mt-8 text-center">
              <p className="text-gray-300 text-sm">
                Don't have an account?{" "}
                <Link
                  href="/register"
                  className="text-orange-500 font-semibold hover:text-orange-400 transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};