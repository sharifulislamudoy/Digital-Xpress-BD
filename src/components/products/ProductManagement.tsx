"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { FaEdit, FaEye, FaPlus, FaTrash, FaChevronDown } from "react-icons/fa";
import Link from "next/link";
import ConfirmationModal from "@/components/users/ConfirmationModal";
import type { Product, StockStatus } from "@/types/product";
import { formatPrice } from "@/lib/formatPrice";

interface ProductManagementProps {
  panelType: "admin" | "moderator";
}

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

const stockStatusOptions: { value: StockStatus; label: string }[] = [
  { value: "IN_STOCK", label: "In stock" },
  { value: "LIMITED_STOCK", label: "Limited stock" },
  { value: "LOW_STOCK", label: "Low stock" },
  { value: "OUT_OF_STOCK", label: "Out of stock" },
  { value: "PRE_ORDER", label: "Pre-order" },
  { value: "COMING_SOON", label: "Coming soon" },
];

function buildProductUpdateFormData(
  product: Product,
  updates: Partial<
    Pick<
      Product,
      | "stockStatus"
      | "isPublished"
      | "isFeatured"
      | "isNewArrival"
      | "isBestSeller"
      | "isTrending"
      | "isRecommended"
      | "isFlashSale"
    >
  >
) {
  const formData = new FormData();

  formData.append("name", product.name || "");
  formData.append("modelName", product.modelName || "");
  formData.append("shortDescription", product.shortDescription || "");
  formData.append("description", product.description || "");

  if (product.category?.id) {
    formData.append("categoryId", product.category.id);
  }

  if (product.subCategory?.id) {
    formData.append("subCategoryId", product.subCategory.id);
  }

  if (product.brand?.id) {
    formData.append("brandId", product.brand.id);
  }

  formData.append("mrp", String(product.mrp ?? 0));
  formData.append("costPrice", String(product.costPrice ?? 0));
  formData.append("sellingPrice", String(product.sellingPrice ?? 0));
  formData.append("stock", String(product.stock ?? 0));
  formData.append("stockStatus", updates.stockStatus || product.stockStatus || "IN_STOCK");
  formData.append("isPublished", String(updates.isPublished ?? product.isPublished ?? true));

  const booleanFields = [
    "isFeatured",
    "isNewArrival",
    "isBestSeller",
    "isTrending",
    "isRecommended",
    "isFlashSale",
  ] as const;

  for (const field of booleanFields) {
    const value = updates[field] ?? product[field] ?? false;
    formData.append(field, String(value));
  }

  formData.append("removeExtraImageIds", JSON.stringify([]));

  return formData;
}

