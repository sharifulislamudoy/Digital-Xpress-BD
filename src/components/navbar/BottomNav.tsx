"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaHome,
  FaSearch,
  FaShoppingCart,
  FaThLarge,
  FaUser,
} from "react-icons/fa";

interface BottomNavProps {
  itemCount?: number;
  onSearchClick: () => void;
  onAccountClick: () => void;
}

export const BottomNav = ({
  itemCount = 0,
  onSearchClick,
  onAccountClick,
}: BottomNavProps) => {
  const pathname = usePathname();

  const linkClass = (active: boolean) =>
    `relative flex flex-col items-center justify-center gap-1 text-[11px] transition ${
      active ? "text-orange-500" : "text-gray-400 hover:text-orange-400"
    }`;

  return (
    <nav className="lg:hidden fixed left-0 right-0 bottom-0 z-[120] bg-black/95 backdrop-blur-xl border-t border-gray-800 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 h-16">
        <Link href="/" className={linkClass(pathname === "/")}>
          <FaHome size={20} />
          <span>Home</span>
        </Link>

        <Link
          href="/products"
          className={linkClass(pathname.startsWith("/products"))}
        >
          <FaThLarge size={20} />
          <span>Products</span>
        </Link>

        <button onClick={onSearchClick} className={linkClass(false)}>
          <FaSearch size={20} />
          <span>Search</span>
        </button>

        <Link
          href="/cart"
          className={linkClass(pathname.startsWith("/cart"))}
        >
          <span className="relative">
            <FaShoppingCart size={21} />

            {itemCount > 0 && (
              <span className="absolute -top-2 -right-3 min-w-[17px] h-[17px] px-1 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center border border-black">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </span>

          <span>Cart</span>
        </Link>

        <button onClick={onAccountClick} className={linkClass(false)}>
          <FaUser size={20} />
          <span>Account</span>
        </button>
      </div>
    </nav>
  );
};