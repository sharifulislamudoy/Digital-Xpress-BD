// components/AuthButtons.tsx
"use client";

import Link from "next/link";

export const AuthButtons = () => (
  <div className="flex items-center space-x-4">
    <Link
      href="/register"
      className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition"
    >
      Create Account
    </Link>
  </div>
);