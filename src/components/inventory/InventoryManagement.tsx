"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  FaBoxes,
  FaChartLine,
  FaEye,
  FaPlus,
  FaSearch,
  FaSyncAlt,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import type {
  InventoryBatch,
  InventoryMovement,
  InventoryMovementType,
  InventoryPagination,
  InventoryProduct,
} from "@/types/inventory";
import type { StockStatus } from "@/types/product";
import { formatPrice } from "@/lib/formatPrice";

const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(
  /\/+$/,
  "",
);

const limitOptions = [15, 25, 50, 100];

const stockFilters: Array<{ value: "all" | StockStatus; label: string }> = [
  { value: "all", label: "All Stock" },
  { value: "IN_STOCK", label: "In Stock" },
  { value: "LIMITED_STOCK", label: "Limited" },
  { value: "LOW_STOCK", label: "Low Stock" },
  { value: "OUT_OF_STOCK", label: "Out of Stock" },
  { value: "PRE_ORDER", label: "Pre-order" },
  { value: "COMING_SOON", label: "Coming Soon" },
];

type SessionTokenShape =
  | {
      accessToken?: unknown;
      user?: {
        accessToken?: unknown;
        token?: unknown;
      } | null;
    }
  | null
  | undefined;

interface InventoryManagementProps {
  panelType: "admin" | "moderator";
}

type PurchaseForm = {
  productId: string;
  quantity: string;
  unitCostPrice: string;
  mrp: string;
  sellingPrice: string;
  supplierName: string;
  supplierPhone: string;
  supplierInvoiceNumber: string;
  purchaseDate: string;
  note: string;
  updateProductPrice: boolean;
};

type AdjustForm = {
  productId: string;
  type: InventoryMovementType;
  quantity: string;
  unitCostPrice: string;
  reason: string;
  updateProductPrice: boolean;
};

const emptyPurchaseForm: PurchaseForm = {
  productId: "",
  quantity: "",
  unitCostPrice: "",
  mrp: "",
  sellingPrice: "",
  supplierName: "",
  supplierPhone: "",
  supplierInvoiceNumber: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
  note: "",
  updateProductPrice: true,
};

const emptyAdjustForm: AdjustForm = {
  productId: "",
  type: "ADJUSTMENT_OUT",
  quantity: "",
  unitCostPrice: "",
  reason: "",
  updateProductPrice: false,
};

function getSessionToken(session: unknown): string {
  const sessionData = session as SessionTokenShape;
  const token =
    sessionData?.accessToken ||
    sessionData?.user?.accessToken ||
    sessionData?.user?.token;

  return typeof token === "string" ? token : "";
}

function safeNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStockBadgeClass(status?: StockStatus) {
  switch (status) {
    case "IN_STOCK":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "LIMITED_STOCK":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    case "LOW_STOCK":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    case "OUT_OF_STOCK":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    case "PRE_ORDER":
      return "border-purple-500/30 bg-purple-500/10 text-purple-300";
    case "COMING_SOON":
      return "border-neutral-500/30 bg-neutral-500/10 text-neutral-300";
    default:
      return "border-neutral-500/30 bg-neutral-500/10 text-neutral-300";
  }
}

function movementLabel(type: InventoryMovementType) {
  const labels: Record<InventoryMovementType, string> = {
    PURCHASE: "Purchase",
    SALE: "Sale",
    CANCEL_RESTORE: "Cancel Restore",
    RETURN_RESTORE: "Return Restore",
    ADJUSTMENT_IN: "Adjustment In",
    ADJUSTMENT_OUT: "Adjustment Out",
    DAMAGE: "Damage",
    LOSS: "Loss",
  };

  return labels[type] || type;
}

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/75 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-neutral-800 bg-neutral-950 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-800 bg-neutral-950 px-5 py-4">
          <h2 className="text-lg font-black text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-neutral-900 text-neutral-300 transition hover:bg-red-500 hover:text-white"
          >
            <FaTimes />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function inputClass() {
  return "h-11 w-full rounded-2xl border border-neutral-800 bg-black px-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-orange-500";
}

