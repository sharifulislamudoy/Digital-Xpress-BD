"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { FaGoogle, FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";
import BannedErrorModal from "../users/BannedErrorModal";

const schema = z.object({
  identifier: z.string().min(1, "Email or phone is required"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

const AnimatedBackground = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) =>
      setMousePosition({ x: event.clientX, y: event.clientY });

    window.addEventListener("mousemove", handleMouseMove);

    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />

      <motion.div
        className="absolute h-[500px] w-[500px] rounded-full bg-orange-600/20 blur-3xl"
        animate={{
          x: mousePosition.x * 0.03,
          y: mousePosition.y * 0.03,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 100 }}
        style={{ left: "10%", top: "20%" }}
      />

      <motion.div
        className="absolute h-[600px] w-[600px] rounded-full bg-orange-500/15 blur-3xl"
        animate={{
          x: mousePosition.x * 0.05,
          y: mousePosition.y * 0.05,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 100 }}
        style={{ right: "5%", bottom: "10%" }}
      />

      <motion.div
        className="absolute left-1/4 top-1/3 h-64 w-64 rounded-full border border-orange-500/30"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute bottom-1/3 right-1/4 h-96 w-96 rounded-full border border-orange-500/20"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.05, 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
};

const LoginFormContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const [bannedModal, setBannedModal] = useState<{
    open: boolean;
    identifier: string;
    contactEmail: string;
    contactPhone: string;
  }>({
    open: false,
    identifier: "",
    contactEmail: "",
    contactPhone: "",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const error = searchParams.get("error");
    const email = searchParams.get("email");

    if (error === "banned" && email) {
      setBannedModal({
        open: true,
        identifier: email,
        contactEmail:
          process.env.NEXT_PUBLIC_CONTACT_EMAIL ||
          "info@digital-xpress-bd.com",
        contactPhone:
          process.env.NEXT_PUBLIC_CONTACT_PHONE || "+8801995322033",
      });
    }
  }, [searchParams]);

  const onLogin = async (data: FormValues) => {
    setIsLoading(true);
    setServerError("");

    try {
      const result = await signIn("credentials", {
        identifier: data.identifier,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        try {
          const parsed = JSON.parse(result.error);

          if (parsed.message === "BANNED_ACCOUNT") {
            setBannedModal({
              open: true,
              identifier: parsed.bannedIdentifier,
              contactEmail: parsed.contactEmail,
              contactPhone: parsed.contactPhone,
            });

            setIsLoading(false);
            return;
          }
        } catch {
          // fallback for normal auth error
        }

        setServerError("Invalid credentials");
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
    setIsLoading(false);
  };

  return (
    <>
      <AnimatedBackground />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <Link
          href="/"
          className="group fixed left-4 top-6 z-50 rounded-full bg-gray-800/80 p-2 backdrop-blur-sm transition-all duration-300 hover:bg-gray-700"
        >
          <FaArrowLeft className="text-xl text-white transition-transform group-hover:-translate-x-1" />
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
          className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-900/60 shadow-2xl backdrop-blur-md"
        >
          <div className="px-6 pb-6 pt-8 text-center">
            <motion.h1
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-3xl font-bold text-transparent"
            >
              Welcome Back
            </motion.h1>

            <p className="mt-2 text-sm text-gray-300">
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
                <label className="mb-2 block text-sm font-medium text-gray-200">
                  Email or Phone Number
                </label>

                <input
                  type="text"
                  {...register("identifier")}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="you@example.com or +1234567890"
                  disabled={isLoading}
                />

                {errors.identifier && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.identifier.message}
                  </p>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-200">
                    Password
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-xs text-orange-500 transition-colors hover:text-orange-400"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className="w-full rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                {errors.password && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {serverError && (
                <p className="rounded-lg bg-red-500/10 p-2 text-center text-sm text-red-400">
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-3 font-semibold text-white transition-all hover:scale-[1.02] hover:from-orange-600 hover:to-orange-700 active:scale-95 disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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
                <span className="rounded-full bg-gray-900/80 px-3 py-1 text-gray-300 backdrop-blur-sm">
                  OR SIGN IN WITH
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-700 bg-gray-800/50 py-3 font-medium text-white transition-all hover:bg-gray-700/70"
              >
                <FaGoogle className="text-xl text-red-400" />
                <span>Continue with Google</span>
              </motion.button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-300">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-orange-500 transition-colors hover:text-orange-400"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <BannedErrorModal
        isOpen={bannedModal.open}
        onClose={() =>
          setBannedModal({
            open: false,
            identifier: "",
            contactEmail: "",
            contactPhone: "",
          })
        }
        identifier={bannedModal.identifier}
        contactEmail={bannedModal.contactEmail}
        contactPhone={bannedModal.contactPhone}
      />
    </>
  );
};

export const LoginForm = () => {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black text-white">
          Loading...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
};