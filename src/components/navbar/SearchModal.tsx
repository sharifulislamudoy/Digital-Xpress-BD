"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaArrowRight,
  FaBoxOpen,
  FaLayerGroup,
  FaSearch,
  FaSpinner,
  FaTags,
  FaTimes,
} from "react-icons/fa";
import type { Product } from "@/types/product";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  iconSvg?: string | null;
  productCount?: number;
}

interface SearchSubCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  iconSvg?: string | null;
  productCount?: number;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface SearchBrand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  productCount?: number;
}

interface ProductSearchApiResponse {
  success: boolean;
  query?: string;
  products?: Product[];
  categories?: SearchCategory[];
  subCategories?: SearchSubCategory[];
  brands?: SearchBrand[];
  message?: string;
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"
).replace(/\/$/, "");

function formatPrice(value?: number | string | null) {
  const numericValue = Number(value || 0);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "৳0";
  }

  return `৳${numericValue.toLocaleString("en-BD", {
    maximumFractionDigits: 0,
  })}`;
}

function buildProductHref(product: Product) {
  const categorySlug = product.category?.slug;

  if (!categorySlug || !product.slug) {
    return `/products?search=${encodeURIComponent(product.name || "")}`;
  }

  return `/products/${encodeURIComponent(categorySlug)}/${encodeURIComponent(
    product.slug,
  )}`;
}

function buildCategoryHref(category: SearchCategory) {
  return `/products/${encodeURIComponent(category.slug)}`;
}

function buildSubCategoryHref(subCategory: SearchSubCategory) {
  if (subCategory.category?.slug) {
    const categorySlug = encodeURIComponent(subCategory.category.slug);
    const subCategorySlug = encodeURIComponent(subCategory.slug);

    return `/product/${categorySlug}?subCategory=${subCategorySlug}`;
  }

  return `/products?subCategory=${encodeURIComponent(subCategory.slug)}`;
}

function buildBrandHref(brand: SearchBrand) {
  return `/products?brand=${encodeURIComponent(brand.slug)}`;
}

function getProductMeta(product: Product) {
  return [product.category?.name, product.subCategory?.name, product.brand?.name]
    .filter(Boolean)
    .join(" • ");
}

function SearchSectionHeader({
  icon,
  title,
  count,
}: {
  icon: ReactNode;
  title: string;
  count: number;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <span className="text-orange-400">{icon}</span>
        <span>{title}</span>
      </div>

      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-400">
        {count}
      </span>
    </div>
  );
}

