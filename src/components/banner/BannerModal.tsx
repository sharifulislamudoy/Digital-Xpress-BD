"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCheckCircle,
  FaLink,
  FaSearch,
  FaSpinner,
  FaTimes,
  FaUpload,
} from "react-icons/fa";

export interface BannerFormData {
  image: File | null;
  productLink: string;
  isPublished: boolean;
}

interface BannerModalProps {
  isOpen: boolean;
  title: string;
  initialData?: {
    imageUrl?: string;
    productLink?: string | null;
    isPublished?: boolean;
  } | null;
  isEdit?: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (data: BannerFormData) => void;
}

interface ProductSearchItem {
  id: string;
  name: string;
  slug?: string | null;
  modelName?: string | null;
  mainImageUrl?: string | null;
  image?: string | null;
  brand?: {
    name?: string | null;
  } | null;
  category?: {
    name?: string | null;
    slug?: string | null;
  } | null;
  subCategory?: {
    name?: string | null;
  } | null;
  sellingPrice?: number | string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const getProductsEndpoint = () => {
  if (API_BASE_URL) return `${API_BASE_URL}/api/v1/products`;
  return "/api/v1/products";
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const getArrayFromPayload = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;

  if (!isRecord(payload)) return [];

  const directKeys = ["products", "data", "items", "results"];

  for (const key of directKeys) {
    const value = payload[key];

    if (Array.isArray(value)) return value;

    if (isRecord(value)) {
      for (const nestedKey of directKeys) {
        const nestedValue = value[nestedKey];
        if (Array.isArray(nestedValue)) return nestedValue;
      }
    }
  }

  return [];
};

const normalizeProducts = (payload: unknown): ProductSearchItem[] => {
  return getArrayFromPayload(payload)
    .filter(isRecord)
    .map((item) => item as unknown as ProductSearchItem)
    .filter((product) => Boolean(product.id && product.name));
};

function slugify(value: unknown) {
  if (!value) return "products";

  return String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getProductHref(product: ProductSearchItem) {
  const categorySlug = slugify(product.category?.slug || product.category?.name);
  const productSlug = slugify(product.slug || product.id || product.name);

  return `/products/${encodeURIComponent(categorySlug)}/${encodeURIComponent(
    productSlug
  )}`;
}

function formatProductPrice(value: ProductSearchItem["sellingPrice"]) {
  if (value === null || value === undefined || value === "") return "";

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) return "";

  return `৳${numericValue.toLocaleString("en-BD")}`;
}

export default function BannerModal({
  isOpen,
  title,
  initialData,
  isEdit = false,
  isLoading = false,
  onClose,
  onConfirm,
}: BannerModalProps) {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [productLink, setProductLink] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  const [productSearch, setProductSearch] = useState("");
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("");
  const [productResults, setProductResults] = useState<ProductSearchItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchItem | null>(
    null
  );
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setImage(null);
      setPreview(initialData?.imageUrl || "");
      setProductLink(initialData?.productLink || "");
      setIsPublished(initialData?.isPublished ?? true);

      setProductSearch("");
      setDebouncedProductSearch("");
      setProductResults([]);
      setSelectedProduct(null);
      setProductLoading(false);
      setProductError("");
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedProductSearch(productSearch.trim());
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [productSearch]);

