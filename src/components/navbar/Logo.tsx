"use client";

import Link from "next/link";

interface LogoProps {
  imageSrc: string;
  className?: string;
  badgeText?: string;
}

export const Logo = ({
  imageSrc,
  className = "",
  badgeText = "BD",
}: LogoProps) => {
  return (
    <Link href="/" className={`flex items-center ${className}`}>
      <img src={imageSrc} className="h-10 w-auto" alt="Digital Xpress Logo" />

      <span className="text-white text-xl -ml-2 whitespace-nowrap">
        igital
        <i className="text-orange-500 italic">
          <span className="text-[26px]">X</span>press
        </i>
      </span>

      <span className="ml-1 inline-flex items-center rounded-full bg-gray-900 px-1.5 py-1 text-[8px] text-white leading-none border border-gray-700">
        {badgeText}
      </span>
    </Link>
  );
};