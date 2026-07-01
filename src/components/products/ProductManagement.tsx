"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  FaChevronDown,
  FaEdit,
  FaEye,
  FaFolder,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
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
  >,
) {
  const formData = new FormData();

  formData.append("name", product.name || "");
  formData.append("slug", product.slug || "");
  formData.append("productType", product.productType || "single");
  formData.append("sku", product.sku || "");
  formData.append("barcode", product.barcode || "");
  formData.append("modelName", product.modelName || "");
  formData.append("shortDescription", product.shortDescription || "");
  formData.append("description", product.description || "");

  formData.append("keyFeatures", JSON.stringify(product.keyFeatures || []));
  formData.append("highlights", JSON.stringify(product.highlights || []));
  formData.append("specifications", JSON.stringify(product.specifications || null));
  formData.append("tags", JSON.stringify(product.tags || []));
  formData.append("searchKeywords", JSON.stringify(product.searchKeywords || []));

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
  formData.append(
    "stockStatus",
    updates.stockStatus || product.stockStatus || "IN_STOCK",
  );

  formData.append("lowStockAlertQuantity", String(product.lowStockAlertQuantity ?? 5));
  formData.append("inStock", String(product.inStock ?? true));
  formData.append(
    "isPublished",
    String(updates.isPublished ?? product.isPublished ?? true),
  );

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

  formData.append("mainImageAlt", product.mainImageAlt || "");
  formData.append("hoverImageAlt", product.hoverImageAlt || "");
  formData.append("removeExtraImageIds", JSON.stringify([]));

  formData.append("warrantyDuration", product.warrantyDuration || "");
  formData.append("warrantyDetails", product.warrantyDetails || "");
  formData.append("returnPolicy", product.returnPolicy || "");
  formData.append("replacementPolicy", product.replacementPolicy || "");
  formData.append("refundPolicy", product.refundPolicy || "");
  formData.append("deliveryInfo", product.deliveryInfo || "");
  formData.append("deliveryTime", product.deliveryTime || "");
  formData.append("cashOnDelivery", String(product.cashOnDelivery ?? true));
  formData.append("freeDelivery", String(product.freeDelivery ?? false));
  formData.append("packageIncludes", JSON.stringify(product.packageIncludes || []));
  formData.append("packageWeight", product.packageWeight || "");
  formData.append("packageDimensions", product.packageDimensions || "");

  return formData;
}