export default function InventoryManagement({
  panelType,
}: InventoryManagementProps) {
  const { data: session, status: sessionStatus } = useSession();
  const token = getSessionToken(session);

  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [autoStockOutEnabled, setAutoStockOutEnabled] = useState(false);
  const [resetStockModalOpen, setResetStockModalOpen] = useState(false);
  const [resetStockConfirmText, setResetStockConfirmText] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | StockStatus>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [pagination, setPagination] = useState<InventoryPagination>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });

  const [purchaseModalProduct, setPurchaseModalProduct] =
    useState<InventoryProduct | null>(null);
  const [adjustModalProduct, setAdjustModalProduct] =
    useState<InventoryProduct | null>(null);
  const [detailsProduct, setDetailsProduct] = useState<InventoryProduct | null>(
    null,
  );

  const [purchaseForm, setPurchaseForm] =
    useState<PurchaseForm>(emptyPurchaseForm);
  const [adjustForm, setAdjustForm] = useState<AdjustForm>(emptyAdjustForm);

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsBatches, setDetailsBatches] = useState<InventoryBatch[]>([]);
  const [detailsMovements, setDetailsMovements] = useState<InventoryMovement[]>(
    [],
  );

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  const loadProducts = useCallback(async () => {
    if (sessionStatus === "loading") return;

    if (!API_BASE) {
      toast.error("NEXT_PUBLIC_BACKEND_URL is missing");
      setLoading(false);
      return;
    }

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const params = new URLSearchParams({
        search: search.trim(),
        status: statusFilter,
        page: String(page),
        limit: String(limit),
      });

      const res = await fetch(
        `${API_BASE}/api/v1/inventory/products?${params}`,
        {
          headers: authHeaders,
          cache: "no-store",
        },
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Inventory load failed");
        return;
      }

      setProducts(Array.isArray(data.products) ? data.products : []);
      setPagination(
        data.pagination || {
          page,
          limit,
          total: 0,
          totalPages: 1,
        },
      );
    } catch (error) {
      console.error(error);
      toast.error("Inventory load failed");
    } finally {
      setLoading(false);
    }
  }, [sessionStatus, token, search, statusFilter, page, limit, authHeaders]);

  const loadSettings = useCallback(async () => {
    if (sessionStatus === "loading") return;
    if (!API_BASE || !token || panelType !== "admin") {
      setSettingsLoading(false);
      return;
    }

    try {
      setSettingsLoading(true);

      const res = await fetch(`${API_BASE}/api/v1/inventory/settings`, {
        headers: authHeaders,
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Inventory settings load failed");
        return;
      }

      setAutoStockOutEnabled(Boolean(data.settings?.autoStockOutEnabled));
    } catch (error) {
      console.error(error);
      toast.error("Inventory settings load failed");
    } finally {
      setSettingsLoading(false);
    }
  }, [sessionStatus, token, authHeaders, panelType]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const openPurchaseModal = (product: InventoryProduct) => {
    setPurchaseModalProduct(product);
    setPurchaseForm({
      ...emptyPurchaseForm,
      productId: product.id,
      unitCostPrice: String(
        product.lastPurchaseCost || product.costPrice || "",
      ),
      mrp: String(product.mrp || ""),
      sellingPrice: String(product.sellingPrice || ""),
    });
  };

  const openAdjustModal = (product: InventoryProduct) => {
    setAdjustModalProduct(product);
    setAdjustForm({
      ...emptyAdjustForm,
      productId: product.id,
    });
  };

  const loadDetails = async (product: InventoryProduct) => {
    setDetailsProduct(product);
    setDetailsLoading(true);
    setDetailsBatches([]);
    setDetailsMovements([]);

    try {
      const res = await fetch(
        `${API_BASE}/api/v1/inventory/products/${product.id}`,
        {
          headers: authHeaders,
          cache: "no-store",
        },
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Details load failed");
        return;
      }

      setDetailsProduct(data.product || product);
      setDetailsBatches(Array.isArray(data.batches) ? data.batches : []);
      setDetailsMovements(Array.isArray(data.movements) ? data.movements : []);
    } catch {
      toast.error("Details load failed");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSeedOpeningStock = async () => {
    if (
      !confirm(
        "Create opening stock batches for existing products that have stock but no batch?",
      )
    ) {
      return;
    }

    try {
      setActionLoading("seed");
      const res = await fetch(
        `${API_BASE}/api/v1/inventory/seed-opening-stock`,
        {
          method: "POST",
          headers: authHeaders,
        },
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Opening stock seed failed");
        return;
      }

      toast.success(data.message || "Opening stock created");
      loadProducts();
    } catch {
      toast.error("Opening stock seed failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAutoStockOutToggle = async () => {
    if (panelType !== "admin") return;

    try {
      const nextValue = !autoStockOutEnabled;
      setActionLoading("auto-stock-out");

      const res = await fetch(
        `${API_BASE}/api/v1/inventory/settings/auto-stock-out`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({ enabled: nextValue }),
        },
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Auto stock out update failed");
        return;
      }

      setAutoStockOutEnabled(Boolean(data.settings?.autoStockOutEnabled));
      toast.success(data.message || "Inventory setting updated");
      loadProducts();
    } catch (error) {
      console.error(error);
      toast.error("Auto stock out update failed");
    } finally {
      setActionLoading(null);
    }
  };

  const openResetStockModal = () => {
    setResetStockConfirmText("");
    setResetStockModalOpen(true);
  };

  const submitResetStock = async () => {
    if (resetStockConfirmText.trim() !== "delete my store") {
      toast.error("Type delete my store exactly to continue");
      return;
    }

    try {
      setActionLoading("reset-stock");

      const res = await fetch(`${API_BASE}/api/v1/inventory/reset-stock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ confirmText: resetStockConfirmText.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Stock reset failed");
        return;
      }

      toast.success(data.message || "All product stock reset to 0");
      setResetStockModalOpen(false);
      setResetStockConfirmText("");
      loadProducts();
    } catch (error) {
      console.error(error);
      toast.error("Stock reset failed");
    } finally {
      setActionLoading(null);
    }
  };

  const submitPurchase = async () => {
    if (!purchaseModalProduct) return;

    try {
      setActionLoading("purchase");
      const res = await fetch(`${API_BASE}/api/v1/inventory/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          ...purchaseForm,
          quantity: Number(purchaseForm.quantity),
          unitCostPrice: Number(purchaseForm.unitCostPrice),
          mrp: purchaseForm.mrp ? Number(purchaseForm.mrp) : undefined,
          sellingPrice: purchaseForm.sellingPrice
            ? Number(purchaseForm.sellingPrice)
            : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Stock purchase failed");
        return;
      }

      toast.success(data.message || "Stock added");
      setPurchaseModalProduct(null);
      setPurchaseForm(emptyPurchaseForm);
      loadProducts();
    } catch {
      toast.error("Stock purchase failed");
    } finally {
      setActionLoading(null);
    }
  };

  const submitAdjustment = async () => {
    if (!adjustModalProduct) return;

    try {
      setActionLoading("adjust");
      const res = await fetch(
        `${API_BASE}/api/v1/inventory/products/${adjustModalProduct.id}/adjust`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({
            ...adjustForm,
            quantity: Number(adjustForm.quantity),
            unitCostPrice: adjustForm.unitCostPrice
              ? Number(adjustForm.unitCostPrice)
              : undefined,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Stock adjustment failed");
        return;
      }

      toast.success(data.message || "Stock adjusted");
      setAdjustModalProduct(null);
      setAdjustForm(emptyAdjustForm);
      loadProducts();
    } catch {
      toast.error("Stock adjustment failed");
    } finally {
      setActionLoading(null);
    }
  };

  const startEntry =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endEntry =
    pagination.total === 0
      ? 0
      : Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-xl font-black text-white sm:text-2xl">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-orange-500/15 text-orange-400">
                <FaBoxes />
              </span>
              Inventory Management
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              Maintain purchase batches, stock, cost, selling price, and FIFO
              inventory.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleSeedOpeningStock}
              disabled={actionLoading === "seed"}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-neutral-800 bg-black px-4 text-sm font-black text-white transition hover:border-orange-500 hover:text-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaSyncAlt
                className={actionLoading === "seed" ? "animate-spin" : ""}
              />
              Seed Opening Stock
            </button>

            <a
              href={
                panelType === "admin"
                  ? "/admin/reports/profit-loss"
                  : "/moderator/reports/profit-loss"
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 text-sm font-black text-white transition hover:bg-orange-700"
            >
              <FaChartLine />
              Profit Report
            </a>
          </div>
        </div>
      </div>

      {panelType === "admin" && (
        <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-black text-white">
                Stock Automation
              </h2>
              <p className="mt-1 max-w-3xl text-sm text-neutral-400">
                When Auto Stock Out is ON
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleAutoStockOutToggle}
                disabled={settingsLoading || actionLoading === "auto-stock-out"}
                className={`inline-flex h-11 items-center justify-center gap-3 rounded-2xl border px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  autoStockOutEnabled
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-neutral-800 bg-black text-neutral-300 hover:border-orange-500 hover:text-orange-300"
                }`}
              >
                <span
                  className={`flex h-6 w-11 items-center rounded-full p-1 transition ${
                    autoStockOutEnabled ? "bg-emerald-500" : "bg-neutral-700"
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full bg-white transition ${
                      autoStockOutEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </span>
                Auto Stock Out {autoStockOutEnabled ? "ON" : "OFF"}
              </button>

              <button
                type="button"
                onClick={openResetStockModal}
                disabled={actionLoading === "reset-stock"}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 text-sm font-black text-red-300 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaTrash />
                Reset Stock
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-4 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <FaSearch
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
                size={13}
              />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search product, SKU, brand"
                className="h-11 w-full rounded-2xl border border-neutral-800 bg-black pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-orange-500 sm:w-80"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as "all" | StockStatus);
                setPage(1);
              }}
              className="h-11 rounded-2xl border border-neutral-800 bg-black px-4 text-sm font-bold text-white outline-none focus:border-orange-500"
            >
              {stockFilters.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-black"
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <label className="flex h-11 items-center gap-2 rounded-2xl border border-neutral-800 bg-black px-3 text-sm text-neutral-400">
            Show
            <select
              value={limit}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setPage(1);
              }}
              className="bg-transparent font-bold text-white outline-none"
            >
              {limitOptions.map((option) => (
                <option key={option} value={option} className="bg-black">
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-800 text-left text-sm">
            <thead className="bg-black/60 text-xs uppercase tracking-[0.15em] text-neutral-500">
              <tr>
                <th className="px-4 py-4">Product</th>
                <th className="px-4 py-4">Stock</th>
                <th className="px-4 py-4">MRP</th>
                <th className="px-4 py-4">Cost</th>
                <th className="px-4 py-4">Sell</th>
                <th className="px-4 py-4">Stock</th>
                <th className="px-4 py-4">Profit</th>
                <th className="px-4 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-900">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-neutral-400"
                  >
                    Loading inventory...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-neutral-400"
                  >
                    No inventory product found.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const avgCost = safeNumber(
                    product.averageCost || product.costPrice,
                  );
                  const profitPerUnit =
                    safeNumber(product.sellingPrice) - avgCost;

                  return (
                    <tr
                      key={product.id}
                      className="align-top transition hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-4">
                        <div className="flex min-w-[260px] items-center gap-3">
                          <img
                            src={product.mainImageUrl}
                            alt={product.name}
                            className="h-12 w-12 rounded-2xl border border-neutral-800 object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-black text-white">
                              {product.name}
                            </p>
                            <p className="truncate text-xs text-neutral-500">
                              {product.sku || product.productCode || "No SKU"}
                            </p>
                            <span
                              className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStockBadgeClass(product.stockStatus)}`}
                            >
                              {product.stockStatus?.replaceAll("_", " ")}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-black text-white">
                        {product.stock || 0}
                      </td>
                      <td className="px-4 py-4 text-neutral-300">
                        {formatPrice(product.mrp || 0)}
                      </td>
                      <td className="px-4 py-4 text-neutral-300">
                        {formatPrice(avgCost)}
                      </td>
                      <td className="px-4 py-4 text-neutral-300">
                        {formatPrice(product.sellingPrice || 0)}
                      </td>
                      <td className="px-4 py-4 font-bold text-neutral-200">
                        {formatPrice(product.stockValue || 0)}
                      </td>
                      <td
                        className={`px-4 py-4 font-black ${profitPerUnit >= 0 ? "text-emerald-300" : "text-red-300"}`}
                      >
                        {formatPrice(profitPerUnit)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => loadDetails(product)}
                            className="grid h-9 w-9 place-items-center rounded-xl border border-neutral-800 bg-black text-neutral-300 transition hover:border-blue-500 hover:text-blue-300"
                            title="View details"
                          >
                            <FaEye size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openPurchaseModal(product)}
                            className="inline-flex h-9 items-center gap-2 rounded-xl bg-orange-600 px-3 text-xs font-black text-white transition hover:bg-orange-700"
                          >
                            <FaPlus size={11} /> Stock
                          </button>
                          <button
                            type="button"
                            onClick={() => openAdjustModal(product)}
                            className="h-9 rounded-xl border border-neutral-800 bg-black px-3 text-xs font-black text-neutral-300 transition hover:border-red-500 hover:text-red-300"
                          >
                            Adjust
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

        <div className="flex flex-col gap-3 border-t border-neutral-800 px-4 py-4 text-sm text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing <span className="font-bold text-white">{startEntry}</span>{" "}
            to <span className="font-bold text-white">{endEntry}</span> of{" "}
            <span className="font-bold text-white">{pagination.total}</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={page <= 1}
              className="rounded-xl border border-neutral-800 px-3 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>
            <span className="rounded-xl bg-black px-3 py-2 font-bold text-white">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setPage((current) =>
                  Math.min(current + 1, pagination.totalPages),
                )
              }
              disabled={page >= pagination.totalPages}
              className="rounded-xl border border-neutral-800 px-3 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <Modal
        open={resetStockModalOpen}
        title="Reset all product stock"
        onClose={() => {
          setResetStockModalOpen(false);
          setResetStockConfirmText("");
        }}
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            This will set only the stock quantity of every product to 0. Product
            name, price, status, images, batches, orders, and other data will
            stay unchanged.
          </div>

          <Field label="Confirmation text">
            <input
              className={inputClass()}
              value={resetStockConfirmText}
              onChange={(event) => setResetStockConfirmText(event.target.value)}
              placeholder="Type delete my store"
            />
          </Field>

          <p className="text-sm text-neutral-400">
            Type <span className="font-black text-white">delete my store</span>{" "}
            exactly to enable the reset button.
          </p>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setResetStockModalOpen(false);
                setResetStockConfirmText("");
              }}
              className="rounded-2xl border border-neutral-800 px-4 py-2.5 text-sm font-bold text-neutral-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitResetStock}
              disabled={
                actionLoading === "reset-stock" ||
                resetStockConfirmText.trim() !== "delete my store"
              }
              className="rounded-2xl bg-red-600 px-5 py-2.5 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading === "reset-stock" ? "Resetting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(purchaseModalProduct)}
        title={`Add Stock${purchaseModalProduct ? `: ${purchaseModalProduct.name}` : ""}`}
        onClose={() => setPurchaseModalProduct(null)}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Quantity">
            <input
              className={inputClass()}
              value={purchaseForm.quantity}
              onChange={(event) =>
                setPurchaseForm((prev) => ({
                  ...prev,
                  quantity: event.target.value,
                }))
              }
              placeholder="Example: 10"
              type="number"
              min="1"
            />
          </Field>
          <Field label="Unit Cost Price">
            <input
              className={inputClass()}
              value={purchaseForm.unitCostPrice}
              onChange={(event) =>
                setPurchaseForm((prev) => ({
                  ...prev,
                  unitCostPrice: event.target.value,
                }))
              }
              placeholder="Example: 850"
              type="number"
              min="0"
            />
          </Field>
          <Field label="MRP">
            <input
              className={inputClass()}
              value={purchaseForm.mrp}
              onChange={(event) =>
                setPurchaseForm((prev) => ({
                  ...prev,
                  mrp: event.target.value,
                }))
              }
              placeholder="Optional"
              type="number"
              min="0"
            />
          </Field>
          <Field label="Selling Price">
            <input
              className={inputClass()}
              value={purchaseForm.sellingPrice}
              onChange={(event) =>
                setPurchaseForm((prev) => ({
                  ...prev,
                  sellingPrice: event.target.value,
                }))
              }
              placeholder="Optional"
              type="number"
              min="0"
            />
          </Field>
          <Field label="Supplier Name">
            <input
              className={inputClass()}
              value={purchaseForm.supplierName}
              onChange={(event) =>
                setPurchaseForm((prev) => ({
                  ...prev,
                  supplierName: event.target.value,
                }))
              }
              placeholder="Optional"
            />
          </Field>
          <Field label="Supplier Phone">
            <input
              className={inputClass()}
              value={purchaseForm.supplierPhone}
              onChange={(event) =>
                setPurchaseForm((prev) => ({
                  ...prev,
                  supplierPhone: event.target.value,
                }))
              }
              placeholder="Optional"
            />
          </Field>
          <Field label="Supplier Invoice">
            <input
              className={inputClass()}
              value={purchaseForm.supplierInvoiceNumber}
              onChange={(event) =>
                setPurchaseForm((prev) => ({
                  ...prev,
                  supplierInvoiceNumber: event.target.value,
                }))
              }
              placeholder="Optional"
            />
          </Field>
          <Field label="Purchase Date">
            <input
              className={inputClass()}
              value={purchaseForm.purchaseDate}
              onChange={(event) =>
                setPurchaseForm((prev) => ({
                  ...prev,
                  purchaseDate: event.target.value,
                }))
              }
              type="date"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Note">
              <textarea
                className="min-h-24 w-full rounded-2xl border border-neutral-800 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-orange-500"
                value={purchaseForm.note}
                onChange={(event) =>
                  setPurchaseForm((prev) => ({
                    ...prev,
                    note: event.target.value,
                  }))
                }
                placeholder="Optional note"
              />
            </Field>
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-black p-4 text-sm font-bold text-white sm:col-span-2">
            <input
              type="checkbox"
              checked={purchaseForm.updateProductPrice}
              onChange={(event) =>
                setPurchaseForm((prev) => ({
                  ...prev,
                  updateProductPrice: event.target.checked,
                }))
              }
              className="h-4 w-4 accent-orange-500"
            />
            Update product MRP / selling price / latest cost with this purchase
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setPurchaseModalProduct(null)}
            className="rounded-2xl border border-neutral-800 px-4 py-2.5 text-sm font-bold text-neutral-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submitPurchase}
            disabled={actionLoading === "purchase"}
            className="rounded-2xl bg-orange-600 px-5 py-2.5 text-sm font-black text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {actionLoading === "purchase" ? "Saving..." : "Add Stock"}
          </button>
        </div>
      </Modal>

      <Modal
        open={Boolean(adjustModalProduct)}
        title={`Adjust Stock${adjustModalProduct ? `: ${adjustModalProduct.name}` : ""}`}
        onClose={() => setAdjustModalProduct(null)}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Adjustment Type">
            <select
              className={inputClass()}
              value={adjustForm.type}
              onChange={(event) =>
                setAdjustForm((prev) => ({
                  ...prev,
                  type: event.target.value as InventoryMovementType,
                }))
              }
            >
              <option value="ADJUSTMENT_OUT" className="bg-black">
                Stock Decrease
              </option>
              <option value="DAMAGE" className="bg-black">
                Damage
              </option>
              <option value="LOSS" className="bg-black">
                Loss
              </option>
              <option value="ADJUSTMENT_IN" className="bg-black">
                Stock Increase
              </option>
            </select>
          </Field>
          <Field label="Quantity">
            <input
              className={inputClass()}
              value={adjustForm.quantity}
              onChange={(event) =>
                setAdjustForm((prev) => ({
                  ...prev,
                  quantity: event.target.value,
                }))
              }
              placeholder="Example: 2"
              type="number"
              min="1"
            />
          </Field>
          {adjustForm.type === "ADJUSTMENT_IN" && (
            <Field label="Unit Cost Price">
              <input
                className={inputClass()}
                value={adjustForm.unitCostPrice}
                onChange={(event) =>
                  setAdjustForm((prev) => ({
                    ...prev,
                    unitCostPrice: event.target.value,
                  }))
                }
                placeholder="Required for stock increase"
                type="number"
                min="0"
              />
            </Field>
          )}
          <div className="sm:col-span-2">
            <Field label="Reason">
              <textarea
                className="min-h-24 w-full rounded-2xl border border-neutral-800 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-orange-500"
                value={adjustForm.reason}
                onChange={(event) =>
                  setAdjustForm((prev) => ({
                    ...prev,
                    reason: event.target.value,
                  }))
                }
                placeholder="Example: Damaged product, manual correction"
              />
            </Field>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setAdjustModalProduct(null)}
            className="rounded-2xl border border-neutral-800 px-4 py-2.5 text-sm font-bold text-neutral-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submitAdjustment}
            disabled={actionLoading === "adjust"}
            className="rounded-2xl bg-orange-600 px-5 py-2.5 text-sm font-black text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {actionLoading === "adjust" ? "Saving..." : "Adjust Stock"}
          </button>
        </div>
      </Modal>

      <Modal
        open={Boolean(detailsProduct)}
        title={
          detailsProduct
            ? `Inventory Details: ${detailsProduct.name}`
            : "Inventory Details"
        }
        onClose={() => setDetailsProduct(null)}
      >
        {detailsLoading ? (
          <div className="py-10 text-center text-neutral-400">
            Loading details...
          </div>
        ) : (
          <div className="space-y-6">
            {detailsProduct && (
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-neutral-800 bg-black p-4">
                  <p className="text-xs text-neutral-500">Stock</p>
                  <p className="mt-1 text-xl font-black text-white">
                    {detailsProduct.stock}
                  </p>
                </div>
                <div className="rounded-2xl border border-neutral-800 bg-black p-4">
                  <p className="text-xs text-neutral-500">Average Cost</p>
                  <p className="mt-1 text-xl font-black text-white">
                    {formatPrice(detailsProduct.averageCost || 0)}
                  </p>
                </div>
                <div className="rounded-2xl border border-neutral-800 bg-black p-4">
                  <p className="text-xs text-neutral-500">Selling Price</p>
                  <p className="mt-1 text-xl font-black text-white">
                    {formatPrice(detailsProduct.sellingPrice || 0)}
                  </p>
                </div>
                <div className="rounded-2xl border border-neutral-800 bg-black p-4">
                  <p className="text-xs text-neutral-500">Stock Value</p>
                  <p className="mt-1 text-xl font-black text-white">
                    {formatPrice(detailsProduct.stockValue || 0)}
                  </p>
                </div>
              </div>
            )}

            <section>
              <h3 className="mb-3 text-base font-black text-white">Batches</h3>
              <div className="overflow-hidden rounded-2xl border border-neutral-800">
                <table className="min-w-full divide-y divide-neutral-800 text-left text-xs">
                  <thead className="bg-black text-neutral-500">
                    <tr>
                      <th className="px-3 py-3">Batch</th>
                      <th className="px-3 py-3">Purchased</th>
                      <th className="px-3 py-3">Remaining</th>
                      <th className="px-3 py-3">Cost</th>
                      <th className="px-3 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {detailsBatches.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-5 text-center text-neutral-500"
                        >
                          No batch found
                        </td>
                      </tr>
                    ) : (
                      detailsBatches.map((batch) => (
                        <tr key={batch.id}>
                          <td className="px-3 py-3 font-bold text-white">
                            {batch.batchNo}
                          </td>
                          <td className="px-3 py-3 text-neutral-300">
                            {batch.purchaseQuantity}
                          </td>
                          <td className="px-3 py-3 text-neutral-300">
                            {batch.remainingQuantity}
                          </td>
                          <td className="px-3 py-3 text-neutral-300">
                            {formatPrice(batch.unitCostPrice)}
                          </td>
                          <td className="px-3 py-3 text-neutral-400">
                            {formatDate(batch.purchaseDate)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-base font-black text-white">
                Recent Movements
              </h3>
              <div className="overflow-hidden rounded-2xl border border-neutral-800">
                <table className="min-w-full divide-y divide-neutral-800 text-left text-xs">
                  <thead className="bg-black text-neutral-500">
                    <tr>
                      <th className="px-3 py-3">Type</th>
                      <th className="px-3 py-3">Qty</th>
                      <th className="px-3 py-3">Cost</th>
                      <th className="px-3 py-3">Reference</th>
                      <th className="px-3 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {detailsMovements.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-5 text-center text-neutral-500"
                        >
                          No movement found
                        </td>
                      </tr>
                    ) : (
                      detailsMovements.map((movement) => (
                        <tr key={movement.id}>
                          <td className="px-3 py-3 font-bold text-white">
                            {movementLabel(movement.type)}
                          </td>
                          <td
                            className={`px-3 py-3 font-black ${movement.quantity >= 0 ? "text-emerald-300" : "text-red-300"}`}
                          >
                            {movement.quantity}
                          </td>
                          <td className="px-3 py-3 text-neutral-300">
                            {formatPrice(movement.totalCost || 0)}
                          </td>
                          <td className="px-3 py-3 text-neutral-400">
                            {movement.referenceNo || "-"}
                          </td>
                          <td className="px-3 py-3 text-neutral-400">
                            {formatDate(movement.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </Modal>
    </div>
  );
}