function ProductResultCard({
  product,
  onNavigate,
}: {
  product: Product;
  onNavigate: () => void;
}) {
  const discount =
    Number(product.mrp || 0) > Number(product.sellingPrice || product.price || 0)
      ? Math.round(
          ((Number(product.mrp || 0) -
            Number(product.sellingPrice || product.price || 0)) /
            Number(product.mrp || 0)) *
            100,
        )
      : 0;

  return (
    <Link
      href={buildProductHref(product)}
      onClick={onNavigate}
      className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-2.5 transition hover:border-orange-500/60 hover:bg-orange-500/10 sm:gap-4 sm:p-3"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-900 sm:h-20 sm:w-20">
        {product.mainImageUrl || product.image ? (
          <Image
            src={product.mainImageUrl || product.image || ""}
            alt={product.mainImageAlt || product.name || "Product image"}
            fill
            sizes="80px"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-500">
            <FaBoxOpen />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white sm:text-base">
          {product.name}
        </h3>

        <p className="mt-1 truncate text-xs text-gray-400">
          {getProductMeta(product) || "Digital Xpress product"}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-orange-400 sm:text-base">
            {formatPrice(product.sellingPrice || product.price)}
          </span>

          {Number(product.mrp || product.originalPrice || 0) >
            Number(product.sellingPrice || product.price || 0) && (
            <span className="text-xs text-gray-500 line-through">
              {formatPrice(product.mrp || product.originalPrice)}
            </span>
          )}

          {discount > 0 && (
            <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[11px] font-semibold text-orange-300">
              {discount}% OFF
            </span>
          )}
        </div>
      </div>

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/30 text-gray-300 transition group-hover:border-orange-500 group-hover:bg-orange-500 group-hover:text-white sm:h-10 sm:w-10">
        <FaArrowRight className="text-sm" />
      </div>
    </Link>
  );
}

function SuggestionPill({
  href,
  title,
  subtitle,
  imageUrl,
  icon,
  onNavigate,
}: {
  href: string;
  title: string;
  subtitle: string;
  imageUrl?: string | null;
  icon: ReactNode;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="group flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 transition hover:border-orange-500/60 hover:bg-orange-500/10"
    >
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-zinc-900 text-orange-400">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="44px"
            className="object-cover"
          />
        ) : (
          icon
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-semibold text-white">{title}</h4>
        <p className="truncate text-xs text-gray-400">{subtitle}</p>
      </div>

      <FaArrowRight className="shrink-0 text-xs text-gray-500 transition group-hover:text-orange-400" />
    </Link>
  );
}

export const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<ProductSearchApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const cleanQuery = searchQuery.trim();
  const canSearch = cleanQuery.length >= 2;

  const totalResults = useMemo(() => {
    if (!results) return 0;

    return (
      (results.products?.length || 0) +
      (results.categories?.length || 0) +
      (results.subCategories?.length || 0) +
      (results.brands?.length || 0)
    );
  }, [results]);

  useEffect(() => {
    if (!isOpen) return;

    const timeout = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setResults(null);
      setIsLoading(false);
      setErrorMessage("");
      return;
    }

    if (!canSearch) {
      setResults(null);
      setIsLoading(false);
      setErrorMessage("");
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch(
          `${API_BASE_URL}/api/v1/products/search?q=${encodeURIComponent(
            cleanQuery,
          )}&limit=12`,
          { signal: controller.signal },
        );

        const data = (await response.json()) as ProductSearchApiResponse;

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to search products");
        }

        setResults(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Search failed. Please try again.",
        );
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    }, 320);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [canSearch, cleanQuery, isOpen]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (cleanQuery) {
      router.push(`/products?search=${encodeURIComponent(cleanQuery)}`);
    }

    handleClose();
  };

  const handlePopularSearch = (item: string) => {
    router.push(`/products?search=${encodeURIComponent(item)}`);
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[220] bg-black/95 px-3 py-4 backdrop-blur-md sm:px-4 sm:py-6"
        >
          <motion.div
            initial={{ y: 34, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 28, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950 shadow-2xl"
          >
            <div className="shrink-0 border-b border-white/10 bg-black/40 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-400">
                    Digital Xpress
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                    Search products
                  </h2>
                </div>

                <button
                  onClick={handleClose}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-orange-500 hover:text-orange-400"
                  aria-label="Close search"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="relative">
                <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search by product, category, sub-category or brand..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full rounded-full border border-white/10 bg-black px-5 py-4 pl-12 pr-24 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 sm:text-base"
                />
              </form>
            </div>

            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-track-zinc-900 scrollbar-thumb-zinc-700 sm:p-5">

              {canSearch && isLoading && (
                <div className="flex min-h-[260px] flex-col items-center justify-center text-center text-gray-400">
                  <FaSpinner className="mb-4 animate-spin text-3xl text-orange-400" />
                  <p>Searching products...</p>
                </div>
              )}

              {canSearch && !isLoading && errorMessage && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {errorMessage}
                </div>
              )}

              {canSearch && !isLoading && !errorMessage && results && (
                <div className="space-y-6">
                  {totalResults === 0 && (
                    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.025] p-6 text-center">
                      <FaBoxOpen className="mb-4 text-4xl text-gray-600" />
                      <h3 className="text-lg font-bold text-white">
                        No result found
                      </h3>
                      <p className="mt-2 max-w-md text-sm text-gray-400">
                        Try a product name, category, sub-category or brand name.
                      </p>
                    </div>
                  )}

                  {!!results.products?.length && (
                    <section>
                      <SearchSectionHeader
                        icon={<FaSearch />}
                        title="Products"
                        count={results.products.length}
                      />

                      <div className="space-y-3">
                        {results.products.map((product) => (
                          <ProductResultCard
                            key={product.id}
                            product={product}
                            onNavigate={handleClose}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {!!(
                    (results.categories?.length || 0) +
                    (results.subCategories?.length || 0)
                  ) && (
                    <section>
                      <SearchSectionHeader
                        icon={<FaLayerGroup />}
                        title="Categories & sub-categories"
                        count={
                          (results.categories?.length || 0) +
                          (results.subCategories?.length || 0)
                        }
                      />

                      <div className="grid gap-3 sm:grid-cols-2">
                        {results.categories?.map((category) => (
                          <SuggestionPill
                            key={`category-${category.id}`}
                            href={buildCategoryHref(category)}
                            title={category.name}
                            subtitle={`${category.productCount || 0} products • Category`}
                            imageUrl={category.imageUrl}
                            icon={<FaLayerGroup />}
                            onNavigate={handleClose}
                          />
                        ))}

                        {results.subCategories?.map((subCategory) => (
                          <SuggestionPill
                            key={`sub-category-${subCategory.id}`}
                            href={buildSubCategoryHref(subCategory)}
                            title={subCategory.name}
                            subtitle={`${subCategory.category?.name || "Category"} • ${
                              subCategory.productCount || 0
                            } products`}
                            imageUrl={subCategory.imageUrl}
                            icon={<FaLayerGroup />}
                            onNavigate={handleClose}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {!!results.brands?.length && (
                    <section>
                      <SearchSectionHeader
                        icon={<FaTags />}
                        title="Brands"
                        count={results.brands.length}
                      />

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {results.brands.map((brand) => (
                          <SuggestionPill
                            key={brand.id}
                            href={buildBrandHref(brand)}
                            title={brand.name}
                            subtitle={`${brand.productCount || 0} products • Brand`}
                            imageUrl={brand.logoUrl}
                            icon={<FaTags />}
                            onNavigate={handleClose}
                          />
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};