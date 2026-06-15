"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { FaEdit, FaEye, FaPlus, FaTrash } from "react-icons/fa";
import Link from "next/link";
import ConfirmationModal from "@/components/users/ConfirmationModal";
import type { Product } from "@/types/product";
import { getStockStatusLabel } from "@/types/product";
import { formatPrice } from "@/lib/formatPrice";

interface ProductManagementProps {
  panelType: "admin" | "moderator";
}

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function ProductManagement({ panelType }: ProductManagementProps) {
  const { data: session } = useSession();
  const accessToken = (session?.user as any)?.accessToken;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    product: Product | null;
  }>({
    open: false,
    product: null,
  });

  const isAdmin = panelType === "admin";

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

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/products/admin`, {
        headers: authHeaders,
      });

      const data = await res.json();

      if (data.success) {
        setProducts(data.products);
      } else {
        toast.error(data.message || "Failed to load products");
      }
    } catch {
      toast.error("Error loading products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    fetchProducts();
  }, [accessToken]);

  const handleDeleteProduct = async () => {
    if (!deleteModal.product) return;

    setActionInProgress(deleteModal.product.id);

    try {
      const res = await fetch(`${API_BASE}/api/v1/products/${deleteModal.product.id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Product deleted successfully");
        setProducts((prev) => prev.filter((item) => item.id !== deleteModal.product?.id));
        setDeleteModal({ open: false, product: null });
      } else {
        toast.error(data.message || "Failed to delete product");
      }
    } catch {
      toast.error("Error deleting product");
    } finally {
      setActionInProgress(null);
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
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Product Management {panelType === "moderator" ? "(Moderator)" : ""}
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Create products, categories, sub-categories, brands, images, videos, stock
            status and pricing.
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
        <table className="min-w-full divide-y divide-gray-800">
          <thead className="bg-gray-950">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-400">
                Product
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-400">
                Category
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-400">
                Brand
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-400">
                MRP
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-400">
                Selling
              </th>
              {isAdmin && (
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-400">
                  Stock Qty
                </th>
              )}
              <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-400">
                Stock Status
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-400">
                Status
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-400">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-800">
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={isAdmin ? 9 : 8}
                  className="px-6 py-12 text-center text-gray-400"
                >
                  No products found. Create your first product.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-950/70">
                  <td className="px-5 py-4">
                    <div className="flex min-w-[280px] items-center gap-3">
                      <img
                        src={product.mainImageUrl}
                        alt={product.name}
                        className="h-16 w-16 rounded-xl border border-gray-800 object-contain p-1"
                      />

                      <div>
                        <p className="line-clamp-2 font-semibold text-white">
                          {product.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">/{product.slug}</p>
                        {product.modelName && (
                          <p className="mt-1 text-xs text-orange-400">
                            Model: {product.modelName}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-300">
                    <p>{product.category?.name || "N/A"}</p>
                    <p className="text-xs text-gray-500">
                      {product.subCategory?.name || "No sub-category"}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-300">
                    {product.brand?.name || "N/A"}
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-300">
                    {formatPrice(product.mrp)}
                  </td>

                  <td className="px-5 py-4 text-sm font-semibold text-orange-400">
                    {formatPrice(product.sellingPrice)}
                  </td>

                  {isAdmin && (
                    <td className="px-5 py-4 text-sm text-gray-300">
                      {typeof product.stock === "number" ? product.stock : "Hidden"}
                    </td>
                  )}

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        product.stockStatus === "OUT_OF_STOCK"
                          ? "bg-red-500/10 text-red-300"
                          : product.stockStatus === "COMING_SOON"
                          ? "bg-purple-500/10 text-purple-300"
                          : "bg-orange-500/10 text-orange-300"
                      }`}
                    >
                      {getStockStatusLabel(product.stockStatus)}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    {product.isPublished ? (
                      <span className="rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-300">
                        Published
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-800 px-2 py-1 text-xs font-medium text-gray-300">
                        Hidden
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-3">
                      <Link
                        href={`/products/${product.slug}`}
                        target="_blank"
                        className="text-gray-300 hover:text-orange-400"
                        title="View product"
                      >
                        <FaEye />
                      </Link>

                      <Link
                        href={getEditHref(product.id)}
                        className="text-orange-400 hover:text-orange-300"
                        title="Edit product"
                      >
                        <FaEdit />
                      </Link>

                      <button
                        type="button"
                        onClick={() => setDeleteModal({ open: true, product })}
                        disabled={actionInProgress === product.id}
                        className="text-red-400 hover:text-red-300 disabled:opacity-50"
                        title="Delete product"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
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
        isLoading={actionInProgress === deleteModal.product?.id}
      />
    </div>
  );
}