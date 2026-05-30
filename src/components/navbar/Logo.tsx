// components/Logo.tsx
"use client";

import Link from "next/link";

interface LogoProps {
  imageSrc: string;
  className?: string;
}

export const Logo = ({ imageSrc, className = "" }: LogoProps) => (
  <Link href="/" className={`flex items-center ${className}`}>
    <img src={imageSrc} className="h-10 w-auto" alt="Logo" />
    <span className="text-white text-xl -ml-2">
      igital<i className="text-orange-500 font-italic">Xpress</i>
    </span>
  </Link>
);