"use client";

import { useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBox,
  FaUsers,
  FaShoppingCart,
  FaHome,
  FaSignOutAlt,
  FaBars,
  FaTachometerAlt,
  FaImages,
  FaWarehouse,
  FaChartLine,
  FaStar,
  FaTags,
  FaFolder,
} from "react-icons/fa";
import { signOut } from "next-auth/react";

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

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: FaTachometerAlt },
    { name: "Orders", href: "/admin/orders", icon: FaShoppingCart },
    { name: "Categories", href: "/admin/categories", icon: FaFolder },
    { name: "Products", href: "/admin/products", icon: FaBox },
    { name: "Inventory", href: "/admin/inventory", icon: FaWarehouse },
    {
      name: "Profit Report",
      href: "/admin/reports/profit-loss",
      icon: FaChartLine,
    },
    { name: "Users", href: "/admin/users", icon: FaUsers },
    { name: "Reviews", href: "/admin/reviews", icon: FaStar },
    { name: "Banners", href: "/admin/banners", icon: FaImages },
    { name: "Discounts", href: "/admin/discounts", icon: FaTags },
  ];

  const handleLinkClick = () => {
    if (onLinkClick) onLinkClick();
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="flex h-full flex-col border-r border-gray-800 bg-[#0a0a0a]">
      <Link
        href="/"
        onClick={handleLinkClick}
        className="group flex items-center gap-3 border-b border-gray-800 p-5 transition hover:bg-gray-900"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
          <FaHome className="text-sm text-white" />
        </div>
        <span className="text-xl font-bold text-white transition group-hover:text-orange-500">
          Admin Panel
        </span>
      </Link>

      <nav className="flex-1 space-y-1 px-3 py-6">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 ${
                isActive
                  ? "border-r-2 border-orange-500 bg-orange-500/20 text-orange-500"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {showLogoutButton && user && (
        <div className="border-t border-gray-800 p-4">
          <div className="mb-4 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-500 bg-orange-500/20 font-bold text-orange-500">
              {user.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {user.name}
              </p>
              <p className="truncate text-xs text-gray-400">{user.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600/20 py-2.5 text-red-400 transition hover:bg-red-600 hover:text-white"
          >
            <FaSignOutAlt size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

const MobileSidebarDrawer = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";

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
            className="fixed inset-0 z-[200] bg-black/70"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 top-0 z-[210] w-[280px] shadow-2xl"
          >
            <SidebarContent onLinkClick={onClose} showLogoutButton={true} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.replace("/login");
    } else if (session.user?.role !== "admin") {
      router.replace("/");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!session || session.user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-gray-800 bg-[#0a0a0a] px-4 py-3 lg:hidden">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="rounded-lg p-2 text-white transition hover:bg-gray-800"
        >
          <FaBars size={22} />
        </button>
        <Link href="/" className="text-xl font-bold text-white">
          Admin
        </Link>
        <div className="w-10" />
      </div>

      <div className="hidden min-h-screen lg:grid lg:grid-cols-[1fr_4fr]">
        <div className="sticky top-0 h-screen overflow-y-auto border-r border-gray-800 bg-[#0a0a0a]">
          <SidebarContent showLogoutButton={true} />
        </div>

        <main className="overflow-y-auto bg-black">
          <div className="p-6 md:p-8">{children}</div>
        </main>
      </div>

      <div className="pt-16 lg:hidden">
        <main className="p-4">{children}</main>
      </div>

      <MobileSidebarDrawer
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
    </div>
  );
}