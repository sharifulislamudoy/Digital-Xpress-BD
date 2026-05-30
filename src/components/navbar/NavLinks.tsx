"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinksProps {
  onLinkClick?: () => void; // optional callback for mobile menu close
  className?: string;
}

const navItems = [
  { name: "Home", href: "/" },
  { name: "Products", href: "/products" },
  { name: "About Us", href: "/about" },
  { name: "Blog", href: "/blog" },
  { name: "Contact", href: "/contact" },
];

export const NavLinks = ({ onLinkClick, className = "" }: NavLinksProps) => {
  const pathname = usePathname();

  return (
    <ul className={`flex flex-col lg:flex-row lg:space-x-6 space-y-3 lg:space-y-0 ${className}`}>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onLinkClick}
              className={`block transition-colors ${
                isActive
                  ? "text-orange-500 font-semibold"
                  : "text-white hover:text-orange-400"
              }`}
            >
              {item.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};