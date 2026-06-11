"use client";

import Link from "next/link";

export const AuthButtons = () => {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="text-white hover:text-orange-400 transition"
      >
        Login
      </Link>

      <Link
        href="/register"
        className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition"
      >
        Create Account
      </Link>
    </div>
  );
};