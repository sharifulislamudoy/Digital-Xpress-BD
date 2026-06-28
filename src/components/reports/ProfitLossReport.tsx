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

type ReportStatus = "completed" | "delivered" | "returned";

type Summary = {
  orderCount: number;
  totalSales: number;
  deliveryCharge: number;
  productCostTotal: number;
  grossProfit: number;
  actualCourierCost: number;
  packagingCost: number;
  netProfit: number;
};

type StatusBreakdown = {
  status: OrderStatus;
  orderCount: number;
  totalSales: number;
  productCostTotal: number;
  grossProfit: number;
  actualCourierCost: number;
  packagingCost: number;
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
  sku: string | null;
  quantity: number;
};

const statusOptions: Array<{ value: ReportStatus; label: string }> = [
  { value: "completed", label: "Delivered + Return" },
  { value: "delivered", label: "Delivered Only" },
  { value: "returned", label: "Return Only" },
];

const emptySummary: Summary = {
  orderCount: 0,
  totalSales: 0,
  deliveryCharge: 0,
  productCostTotal: 0,
  grossProfit: 0,
  actualCourierCost: 0,
  packagingCost: 0,
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
    returned: "Return",
    cancelled: "Cancelled",
  };

  return labels[status] || status;
}

function StatCard({
  label,
  value,
  hint,
  tone = "normal",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "normal" | "profit" | "loss";
}) {
  const toneClass =
    tone === "profit"
      ? "text-emerald-300"
      : tone === "loss"
        ? "text-red-300"
        : "text-white";

  return (
    <div className="rounded-3xl border border-neutral-800 bg-black p-4 shadow-[0_16px_50px_rgba(0,0,0,0.28)]">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </p>
      <p className={`mt-3 text-2xl font-black ${toneClass}`}>{value}</p>
      {hint ? <p className="mt-2 text-xs text-neutral-500">{hint}</p> : null}
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
  const [status, setStatus] = useState<ReportStatus>("completed");

  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([]);
  const [productProfit, setProductProfit] = useState<ProductProfit[]>([]);
  const [missingCostItems, setMissingCostItems] = useState<MissingCostItem[]>(
    [],
  );
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const profitMargin =
    summary.totalSales > 0 ? (summary.netProfit / summary.totalSales) * 100 : 0;

  const loadReport = useCallback(async () => {
    if (sessionStatus === "loading") return;

    if (!API_BASE || !token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const params = new URLSearchParams({ from, to, status });
      const res = await fetch(
        `${API_BASE}/api/v1/reports/profit-loss?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Profit report load failed");
        return;
      }

      setSummary({
        ...emptySummary,
        ...(data.summary || {}),
        orderCount: toNumber(data.summary?.orderCount),
      });
      setStatusBreakdown(
        Array.isArray(data.statusBreakdown) ? data.statusBreakdown : [],
      );
      setProductProfit(Array.isArray(data.productProfit) ? data.productProfit : []);
      setMissingCostItems(
        Array.isArray(data.missingCostItems) ? data.missingCostItems : [],
      );
      setWarning(data.warning || null);
    } catch (error) {
      console.error(error);
      toast.error("Profit report load failed");
    } finally {
      setLoading(false);
    }
  }, [sessionStatus, token, from, to, status]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleRecalculate = async () => {
    if (!API_BASE || !token) return;

    try {
      setRecalculating(true);

      const res = await fetch(
        `${API_BASE}/api/v1/reports/profit-loss/recalculate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        },
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Recalculate failed");
        return;
      }

      toast.success(data.message || "Profit recalculated");
      loadReport();
    } catch (error) {
      console.error(error);
      toast.error("Recalculate failed");
    } finally {
      setRecalculating(false);
    }
  };

  const netTone = summary.netProfit >= 0 ? "profit" : "loss";

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8 text-center text-neutral-400">
        Loading profit report...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-neutral-800 bg-neutral-950 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-300">
              <FaChartLine size={20} />
            </div>
            <h1 className="text-xl font-black text-white sm:text-2xl">
              Profit / Loss Report
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-400">
              Simple formula: selling price - cost price + customer delivery charge - courier company charge - packaging cost. Packaging cost is always {formatPrice(20)} per order. Report only counts delivered and return orders.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRecalculate}
            disabled={recalculating}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 text-sm font-black text-orange-200 transition hover:bg-orange-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaSyncAlt className={recalculating ? "animate-spin" : ""} size={13} />
            {recalculating ? "Recalculating..." : "Recalculate"}
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
              From
            </span>
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-neutral-800 bg-black px-4 text-sm text-white outline-none transition focus:border-orange-500"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
              To
            </span>
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-neutral-800 bg-black px-4 text-sm text-white outline-none transition focus:border-orange-500"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
              Status
            </span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as ReportStatus)}
              className="mt-2 h-11 w-full rounded-2xl border border-neutral-800 bg-black px-4 text-sm font-bold text-white outline-none transition focus:border-orange-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-black">
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {warning ? (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-200">
          {warning}
        </div>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Orders" value={String(summary.orderCount)} hint="Delivered + return only" />
        <StatCard label="Product Sales" value={formatPrice(summary.totalSales)} hint="Selling price total" />
        <StatCard label="Product Cost" value={formatPrice(summary.productCostTotal)} hint="Cost price total" />
        <StatCard
          label="Net Profit"
          value={formatPrice(summary.netProfit)}
          hint={`${profitMargin.toFixed(2)}% margin`}
          tone={netTone}
        />
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Customer Delivery" value={formatPrice(summary.deliveryCharge)} hint="Income from customer" />
        <StatCard label="Courier Cost" value={formatPrice(summary.actualCourierCost)} hint="Paid to courier company" />
        <StatCard label="Packaging Cost" value={formatPrice(summary.packagingCost)} hint="Fixed 20 per order" />
        <StatCard label="Gross Profit" value={formatPrice(summary.grossProfit)} hint="Sales - product cost" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-4">
          <h2 className="text-lg font-black text-white">Status Breakdown</h2>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-800 text-xs uppercase tracking-[0.12em] text-neutral-500">
                <tr>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Orders</th>
                  <th className="px-3 py-3">Sales</th>
                  <th className="px-3 py-3">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {statusBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-neutral-500">
                      No data found
                    </td>
                  </tr>
                ) : (
                  statusBreakdown.map((item) => (
                    <tr key={item.status}>
                      <td className="px-3 py-3 font-bold text-white">
                        {statusLabel(item.status)}
                      </td>
                      <td className="px-3 py-3 text-neutral-300">{item.orderCount}</td>
                      <td className="px-3 py-3 text-neutral-300">
                        {formatPrice(item.totalSales)}
                      </td>
                      <td
                        className={`px-3 py-3 font-black ${
                          item.netProfit >= 0 ? "text-emerald-300" : "text-red-300"
                        }`}
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

        <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-300">
              <FaSearchDollar size={18} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Top Product Profit</h2>
              <p className="text-xs text-neutral-500">Product level sales - cost only</p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="border-b border-neutral-800 text-xs uppercase tracking-[0.12em] text-neutral-500">
                <tr>
                  <th className="px-3 py-3">Product</th>
                  <th className="px-3 py-3">Qty</th>
                  <th className="px-3 py-3">Sales</th>
                  <th className="px-3 py-3">Cost</th>
                  <th className="px-3 py-3">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {productProfit.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-neutral-500">
                      No product profit found
                    </td>
                  </tr>
                ) : (
                  productProfit.map((item) => (
                    <tr key={item.productId || item.productName}>
                      <td className="px-3 py-3">
                        <p className="font-bold text-white">{item.productName}</p>
                        <p className="mt-1 text-xs text-neutral-500">{item.sku || "No SKU"}</p>
                      </td>
                      <td className="px-3 py-3 text-neutral-300">{item.quantity}</td>
                      <td className="px-3 py-3 text-neutral-300">
                        {formatPrice(item.totalSales)}
                      </td>
                      <td className="px-3 py-3 text-neutral-300">
                        {formatPrice(item.totalCost)}
                      </td>
                      <td
                        className={`px-3 py-3 font-black ${
                          item.profit >= 0 ? "text-emerald-300" : "text-red-300"
                        }`}
                      >
                        {formatPrice(item.profit)}
                        <p className="mt-1 text-xs text-neutral-500">
                          {item.profitMargin.toFixed(1)}%
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {missingCostItems.length > 0 ? (
        <section className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4">
          <h2 className="text-lg font-black text-red-200">Missing Cost Price</h2>
          <p className="mt-1 text-sm text-red-200/70">
            Ei items gula te cost price nai, tai profit accurate hobe na.
          </p>

          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {missingCostItems.slice(0, 18).map((item, index) => (
              <div
                key={`${item.invoiceNo}-${item.productId || item.productName}-${index}`}
                className="rounded-2xl border border-red-500/20 bg-black/40 p-3 text-sm"
              >
                <p className="font-black text-white">{item.productName}</p>
                <p className="mt-1 text-xs text-red-200/70">
                  Invoice: {item.invoiceNo} • Qty: {item.quantity}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