export default function ProductManagement({ panelType }: ProductManagementProps) {
  const { data: session } = useSession();
  const accessToken = (session?.user as any)?.accessToken;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    product: Product | null;
  }>({
    open: false,
    product: null,
  });

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${accessToken}`,
    }),
    [accessToken]
  );

  const createHref =
    panelType === "admin"
      ? "/admin/products/create-product"
      : "/moderator/products/create-products";

  const getEditHref = (productId: string) =>
    panelType === "admin"
      ? `/admin/products/${productId}/edit`
      : `/moderator/products/${productId}/edit`;

  const fetchProducts = useCallback(async () => {
    if (!accessToken) return;

    try {
      if (!API_BASE) {
        toast.error("NEXT_PUBLIC_BACKEND_URL is missing");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/v1/products/admin`, {
        headers: authHeaders,
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        setProducts(data.products || []);
      } else {
        toast.error(data.message || "Failed to load products");
      }
    } catch {
      toast.error("Error loading products");
    } finally {
      setLoading(false);
    }
  }, [accessToken, authHeaders]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateProductInline = async (
    product: Product,
    updates: Partial<
      Pick<
        Product,
        | "stockStatus"
        | "isPublished"
        | "isFeatured"
        | "isNewArrival"
        | "isBestSeller"
        | "isTrending"
        | "isRecommended"
        | "isFlashSale"
      >
    >,
    successMessage: string
  ) => {
    if (!accessToken) {
      toast.error("You are not authorized");
      return;
    }

    if (!API_BASE) {
      toast.error("NEXT_PUBLIC_BACKEND_URL is missing");
      return;
    }

    if (!product.category?.id) {
      toast.error("This product has no category. Please update it from edit page first.");
      return;
    }

    if (!product.brand?.id) {
      toast.error("This product has no brand. Please update it from edit page first.");
      return;
    }

    const previousProducts = products;

    setUpdatingProductId(product.id);

    setProducts((prev) =>
      prev.map((item) => (item.id === product.id ? { ...item, ...updates } : item))
    );

    try {
      const res = await fetch(`${API_BASE}/api/v1/products/${product.id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: buildProductUpdateFormData(product, updates),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setProducts(previousProducts);
        toast.error(data.message || "Failed to update product");
        return;
      }

      if (data.product) {
        setProducts((prev) =>
          prev.map((item) => (item.id === product.id ? data.product : item))
        );
      }

      toast.success(successMessage);
    } catch {
      setProducts(previousProducts);
      toast.error("Error updating product");
    } finally {
      setUpdatingProductId(null);
    }
  };

  const handleStockStatusChange = async (
    product: Product,
    nextStockStatus: StockStatus
  ) => {
    if (product.stockStatus === nextStockStatus) return;
    await updateProductInline(
      product,
      { stockStatus: nextStockStatus },
      "Stock status updated"
    );
  };

  const handlePublishedToggle = async (product: Product) => {
    const nextStatus = !(product.isPublished ?? false);
    await updateProductInline(
      product,
      { isPublished: nextStatus },
      nextStatus ? "Product published" : "Product hidden"
    );
  };

  const handleBooleanToggle = async (
    product: Product,
    field: keyof Pick<
      Product,
      | "isFeatured"
      | "isNewArrival"
      | "isBestSeller"
      | "isTrending"
      | "isRecommended"
      | "isFlashSale"
    >
  ) => {
    const current = product[field] ?? false;
    const next = !current;
    await updateProductInline(
      product,
      { [field]: next },
      `${field} ${next ? "enabled" : "disabled"}`
    );
  };

  const handleDeleteProduct = async () => {
    if (!deleteModal.product) return;

    setDeletingProductId(deleteModal.product.id);

    try {
      if (!API_BASE) {
        toast.error("NEXT_PUBLIC_BACKEND_URL is missing");
        return;
      }

      const res = await fetch(`${API_BASE}/api/v1/products/${deleteModal.product.id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Product deleted successfully");
        setProducts((prev) =>
          prev.filter((item) => item.id !== deleteModal.product?.id)
        );
        setDeleteModal({ open: false, product: null });
      } else {
        toast.error(data.message || "Failed to delete product");
      }
    } catch {
      toast.error("Error deleting product");
    } finally {
      setDeletingProductId(null);
    }
  };

  // Toggle dropdown explicitly
  const toggleDropdown = (productId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setOpenDropdownId((prev) => (prev === productId ? null : productId));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-gray-400">Loading products...</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Product Management {panelType === "moderator" ? "(Moderator)" : ""}
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage product info, pricing, stock status and publishing without opening
            the edit page every time.
          </p>
        </div>

        <Link
          href={createHref}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
        >
          <FaPlus size={13} /> Create Product
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-800 bg-[#0a0a0a]">
        <table className="w-full divide-y divide-gray-800">
          <thead className="bg-gray-950">
            <tr>
              <th className="px-3 py-2 text-center text-[11px] font-medium uppercase text-gray-400">
                Actions
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-medium uppercase text-gray-400">
                Product
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-medium uppercase text-gray-400">
                SKU
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-medium uppercase text-gray-400">
                Category
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-medium uppercase text-gray-400">
                Brand
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-medium uppercase text-gray-400">
                Cost
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-medium uppercase text-gray-400">
                MRP
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-medium uppercase text-gray-400">
                Sell
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-medium uppercase text-gray-400">
                Stock
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-medium uppercase text-gray-400">
                Stock Status
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-medium uppercase text-gray-400">
                Publish
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-800">
            {products.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-12 text-center text-gray-400">
                  No products found. Create your first product.
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const currentStockStatus = product.stockStatus || "IN_STOCK";
                const isRowUpdating = updatingProductId === product.id;
                const isPublished = product.isPublished ?? false;
                const isDropdownOpen = openDropdownId === product.id;

                return (
                  <tr key={product.id} className="hover:bg-gray-950/70">
                    <td className="px-3 py-2 text-center">
                      <div className="relative inline-block" ref={dropdownRef}>
                        <button
                          type="button"
                          onClick={(e) => toggleDropdown(product.id, e)}
                          className="rounded-lg border border-gray-700 p-1.5 text-gray-300 transition hover:border-orange-400 hover:text-orange-400 disabled:opacity-50"
                          disabled={isRowUpdating}
                        >
                          <FaChevronDown size={13} />
                        </button>

                        {isDropdownOpen && (
                          <div
                            className="absolute left-0 z-20 mt-1 min-w-[190px] rounded-xl border border-gray-700 bg-[#0f0f0f] p-2.5 shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="space-y-2">
                              <Link
                                href={`/products/${encodeURIComponent(product.slug || product.id)}`}
                                target="_blank"
                                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 transition hover:bg-orange-500/20 hover:text-orange-400"
                              >
                                <FaEye size={13} /> View Product
                              </Link>

                              <Link
                                href={getEditHref(product.id)}
                                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 transition hover:bg-orange-500/20 hover:text-orange-400"
                              >
                                <FaEdit size={13} /> Edit Product
                              </Link>

                              <button
                                type="button"
                                onClick={() => setDeleteModal({ open: true, product })}
                                disabled={deletingProductId === product.id}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-red-400 transition hover:bg-red-500/20"
                              >
                                <FaTrash size={13} /> Delete Product
                              </button>

                              <hr className="border-gray-700" />

                              <div className="space-y-1.5">
                                <ToggleRow
                                  label="Featured"
                                  checked={product.isFeatured ?? false}
                                  onChange={() =>
                                    handleBooleanToggle(product, "isFeatured")
                                  }
                                  disabled={isRowUpdating}
                                />
                                <ToggleRow
                                  label="New Arrival"
                                  checked={product.isNewArrival ?? false}
                                  onChange={() =>
                                    handleBooleanToggle(product, "isNewArrival")
                                  }
                                  disabled={isRowUpdating}
                                />
                                <ToggleRow
                                  label="Best Seller"
                                  checked={product.isBestSeller ?? false}
                                  onChange={() =>
                                    handleBooleanToggle(product, "isBestSeller")
                                  }
                                  disabled={isRowUpdating}
                                />
                                <ToggleRow
                                  label="Trending"
                                  checked={product.isTrending ?? false}
                                  onChange={() =>
                                    handleBooleanToggle(product, "isTrending")
                                  }
                                  disabled={isRowUpdating}
                                />
                                <ToggleRow
                                  label="Recommended"
                                  checked={product.isRecommended ?? false}
                                  onChange={() =>
                                    handleBooleanToggle(product, "isRecommended")
                                  }
                                  disabled={isRowUpdating}
                                />
                                <ToggleRow
                                  label="Flash Sale"
                                  checked={product.isFlashSale ?? false}
                                  onChange={() =>
                                    handleBooleanToggle(product, "isFlashSale")
                                  }
                                  disabled={isRowUpdating}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-gray-800 bg-black">
                          {product.mainImageUrl ? (
                            <img
                              src={product.mainImageUrl}
                              alt={product.name}
                              className="h-full w-full object-contain p-1"
                            />
                          ) : (
                            <span className="text-[9px] text-gray-600">No img</span>
                          )}
                        </div>
                        <p className="line-clamp-2 text-sm font-semibold text-white">
                          {product.name}
                        </p>
                      </div>
                    </td>

                    <td className="px-3 py-2 text-xs font-mono text-gray-300">
                      {product.sku || "—"}
                    </td>

                    <td className="px-3 py-2">
                      <div className="space-y-0.5">
                        <span className="text-xs font-medium text-gray-300">
                          {product.category?.name || "N/A"}
                        </span>
                        <span className="block text-[10px] text-gray-500">
                          {product.subCategory?.name || "No sub"}
                        </span>
                        <span className="block text-[10px] text-gray-500">
                          {product.modelName || "No model"}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-2 text-xs font-medium text-gray-300">
                      {product.brand?.name || "N/A"}
                    </td>

                    <td className="px-3 py-2 text-xs font-semibold text-gray-300">
                      {formatPrice(product.costPrice || 0)}
                    </td>

                    <td className="px-3 py-2 text-xs font-semibold text-gray-300">
                      {formatPrice(product.mrp)}
                    </td>

                    <td className="px-3 py-2 text-xs font-semibold text-orange-400">
                      {formatPrice(product.sellingPrice)}
                    </td>

                    <td className="px-3 py-2 text-xs font-semibold text-gray-300">
                      {typeof product.stock === "number" ? product.stock : "—"}
                    </td>

                    <td className="px-3 py-2">
                      <select
                        value={currentStockStatus}
                        disabled={isRowUpdating}
                        onChange={(event) =>
                          handleStockStatusChange(
                            product,
                            event.target.value as StockStatus
                          )
                        }
                        className={`w-[120px] rounded-lg border px-2 py-1 text-[10px] font-semibold outline-none transition focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-60 ${
                          currentStockStatus === "OUT_OF_STOCK"
                            ? "border-red-500/30 bg-red-500/10 text-red-300"
                            : currentStockStatus === "COMING_SOON"
                            ? "border-purple-500/30 bg-purple-500/10 text-purple-300"
                            : currentStockStatus === "PRE_ORDER"
                            ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
                            : currentStockStatus === "LOW_STOCK"
                            ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
                            : currentStockStatus === "LIMITED_STOCK"
                            ? "border-orange-500/30 bg-orange-500/10 text-orange-300"
                            : "border-green-500/30 bg-green-500/10 text-green-300"
                        }`}
                      >
                        {stockStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-3 py-2">
                      <div className="flex flex-col items-center gap-0.5">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isPublished}
                          disabled={isRowUpdating}
                          onClick={() => handlePublishedToggle(product)}
                          className={`relative inline-flex h-5 w-10 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            isPublished ? "bg-green-500" : "bg-gray-700"
                          }`}
                          title={isPublished ? "Click to hide" : "Click to publish"}
                        >
                          <span
                            className={`absolute left-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
                              isPublished ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                        <span
                          className={`text-[9px] font-semibold ${
                            isPublished ? "text-green-300" : "text-gray-400"
                          }`}
                        >
                          {isPublished ? "Live" : "Draft"}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmationModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, product: null })}
        onConfirm={handleDeleteProduct}
        title="Delete Product"
        message="Are you sure you want to delete this product? This will also remove related images and video from Cloudinary."
        confirmText="Yes, Delete"
        confirmVariant="danger"
        isLoading={deletingProductId === deleteModal.product?.id}
      />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-gray-900">
      <span className="text-[10px] font-medium text-gray-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={onChange}
        className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition ${
          checked ? "bg-orange-500" : "bg-gray-600"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <span
          className={`absolute left-0.5 h-3.5 w-3.5 rounded-full bg-white shadow transition ${
            checked ? "translate-x-3.5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}