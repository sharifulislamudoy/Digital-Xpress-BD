"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { FaHeart, FaTrashAlt, FaShoppingCart } from "react-icons/fa";
import toast from "react-hot-toast";
import type { Product } from "@/types/product";
import {
  canProductBeAddedToCart,
  getDiscountPercentage,
  getStockStatusLabel,
} from "@/types/product";
import { formatPrice } from "@/lib/formatPrice";

type FavoriteProduct = Product & {
  addedAt?: string;
};

type StoredCartProduct = Product & {
  quantity: number;
  addedAt: string;
  updatedAt: string;
};

const WISHLIST_STORAGE_KEY = "digital-xpress-wishlist";
const CART_STORAGE_KEY = "digital-xpress-cart";

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

export default function FavoritesClient() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFavorites = () => {
    const storedFavorites = readLocalStorage<FavoriteProduct[]>(
      WISHLIST_STORAGE_KEY,
      []
    );

    setFavorites(storedFavorites);
    setIsLoading(false);
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      toast.error("Please login to view your favorites", {
        id: "favorites-auth-error",
        duration: 3000,
        icon: "🔒",
      });

      router.push("/login");
      setIsLoading(false);
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      loadFavorites();
    }
  }, [status]);

  useEffect(() => {
    const handleWishlistUpdate = () => {
      if (status === "authenticated") {
        loadFavorites();
      }
    };

    window.addEventListener(
      "digital-xpress-wishlist-updated",
      handleWishlistUpdate
    );

    return () => {
      window.removeEventListener(
        "digital-xpress-wishlist-updated",
        handleWishlistUpdate
      );
    };
  }, [status]);

  const removeFromFavorites = (id: FavoriteProduct["id"]) => {
    if (!session?.user) {
      toast.error("Please login to manage favorites", {
        duration: 3000,
        icon: "🔒",
      });

      return;
    }

    const updatedFavorites = favorites.filter((item) => item.id !== id);

    setFavorites(updatedFavorites);
    writeLocalStorage(WISHLIST_STORAGE_KEY, updatedFavorites);

    window.dispatchEvent(
      new CustomEvent("digital-xpress-wishlist-updated", {
        detail: updatedFavorites,
      })
    );

    toast.success("Removed from favorites");
  };

  const addToCart = (product: FavoriteProduct) => {
    if (!session?.user) {
      toast.error("Please login to add items to cart", {
        duration: 3000,
        icon: "🔒",
      });

      return;
    }

    if (!canProductBeAddedToCart(product)) {
      toast.error("This product is currently not available");
      return;
    }

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

    toast.success("Added to cart!");
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black pb-20 pt-24">
        <div className="text-gray-400">Loading favorites...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-black px-4 pb-20 pt-24">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-2 text-3xl font-bold text-white">My Favorites</h1>

        <p className="mb-8 text-gray-400">
          {favorites.length} {favorites.length === 1 ? "item" : "items"} saved
        </p>

        {favorites.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-900/30 py-16 text-center">
            <FaHeart className="mx-auto mb-4 text-5xl text-gray-600" />

            <h2 className="mb-2 text-xl font-semibold text-white">
              No favorites yet
            </h2>

            <p className="mb-6 text-gray-400">
              Start adding products you love to your favorites list
            </p>

            <Link
              href="/products"
              className="inline-block rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {favorites.map((product) => {
              const image = product.mainImageUrl || product.image || "";
              const productHref = `/products/${product.slug || product.id}`;
              const canAddToCart = canProductBeAddedToCart(product);
              const stockLabel = getStockStatusLabel(product.stockStatus);
              const discount = getDiscountPercentage(product);

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-black/60 transition hover:border-orange-500/50"
                >
                  <Link href={productHref}>
                    <div className="relative aspect-square overflow-hidden bg-gray-900">
                      {image ? (
                        <img
                          src={image}
                          alt={product.name}
                          className="h-full w-full object-contain p-3 transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-gray-500">
                          No image available
                        </div>
                      )}

                      {discount > 0 && (
                        <div className="absolute left-3 top-3 rounded-full bg-orange-500 px-2 py-1 text-xs font-bold text-white">
                          -{discount}%
                        </div>
                      )}

                      {!canAddToCart && (
                        <div className="absolute right-3 top-3 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                          {stockLabel}
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-4">
                    <Link href={productHref}>
                      <h3 className="line-clamp-2 min-h-[48px] font-semibold text-white transition hover:text-orange-500">
                        {product.name}
                      </h3>
                    </Link>

                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-lg font-bold text-orange-500">
                        {formatPrice(product.sellingPrice)}
                      </span>

                      {product.mrp > product.sellingPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          {formatPrice(product.mrp)}
                        </span>
                      )}
                    </div>

                    <div className="mt-2">
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

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        disabled={!canAddToCart}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 py-2 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-600"
                      >
                        <FaShoppingCart size={14} />
                        {canAddToCart ? "Add to Cart" : stockLabel}
                      </button>

                      <button
                        type="button"
                        onClick={() => removeFromFavorites(product.id)}
                        className="rounded-lg bg-gray-800 p-2 text-gray-400 transition hover:bg-red-500/20 hover:text-red-500"
                        aria-label="Remove from favorites"
                      >
                        <FaTrashAlt size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}