"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ReactNode,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  FaTruck,
  FaUndo,
  FaMapMarkerAlt,
  FaInfoCircle,
  FaBlog,
  FaTags,
} from "react-icons/fa";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

type ApiCategory = {
  id: string;
  name: string;
  slug: string;
  iconSvg?: string | null;
  sortOrder?: number | null;
  isPublished?: boolean | null;
};

interface DropdownItem {
  name: string;
  href: string;
  icon?: ReactNode;
  iconSvg?: string | null;
}

interface DesktopDropdownProps {
  title: string;
  items: DropdownItem[];
  isActive?: boolean;
}

const fallbackCategoryItems: DropdownItem[] = [
  {
    name: "Mobile Phones",
    href: "/products/mobile-phones",
    icon: <FaMobileAlt />,
  },
  {
    name: "Laptops",
    href: "/products/laptops",
    icon: <FaLaptop />,
  },
  {
    name: "Accessories",
    href: "/products/accessories",
    icon: <FaHeadphones />,
  },
  {
    name: "Headphones",
    href: "/products/headphones",
    icon: <FaHeadphones />,
  },
  {
    name: "Smart Watches",
    href: "/products/smart-watches",
    icon: <FaClock />,
  },
];

const exploreItems: DropdownItem[] = [
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

const supportItems: DropdownItem[] = [
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

const companyItems: DropdownItem[] = [
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

function isSafeInlineSvg(svg?: string | null) {
  if (!svg) return false;

  const cleanSvg = svg.trim();
  const lowerSvg = cleanSvg.toLowerCase();

  return (
    cleanSvg.startsWith("<svg") &&
    !lowerSvg.includes("<script") &&
    !/\son[a-z]+\s*=/.test(lowerSvg)
  );
}

function DropdownIcon({ item }: { item: DropdownItem }) {
  if (isSafeInlineSvg(item.iconSvg)) {
    return (
      <span
        className="inline-flex h-5 w-5 items-center justify-center text-orange-500 [&_svg]:h-5 [&_svg]:w-5 [&_svg]:stroke-current"
        dangerouslySetInnerHTML={{ __html: item.iconSvg!.trim() }}
      />
    );
  }

  return (
    <span className="text-base text-orange-500">{item.icon || <FaTags />}</span>
  );
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

  const currentSearch = searchParams.toString();
  const currentFullPath = currentSearch
    ? `${pathname}?${currentSearch}`
    : pathname;

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
        type="button"
        className={`flex items-center gap-1 transition-colors ${
          isActive
            ? "font-semibold text-orange-500"
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
            className="absolute left-0 z-50 mt-3 w-60 overflow-hidden rounded-xl border border-gray-800 bg-black shadow-xl"
          >
            <ul className="py-2">
              {items.map((item) => {
                const isItemActive =
                  currentFullPath === item.href || pathname === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        isItemActive
                          ? "bg-gray-900 text-orange-500"
                          : "text-gray-300 hover:bg-gray-900 hover:text-orange-400"
                      }`}
                    >
                      <span className="grid h-6 w-6 place-items-center text-orange-500">
                        <DropdownIcon item={item} />
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

const NavLinksContent = () => {
  const pathname = usePathname();
  const [categories, setCategories] = useState<ApiCategory[]>([]);

  useEffect(() => {
    let ignore = false;

    async function loadCategories() {
      try {
        if (!API_BASE) return;

        const response = await fetch(`${API_BASE}/api/v1/products/meta`, {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok || !data.success) return;

        if (!ignore) {
          setCategories(Array.isArray(data.categories) ? data.categories : []);
        }
      } catch {
        if (!ignore) setCategories([]);
      }
    }

    loadCategories();

    return () => {
      ignore = true;
    };
  }, []);

  const categoryItems = useMemo<DropdownItem[]>(() => {
    const publishedCategories = categories
      .filter((category) => category.isPublished !== false)
      .sort((a, b) => {
        const sortA = Number(a.sortOrder ?? 0);
        const sortB = Number(b.sortOrder ?? 0);
        if (sortA !== sortB) return sortA - sortB;
        return a.name.localeCompare(b.name);
      })
      .map((category) => ({
        name: category.name,
        href: `/products/${category.slug}`,
        iconSvg: category.iconSvg,
      }));

    return publishedCategories.length > 0
      ? publishedCategories
      : fallbackCategoryItems;
  }, [categories]);

  const isHomeActive = pathname === "/";
  const isProductsActive = pathname === "/products";
  const isCategoriesActive = pathname.startsWith("/products/");
  const isSupportActive = supportItems.some((item) => pathname === item.href);
  const isCompanyActive = companyItems.some((item) => pathname === item.href);

  return (
    <ul className="flex items-center gap-7">
      <li>
        <Link
          href="/"
          className={`transition-colors ${
            isHomeActive
              ? "font-semibold text-orange-500"
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
              ? "font-semibold text-orange-500"
              : "text-white hover:text-orange-400"
          }`}
        >
          Products
        </Link>
      </li>

      <DesktopDropdown
        title="Categories"
        items={categoryItems}
        isActive={isCategoriesActive}
      />

      <DesktopDropdown title="Explore" items={exploreItems} />

      <DesktopDropdown
        title="Support"
        items={supportItems}
        isActive={isSupportActive}
      />

      <DesktopDropdown
        title="Company"
        items={companyItems}
        isActive={isCompanyActive}
      />
    </ul>
  );
};

export const NavLinks = () => {
  return (
    <Suspense fallback={null}>
      <NavLinksContent />
    </Suspense>
  );
};
