"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  FaChevronDown,
  FaEdit,
  FaEye,
  FaImages,
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

type CategoryFormState = {
  categoryName: string;
  categorySlug: string;
  categoryDescription: string;
  categoryIconSvg: string;
  categorySortOrder: string;
  categoryIsPublished: boolean;
  categorySeoTitle: string;
  categorySeoDescription: string;
  categorySeoKeywords: string;

  createSubCategory: boolean;
  subCategoryName: string;
  subCategorySlug: string;
  subCategoryDescription: string;
  subCategoryIconSvg: string;
  subCategorySortOrder: string;
  subCategoryIsPublished: boolean;
  subCategorySeoTitle: string;
  subCategorySeoDescription: string;
  subCategorySeoKeywords: string;
};

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

const stockStatusOptions: { value: StockStatus; label: string }[] = [
  { value: "IN_STOCK", label: "In stock" },
  { value: "LIMITED_STOCK", label: "Limited stock" },
  { value: "LOW_STOCK", label: "Low stock" },
  { value: "OUT_OF_STOCK", label: "Out of stock" },
  { value: "PRE_ORDER", label: "Pre-order" },
  { value: "COMING_SOON", label: "Coming soon" },
];

const defaultCategoryForm: CategoryFormState = {
  categoryName: "",
  categorySlug: "",
  categoryDescription: "",
  categoryIconSvg: "",
  categorySortOrder: "0",
  categoryIsPublished: true,
  categorySeoTitle: "",
  categorySeoDescription: "",
  categorySeoKeywords: "",

  createSubCategory: true,
  subCategoryName: "",
  subCategorySlug: "",
  subCategoryDescription: "",
  subCategoryIconSvg: "",
  subCategorySortOrder: "0",
  subCategoryIsPublished: true,
  subCategorySeoTitle: "",
  subCategorySeoDescription: "",
  subCategorySeoKeywords: "",
};

const inputClass =
  "w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-orange-500";
