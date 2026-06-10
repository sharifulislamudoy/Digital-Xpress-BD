// app/(dashboard)/moderator/layout.tsx
"use client";

import { useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBox,
  FaShoppingCart,
  FaHome,
  FaSignOutAlt,
  FaBars,
  FaTachometerAlt,
  FaImages,
  FaUsers,
} from "react-icons/fa";
import { signOut } from "next-auth/react";

// ============================================================================
// Type for extended user (if you haven't added next-auth types yet)
// To fix TS permanently, create types/next-auth.d.ts as shown in admin layout.
// ============================================================================

// ============================================================================
// Sidebar Content for Moderator (shared between desktop and mobile)
// ============================================================================
const SidebarContent = ({
  onLinkClick,
  showLogoutButton = true,
}: {
  onLinkClick?: () => void;
  showLogoutButton?: boolean;
}) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  // Moderator can only see Dashboard, Orders, Products (no Users)
  const navItems = [
    { name: "Dashboard", href: "/moderator", icon: FaTachometerAlt },
    { name: "Orders", href: "/moderator/orders", icon: FaShoppingCart },
    { name: "Products", href: "/moderator/products", icon: FaBox },
    { name: "Users", href: "/moderator/users", icon: FaUsers },
    { name: "Banners", href: "/moderator/banners", icon: FaImages },
  ];

  const handleLinkClick = () => {
    if (onLinkClick) onLinkClick();
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-r border-gray-800">
      {/* Logo / Home Link - redirects to homepage */}
      <Link
        href="/"
        onClick={handleLinkClick}
        className="flex items-center gap-3 p-5 border-b border-gray-800 hover:bg-gray-900 transition group"
      >
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
          <FaHome className="text-white text-sm" />
        </div>
        <span className="text-white font-bold text-xl group-hover:text-orange-500 transition">
          Moderator Panel
        </span>
      </Link>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-orange-500/20 text-orange-500 border-r-2 border-orange-500"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      {showLogoutButton && user && (
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500 flex items-center justify-center text-orange-500 font-bold">
              {user.name?.charAt(0).toUpperCase() || "M"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user.name}
              </p>
              <p className="text-gray-400 text-xs truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full bg-red-600/20 text-red-400 py-2.5 rounded-lg hover:bg-red-600 hover:text-white transition"
          >
            <FaSignOutAlt size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Mobile Sidebar Drawer (same as admin layout)
// ============================================================================
const MobileSidebarDrawer = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[200]"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[280px] z-[210] shadow-2xl"
          >
            <SidebarContent onLinkClick={onClose} showLogoutButton={true} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// Moderator Layout Component with Role Protection
// ============================================================================
export default function ModeratorLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Protect moderator route: only users with role "moderator" (or "admin"? optional)
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.replace("/login");
    } else {
      const userRole = (session.user as any)?.role;
      // Allow both moderator and admin to access? Usually admin also has access.
      // For strict moderator-only, check === "moderator". If you want admin as well:
      if (userRole !== "moderator" && userRole !== "admin") {
        router.replace("/");
      }
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) return null;
  const userRole = (session.user as any)?.role;
  if (userRole !== "moderator" && userRole !== "admin") return null;

  return (
    <div className="min-h-screen bg-black">
      {/* Mobile Header with Hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="text-white p-2 hover:bg-gray-800 rounded-lg transition"
        >
          <FaBars size={22} />
        </button>
        <Link href="/" className="text-white font-bold text-xl">
          Moderator
        </Link>
        <div className="w-10" />
      </div>

      {/* Desktop Layout: Sidebar (1/5) + Content (4/5) */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_4fr] min-h-screen">
        <div className="bg-[#0a0a0a] border-r border-gray-800 sticky top-0 h-screen overflow-y-auto">
          <SidebarContent showLogoutButton={true} />
        </div>
        <main className="bg-black overflow-y-auto">
          <div className="p-6 md:p-8">{children}</div>
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden pt-16">
        <main className="p-4">{children}</main>
      </div>

      <MobileSidebarDrawer
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
    </div>
  );
}