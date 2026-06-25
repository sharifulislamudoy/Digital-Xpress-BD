"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { FaTimesCircle } from "react-icons/fa";
import type { Order } from "@/types/order";
import { canCancelOrder, orderStatusLabels } from "@/types/order";
import { formatPrice } from "@/lib/formatPrice";

const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");

type SessionTokenShape = {
  accessToken?: unknown;
  user?: {
    accessToken?: unknown;
    token?: unknown;
  } | null;
} | null | undefined;


function getSessionToken(session: unknown): string {
  const sessionData = session as SessionTokenShape;

  const token =
    sessionData?.accessToken ||
    sessionData?.user?.accessToken ||
    sessionData?.user?.token;

  return typeof token === "string" ? token : "";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function MyOrdersPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelInvoice, setCancelInvoice] = useState<string | null>(null);

  const token = getSessionToken(session);

  const loadOrders = async () => {
    if (!token || !API_BASE) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/orders/my`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Order load korte problem hocche");
        return;
      }

      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch {
      toast.error("Order load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      setLoading(false);
      return;
    }
    if (status === "authenticated") loadOrders();
  }, [status, token]);

  const cancelOrder = async () => {
    if (!cancelInvoice) return;

    try {
      const res = await fetch(`${API_BASE}/api/v1/orders/my/${encodeURIComponent(cancelInvoice)}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Order cancel kora jacche na");
        return;
      }

      toast.success("Order cancelled");
      setOrders((current) =>
        current.map((order) => (order.invoiceNo === cancelInvoice ? data.order : order))
      );
      setCancelInvoice(null);
    } catch {
      toast.error("Cancel failed");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-3xl border border-gray-800 bg-black p-8 text-center text-gray-400">Loading orders...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-3xl border border-gray-800 bg-black p-8 text-center">
          <h1 className="text-2xl font-black text-white">Login Required</h1>
          <p className="mt-3 text-sm text-gray-400">Tomar order dekhte hole login korte hobe.</p>
          <Link href="/login" className="mt-6 inline-flex rounded-2xl bg-orange-600 px-6 py-3 font-bold text-white transition hover:bg-orange-700">
            Login Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 lg:py-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">My Orders</h1>
          <p className="mt-2 text-sm text-gray-400">Pending status thakle order cancel korte parbe.</p>
        </div>
        <Link href="/products" className="w-fit rounded-2xl bg-orange-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-700">
          Continue Shopping
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-gray-800 bg-black p-8 text-center text-gray-400">
          No order found.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-3xl border border-gray-800 bg-black p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-black text-white">{order.invoiceNo}</h2>
                    <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300">
                      {orderStatusLabels[order.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Placed on {formatDate(order.createdAt)}</p>
                  <p className="mt-2 text-sm text-gray-400">{order.customerAddress}, {order.thana ? `${order.thana}, ` : ""}{order.district}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 lg:min-w-[420px]">
                  <InfoBox label="Total" value={formatPrice(order.totalAmount + order.deliveryCharge - order.discountAmount)} />
                  <InfoBox label="Paid" value={formatPrice(order.paidAmount)} />
                  <InfoBox label="Due" value={formatPrice(order.dueAmount)} />
                  <InfoBox label="COD" value={formatPrice(order.codAmount)} />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-gray-800 bg-gray-950 p-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-black">
                      {item.productImage ? <img src={item.productImage} alt={item.productName} className="h-full w-full object-contain p-1" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-bold text-white">{item.productName}</p>
                      <p className="mt-1 text-xs text-gray-500">Qty {item.quantity} × {formatPrice(item.unitPrice)}</p>
                    </div>
                    <p className="shrink-0 text-sm font-black text-orange-400">{formatPrice(item.totalPrice)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-800 pt-4">
                <div className="text-xs text-gray-500">
                  {order.courierTrackingNumber
                    ? `${order.courierName || "Courier"}: ${order.courierTrackingNumber}`
                    : "Tracking info will appear after courier booking."}
                </div>

                <button
                  type="button"
                  disabled={!canCancelOrder(order.status)}
                  onClick={() => setCancelInvoice(order.invoiceNo)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-300 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:border-gray-800 disabled:bg-gray-900 disabled:text-gray-600"
                >
                  <FaTimesCircle />
                  Cancel Order
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {cancelInvoice && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-gray-800 bg-black p-6 text-center">
            <h2 className="text-xl font-black text-white">Cancel Order?</h2>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Invoice {cancelInvoice} cancel korte chaccho? Pending order cancel hole pore abar active kora jabe na.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button onClick={() => setCancelInvoice(null)} className="rounded-2xl border border-gray-700 px-5 py-3 font-bold text-gray-200 transition hover:bg-gray-900">
                No
              </button>
              <button onClick={cancelOrder} className="rounded-2xl bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700">
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-950 p-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}
