// components/Logo.tsx
"use client";

import Link from "next/link";

interface LogoProps {
  imageSrc: string;
  className?: string;
  badgeText?: string; // নতুন prop, ডিফল্ট "BD"
}

export const Logo = ({
  imageSrc,
  className = "",
  badgeText = "BD",
}: LogoProps) => (
  <Link href="/" className={`flex items-center ${className}`}>
    <img src={imageSrc} className="h-10 w-auto" alt="Logo" />
    <span className="text-white text-xl -ml-2">
      igital<i className="text-orange-500 font-italic"><span className="text-[26px]">X</span>press</i>
    </span>
    {/* ছোট BD ব্যাজ */}
    <span className="inline-flex items-center rounded-full bg-gray-900 px-1 py-1 text-[8px] text-white leading-none">
      {badgeText}
    </span>
  </Link>
);