export default function ProductManagement({
  panelType,
}: ProductManagementProps) {
  const { data: session } = useSession();
  const accessToken = (session?.user as any)?.accessToken;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(
    null,
  );
  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null,
  );
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
    [accessToken],
  );

  const createHref =
    panelType === "admin"
      ? "/admin/products/create-product"
      : "/moderator/products/create-products";

  const categoryHref =
    panelType === "admin" ? "/admin/categories" : "/moderator/categories";

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
    successMessage: string,
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
      toast.error(
        "This product has no category. Please update it from edit page first.",
      );
      return;
    }

    if (!product.brand?.id) {
      toast.error(
        "This product has no brand. Please update it from edit page first.",
      );
      return;
    }

    const previousProducts = products;

    setUpdatingProductId(product.id);

    setProducts((prev) =>
      prev.map((item) =>
        item.id === product.id ? { ...item, ...updates } : item,
      ),
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
          prev.map((item) => (item.id === product.id ? data.product : item)),
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
    nextStockStatus: StockStatus,
  ) => {
    if (product.stockStatus === nextStockStatus) return;

    await updateProductInline(
      product,
      { stockStatus: nextStockStatus },
      "Stock status updated",
    );
  };

  const handlePublishedToggle = async (product: Product) => {
    const nextStatus = !(product.isPublished ?? false);

    await updateProductInline(
      product,
      { isPublished: nextStatus },
      nextStatus ? "Product published" : "Product hidden",
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
    >,
  ) => {
    const current = product[field] ?? false;
    const next = !current;

    await updateProductInline(
      product,
      { [field]: next },
      `${field} ${next ? "enabled" : "disabled"}`,
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

      const res = await fetch(
        `${API_BASE}/api/v1/products/${deleteModal.product.id}`,
        {
          method: "DELETE",
          headers: authHeaders,
        },
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to delete product");
        return;
      }

      toast.success("Product deleted successfully");
      setDeleteModal({ open: false, product: null });
      await fetchProducts();
    } catch {
      toast.error("Error deleting product");
    } finally {
      setDeletingProductId(null);
    }
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
            Manage products only. Category and sub-category are managed from the
            separate category page.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={categoryHref}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/10 px-4 py-2.5 text-sm font-semibold text-orange-300 transition hover:bg-orange-500/20"
          >
            <FaFolder size={13} />
            Categories
          </Link>

          <Link
            href={createHref}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
          >
            <FaPlus size={13} />
            Add Product
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-800 bg-[#0a0a0a]">
        <table className="w-full divide-y divide-gray-800">
          <thead className="bg-gray-950">
            <tr>
              <th className="px-3 py-3 text-left text-[11px] font-medium uppercase text-gray-400">
                Product
              </th>
              <th className="px-3 py-3 text-left text-[11px] font-medium uppercase text-gray-400">
                Category
              </th>
              <th className="px-3 py-3 text-left text-[11px] font-medium uppercase text-gray-400">
                Brand
              </th>
              <th className="px-3 py-3 text-right text-[11px] font-medium uppercase text-gray-400">
                Price
              </th>
              <th className="px-3 py-3 text-center text-[11px] font-medium uppercase text-gray-400">
                Stock
              </th>
              <th className="px-3 py-3 text-center text-[11px] font-medium uppercase text-gray-400">
                Stock Status
              </th>
              <th className="px-3 py-3 text-center text-[11px] font-medium uppercase text-gray-400">
                Publish
              </th>
              <th className="px-3 py-3 text-center text-[11px] font-medium uppercase text-gray-400">
                Flags
              </th>
              <th className="px-3 py-3 text-right text-[11px] font-medium uppercase text-gray-400">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-800">
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-12 text-center text-gray-400"
                >
                  No product found.
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const isRowUpdating = updatingProductId === product.id;
                const currentStockStatus = product.stockStatus || "IN_STOCK";
                const isPublished = product.isPublished ?? true;
                const stock = Number(product.stock ?? 0);

                return (
                  <tr key={product.id} className="hover:bg-gray-950">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-gray-800 bg-gray-950">
                          <img
                            src={product.mainImageUrl || product.image || ""}
                            alt={product.name}
                            className="h-full w-full object-contain p-1"
                          />
                        </div>

                        <div className="min-w-[190px]">
                          <p className="line-clamp-1 text-sm font-semibold text-white">
                            {product.name}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            SKU: {product.sku || "N/A"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <p className="text-xs font-semibold text-gray-200">
                        {product.category?.name || "N/A"}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {product.subCategory?.name || "No sub-category"}
                      </p>
                    </td>

                    <td className="px-3 py-3">
                      <p className="text-xs text-gray-300">
                        {product.brand?.name || "N/A"}
                      </p>
                    </td>

                    <td className="px-3 py-3 text-right">
                      <p className="text-sm font-bold text-orange-400">
                        {formatPrice(product.sellingPrice)}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        MRP: {formatPrice(product.mrp)}
                      </p>
                    </td>

                    <td className="px-3 py-3 text-center">
                      <div
                        className={`inline-flex min-w-12 items-center justify-center rounded-lg px-2 py-1 text-xs font-bold ${
                          stock <= 0
                            ? "bg-red-500/10 text-red-300"
                            : stock <= Number(product.lowStockAlertQuantity ?? 5)
                              ? "bg-yellow-500/10 text-yellow-300"
                              : "bg-green-500/10 text-green-300"
                        }`}
                      >
                        {stock}
                      </div>
                    </td>

                    <td className="px-3 py-3 text-center">
                      <select
                        value={currentStockStatus}
                        disabled={isRowUpdating}
                        onChange={(event) =>
                          handleStockStatusChange(
                            product,
                            event.target.value as StockStatus,
                          )
                        }
                        className={`w-[125px] rounded-lg border px-2 py-1 text-[10px] font-semibold outline-none transition focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-60 ${
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

                    <td className="px-3 py-3 text-center">
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

                    <td className="px-3 py-3 text-center">
                      <div className="relative inline-block" ref={dropdownRef}>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenDropdownId((current) =>
                              current === product.id ? null : product.id,
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-700 px-2 py-1 text-xs text-gray-300 transition hover:border-orange-500 hover:text-orange-400"
                        >
                          Manage
                          <FaChevronDown size={10} />
                        </button>

                        {openDropdownId === product.id && (
                          <div className="absolute right-0 z-30 mt-2 w-52 rounded-xl border border-gray-800 bg-black p-2 shadow-xl">
                            <ToggleRow
                              label="Featured"
                              checked={product.isFeatured ?? false}
                              onClick={() =>
                                handleBooleanToggle(product, "isFeatured")
                              }
                            />
                            <ToggleRow
                              label="New Arrival"
                              checked={product.isNewArrival ?? false}
                              onClick={() =>
                                handleBooleanToggle(product, "isNewArrival")
                              }
                            />
                            <ToggleRow
                              label="Best Seller"
                              checked={product.isBestSeller ?? false}
                              onClick={() =>
                                handleBooleanToggle(product, "isBestSeller")
                              }
                            />
                            <ToggleRow
                              label="Trending"
                              checked={product.isTrending ?? false}
                              onClick={() =>
                                handleBooleanToggle(product, "isTrending")
                              }
                            />
                            <ToggleRow
                              label="Recommended"
                              checked={product.isRecommended ?? false}
                              onClick={() =>
                                handleBooleanToggle(product, "isRecommended")
                              }
                            />
                            <ToggleRow
                              label="Flash Sale"
                              checked={product.isFlashSale ?? false}
                              onClick={() =>
                                handleBooleanToggle(product, "isFlashSale")
                              }
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/products/${product.slug || product.id}`}
                          target="_blank"
                          className="rounded-lg border border-gray-700 p-2 text-gray-300 transition hover:border-blue-500 hover:text-blue-400"
                          title="View"
                        >
                          <FaEye size={13} />
                        </Link>

                        <Link
                          href={getEditHref(product.id)}
                          className="rounded-lg border border-gray-700 p-2 text-gray-300 transition hover:border-orange-500 hover:text-orange-400"
                          title="Edit"
                        >
                          <FaEdit size={13} />
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            setDeleteModal({ open: true, product })
                          }
                          className="rounded-lg border border-red-500/30 p-2 text-red-400 transition hover:bg-red-500/10"
                          title="Delete"
                        >
                          <FaTrash size={13} />
                        </button>
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
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs text-gray-300 transition hover:bg-gray-900"
    >
      <span>{label}</span>
      <span
        className={`relative h-4 w-8 rounded-full transition ${
          checked ? "bg-orange-500" : "bg-gray-700"
        }`}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition ${
            checked ? "left-4" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}