  useEffect(() => {
    const query = debouncedProductSearch.trim();

    if (!isOpen) return;

    if (query.length < 2) {
      setProductResults([]);
      setProductError("");
      setProductLoading(false);
      return;
    }

    if (selectedProduct?.name && query === selectedProduct.name.trim()) {
      setProductResults([]);
      setProductError("");
      setProductLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchProducts = async () => {
      setProductLoading(true);
      setProductError("");

      try {
        const url = new URL(
          getProductsEndpoint(),
          typeof window !== "undefined"
            ? window.location.origin
            : "http://localhost:3000"
        );

        url.searchParams.set("search", query);
        url.searchParams.set("limit", "8");

        const res = await fetch(url.toString(), {
          signal: controller.signal,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Failed to search products");
        }

        setProductResults(normalizeProducts(data));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;

        setProductResults([]);
        setProductError("Product search failed. Please try again.");
      } finally {
        setProductLoading(false);
      }
    };

    fetchProducts();

    return () => controller.abort();
  }, [debouncedProductSearch, isOpen, selectedProduct?.name]);

  const handleImageChange = (file: File | null) => {
    setImage(file);

    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreview(imageUrl);
    } else {
      setPreview(initialData?.imageUrl || "");
    }
  };

  const handleProductSelect = (product: ProductSearchItem) => {
    const href = getProductHref(product);

    setSelectedProduct(product);
    setProductSearch(product.name);
    setProductLink(href);
    setProductResults([]);
    setProductError("");
  };

  const handleProductSearchChange = (value: string) => {
    setProductSearch(value);
    setSelectedProduct(null);
  };

  const handleClearSelectedProduct = () => {
    setSelectedProduct(null);
    setProductSearch("");
    setProductResults([]);
    setProductLink("");
    setProductError("");
  };

  const handleSubmit = () => {
    if (!isEdit && !image) return;

    onConfirm({
      image,
      productLink: productLink.trim(),
      isPublished,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/80 p-4"
          onClick={isLoading ? undefined : onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-700 p-5">
              <h2 className="text-xl font-bold text-white">{title}</h2>

              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="text-gray-400 transition hover:text-white disabled:opacity-50"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Banner Image {!isEdit && <span className="text-red-400">*</span>}
                </label>

                <label className="flex min-h-[170px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-700 bg-gray-800/60 transition hover:bg-gray-800">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Banner preview"
                      className="h-[170px] w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <FaUpload size={28} />
                      <span className="text-sm">Click to upload banner image</span>
                      <span className="text-xs text-gray-500">
                        PNG, JPG, WEBP. Max 5MB.
                      </span>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isLoading}
                    onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              <div className="relative">
                <label className="mb-2 block text-sm font-medium text-white">
                  Search Product{" "}
                  <span className="text-gray-500">(select to auto-fill link)</span>
                </label>

                <div className="relative">
                  <FaSearch
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />

                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => handleProductSearchChange(e.target.value)}
                    disabled={isLoading}
                    placeholder="Search product by name, brand, model..."
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-9 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                  />

                  {productLoading && (
                    <FaSpinner
                      size={15}
                      className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-orange-400"
                    />
                  )}
                </div>

                {productSearch.trim().length > 0 &&
                  productSearch.trim().length < 2 && (
                    <p className="mt-2 text-xs text-gray-500">
                      Type at least 2 characters to search products.
                    </p>
                  )}

                {productError && (
                  <p className="mt-2 text-xs text-red-400">{productError}</p>
                )}

                <AnimatePresence>
                  {productResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-gray-700 bg-gray-950 shadow-2xl"
                    >
                      {productResults.map((product) => {
                        const href = getProductHref(product);
                        const productImage =
                          product.mainImageUrl || product.image || "";
                        const price = formatProductPrice(product.sellingPrice);

                        return (
                          <button
                            key={product.id}
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleProductSelect(product)}
                            className="flex w-full gap-3 border-b border-gray-800 p-3 text-left transition last:border-b-0 hover:bg-gray-900 disabled:opacity-50"
                          >
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-700 bg-black">
                              {productImage ? (
                                <img
                                  src={productImage}
                                  alt={product.name}
                                  className="h-full w-full object-contain p-1"
                                />
                              ) : (
                                <div className="grid h-full w-full place-items-center text-xs text-gray-500">
                                  No img
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-1 font-medium text-white">
                                {product.name}
                              </p>

                              <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">
                                {product.brand?.name || "Digital Xpress"}
                                {product.category?.name
                                  ? ` | ${product.category.name}`
                                  : ""}
                                {product.modelName ? ` | ${product.modelName}` : ""}
                              </p>

                              <div className="mt-1 flex items-center justify-between gap-2">
                                <span className="line-clamp-1 text-xs text-orange-400">
                                  {href}
                                </span>

                                {price && (
                                  <span className="shrink-0 text-xs font-semibold text-gray-300">
                                    {price}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                {!productLoading &&
                  debouncedProductSearch.length >= 2 &&
                  productResults.length === 0 &&
                  !productError &&
                  !selectedProduct && (
                    <p className="mt-2 text-xs text-gray-500">
                      No product found for this search.
                    </p>
                  )}

                {selectedProduct && (
                  <div className="mt-3 rounded-xl border border-orange-500/30 bg-orange-500/10 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-semibold text-orange-300">
                          <FaCheckCircle size={14} />
                          Product selected
                        </p>

                        <p className="mt-1 line-clamp-1 text-sm text-white">
                          {selectedProduct.name}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleClearSelectedProduct}
                        disabled={isLoading}
                        className="shrink-0 rounded-lg bg-gray-800 px-2.5 py-1.5 text-xs text-gray-300 transition hover:bg-gray-700 disabled:opacity-50"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Product Link <span className="text-gray-500">(optional)</span>
                </label>

                <div className="relative">
                  <FaLink
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />

                  <input
                    type="text"
                    value={productLink}
                    onChange={(e) => setProductLink(e.target.value)}
                    disabled={isLoading}
                    placeholder="/products/category-slug/product-slug or full URL"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-9 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                  />
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  Product select korle card er same product details link ekhane
                  automatically boshe jabe.
                </p>
              </div>

              {isEdit && (
                <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 px-4 py-3">
                  <div>
                    <p className="font-medium text-white">Published Status</p>
                    <p className="text-sm text-gray-400">
                      Turn off if you want to hide this banner.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setIsPublished((prev) => !prev)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition disabled:opacity-50 ${
                      isPublished ? "bg-orange-500" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-black transition ${
                        isPublished ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-700 p-5">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-lg bg-gray-700 px-4 py-2 text-white transition hover:bg-gray-600 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || (!isEdit && !image)}
                className="rounded-lg bg-orange-600 px-4 py-2 text-white transition hover:bg-orange-700 disabled:opacity-50"
              >
                {isLoading
                  ? "Processing..."
                  : isEdit
                  ? "Update Banner"
                  : "Create Banner"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}