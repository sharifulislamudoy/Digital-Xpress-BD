"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import type { Product, ProductImage } from "@/types/product";
import {
  canProductBeAddedToCart,
  getDiscountPercentage,
  getProductBadges,
  getStockStatusLabel,
} from "@/types/product";
import { formatPrice } from "@/lib/formatPrice";
import ProductCard from "@/components/products/ProductCard";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
const CART_STORAGE_KEY = "digital-xpress-cart";

type StoredCartProduct = Product & {
  quantity: number;
  addedAt: string;
  updatedAt: string;
};

type TabKey = "description" | "specifications" | "features" | "policy";

type ProductApiResponse = {
  success?: boolean;
  product?: Product;
  relatedProducts?: Product[];
};

type MediaItem = {
  type: "image" | "video";
  url: string;
  label: string;
};

type ProductMediaShape = Product & {
  mainImageUrl?: string | null;
  hoverImageUrl?: string | null;
  videoUrl?: string | null;

  image?: string | null;
  hoverImage?: string | null;
  imageUrl?: string | null;
  thumbnail?: string | null;

  extraImages?: ProductImage[];

  stock?: number | null;
  sku?: string | null;
  warranty?: string | null;
};

const tabs: { key: TabKey; label: string }[] = [
  { key: "description", label: "Description" },
  { key: "specifications", label: "Specifications" },
  { key: "features", label: "Features & Highlights" },
  { key: "policy", label: "Policies & Delivery" },
];

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const getText = (value: unknown, fallback = "N/A") => {
  if (typeof value === "string" && value.trim()) return value.trim();
  return fallback;
};

const getNumberValue = (value: unknown, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const getOptionalNumber = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const getStockQuantity = (product: Product | null) => {
  if (!product) return null;
  const stock = (product as ProductMediaShape).stock;
  return typeof stock === "number" && Number.isFinite(stock) ? stock : null;
};

const getMaxSelectableQuantity = (product: Product | null) => {
  const stockQuantity = getStockQuantity(product);
  if (stockQuantity !== null && stockQuantity > 0) {
    return Math.min(stockQuantity, 99);
  }
  return 99;
};

const getMediaUrl = (item: unknown): string => {
  if (typeof item === "string") return item.trim();
  if (!item || typeof item !== "object") return "";
  const record = item as Record<string, unknown>;
  const possibleKeys = [
    "imageUrl",
    "mainImageUrl",
    "hoverImageUrl",
    "videoUrl",
    "url",
    "src",
    "path",
    "image",
    "secure_url",
    "secureUrl",
    "thumbnail",
  ];
  for (const key of possibleKeys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
};

const buildMediaItems = (product: Product): MediaItem[] => {
  const mediaProduct = product as ProductMediaShape;
  const items: MediaItem[] = [];
  const seenUrls = new Set<string>();

  const addMedia = (
    type: MediaItem["type"],
    source: unknown,
    label: string
  ) => {
    const cleanUrl = getMediaUrl(source);
    if (!cleanUrl || seenUrls.has(cleanUrl)) return;
    seenUrls.add(cleanUrl);
    items.push({
      type,
      url: cleanUrl,
      label,
    });
  };

  addMedia("video", mediaProduct.videoUrl, "Product video");
  addMedia("image", mediaProduct.mainImageUrl, "Main image");
  addMedia("image", mediaProduct.image, "Main image");
  addMedia("image", mediaProduct.imageUrl, "Product image");
  addMedia("image", mediaProduct.hoverImageUrl, "Hover image");
  addMedia("image", mediaProduct.hoverImage, "Hover image");

  if (Array.isArray(mediaProduct.extraImages)) {
    const sortedExtraImages = [...mediaProduct.extraImages].sort(
      (a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)
    );
    sortedExtraImages.forEach((image, index) => {
      addMedia("image", image.imageUrl, `Extra image ${index + 1}`);
    });
  }

  return items;
};

const CartIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h8.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const LightningIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M13 2 3 14h8l-1 8 11-13h-8l1-7Z" />
  </svg>
);

const ShieldIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const TruckIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M10 17h4V5H2v12h3" />
    <path d="M14 17h1" />
    <path d="M19 17h3v-6l-3-4h-5v10h2" />
    <circle cx="7.5" cy="17.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
);

const ReturnIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h11a5 5 0 0 1 0 10h-4" />
  </svg>
);

const CheckIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="m5 12 4 4L19 6" />
  </svg>
);

const ProductDetailsPage = () => {
  const params = useParams();
  const router = useRouter();

  const rawIdentifier = params.id;
  const identifier = Array.isArray(rawIdentifier)
    ? rawIdentifier[0] || ""
    : String(rawIdentifier || "");

  const { data: session } = useSession();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState<TabKey>("description");

  useEffect(() => {
    let isActive = true;

    const fetchProduct = async () => {
      if (!identifier) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const endpoint = API_BASE
          ? `${API_BASE}/api/v1/products/${identifier}`
          : `/api/v1/products/${identifier}`;

        const res = await fetch(endpoint);

        if (!res.ok) {
          throw new Error("Failed to fetch product");
        }

        const data = (await res.json()) as ProductApiResponse;

        if (!isActive) return;

        if (data.success && data.product) {
          setProduct(data.product);
          setRelatedProducts(
            Array.isArray(data.relatedProducts) ? data.relatedProducts : []
          );
          setQuantity(1);
        } else {
          setProduct(null);
          setRelatedProducts([]);
        }
      } catch {
        if (!isActive) return;
        setProduct(null);
        setRelatedProducts([]);
        toast.error("Failed to load product details");
      } finally {
        if (isActive) setLoading(false);
      }
    };

    fetchProduct();

    return () => {
      isActive = false;
    };
  }, [identifier]);

  useEffect(() => {
    setQuantity((prev) =>
      Math.max(1, Math.min(getMaxSelectableQuantity(product), prev))
    );
  }, [product]);

  const productInfo = useMemo(() => {
    if (!product) return null;

    const sellingPrice = getNumberValue(product.sellingPrice || product.price);
    const mrpValue = getNumberValue(product.mrp || product.originalPrice);
    const originalPrice = mrpValue > 0 ? mrpValue : sellingPrice;
    const discount = getDiscountPercentage(product);
    const canAddToCart = canProductBeAddedToCart(product);
    const stockLabel =
      product.stockStatusLabel || getStockStatusLabel(product.stockStatus);
    const stockQuantity = getStockQuantity(product);
    const sku = getText((product as ProductMediaShape).sku, "");
    const warranty = getText((product as ProductMediaShape).warranty, "");
    const badges = getProductBadges(product);
    const rating = product.averageRating ? Number(product.averageRating) : null;
    const reviewCount = product.totalReviews || 0;

    return {
      sellingPrice,
      originalPrice,
      discount,
      canAddToCart,
      stockLabel,
      stockQuantity,
      sku,
      warranty,
      description: getText(
        product.description,
        "No description available for this product."
      ),
      shortDescription: getText(product.shortDescription, ""),
      modelName: getText(product.modelName, ""),
      brandName: getText(product.brand?.name, ""),
      categoryName: getText(product.category?.name, ""),
      subCategoryName: getText(product.subCategory?.name, ""),
      rating,
      reviewCount,
      badges,
      keyFeatures: product.keyFeatures || [],
      highlights: product.highlights || [],
      specifications: product.specifications || {},
      warrantyDuration: product.warrantyDuration,
      warrantyDetails: product.warrantyDetails,
      returnPolicy: product.returnPolicy,
      replacementPolicy: product.replacementPolicy,
      refundPolicy: product.refundPolicy,
      deliveryInfo: product.deliveryInfo,
      deliveryCharge: product.deliveryCharge ? Number(product.deliveryCharge) : null,
      insideDhakaDeliveryCharge: product.insideDhakaDeliveryCharge ? Number(product.insideDhakaDeliveryCharge) : null,
      outsideDhakaDeliveryCharge: product.outsideDhakaDeliveryCharge ? Number(product.outsideDhakaDeliveryCharge) : null,
      deliveryTime: product.deliveryTime,
      cashOnDelivery: product.cashOnDelivery,
      freeDelivery: product.freeDelivery,
      freeDeliveryMinAmount: product.freeDeliveryMinAmount ? Number(product.freeDeliveryMinAmount) : null,
      packageIncludes: product.packageIncludes || [],
      packageWeight: product.packageWeight,
      packageDimensions: product.packageDimensions,
    };
  }, [product]);

  const handleQuantityChange = (change: number) => {
    const maxQuantity = getMaxSelectableQuantity(product);
    setQuantity((prev) => Math.max(1, Math.min(maxQuantity, prev + change)));
  };

  const saveToCart = (redirectToCheckout = false) => {
    if (!product || !productInfo) return;

    if (!session?.user) {
      toast.error("Please login to add items to cart", {
        duration: 3000,
        icon: "🔒",
      });
      return;
    }

    if (!productInfo.canAddToCart) {
      toast.error("This product is currently not available");
      return;
    }

    try {
      const currentCart: StoredCartProduct[] = JSON.parse(
        window.localStorage.getItem(CART_STORAGE_KEY) || "[]"
      );

      const existing = currentCart.find((item) => item.id === product.id);
      const existingQuantity =
        existing && typeof existing.quantity === "number"
          ? existing.quantity
          : 0;

      const requestedQuantity = existingQuantity + quantity;

      if (
        productInfo.stockQuantity !== null &&
        productInfo.stockQuantity > 0 &&
        requestedQuantity > productInfo.stockQuantity
      ) {
        toast.error(`Only ${productInfo.stockQuantity} item(s) available`);
        return;
      }

      const now = new Date().toISOString();

      const updatedCart = existing
        ? currentCart.map((item) =>
            item.id === product.id
              ? {
                  ...item,
                  quantity: requestedQuantity,
                  updatedAt: now,
                }
              : item
          )
        : [
            ...currentCart,
            {
              ...product,
              quantity,
              addedAt: now,
              updatedAt: now,
            },
          ];

      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));

      window.dispatchEvent(
        new CustomEvent("digital-xpress-cart-updated", {
          detail: updatedCart,
        })
      );

      toast.success(`${quantity} item(s) added to cart`);

      if (redirectToCheckout) {
        router.push("/checkout");
      }
    } catch {
      toast.error("Failed to add item to cart");
    }
  };

  if (loading) {
    return <ProductDetailsSkeleton />;
  }

  if (!product || !productInfo) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-black px-4 py-16 text-white sm:py-20">
        <div className="mx-auto flex max-w-xl flex-col items-center rounded-3xl border border-orange-500/20 bg-zinc-950 p-6 text-center shadow-[0_24px_90px_rgba(249,115,22,0.12)] sm:p-8">
          <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-orange-500/10 text-3xl text-orange-400">
            !
          </div>
          <h1 className="text-2xl font-bold">Product not found</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            The product may be unavailable, unpublished, or removed from the
            store.
          </p>
          <Link
            href="/products"
            className="mt-7 rounded-2xl bg-orange-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-500"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const metaItems = [
    productInfo.categoryName,
    productInfo.subCategoryName,
    productInfo.brandName,
  ].filter(Boolean);

  const descriptionLines = productInfo.description
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const specificationRows = [
    { label: "Model", value: productInfo.modelName },
    { label: "SKU", value: productInfo.sku },
    { label: "Brand", value: productInfo.brandName },
    { label: "Category", value: productInfo.categoryName },
    { label: "Sub-category", value: productInfo.subCategoryName },
    { label: "MRP", value: formatPrice(productInfo.originalPrice) },
    { label: "Selling Price", value: formatPrice(productInfo.sellingPrice) },
    { label: "Stock Status", value: productInfo.stockLabel },
    {
      label: "Available Stock",
      value:
        productInfo.stockQuantity !== null
          ? `${productInfo.stockQuantity} item(s)`
          : "",
    },
    { label: "Warranty", value: productInfo.warranty },
  ].filter((item) => item.value);

  const lowStock =
    productInfo.stockQuantity !== null &&
    productInfo.stockQuantity > 0 &&
    productInfo.stockQuantity <= 5;

  return (
    <main className="min-h-screen overflow-x-hidden bg-black text-white">
      <section className="relative overflow-hidden border-b border-orange-500/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.22),transparent_34%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.35),#000_85%)]" />

        <div className="relative mx-auto w-full max-w-7xl px-3 pb-8 pt-5 sm:px-6 sm:pb-10 sm:pt-6 lg:px-8">
          <nav className="mb-5 flex min-w-0 flex-wrap items-center gap-2 text-xs text-zinc-500 sm:mb-6 sm:text-sm">
            <Link href="/" className="transition hover:text-orange-400">
              Home
            </Link>
            <span>/</span>
            <Link href="/products" className="transition hover:text-orange-400">
              Products
            </Link>
            <span>/</span>
            <span className="min-w-0 max-w-[220px] truncate text-orange-300 sm:max-w-sm lg:max-w-xl">
              {product.name}
            </span>
          </nav>

          <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-start xl:gap-8">
            <ProductShowcase product={product} />

            <aside className="min-w-0 lg:sticky lg:top-24">
              <div className="rounded-[1.5rem] border border-orange-500/15 bg-zinc-950/90 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.55)] backdrop-blur sm:rounded-[2rem] sm:p-7">
                <div className="mb-4 flex flex-wrap gap-2">
                  {metaItems.map((item, index) => (
                    <span
                      key={`${item}-${index}`}
                      className={cx(
                        "max-w-full truncate rounded-full px-3 py-1 text-xs font-semibold",
                        index === 0
                          ? "bg-orange-500/15 text-orange-300"
                          : "bg-white/5 text-zinc-300"
                      )}
                    >
                      {item}
                    </span>
                  ))}
                  {productInfo.badges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full border border-orange-400/30 bg-black/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-300"
                    >
                      {badge}
                    </span>
                  ))}
                </div>

                <h1 className="break-words text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
                  {product.name}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {productInfo.modelName && (
                    <span className="text-sm font-semibold text-orange-400">
                      Model: {productInfo.modelName}
                    </span>
                  )}

                  {productInfo.rating !== null && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                      ★ {productInfo.rating.toFixed(1)}
                      {productInfo.reviewCount > 0
                        ? ` (${productInfo.reviewCount} reviews)`
                        : ""}
                    </span>
                  )}
                </div>

                {productInfo.shortDescription && (
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-400">
                    {productInfo.shortDescription}
                  </p>
                )}

                <div className="mt-6 rounded-3xl border border-orange-500/15 bg-black/50 p-4 sm:mt-7 sm:p-5">
                  <div className="flex flex-wrap items-end gap-3">
                    {productInfo.originalPrice > productInfo.sellingPrice && (
                      <span className="pb-1 text-base font-semibold text-zinc-500 line-through sm:text-lg">
                        {formatPrice(productInfo.originalPrice)}
                      </span>
                    )}

                    <span className="break-words text-3xl font-black text-orange-500 sm:text-4xl">
                      {formatPrice(productInfo.sellingPrice)}
                    </span>

                    {productInfo.discount > 0 && (
                      <span className="mb-1 rounded-full bg-orange-500 px-3 py-1 text-xs font-black text-white">
                        Save {productInfo.discount}%
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-zinc-500">
                    VAT included where applicable.
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <span
                      className={cx(
                        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold",
                        productInfo.canAddToCart
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-red-500/10 text-red-300"
                      )}
                    >
                      <span
                        className={cx(
                          "h-2 w-2 rounded-full",
                          productInfo.canAddToCart
                            ? "bg-emerald-400"
                            : "bg-red-400"
                        )}
                      />
                      {productInfo.stockLabel}
                    </span>

                    {productInfo.stockQuantity !== null && (
                      <span className="rounded-full bg-white/5 px-4 py-2 text-sm text-zinc-300">
                        {productInfo.stockQuantity} item(s) available
                      </span>
                    )}
                  </div>

                  {lowStock && (
                    <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
                      Low stock. Secure yours before the next restock.
                    </p>
                  )}
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-[150px_1fr]">
                  <div className="min-w-0">
                    <p className="mb-2 text-sm font-medium text-zinc-400">
                      Quantity
                    </p>

                    <div className="flex h-12 overflow-hidden rounded-2xl border border-white/10 bg-black">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="grid w-12 shrink-0 place-items-center text-xl text-zinc-300 transition hover:bg-white/5 hover:text-orange-400 disabled:cursor-not-allowed disabled:text-zinc-700"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>

                      <span className="grid min-w-0 flex-1 place-items-center border-x border-white/10 text-sm font-black text-white">
                        {quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= getMaxSelectableQuantity(product)}
                        className="grid w-12 shrink-0 place-items-center text-xl text-zinc-300 transition hover:bg-white/5 hover:text-orange-400 disabled:cursor-not-allowed disabled:text-zinc-700"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="grid min-w-0 gap-3 sm:grid-cols-2 md:items-end">
                    <button
                      type="button"
                      onClick={() => saveToCart(false)}
                      disabled={!productInfo.canAddToCart}
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(234,88,12,0.22)] transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none"
                    >
                      <CartIcon />
                      <span className="truncate">
                        {productInfo.canAddToCart
                          ? "ADD TO CART"
                          : productInfo.stockLabel.toUpperCase()}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => saveToCart(true)}
                      disabled={!productInfo.canAddToCart}
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-orange-500 px-4 text-sm font-black text-orange-300 transition hover:bg-orange-500 hover:text-white disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600"
                    >
                      <LightningIcon />
                      BUY NOW
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-3 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-zinc-950 shadow-[0_20px_80px_rgba(0,0,0,0.45)] sm:rounded-[2rem]">
          <div className="flex gap-1 overflow-x-auto border-b border-white/10 bg-black/40 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedTab(tab.key)}
                className={cx(
                  "shrink-0 whitespace-nowrap rounded-2xl px-4 py-3 text-xs font-bold transition sm:px-5 sm:text-sm",
                  selectedTab === tab.key
                    ? "bg-orange-600 text-white shadow-[0_12px_30px_rgba(234,88,12,0.25)]"
                    : "text-zinc-400 hover:bg-white/5 hover:text-orange-300"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-7 lg:p-8">
            {selectedTab === "description" && (
              <div className="max-w-4xl space-y-4 text-sm leading-7 text-zinc-300 sm:text-base">
                {descriptionLines.map((line, index) => (
                  <p key={`${line}-${index}`}>{line}</p>
                ))}
              </div>
            )}

            {selectedTab === "specifications" && (
              <div>
                {productInfo.specifications &&
                Object.keys(productInfo.specifications).length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {Object.entries(productInfo.specifications).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="min-w-0 rounded-2xl border border-white/10 bg-black/35 p-4"
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                            {key}
                          </p>
                          <p className="mt-2 break-words text-sm font-semibold text-white">
                            {String(value)}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-white/10 bg-black/35 p-6 text-center sm:p-8">
                    <p className="text-sm text-zinc-400">
                      No specifications available.
                    </p>
                  </div>
                )}
              </div>
            )}

            {selectedTab === "features" && (
              <div className="space-y-6">
                {productInfo.keyFeatures.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-lg font-bold text-white">
                      Key Features
                    </h3>
                    <ul className="list-inside list-disc space-y-1 text-sm text-zinc-300">
                      {productInfo.keyFeatures.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {productInfo.highlights.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-lg font-bold text-white">
                      Highlights
                    </h3>
                    <ul className="list-inside list-disc space-y-1 text-sm text-zinc-300">
                      {productInfo.highlights.map((highlight, idx) => (
                        <li key={idx}>{highlight}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {productInfo.packageIncludes.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-lg font-bold text-white">
                      Package Includes
                    </h3>
                    <ul className="list-inside list-disc space-y-1 text-sm text-zinc-300">
                      {productInfo.packageIncludes.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {productInfo.packageWeight && (
                  <p className="text-sm text-zinc-400">
                    <span className="font-semibold text-white">Package Weight:</span> {productInfo.packageWeight}
                  </p>
                )}

                {productInfo.packageDimensions && (
                  <p className="text-sm text-zinc-400">
                    <span className="font-semibold text-white">Package Dimensions:</span> {productInfo.packageDimensions}
                  </p>
                )}

                {productInfo.keyFeatures.length === 0 &&
                  productInfo.highlights.length === 0 &&
                  productInfo.packageIncludes.length === 0 &&
                  !productInfo.packageWeight &&
                  !productInfo.packageDimensions && (
                    <div className="rounded-3xl border border-white/10 bg-black/35 p-6 text-center sm:p-8">
                      <p className="text-sm text-zinc-400">
                        No additional features or highlights provided.
                      </p>
                    </div>
                  )}
              </div>
            )}

            {selectedTab === "policy" && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {productInfo.warrantyDuration && (
                    <PolicyCard
                      icon={<ShieldIcon />}
                      title="Warranty"
                      text={`${productInfo.warrantyDuration}${
                        productInfo.warrantyDetails
                          ? ` - ${productInfo.warrantyDetails}`
                          : ""
                      }`}
                    />
                  )}
                  {productInfo.returnPolicy && (
                    <PolicyCard
                      icon={<ReturnIcon />}
                      title="Return Policy"
                      text={productInfo.returnPolicy}
                    />
                  )}
                  {productInfo.replacementPolicy && (
                    <PolicyCard
                      icon={<ReturnIcon />}
                      title="Replacement Policy"
                      text={productInfo.replacementPolicy}
                    />
                  )}
                  {productInfo.refundPolicy && (
                    <PolicyCard
                      icon={<ReturnIcon />}
                      title="Refund Policy"
                      text={productInfo.refundPolicy}
                    />
                  )}
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/35 p-6">
                  <h3 className="mb-4 text-lg font-bold text-white">
                    Delivery Information
                  </h3>
                  <div className="space-y-2 text-sm text-zinc-300">
                    {productInfo.deliveryInfo && (
                      <p>{productInfo.deliveryInfo}</p>
                    )}
                    {productInfo.deliveryTime && (
                      <p>
                        <span className="font-semibold text-white">Estimated Delivery:</span> {productInfo.deliveryTime}
                      </p>
                    )}
                    {productInfo.deliveryCharge !== null && (
                      <p>
                        <span className="font-semibold text-white">Delivery Charge:</span> {formatPrice(productInfo.deliveryCharge)}
                      </p>
                    )}
                    {productInfo.insideDhakaDeliveryCharge !== null && (
                      <p>
                        <span className="font-semibold text-white">Inside Dhaka Charge:</span> {formatPrice(productInfo.insideDhakaDeliveryCharge)}
                      </p>
                    )}
                    {productInfo.outsideDhakaDeliveryCharge !== null && (
                      <p>
                        <span className="font-semibold text-white">Outside Dhaka Charge:</span> {formatPrice(productInfo.outsideDhakaDeliveryCharge)}
                      </p>
                    )}
                    {productInfo.freeDelivery && (
                      <p className="text-emerald-400">
                        Free Delivery
                        {productInfo.freeDeliveryMinAmount !== null &&
                          ` (orders over ${formatPrice(productInfo.freeDeliveryMinAmount)})`}
                      </p>
                    )}
                    {productInfo.cashOnDelivery !== undefined && (
                      <p>
                        <span className="font-semibold text-white">Cash on Delivery:</span> {productInfo.cashOnDelivery ? "Available" : "Not Available"}
                      </p>
                    )}
                    {!productInfo.deliveryInfo &&
                      !productInfo.deliveryTime &&
                      productInfo.deliveryCharge === null &&
                      productInfo.insideDhakaDeliveryCharge === null &&
                      productInfo.outsideDhakaDeliveryCharge === null &&
                      !productInfo.freeDelivery &&
                      productInfo.cashOnDelivery === undefined && (
                        <p className="text-zinc-400">
                          No delivery information available.
                        </p>
                      )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-12 sm:mt-14">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-400 sm:text-sm">
                  More to explore
                </p>
                <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                  You May Also Like
                </h2>
              </div>

              <Link
                href="/products"
                className="rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-zinc-300 transition hover:border-orange-500 hover:text-orange-300"
              >
                View all products
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((related) => (
                <ProductCard key={related.id} product={related} />
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
};

const ProductShowcase = ({ product }: { product: Product }) => {
  const mediaItems = useMemo(() => buildMediaItems(product), [product]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [product.id]);

  const activeMedia = mediaItems[activeIndex];

  return (
    <div className="min-w-0 bg-zinc-950/90 shadow-[0_24px_90px_rgba(0,0,0,0.55)] backdrop-blur">
      <div className="relative overflow-hidden rounded-[1.4rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.16),transparent_38%),#050505] sm:rounded-[1.6rem]">
        <div className="aspect-square w-full sm:aspect-[1.08/1]">
          {activeMedia ? (
            activeMedia.type === "video" ? (
              <video
                src={activeMedia.url}
                controls
                playsInline
                preload="metadata"
                className="h-full w-full bg-black object-contain"
              />
            ) : (
              <img
                src={activeMedia.url}
                alt={product.name}
                className="h-full w-full object-contain p-3 sm:p-8"
              />
            )
          ) : (
            <div className="grid h-full place-items-center p-8 text-center">
              <div>
                <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-orange-500/10 text-orange-300">
                  <CartIcon className="h-7 w-7" />
                </div>
                <p className="text-sm font-semibold text-zinc-400">
                  No media available
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-orange-500/20 bg-black/60 px-3 py-1 text-xs font-bold text-orange-300 backdrop-blur sm:left-4 sm:top-4">
          Digital Xpress
        </div>
      </div>

      {mediaItems.length > 0 && (
        <div className="mt-4 flex max-w-full gap-2 overflow-x-auto pb-1 sm:gap-3">
          {mediaItems.map((item, index) => (
            <button
              key={`${item.url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cx(
                "group relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border bg-black transition sm:h-20 sm:w-20 lg:h-24 lg:w-24",
                activeIndex === index
                  ? "border-orange-500 shadow-[0_12px_30px_rgba(234,88,12,0.24)]"
                  : "border-white/10 hover:border-orange-500/60"
              )}
              aria-label={`Select ${item.label}`}
            >
              {item.type === "video" ? (
                <div className="relative grid h-full w-full place-items-center bg-zinc-950 text-xs font-black text-orange-300">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-orange-500 text-white sm:h-9 sm:w-9">
                    ▶
                  </span>
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] uppercase tracking-wide text-orange-300 sm:bottom-2 sm:text-[10px]">
                    Video
                  </span>
                </div>
              ) : (
                <img
                  src={item.url}
                  alt={item.label}
                  className="h-full w-full object-contain p-2"
                />
              )}

              {activeIndex === index && (
                <span className="absolute inset-x-3 bottom-1 h-1 rounded-full bg-orange-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const PolicyCard = ({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) => (
  <div className="rounded-3xl border border-white/10 bg-black/35 p-5 sm:p-6">
    <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-orange-500/10 text-orange-300">
      {icon}
    </div>

    <h3 className="text-lg font-black text-white">{title}</h3>

    <p className="mt-3 text-sm leading-6 text-zinc-400">{text}</p>

    <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-orange-300">
      <CheckIcon className="h-4 w-4" />
      Included
    </div>
  </div>
);

const ProductDetailsSkeleton = () => (
  <main className="min-h-screen overflow-x-hidden bg-black px-3 py-6 text-white sm:px-6 sm:py-8 lg:px-8">
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-6 h-5 w-56 animate-pulse rounded-full bg-white/10 sm:mb-8 sm:w-72" />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-8">
        <div className="rounded-[1.5rem] border border-white/10 bg-zinc-950 p-3 sm:rounded-[2rem] sm:p-4">
          <div className="aspect-square animate-pulse rounded-[1.4rem] bg-white/10 sm:rounded-[1.6rem] sm:aspect-[1.08/1]" />

          <div className="mt-4 flex gap-2 overflow-hidden sm:gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-16 w-16 shrink-0 animate-pulse rounded-2xl bg-white/10 sm:h-20 sm:w-20 lg:h-24 lg:w-24"
              />
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-zinc-950 p-4 sm:rounded-[2rem] sm:p-6">
          <div className="mb-4 flex gap-2">
            <div className="h-7 w-24 animate-pulse rounded-full bg-white/10" />
            <div className="h-7 w-20 animate-pulse rounded-full bg-white/10" />
          </div>

          <div className="h-8 w-11/12 animate-pulse rounded-full bg-white/10 sm:h-10" />
          <div className="mt-3 h-8 w-8/12 animate-pulse rounded-full bg-white/10 sm:h-10" />

          <div className="mt-6 space-y-3">
            <div className="h-4 w-full animate-pulse rounded-full bg-white/10" />
            <div className="h-4 w-10/12 animate-pulse rounded-full bg-white/10" />
            <div className="h-4 w-8/12 animate-pulse rounded-full bg-white/10" />
          </div>

          <div className="mt-7 h-32 animate-pulse rounded-3xl bg-white/10" />

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="h-12 animate-pulse rounded-2xl bg-white/10 sm:h-14" />
            <div className="h-12 animate-pulse rounded-2xl bg-white/10 sm:h-14" />
          </div>
        </div>
      </div>

      <div className="mt-8 h-72 animate-pulse rounded-[1.5rem] border border-white/10 bg-zinc-950 sm:mt-10 sm:rounded-[2rem]" />
    </div>
  </main>
);

export default ProductDetailsPage;