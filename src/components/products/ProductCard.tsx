// components/products/ProductCard.tsx
"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import type { Product } from "@/types/product";

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
    const storedData = window.localStorage.getItem(key);
    return storedData ? (JSON.parse(storedData) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeLocalStorage = <T,>(key: string, value: T) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const ProductCard = ({
  product,
  onAddToCart,
  onToggleFavorite,
}: ProductCardProps) => {
  const { data: session } = useSession();
  const user = session?.user ?? null;

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isCartAdded, setIsCartAdded] = useState(false);

  const hoverImage = product.hoverImage || product.image;
  const isDiscounted = Boolean(product.discount && product.originalPrice);

  useEffect(() => {
    const wishlist = readLocalStorage<StoredWishlistProduct[]>(
      WISHLIST_STORAGE_KEY,
      []
    );
    const alreadyWishlisted = wishlist.some((item) => item.id === product.id);
    setIsWishlisted(alreadyWishlisted);
  }, [product.id]);

  const handleAddToCart = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    // Check if user is logged in
    if (!user) {
      toast.error("Please login to add items to cart", {
        duration: 3000,
        icon: "🔒",
      });
      return;
    }

    if (!product.inStock) return;

    const currentCart = readLocalStorage<StoredCartProduct[]>(
      CART_STORAGE_KEY,
      []
    );

    const now = new Date().toISOString();
    const existingProduct = currentCart.find((item) => item.id === product.id);

    const updatedCart: StoredCartProduct[] = existingProduct
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
    setTimeout(() => setIsCartAdded(false), 1200);

    toast.success("Item added to cart!", {
      duration: 2000,
    });
  };

  const handleFavorite = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    // Check if user is logged in
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

    const alreadyWishlisted = currentWishlist.some(
      (item) => item.id === product.id
    );

    const updatedWishlist: StoredWishlistProduct[] = alreadyWishlisted
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

    setIsWishlisted(!alreadyWishlisted);
    onToggleFavorite?.(product);

    if (!alreadyWishlisted) {
      toast.success("Added to favorites!", {
        duration: 2000,
        icon: "❤️",
      });
    } else {
      toast.success("Removed from favorites", {
        duration: 2000,
      });
    }
  };

  return (
    <motion.article
      className="group/card relative isolate overflow-hidden rounded-2xl border border-white/10 bg-black/70 shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-300 before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03)_35%,rgba(249,115,22,0.08)_100%)] before:opacity-80 after:pointer-events-none after:absolute after:inset-px after:-z-10 after:rounded-[15px] after:border after:border-white/5 hover:border-orange-400/80 hover:bg-black/80 hover:shadow-[0_22px_65px_rgba(249,115,22,0.20)]"
    >
      <div className="relative overflow-hidden bg-black/60">
        <Link href={`/products/${product.id}`} className="block">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.16),rgba(0,0,0,0.78)_45%,rgba(0,0,0,1)_100%)]">
            <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_34%,rgba(0,0,0,0.28)_100%)]" />
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full rounded-2xl lg:rounded-none rounded-t-2xl object-cover transition-all duration-500 ease-out lg:group-hover/card:scale-105 lg:group-hover/card:opacity-0"
            />
            <img
              src={hoverImage}
              alt={`${product.name} hover preview`}
              loading="lazy"
              className="absolute inset-0 hidden h-full w-full rounded-t-2xl object-cover rounded-b-2xl opacity-0 transition-all duration-500 ease-out lg:block lg:scale-105 lg:group-hover/card:scale-100 lg:group-hover/card:opacity-100"
            />
          </div>
        </Link>

        {isDiscounted && (
          <div className="absolute left-4 top-4 z-20 grid h-12 w-12 place-items-center rounded-full border border-black/40 bg-orange-500/65 text-xs font-bold text-white shadow-[0_10px_30px_rgba(249,115,22,0.22)] backdrop-blur-md">
            -{product.discount}%
          </div>
        )}

        <button
          type="button"
          onClick={handleFavorite}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full border bg-black/65 shadow-[0_10px_28px_rgba(0,0,0,0.35)] backdrop-blur-md transition-all duration-300 lg:translate-y-2 lg:opacity-0 lg:group-hover/card:translate-y-0 lg:group-hover/card:opacity-100 ${
            isWishlisted
              ? "border-orange-400 text-orange-500"
              : "border-white/15 text-gray-300 hover:border-orange-400 hover:text-orange-500"
          }`}
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill={isWishlisted ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!product.inStock}
          aria-label={product.inStock ? "Add to cart" : "Out of stock"}
          className="group/add absolute bottom-0 left-0 z-20 w-full translate-y-0 overflow-hidden rounded-bl-2xl rounded-br-2xl border border-white/10 bg-black/75 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white opacity-100 shadow-[0_-12px_35px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-300 hover:border-orange-400/60 hover:bg-orange-500 disabled:cursor-not-allowed disabled:border-gray-600 disabled:bg-gray-600 lg:translate-y-full lg:opacity-0 lg:group-hover/card:translate-y-0 lg:group-hover/card:opacity-100"
        >
          <span className="block transition-all duration-300 ease-out group-hover/add:-translate-y-8 group-hover/add:opacity-0">
            {!product.inStock
              ? "Out Of Stock"
              : isCartAdded
              ? "Added To Cart"
              : "Add To Cart"}
          </span>
          <span className="absolute inset-0 flex translate-y-full items-center justify-center opacity-0 transition-all duration-300 ease-out group-hover/add:translate-y-0 group-hover/add:opacity-100">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
          </span>
        </button>
      </div>

      <div className="relative bg-black/55 px-4 pb-5 pt-4 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <Link href={`/products/${product.id}`}>
          <h2 className="line-clamp-2 min-h-[48px] text-[15px] font-semibold leading-6 text-gray-300 transition hover:text-orange-500">
            {product.name}
          </h2>
        </Link>
        <p className="mt-1 line-clamp-1 text-xs text-gray-500">
          {product.features?.slice(0, 3).join(", ")}
        </p>
        <div className="mt-3 flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <span
              key={index}
              className={
                index < Math.floor(product.rating)
                  ? "text-orange-400"
                  : "text-gray-500"
              }
            >
              ★
            </span>
          ))}
          <span className="ml-1 text-xs text-gray-400">
            ({product.reviews})
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg font-bold text-gray-200">
            ${product.price.toFixed(2)}
          </span>
          {isDiscounted && (
            <span className="text-sm text-gray-500 line-through">
              ${product.originalPrice?.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
};

export default ProductCard;