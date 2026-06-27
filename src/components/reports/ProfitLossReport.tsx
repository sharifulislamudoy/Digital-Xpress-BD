"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { FaChartLine, FaSearchDollar, FaSyncAlt } from "react-icons/fa";
import { formatPrice } from "@/lib/formatPrice";
import type { OrderStatus } from "@/types/order";

const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(
  /\/+$/,
  "",
);

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

type ReportStatus = "all" | "expected" | "delivered-profit" | OrderStatus;

type Summary = {
  orderCount: number;
  totalSales: number;
  deliveryCharge: number;
  discountAmount: number;
  paidAmount: number;
  dueAmount: number;
  codAmount: number;
  productCostTotal: number;
  grossProfit: number;
  actualCourierCost: number;
  packagingCost: number;
  paymentFee: number;
  otherCost: number;
  netProfit: number;
};

type StatusBreakdown = {
  status: OrderStatus;
  orderCount: number;
  totalSales: number;
  productCostTotal: number;
  grossProfit: number;
  netProfit: number;
};

type ProductProfit = {
  productId: string | null;
  productName: string;
  sku: string | null;
  quantity: number;
  totalSales: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
};

type MissingCostItem = {
  invoiceNo: string;
  productId: string | null;
  productName: string;
  sku?: string | null;
  quantity: number;
};

type ProfitLossResponse = {
  success: boolean;
  summary: Summary;
  statusBreakdown: StatusBreakdown[];
  productProfit: ProductProfit[];
  missingCostItems?: MissingCostItem[];
  warning?: string | null;
  message?: string;
};

const statusOptions: Array<{ value: ReportStatus; label: string }> = [
  { value: "delivered", label: "Delivered Profit" },
  { value: "expected", label: "Expected Profit" },
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "returned", label: "Returned" },
  { value: "cancelled", label: "Cancelled" },
];

const emptySummary: Summary = {
  orderCount: 0,
  totalSales: 0,
  deliveryCharge: 0,
  discountAmount: 0,
  paidAmount: 0,
  dueAmount: 0,
  codAmount: 0,
  productCostTotal: 0,
  grossProfit: 0,
  actualCourierCost: 0,
  packagingCost: 0,
  paymentFee: 0,
  otherCost: 0,
  netProfit: 0,
};

function getSessionToken(session: unknown): string {
  const sessionData = session as SessionTokenShape;
  const token =
    sessionData?.accessToken ||
    sessionData?.user?.accessToken ||
    sessionData?.user?.token;

  return typeof token === "string" ? token : "";
}

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function statusLabel(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    pending: "Pending",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    returned: "Returned",
    cancelled: "Cancelled",
  };

  return labels[status] || status;
}

