// app/favorites/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { FaHeart, FaTrashAlt, FaShoppingCart } from "react-icons/fa";
import toast from "react-hot-toast";

interface FavoriteProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  hoverImage?: string;
  inStock: boolean;
  discount?: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
}

const WISHLIST_STORAGE_KEY = "digital-xpress-wishlist";
const CART_STORAGE_KEY = "digital-xpress-cart";

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not authenticated – only one toast will show
  useEffect(() => {
    if (status === "unauthenticated") {
      toast.error("Please login to view your favorites", {
        id: "favorites-auth-error", // prevents duplicate toasts
        duration: 3000,
        icon: "🔒",
      });
      router.push("/login");
    }
  }, [status, router]);

  const loadFavorites = () => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      setFavorites(stored ? JSON.parse(stored) : []);
    } catch {
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      loadFavorites();
    }

    const handleWishlistUpdate = () => {
      if (status === "authenticated") {
        loadFavorites();
      }
    };

    window.addEventListener("digital-xpress-wishlist-updated", handleWishlistUpdate);
    return () => window.removeEventListener("digital-xpress-wishlist-updated", handleWishlistUpdate);
  }, [status]);

  const removeFromFavorites = (id: string) => {
    if (!session?.user) {
      toast.error("Please login to manage favorites", {
        duration: 3000,
        icon: "🔒",
      });
      return;
    }

    const updatedFavorites = favorites.filter((item) => item.id !== id);
    setFavorites(updatedFavorites);
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updatedFavorites));
    window.dispatchEvent(
      new CustomEvent("digital-xpress-wishlist-updated", { detail: updatedFavorites })
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

    if (!product.inStock) {
      toast.error("This product is out of stock");
      return;
    }

    const currentCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
    const now = new Date().toISOString();
    const existingProduct = currentCart.find((item: any) => item.id === product.id);

    const updatedCart = existingProduct
      ? currentCart.map((item: any) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, updatedAt: now }
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

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
    window.dispatchEvent(
      new CustomEvent("digital-xpress-cart-updated", { detail: updatedCart })
    );
    toast.success("Added to cart!");
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-20 flex items-center justify-center">
        <div className="text-gray-400">Loading favorites...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">My Favorites</h1>
        <p className="text-gray-400 mb-8">
          {favorites.length} {favorites.length === 1 ? "item" : "items"} saved
        </p>

        {favorites.length === 0 ? (
          <div className="text-center py-16 bg-gray-900/30 rounded-2xl border border-gray-800">
            <FaHeart className="text-gray-600 text-5xl mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No favorites yet</h2>
            <p className="text-gray-400 mb-6">
              Start adding products you love to your favorites list
            </p>
            <Link
              href="/products"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {favorites.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative bg-black/60 border border-gray-800 rounded-2xl overflow-hidden hover:border-orange-500/50 transition"
              >
                <Link href={`/products/${product.id}`}>
                  <div className="relative aspect-square overflow-hidden bg-gray-900">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    {product.discount && (
                      <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        -{product.discount}%
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-4">
                  <Link href={`/products/${product.id}`}>
                    <h3 className="font-semibold text-white line-clamp-2 hover:text-orange-500 transition min-h-[48px]">
                      {product.name}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-bold text-orange-500">
                      ${product.price.toFixed(2)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-500 line-through">
                        ${product.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 mt-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={i < Math.floor(product.rating) ? "text-orange-400" : "text-gray-600"}
                      >
                        ★
                      </span>
                    ))}
                    <span className="text-xs text-gray-500 ml-1">({product.reviews})</span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => addToCart(product)}
                      disabled={!product.inStock}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <FaShoppingCart size={14} />
                      {product.inStock ? "Add to Cart" : "Out of Stock"}
                    </button>
                    <button
                      onClick={() => removeFromFavorites(product.id)}
                      className="p-2 bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-lg transition"
                      aria-label="Remove from favorites"
                    >
                      <FaTrashAlt size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}