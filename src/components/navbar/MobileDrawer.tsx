"use client";

import Link from "next/link";
import { ReactNode, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaBolt,
  FaClock,
  FaFire,
  FaHeadphones,
  FaLaptop,
  FaMobileAlt,
  FaQuestionCircle,
  FaShieldAlt,
  FaStar,
  FaThLarge,
  FaTimes,
  FaTruck,
  FaUndo,
  FaMapMarkerAlt,
  FaPhoneAlt,
} from "react-icons/fa";

import { Logo } from "./Logo";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logoSrc: string;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

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

const DrawerSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => {
  return (
    <div className="mb-7">
      <h3 className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-3">
        {title}
      </h3>

      <div className="space-y-1.5">{children}</div>
    </div>
  );
};

const DrawerLink = ({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-200 hover:bg-gray-900 hover:text-orange-400 transition"
    >
      <span className="text-orange-500 text-base">{icon}</span>
      <span>{label}</span>
    </Link>
  );
};

export const MobileDrawer = ({
  isOpen,
  onClose,
  logoSrc,
  user,
}: MobileDrawerProps) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) onClose();
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/65 z-[160]"
            onClick={onClose}
          />

          <motion.aside
            ref={drawerRef}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className="fixed top-0 left-0 bottom-0 w-[86%] max-w-sm bg-black shadow-2xl z-[170] flex flex-col border-r border-gray-900"
          >
            <div className="p-5 border-b border-gray-900 flex justify-between items-center">
              <Logo imageSrc={logoSrc} />

              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition"
                aria-label="Close menu"
              >
                <FaTimes size={22} />
              </button>
            </div>

            <div className="px-5 pt-5">
              <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
                <p className="text-white font-semibold">
                  {user?.name ? `Hi, ${user.name}` : "Welcome to Digital Xpress"}
                </p>

                <p className="text-gray-400 text-sm mt-1">
                  Find your needed tech product faster.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 pb-24">
              <DrawerSection title="Shop by category">
                {categoryItems.map((item) => (
                  <DrawerLink
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.name}
                    onClick={onClose}
                  />
                ))}
              </DrawerSection>

              <DrawerSection title="Explore">
                {exploreItems.map((item) => (
                  <DrawerLink
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.name}
                    onClick={onClose}
                  />
                ))}
              </DrawerSection>

              <DrawerSection title="Support & policies">
                {supportItems.map((item) => (
                  <DrawerLink
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.name}
                    onClick={onClose}
                  />
                ))}
              </DrawerSection>

              <div className="rounded-2xl bg-orange-500/10 border border-orange-500/20 p-4">
                <p className="text-orange-400 font-semibold">Need help?</p>

                <p className="text-gray-300 text-sm mt-1">
                  Call or message us for product support.
                </p>

                <a
                  href="tel:+8801995322033"
                  className="mt-3 inline-flex items-center gap-2 text-white text-sm hover:text-orange-400 transition"
                >
                  <FaPhoneAlt className="text-orange-500" />
                  +8801995322033
                </a>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};