function StatCard({
  title,
  value,
  tone = "default",
}: {
  title: string;
  value: string | number;
  tone?: "default" | "good" | "bad" | "orange";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-300"
      : tone === "bad"
        ? "text-red-300"
        : tone === "orange"
          ? "text-orange-300"
          : "text-white";

  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
        {title}
      </p>
      <p className={`mt-2 text-2xl font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

export default function ProfitLossReport() {
  const { data: session, status: sessionStatus } = useSession();
  const token = getSessionToken(session);

  const today = useMemo(() => new Date(), []);
  const defaultFrom = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() - 30);
    return date;
  }, [today]);

  const [from, setFrom] = useState(formatDateInput(defaultFrom));
  const [to, setTo] = useState(formatDateInput(today));
  const [status, setStatus] = useState<ReportStatus>("delivered");

  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([]);
  const [productProfit, setProductProfit] = useState<ProductProfit[]>([]);
  const [missingCostItems, setMissingCostItems] = useState<MissingCostItem[]>(
    [],
  );
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const loadReport = useCallback(async () => {
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
      const params = new URLSearchParams({ from, to, status });
      const res = await fetch(
        `${API_BASE}/api/v1/reports/profit-loss?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        },
      );

      const data: ProfitLossResponse = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Report load failed");
        return;
      }

      setSummary(data.summary || emptySummary);
      setStatusBreakdown(
        Array.isArray(data.statusBreakdown) ? data.statusBreakdown : [],
      );
      setProductProfit(
        Array.isArray(data.productProfit) ? data.productProfit : [],
      );
      setMissingCostItems(
        Array.isArray(data.missingCostItems) ? data.missingCostItems : [],
      );
      setWarning(data.warning || null);
    } catch (error) {
      console.error(error);
      toast.error("Report load failed");
    } finally {
      setLoading(false);
    }
  }, [sessionStatus, token, from, to, status]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleRecalculateProfit = useCallback(async () => {
    if (!API_BASE) {
      toast.error("NEXT_PUBLIC_BACKEND_URL is missing");
      return;
    }

    if (!token) {
      toast.error("Login token missing");
      return;
    }

    try {
      setRecalculating(true);

      const res = await fetch(
        `${API_BASE}/api/v1/reports/profit-loss/recalculate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Profit recalculation failed");
        return;
      }

      const missingCount = Array.isArray(data.missingCostItems)
        ? data.missingCostItems.length
        : 0;

      if (missingCount > 0) {
        toast.error(`${missingCount} sold item still has no cost price`);
      } else {
        toast.success("Profit recalculated successfully");
      }

      await loadReport();
    } catch (error) {
      console.error(error);
      toast.error("Profit recalculation failed");
    } finally {
      setRecalculating(false);
    }
  }, [token, loadReport]);

  const netProfit = toNumber(summary.netProfit);
  const grossProfit = toNumber(summary.grossProfit);
  const profitMargin =
    summary.totalSales > 0 ? (netProfit / summary.totalSales) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-xl font-black text-white sm:text-2xl">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-orange-500/15 text-orange-400">
                <FaChartLine />
              </span>
              Profit & Loss Report
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              Delivered order profit is confirmed profit. Pending, processing,
              and shipped are expected profit.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleRecalculateProfit}
              disabled={recalculating}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-orange-500/50 bg-black px-4 text-sm font-black text-orange-300 transition hover:bg-orange-500 hover:text-white disabled:opacity-60"
            >
              <FaSyncAlt className={recalculating ? "animate-spin" : ""} />
              Recalculate Profit
            </button>

            <button
              type="button"
              onClick={loadReport}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 text-sm font-black text-white transition hover:bg-orange-700 disabled:opacity-60"
            >
              <FaSyncAlt className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
              From
            </span>
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="h-11 w-full rounded-2xl border border-neutral-800 bg-black px-4 text-sm text-white outline-none focus:border-orange-500"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
              To
            </span>
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="h-11 w-full rounded-2xl border border-neutral-800 bg-black px-4 text-sm text-white outline-none focus:border-orange-500"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
              Status
            </span>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as ReportStatus)
              }
              className="h-11 w-full rounded-2xl border border-neutral-800 bg-black px-4 text-sm font-bold text-white outline-none focus:border-orange-500"
            >
              {statusOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-black"
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={loadReport}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-neutral-800 bg-black px-4 text-sm font-black text-white transition hover:border-orange-500 hover:text-orange-300"
            >
              <FaSearchDollar />
              Apply Filter
            </button>
          </div>
        </div>
      </div>

      {(warning || missingCostItems.length > 0) && (
        <div className="rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
          <p className="font-black">Cost price missing</p>
          <p className="mt-1 text-yellow-100/80">
            {warning ||
              "Some products do not have cost price, so profit cannot be calculated accurately."}
          </p>
          {missingCostItems.length > 0 && (
            <p className="mt-2 text-xs text-yellow-100/70">
              Missing cost items:{" "}
              {missingCostItems
                .slice(0, 5)
                .map((item) => item.productName)
                .join(", ")}
              {missingCostItems.length > 5
                ? ` and ${missingCostItems.length - 5} more`
                : ""}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Orders" value={summary.orderCount || 0} />
        <StatCard
          title="Sales"
          value={formatPrice(summary.totalSales || 0)}
          tone="orange"
        />
        <StatCard
          title="Product Cost"
          value={formatPrice(summary.productCostTotal || 0)}
        />
        <StatCard
          title="Gross Profit"
          value={formatPrice(grossProfit)}
          tone={grossProfit >= 0 ? "good" : "bad"}
        />
        <StatCard
          title="Delivery Collected"
          value={formatPrice(summary.deliveryCharge || 0)}
        />
        <StatCard
          title="Courier Cost"
          value={formatPrice(summary.actualCourierCost || 0)}
        />
        <StatCard
          title="Extra Cost"
          value={formatPrice(
            (summary.packagingCost || 0) +
              (summary.paymentFee || 0) +
              (summary.otherCost || 0),
          )}
        />
        <StatCard
          title="Net Profit"
          value={formatPrice(netProfit)}
          tone={netProfit >= 0 ? "good" : "bad"}
        />
      </div>

      <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-white">Profit Health</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Net margin:{" "}
              <span
                className={
                  profitMargin >= 0 ? "text-emerald-300" : "text-red-300"
                }
              >
                {profitMargin.toFixed(2)}%
              </span>
            </p>
          </div>
          <p className="text-sm text-neutral-400">
            Formula: net profit = sales - product cost + delivery charge -
            discount - courier - packaging - payment fee - other cost
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950">
          <div className="border-b border-neutral-800 px-4 py-4">
            <h2 className="text-lg font-black text-white">Status Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-800 text-left text-sm">
              <thead className="bg-black/60 text-xs uppercase tracking-[0.15em] text-neutral-500">
                <tr>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Orders</th>
                  <th className="px-4 py-4">Sales</th>
                  <th className="px-4 py-4">Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-neutral-400"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : statusBreakdown.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-neutral-400"
                    >
                      No data found
                    </td>
                  </tr>
                ) : (
                  statusBreakdown.map((item) => (
                    <tr key={item.status}>
                      <td className="px-4 py-4 font-bold text-white">
                        {statusLabel(item.status)}
                      </td>
                      <td className="px-4 py-4 text-neutral-300">
                        {item.orderCount}
                      </td>
                      <td className="px-4 py-4 text-neutral-300">
                        {formatPrice(item.totalSales)}
                      </td>
                      <td
                        className={`px-4 py-4 font-black ${item.netProfit >= 0 ? "text-emerald-300" : "text-red-300"}`}
                      >
                        {formatPrice(item.netProfit)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950">
          <div className="border-b border-neutral-800 px-4 py-4">
            <h2 className="text-lg font-black text-white">
              Top Product Profit
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-800 text-left text-sm">
              <thead className="bg-black/60 text-xs uppercase tracking-[0.15em] text-neutral-500">
                <tr>
                  <th className="px-4 py-4">Product</th>
                  <th className="px-4 py-4">Qty</th>
                  <th className="px-4 py-4">Sales</th>
                  <th className="px-4 py-4">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-neutral-400"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : productProfit.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-neutral-400"
                    >
                      No product profit found
                    </td>
                  </tr>
                ) : (
                  productProfit.map((item) => (
                    <tr key={item.productId || item.productName}>
                      <td className="px-4 py-4">
                        <p className="max-w-[260px] truncate font-bold text-white">
                          {item.productName}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {item.sku || "No SKU"}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-neutral-300">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-4 text-neutral-300">
                        {formatPrice(item.totalSales)}
                      </td>
                      <td
                        className={`px-4 py-4 font-black ${item.profit >= 0 ? "text-emerald-300" : "text-red-300"}`}
                      >
                        {formatPrice(item.profit)}
                        <span className="ml-2 text-xs text-neutral-500">
                          ({item.profitMargin.toFixed(1)}%)
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
