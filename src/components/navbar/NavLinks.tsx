// components/navbar/NavLinks.tsx
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ReactNode, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaBolt,
  FaChevronDown,
  FaClock,
  FaFire,
  FaHeadphones,
  FaLaptop,
  FaMobileAlt,
  FaQuestionCircle,
  FaShieldAlt,
  FaStar,
  FaThLarge,
  FaTruck,
  FaUndo,
  FaMapMarkerAlt,
  FaInfoCircle,
  FaBlog,
} from "react-icons/fa";

const mainNavItems = [
  { name: "Home", href: "/" },
  { name: "Products", href: "/products" },
];

const categoryItems = [
  {
    name: "Mobile Phones",
    href: "/products?category=mobile-phones",
    icon: <FaMobileAlt />,
  },
  {
    name: "Laptops",
    href: "/products?category=laptops",
    icon: <FaLaptop />,
  },
  {
    name: "Accessories",
    href: "/products?category=accessories",
    icon: <FaHeadphones />,
  },
  {
    name: "Headphones",
    href: "/products?category=headphones",
    icon: <FaHeadphones />,
  },
  {
    name: "Smart Watches",
    href: "/products?category=smart-watches",
    icon: <FaClock />,
  },
];

const exploreItems = [
  {
    name: "Hot Deals",
    href: "/products?tag=deals",
    icon: <FaFire />,
  },
  {
    name: "New Arrivals",
    href: "/products?sort=newest",
    icon: <FaBolt />,
  },
  {
    name: "Best Sellers",
    href: "/products?sort=popular",
    icon: <FaStar />,
  },
];

const supportItems = [
  {
    name: "Contact Us",
    href: "/contact",
    icon: <FaMapMarkerAlt />,
  },
  {
    name: "FAQ / Help Center",
    href: "/faq",
    icon: <FaQuestionCircle />,
  },
  {
    name: "Shipping Policy",
    href: "/shipping-policy",
    icon: <FaTruck />,
  },
  {
    name: "Refund Policy",
    href: "/refund-policy",
    icon: <FaUndo />,
  },
  {
    name: "Terms & Conditions",
    href: "/terms",
    icon: <FaShieldAlt />,
  },
];

const companyItems = [
  {
    name: "About Us",
    href: "/about",
    icon: <FaInfoCircle />,
  },
  {
    name: "Blog",
    href: "/blog",
    icon: <FaBlog />,
  },
];

interface DropdownItem {
  name: string;
  href: string;
  icon: ReactNode;
}

interface DesktopDropdownProps {
  title: string;
  items: DropdownItem[];
  isActive?: boolean;
}

const DesktopDropdown = ({
  title,
  items,
  isActive = false,
}: DesktopDropdownProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build full current URL (pathname + search params)
  const currentFullPath =
    pathname +
    (searchParams.toString() ? `?${searchParams.toString()}` : "");

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  return (
    <li
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={`flex items-center gap-1 transition-colors  ${
          isActive
            ? "text-orange-500 font-semibold"
            : "text-white hover:text-orange-400"
        }`}
      >
        <span>{title}</span>
        <FaChevronDown
          className={`text-xs transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 mt-3 w-50 bg-black border border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <ul className="py-2 ">
              {items.map((item) => {
                // Exact match including query parameters
                const isItemActive = currentFullPath === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        isItemActive
                          ? "text-orange-500 bg-gray-900"
                          : "text-gray-300 hover:text-orange-400 hover:bg-gray-900"
                      }`}
                    >
                      <span className="text-orange-500 text-base">
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
};

export const NavLinks = () => {
  const pathname = usePathname();
  const isHomeActive = pathname === "/";
  const isProductsActive = pathname.startsWith("/products");
  const isSupportActive = supportItems.some((item) => pathname === item.href);
  const isCompanyActive = companyItems.some((item) => pathname === item.href);

  return (
    <ul className="flex items-center gap-7">
      <li>
        <Link
          href="/"
          className={`transition-colors ${
            isHomeActive
              ? "text-orange-500 font-semibold"
              : "text-white hover:text-orange-400"
          }`}
        >
          Home
        </Link>
      </li>
      <li>
        <Link
          href="/products"
          className={`transition-colors ${
            isProductsActive
              ? "text-orange-500 font-semibold"
              : "text-white hover:text-orange-400"
          }`}
        >
          Products
        </Link>
      </li>
      <DesktopDropdown title="Categories" items={categoryItems} isActive={false} />
      <DesktopDropdown title="Explore" items={exploreItems} isActive={false} />
      <DesktopDropdown title="Support" items={supportItems} isActive={isSupportActive} />
      <DesktopDropdown title="Company" items={companyItems} isActive={isCompanyActive} />
    </ul>
  );
};