"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import type { Product } from "@/types/product";
import {
  canProductBeAddedToCart,
  getDiscountPercentage,
  getStockStatusLabel,
} from "@/types/product";
import { formatPrice } from "@/lib/formatPrice";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
}

type StoredCartProduct = Product & {
  quantity: number;
  addedAt: string;
  updatedAt: string;
};

type StoredWishlistProduct = Product & {
  addedAt: string;
};

const CART_STORAGE_KEY = "digital-xpress-cart";
const WISHLIST_STORAGE_KEY = "digital-xpress-wishlist";

const readLocalStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;

  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeLocalStorage = <T,>(key: string, value: T) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const SoftLoveIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="h-5 w-5"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
  </svg>
);

const ShoppingTrolleyIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="9" cy="20" r="1.6" />
    <circle cx="18" cy="20" r="1.6" />
    <path d="M2.5 3.5h2.2l2.4 11.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4l1.6-6.2H6.1" />
    <path d="M8.2 8.7h13" />
  </svg>
);

const ProductCard = ({
  product,
  onAddToCart,
  onToggleFavorite,
}: ProductCardProps) => {
  const { data: session } = useSession();
  const user = session?.user ?? null;

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isCartAdded, setIsCartAdded] = useState(false);

  const image = product.mainImageUrl || product.image || "";
  const hoverImage = product.hoverImageUrl || product.hoverImage || image;
  const discount = getDiscountPercentage(product);
  const productHref = `/products/${product.slug || product.id}`;
  const canAddToCart = canProductBeAddedToCart(product);
  const stockLabel = getStockStatusLabel(product.stockStatus);

  useEffect(() => {
    const wishlist = readLocalStorage<StoredWishlistProduct[]>(
      WISHLIST_STORAGE_KEY,
      []
    );

    setIsWishlisted(wishlist.some((item) => item.id === product.id));
  }, [product.id]);

  const handleAddToCart = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      toast.error("Please login to add items to cart", {
        duration: 3000,
        icon: "🔒",
      });
      return;
    }

    if (!canAddToCart) {
      toast.error("This product is currently not available");
      return;
    }

    const currentCart = readLocalStorage<StoredCartProduct[]>(
      CART_STORAGE_KEY,
      []
    );

    const now = new Date().toISOString();
    const existing = currentCart.find((item) => item.id === product.id);

    const updatedCart = existing
      ? currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                updatedAt: now,
              }
            : item
        )
      : [
          ...currentCart,
          {
            ...product,
            quantity: 1,
            addedAt: now,
            updatedAt: now,
          },
        ];

    writeLocalStorage(CART_STORAGE_KEY, updatedCart);

    window.dispatchEvent(
      new CustomEvent("digital-xpress-cart-updated", {
        detail: updatedCart,
      })
    );

    onAddToCart?.(product);

    setIsCartAdded(true);
    window.setTimeout(() => setIsCartAdded(false), 1200);

    toast.success("Item added to cart!");
  };

  const handleFavorite = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      toast.error("Please login to add items to favorites", {
        duration: 3000,
        icon: "❤️",
      });
      return;
    }

    const currentWishlist = readLocalStorage<StoredWishlistProduct[]>(
      WISHLIST_STORAGE_KEY,
      []
    );

    const already = currentWishlist.some((item) => item.id === product.id);

    const updatedWishlist = already
      ? currentWishlist.filter((item) => item.id !== product.id)
      : [
          ...currentWishlist,
          {
            ...product,
            addedAt: new Date().toISOString(),
          },
        ];

    writeLocalStorage(WISHLIST_STORAGE_KEY, updatedWishlist);

    window.dispatchEvent(
      new CustomEvent("digital-xpress-wishlist-updated", {
        detail: updatedWishlist,
      })
    );

    setIsWishlisted(!already);
    onToggleFavorite?.(product);

    toast.success(already ? "Removed from favorites" : "Added to favorites");
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group/card relative isolate overflow-hidden rounded-2xl border border-white/10 bg-black/75 shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0.03)_35%,rgba(249,115,22,0.08)_100%)]" />

      <div className="relative aspect-square overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.15),rgba(17,24,39,0.82)_48%,rgba(0,0,0,1)_100%)]">
        <Link href={productHref} className="absolute inset-0 block">
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-contain p-3 transition duration-500 ease-out md:group-hover/card:scale-105 md:group-hover/card:opacity-0"
          />

          <img
            src={hoverImage}
            alt={`${product.name} hover`}
            className="absolute inset-0 h-full w-full object-contain p-3 opacity-0 transition duration-500 ease-out md:group-hover/card:scale-105 md:group-hover/card:opacity-100"
          />
        </Link>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

        {!canAddToCart ? (
          <span className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
            {stockLabel}
          </span>
        ) : discount > 0 ? (
          <span className="absolute left-3 top-3 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
            -{discount}%
          </span>
        ) : null}

        <button
          type="button"
          onClick={handleFavorite}
          aria-label={isWishlisted ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={isWishlisted}
          className={`absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border text-lg shadow-lg backdrop-blur-md transition duration-300 md:opacity-0 md:group-hover/card:opacity-100 ${
            isWishlisted
              ? "border-orange-400/70 bg-orange-500 text-white"
              : "border-white/10 bg-black/65 text-white hover:border-orange-400/70 hover:bg-orange-500 hover:text-white"
          }`}
        >
          <SoftLoveIcon filled={isWishlisted} />
        </button>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!canAddToCart}
          aria-label="Add to cart"
          className={`group/cart absolute inset-x-0 bottom-0 h-12 overflow-hidden rounded-t-xl border-t border-white/10 text-sm font-extrabold uppercase tracking-wide shadow-[0_-12px_30px_rgba(0,0,0,0.35)] backdrop-blur-md transition duration-300 ease-out md:translate-y-full md:opacity-0 md:group-hover/card:translate-y-0 md:group-hover/card:opacity-100 ${
            canAddToCart
              ? "bg-black/85 text-white hover:bg-orange-500"
              : "cursor-not-allowed bg-gray-800/90 text-gray-400"
          }`}
        >
          <span className="absolute inset-0 flex items-center justify-center transition duration-300 ease-out group-hover/cart:-translate-y-full group-hover/cart:opacity-0">
            {isCartAdded ? "Added" : canAddToCart ? "Add to Cart" : stockLabel}
          </span>

          <span className="absolute inset-0 flex translate-y-full items-center justify-center transition duration-300 ease-out group-hover/cart:translate-y-0">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-orange-600 shadow-lg">
              <ShoppingTrolleyIcon />
            </span>
          </span>
        </button>
      </div>

      <div className="relative bg-black/60 px-4 pb-5 pt-4 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-orange-400">
          {product.brand?.name || "Digital Xpress"}
        </p>

        <Link href={productHref}>
          <h2 className="line-clamp-2 min-h-[48px] text-2xl font-semibold leading-6 text-gray-200 transition hover:text-orange-500">
            {product.name}
          </h2>
        </Link>

        <p className="mt-1 line-clamp-1 text-xs text-gray-500">
          {product.category?.name}
          {product.subCategory?.name ? ` | ${product.subCategory.name}` : ""}
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="mr-2 text-lg font-bold text-gray-100">
              {formatPrice(product.sellingPrice)}
            </span>

            {product.mrp > product.sellingPrice && (
              <span className="mr-2 text-xs text-gray-500 line-through">
                {formatPrice(product.mrp)}
              </span>
            )}
          </div>

          <span
            className={`rounded-full px-2 py-1 text-xs ${
              canAddToCart
                ? "bg-orange-500/10 text-orange-300"
                : "bg-red-500/10 text-red-300"
            }`}
          >
            {stockLabel}
          </span>
        </div>
      </div>
    </motion.article>
  );
};

export default ProductCard;