const textareaClass = `${inputClass} min-h-[100px] resize-y`;
const labelClass = "mb-2 block text-sm font-medium text-gray-300";

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
  formData.append(
    "stockStatus",
    updates.stockStatus || product.stockStatus || "IN_STOCK",
  );
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

  formData.append("removeExtraImageIds", JSON.stringify([]));

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
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

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

      if (data.success) {
        toast.success("Product deleted successfully");
        setProducts((prev) =>
          prev.filter((item) => item.id !== deleteModal.product?.id),
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
            Manage product info, pricing, manual stock status and publishing
            without opening the edit page every time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setCategoryModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/10 px-4 py-2.5 text-sm font-semibold text-orange-300 transition hover:bg-orange-500/20"
          >
            <FaPlus size={13} /> Category
          </button>

          <Link
            href={createHref}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
          >
            <FaPlus size={13} /> Create
          </Link>
        </div>
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
                <td
                  colSpan={11}
                  className="px-6 py-12 text-center text-gray-400"
                >
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
                          onClick={(event) =>
                            toggleDropdown(product.id, event)
                          }
                          className="rounded-lg border border-gray-700 p-1.5 text-gray-300 transition hover:border-orange-400 hover:text-orange-400 disabled:opacity-50"
                          disabled={isRowUpdating}
                        >
                          <FaChevronDown size={13} />
                        </button>

                        {isDropdownOpen && (
                          <div
                            className="absolute left-0 z-20 mt-1 min-w-[190px] rounded-xl border border-gray-700 bg-[#0f0f0f] p-2.5 shadow-xl"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <div className="space-y-2">
                              <Link
                                href={`/products/${encodeURIComponent(
                                  product.slug || product.id,
                                )}`}
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
                                onClick={() =>
                                  setDeleteModal({ open: true, product })
                                }
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
                            <span className="text-[9px] text-gray-600">
                              No img
                            </span>
                          )}
                        </div>
                        <p className="line-clamp-2 text-sm font-semibold text-white">
                          {product.name}
                        </p>
                      </div>
                    </td>

                    <td className="px-3 py-2 font-mono text-xs text-gray-300">
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

                    <td className="px-3 py-2">
                      <div className="space-y-0.5">
                        <span
                          className={`text-xs font-bold ${
                            typeof product.stock === "number" &&
                            product.stock < 0
                              ? "text-red-300"
                              : typeof product.stock === "number" &&
                                  product.stock === 0
                                ? "text-yellow-300"
                                : "text-gray-300"
                          }`}
                        >
                          {typeof product.stock === "number"
                            ? product.stock
                            : "—"}
                        </span>
                        {typeof product.stock === "number" &&
                          product.stock <= 0 && (
                            <span className="block text-[9px] text-gray-500" />
                          )}
                      </div>
                    </td>

                    <td className="px-3 py-2">
                      <select
                        value={currentStockStatus}
                        disabled={isRowUpdating}
                        onChange={(event) =>
                          handleStockStatusChange(
                            product,
                            event.target.value as StockStatus,
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
                          title={
                            isPublished ? "Click to hide" : "Click to publish"
                          }
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

      <CategorySubCategoryModal
        open={categoryModalOpen}
        accessToken={accessToken}
        onClose={() => setCategoryModalOpen(false)}
        onCreated={() => {
          setCategoryModalOpen(false);
          fetchProducts();
        }}
      />

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

function CategorySubCategoryModal({
  open,
  accessToken,
  onClose,
  onCreated,
}: {
  open: boolean;
  accessToken?: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<CategoryFormState>(defaultCategoryForm);
  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const [subCategoryImage, setSubCategoryImage] = useState<File | null>(null);
  const [categoryPreview, setCategoryPreview] = useState("");
  const [subCategoryPreview, setSubCategoryPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    setForm(defaultCategoryForm);
    setCategoryImage(null);
    setSubCategoryImage(null);
    setCategoryPreview("");
    setSubCategoryPreview("");
  }, [open]);

  if (!open) return null;

  const setField = <K extends keyof CategoryFormState>(
    field: K,
    value: CategoryFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void,
    previewSetter: (value: string) => void,
  ) {
    const file = event.target.files?.[0] || null;

    if (file && !file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      event.target.value = "";
      setter(null);
      previewSetter("");
      return;
    }

    setter(file);
    previewSetter(file ? URL.createObjectURL(file) : "");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    if (form.createSubCategory && !form.subCategoryName.trim()) {
      toast.error("Sub-category name is required, or turn off sub-category");
      return;
    }

    if (!accessToken) {
      toast.error("Please login again");
      return;
    }

    if (!API_BASE) {
      toast.error("NEXT_PUBLIC_BACKEND_URL is missing");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();

      formData.append("categoryName", form.categoryName.trim());
      formData.append("categorySlug", form.categorySlug.trim());
      formData.append("categoryDescription", form.categoryDescription.trim());
      formData.append("categoryIconSvg", form.categoryIconSvg.trim());
      formData.append("categorySortOrder", form.categorySortOrder.trim());
      formData.append("categoryIsPublished", String(form.categoryIsPublished));
      formData.append("categorySeoTitle", form.categorySeoTitle.trim());
      formData.append(
        "categorySeoDescription",
        form.categorySeoDescription.trim(),
      );
      formData.append("categorySeoKeywords", form.categorySeoKeywords.trim());
      formData.append("createSubCategory", String(form.createSubCategory));

      if (categoryImage) {
        formData.append("categoryImage", categoryImage, categoryImage.name);
      }

      if (form.createSubCategory) {
        formData.append("subCategoryName", form.subCategoryName.trim());
        formData.append("subCategorySlug", form.subCategorySlug.trim());
        formData.append(
          "subCategoryDescription",
          form.subCategoryDescription.trim(),
        );
        formData.append("subCategoryIconSvg", form.subCategoryIconSvg.trim());
        formData.append(
          "subCategorySortOrder",
          form.subCategorySortOrder.trim(),
        );
        formData.append(
          "subCategoryIsPublished",
          String(form.subCategoryIsPublished),
        );
        formData.append("subCategorySeoTitle", form.subCategorySeoTitle.trim());
        formData.append(
          "subCategorySeoDescription",
          form.subCategorySeoDescription.trim(),
        );
        formData.append(
          "subCategorySeoKeywords",
          form.subCategorySeoKeywords.trim(),
        );

        if (subCategoryImage) {
          formData.append(
            "subCategoryImage",
            subCategoryImage,
            subCategoryImage.name,
          );
        }
      }

      const res = await fetch(
        `${API_BASE}/api/v1/products/categories-with-subcategory`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        },
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to create category");
        return;
      }

      toast.success("Category saved successfully");
      onCreated();
    } catch (error) {
      console.error(error);
      toast.error("Error creating category");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-gray-800 bg-gray-950 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-950 p-5">
          <div>
            <h2 className="text-xl font-bold text-white">
              Create Category & Sub-category
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Product form থেকে category create হবে না. এখান থেকে image upload
              সহ category/sub-category create হবে.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-700 px-4 py-2 text-sm text-gray-200 transition hover:border-red-400 hover:text-red-300"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div className="rounded-2xl border border-gray-800 bg-black p-4">
            <h3 className="mb-4 text-base font-semibold text-orange-400">
              Category
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Category Name"
                value={form.categoryName}
                onChange={(value) => setField("categoryName", value)}
                required
                placeholder="Men's Fashion"
              />
              <TextField
                label="Category Slug"
                value={form.categorySlug}
                onChange={(value) => setField("categorySlug", value)}
                placeholder="Auto generated if empty"
              />
              <TextField
                label="Sort Order"
                type="number"
                value={form.categorySortOrder}
                onChange={(value) => setField("categorySortOrder", value)}
              />
              <SwitchField
                label="Show Category"
                checked={form.categoryIsPublished}
                onChange={(value) => setField("categoryIsPublished", value)}
              />

              <div className="md:col-span-2">
                <TextAreaField
                  label="Description"
                  value={form.categoryDescription}
                  onChange={(value) => setField("categoryDescription", value)}
                />
              </div>

              <div>
                <label className={labelClass}>Category Image Upload</label>
                <label className="grid min-h-[170px] cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed border-gray-700 bg-gray-950 p-4 transition hover:border-orange-500/70">
                  {categoryPreview ? (
                    <img
                      src={categoryPreview}
                      alt="Category preview"
                      className="h-40 w-full object-contain"
                    />
                  ) : (
                    <span className="text-sm text-gray-500">
                      Click to upload image
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) =>
                      handleImageChange(
                        event,
                        setCategoryImage,
                        setCategoryPreview,
                      )
                    }
                  />
                </label>
              </div>

              <TextAreaField
                label="Inline SVG Icon"
                value={form.categoryIconSvg}
                onChange={(value) => setField("categoryIconSvg", value)}
                placeholder="Paste safe <svg> icon here"
                mono
              />

              <TextField
                label="SEO Title"
                value={form.categorySeoTitle}
                onChange={(value) => setField("categorySeoTitle", value)}
              />
              <TextField
                label="SEO Keywords"
                value={form.categorySeoKeywords}
                onChange={(value) => setField("categorySeoKeywords", value)}
                placeholder="Comma separated"
              />
              <div className="md:col-span-2">
                <TextAreaField
                  label="SEO Description"
                  value={form.categorySeoDescription}
                  onChange={(value) =>
                    setField("categorySeoDescription", value)
                  }
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-black p-4">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-semibold text-orange-400">
                  Sub-category
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Optional. Category এর সাথে same modal থেকেই create করা যাবে.
                </p>
              </div>
              <SwitchField
                label="Create Sub-category"
                checked={form.createSubCategory}
                onChange={(value) => setField("createSubCategory", value)}
              />
            </div>

            {form.createSubCategory && (
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Sub-category Name"
                  value={form.subCategoryName}
                  onChange={(value) => setField("subCategoryName", value)}
                  required
                  placeholder="T-Shirts"
                />
                <TextField
                  label="Sub-category Slug"
                  value={form.subCategorySlug}
                  onChange={(value) => setField("subCategorySlug", value)}
                  placeholder="Auto generated if empty"
                />
                <TextField
                  label="Sort Order"
                  type="number"
                  value={form.subCategorySortOrder}
                  onChange={(value) => setField("subCategorySortOrder", value)}
                />
                <SwitchField
                  label="Publish Sub-category"
                  checked={form.subCategoryIsPublished}
                  onChange={(value) =>
                    setField("subCategoryIsPublished", value)
                  }
                />

                <div className="md:col-span-2">
                  <TextAreaField
                    label="Description"
                    value={form.subCategoryDescription}
                    onChange={(value) =>
                      setField("subCategoryDescription", value)
                    }
                  />
                </div>

                <div>
                  <label className={labelClass}>Sub-category Image Upload</label>
                  <label className="grid min-h-[170px] cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed border-gray-700 bg-gray-950 p-4 transition hover:border-orange-500/70">
                    {subCategoryPreview ? (
                      <img
                        src={subCategoryPreview}
                        alt="Sub-category preview"
                        className="h-40 w-full object-contain"
                      />
                    ) : (
                      <span className="text-sm text-gray-500">
                        Click to upload image
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) =>
                        handleImageChange(
                          event,
                          setSubCategoryImage,
                          setSubCategoryPreview,
                        )
                      }
                    />
                  </label>
                </div>

                <TextAreaField
                  label="Inline SVG Icon"
                  value={form.subCategoryIconSvg}
                  onChange={(value) => setField("subCategoryIconSvg", value)}
                  placeholder="Paste safe <svg> icon here"
                  mono
                />

                <TextField
                  label="SEO Title"
                  value={form.subCategorySeoTitle}
                  onChange={(value) => setField("subCategorySeoTitle", value)}
                />
                <TextField
                  label="SEO Keywords"
                  value={form.subCategorySeoKeywords}
                  onChange={(value) =>
                    setField("subCategorySeoKeywords", value)
                  }
                  placeholder="Comma separated"
                />
                <div className="md:col-span-2">
                  <TextAreaField
                    label="SEO Description"
                    value={form.subCategorySeoDescription}
                    onChange={(value) =>
                      setField("subCategorySeoDescription", value)
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-800 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-gray-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Category"}
            </button>
          </div>
        </form>
      </div>
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

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required ? " *" : ""}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`${textareaClass} ${mono ? "font-mono text-xs" : ""}`}
      />
    </div>
  );
}

function SwitchField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-xl border border-gray-800 bg-gray-950 px-4 py-3 text-left transition hover:border-orange-500/70"
    >
      <span className="text-sm font-medium text-gray-200">{label}</span>
      <span
        className={`relative h-7 w-12 rounded-full transition ${
          checked ? "bg-orange-500" : "bg-gray-700"
        }`}
      >
        
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}
