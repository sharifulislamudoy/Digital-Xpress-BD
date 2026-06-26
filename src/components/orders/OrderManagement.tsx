"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  FaCheckCircle,
  FaChevronDown,
  FaEdit,
  FaEye,
  FaSearch,
  FaTimes,
  FaTrash,
  FaTruck,
} from "react-icons/fa";

import ConfirmationModal from "@/components/users/ConfirmationModal";
import type { Order, OrderStatus } from "@/types/order";
import { orderStatusLabels, orderStatusOptions } from "@/types/order";
import { formatPrice } from "@/lib/formatPrice";

const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(
  /\/+$/,
  ""
);

type SessionTokenShape = {
  accessToken?: unknown;
  user?: {
    accessToken?: unknown;
    token?: unknown;
  } | null;
} | null | undefined;

const limitOptions = [25, 50, 100, 200, 500];

const filterOptions: Array<{ value: "all" | OrderStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returned", label: "Return" },
];

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type OrderCounts = Record<"all" | OrderStatus, number>;

const emptyOrderCounts: OrderCounts = {
  all: 0,
  pending: 0,
  processing: 0,
  shipped: 0,
  delivered: 0,
  cancelled: 0,
  returned: 0,
};

type CourierForm = {
  courierName: string;
  courierTrackingNumber: string;
  courierNote: string;
};

const emptyCourierForm: CourierForm = {
  courierName: "",
  courierTrackingNumber: "",
  courierNote: "",
};

interface OrderManagementProps {
  panelType: "admin" | "moderator";
}

function getSessionToken(session: unknown): string {
  const sessionData = session as SessionTokenShape;

  const token =
    sessionData?.accessToken ||
    sessionData?.user?.accessToken ||
    sessionData?.user?.token;

  return typeof token === "string" ? token : "";
}

function toSafeNumber(value: number | string | null | undefined) {
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

function orderGrandTotal(order: Order) {
  return (
    toSafeNumber(order.totalAmount) +
    toSafeNumber(order.deliveryCharge) -
    toSafeNumber(order.discountAmount)
  );
}

function getStatusBadgeClass(status: OrderStatus) {
  switch (status) {
    case "pending":
      return "border-orange-500/30 bg-orange-500/10 text-orange-300";
    case "processing":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    case "shipped":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    case "delivered":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "returned":
      return "border-purple-500/30 bg-purple-500/10 text-purple-300";
    case "cancelled":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    default:
      return "border-orange-500/30 bg-orange-500/10 text-orange-300";
  }
}

function ShortText({
  children,
  className = "",
  title,
}: {
  children: string;
  className?: string;
  title?: string;
}) {
  return (
    <p title={title || children} className={`truncate ${className}`}>
      {children}
    </p>
  );
}

export default function OrderManagement({ panelType }: OrderManagementProps) {
  const { data: session, status: sessionStatus } = useSession();
  const token = getSessionToken(session);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [countsLoading, setCountsLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(25);
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });

  const [orderCounts, setOrderCounts] =
    useState<OrderCounts>(emptyOrderCounts);

  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [openActionInvoice, setOpenActionInvoice] = useState<string | null>(
    null
  );

  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null);

  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("processing");
  const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false);
  const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState(false);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [courierForm, setCourierForm] = useState<CourierForm>(emptyCourierForm);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const selectedStatusLabel =
    orderStatusOptions.find((option) => option.value === bulkStatus)?.label ||
    orderStatusLabels[bulkStatus] ||
    bulkStatus;

  const getFilterCount = (value: "all" | OrderStatus) => {
    return orderCounts[value] || 0;
  };

  const loadOrderCounts = useCallback(async () => {
    if (sessionStatus === "loading") return;
    if (!API_BASE || !token) return;

    try {
      setCountsLoading(true);

      const results = await Promise.all(
        filterOptions.map(async (option) => {
          try {
            const params = new URLSearchParams({
              status: option.value,
              page: "1",
              limit: "1",
            });

            const res = await fetch(
              `${API_BASE}/api/v1/orders/admin?${params.toString()}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
              }
            );

            const data = await res.json();

            if (!res.ok || !data.success) {
              return [option.value, 0] as const;
            }

            const total = toSafeNumber(
              data.pagination?.total ??
                data.total ??
                data.count ??
                data.totalOrders ??
                0
            );

            return [option.value, total] as const;
          } catch {
            return [option.value, 0] as const;
          }
        })
      );

      const nextCounts: OrderCounts = { ...emptyOrderCounts };

      results.forEach(([status, total]) => {
        nextCounts[status] = total;
      });

      setOrderCounts(nextCounts);
    } finally {
      setCountsLoading(false);
    }
  }, [sessionStatus, token]);

  const loadOrders = useCallback(async () => {
    if (sessionStatus === "loading") return;

    if (!API_BASE) {
      setLoading(false);
      toast.error("Backend URL missing");
      return;
    }

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const params = new URLSearchParams({
        status: statusFilter,
        search: search.trim(),
        page: String(page),
        limit: String(limit),
      });

      const res = await fetch(
        `${API_BASE}/api/v1/orders/admin?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Order load failed");
        return;
      }

      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setPagination(
        data.pagination || {
          page,
          limit,
          total: 0,
          totalPages: 1,
        }
      );
      setSelectedInvoices([]);
      setOpenActionInvoice(null);
    } catch (error) {
      console.error(error);
      toast.error("Order load failed");
    } finally {
      setLoading(false);
    }
  }, [sessionStatus, token, statusFilter, search, page, limit]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    loadOrderCounts();
  }, [loadOrderCounts]);

  const allCurrentSelected =
    orders.length > 0 &&
    orders.every((order) => selectedInvoices.includes(order.invoiceNo));

  const selectedText = useMemo(() => {
    const count = selectedInvoices.length;
    return `${count} ${count === 1 ? "order" : "orders"} selected`;
  }, [selectedInvoices.length]);

  const startEntry =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;

  const endEntry =
    pagination.total === 0
      ? 0
      : Math.min(pagination.page * pagination.limit, pagination.total);

  const toggleSelectAll = () => {
    if (allCurrentSelected) {
      setSelectedInvoices((current) =>
        current.filter(
          (invoice) => !orders.some((order) => order.invoiceNo === invoice)
        )
      );
      return;
    }

    setSelectedInvoices((current) =>
      Array.from(new Set([...current, ...orders.map((order) => order.invoiceNo)]))
    );
  };

  const toggleSelectOrder = (invoiceNo: string) => {
    setSelectedInvoices((current) =>
      current.includes(invoiceNo)
        ? current.filter((invoice) => invoice !== invoiceNo)
        : [...current, invoiceNo]
    );
  };

  const resetAndSetStatus = (value: "all" | OrderStatus) => {
    setStatusFilter(value);
    setPage(1);
    setOpenActionInvoice(null);
    setIsBulkMenuOpen(false);
  };

  const openBulkStatusModal = () => {
    if (selectedInvoices.length === 0) {
      toast.error("Select at least one order");
      return;
    }

    setIsBulkMenuOpen(false);
    setIsBulkStatusModalOpen(true);
  };

  const startBulkStatusConfirm = () => {
    if (selectedInvoices.length === 0) {
      toast.error("Select at least one order");
      return;
    }

    setIsBulkStatusModalOpen(false);

    if (bulkStatus === "shipped") {
      setIsCourierModalOpen(true);
      return;
    }

    setIsBulkConfirmOpen(true);
  };

  const startCourierConfirm = () => {
    if (!courierForm.courierName.trim()) {
      toast.error("Courier name is required");
      return;
    }

    setIsCourierModalOpen(false);
    setIsBulkConfirmOpen(true);
  };

  const handleBulkStatus = async () => {
    if (selectedInvoices.length === 0) {
      toast.error("Select at least one order");
      setIsBulkConfirmOpen(false);
      return;
    }

    try {
      setActionLoading("bulk-status");

      const res = await fetch(`${API_BASE}/api/v1/orders/admin/bulk/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          invoiceNos: selectedInvoices,
          status: bulkStatus,
          ...(bulkStatus === "shipped" ? courierForm : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Bulk update failed");
        return;
      }

      toast.success(data.message || "Orders updated");
      setIsBulkConfirmOpen(false);
      setIsBulkStatusModalOpen(false);
      setIsCourierModalOpen(false);
      setIsBulkMenuOpen(false);
      setCourierForm(emptyCourierForm);
      loadOrders();
      loadOrderCounts();
    } catch {
      toast.error("Bulk update failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteOrder) return;

    try {
      setActionLoading(`delete-${deleteOrder.invoiceNo}`);

      const res = await fetch(
        `${API_BASE}/api/v1/orders/admin/${encodeURIComponent(
          deleteOrder.invoiceNo
        )}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Delete failed");
        return;
      }

      toast.success("Order deleted");
      setDeleteOrder(null);
      loadOrders();
      loadOrderCounts();
    } catch {
      toast.error("Delete failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-xl font-black text-white sm:text-2xl">
              All Sales
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              Manage orders, payment, courier info, and bulk status updates.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
                placeholder="Search invoice, phone, courier"
                className="h-11 w-full rounded-2xl border border-neutral-800 bg-black pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-orange-500 sm:w-80"
              />
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsBulkMenuOpen((current) => !current)}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 text-sm font-black text-white transition hover:bg-orange-700 sm:w-auto"
              >
                Bulk Action
                <FaChevronDown
                  size={11}
                  className={`transition ${
                    isBulkMenuOpen ? "rotate-180" : "rotate-0"
                  }`}
                />
              </button>

              {isBulkMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-neutral-800 bg-black shadow-2xl">
                  <button
                    type="button"
                    onClick={openBulkStatusModal}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-neutral-300 transition hover:bg-neutral-900 hover:text-orange-300"
                  >
                    <FaEdit size={13} />
                    Edit Status
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {filterOptions.map((option) => {
            const isActive = statusFilter === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => resetAndSetStatus(option.value)}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-black transition ${
                  isActive
                    ? "bg-orange-600 text-white shadow-[0_8px_25px_rgba(234,88,12,0.28)]"
                    : "border border-neutral-800 bg-black text-neutral-400 hover:border-orange-500/50 hover:text-orange-300"
                }`}
              >
                <span>{option.label}</span>

                <span
                  className={`min-w-6 rounded-full px-2 py-0.5 text-[10px] leading-4 ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-neutral-900 text-neutral-400"
                  }`}
                >
                  {countsLoading ? "..." : getFilterCount(option.value)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-black p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-neutral-400">
            <span className="font-black text-orange-400">{selectedText}</span>
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-neutral-800 bg-neutral-950 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
        <table className="w-full min-w-[980px] table-fixed text-left text-xs">
          <colgroup>
            <col className="w-[38px]" />
            <col className="w-[92px]" />
            <col className="w-[120px]" />
            <col className="w-[210px]" />
            <col className="w-[84px]" />
            <col className="w-[74px]" />
            <col className="w-[74px]" />
            <col className="w-[130px]" />
            <col className="w-[100px]" />
            <col className="w-[112px]" />
          </colgroup>

          <thead className="border-b border-neutral-800 bg-black text-[10px] uppercase tracking-[0.12em] text-neutral-500">
            <tr>
              <th className="px-2 py-3">
                <input
                  type="checkbox"
                  checked={allCurrentSelected}
                  onChange={toggleSelectAll}
                  className="h-3.5 w-3.5 accent-orange-500"
                />
              </th>
              <th className="px-2 py-3">Action</th>
              <th className="px-2 py-3">Invoice</th>
              <th className="px-2 py-3">Customer</th>
              <th className="px-2 py-3">Total</th>
              <th className="px-2 py-3">Paid</th>
              <th className="px-2 py-3">Due</th>
              <th className="px-2 py-3">Courier</th>
              <th className="px-2 py-3">Note</th>
              <th className="px-2 py-3">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-800">
            {loading ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-3 py-14 text-center text-neutral-400"
                >
                  Loading orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-3 py-14 text-center text-neutral-400"
                >
                  No order found
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="align-top transition hover:bg-black/70"
                >
                  <td className="px-2 py-3">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.includes(order.invoiceNo)}
                      onChange={() => toggleSelectOrder(order.invoiceNo)}
                      className="h-3.5 w-3.5 accent-orange-500"
                    />
                  </td>

                  <td className="relative px-2 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenActionInvoice((current) =>
                          current === order.invoiceNo ? null : order.invoiceNo
                        )
                      }
                      className="inline-flex max-w-full items-center gap-1.5 rounded-xl border border-neutral-800 bg-black px-2.5 py-2 text-[11px] font-bold text-white transition hover:border-orange-500/60 hover:text-orange-300"
                    >
                      Action
                      <FaChevronDown size={10} />
                    </button>

                    {openActionInvoice === order.invoiceNo && (
                      <div className="absolute left-2 top-12 z-40 w-40 overflow-hidden rounded-2xl border border-neutral-800 bg-black shadow-2xl">
                        <button
                          type="button"
                          onClick={() => {
                            setViewOrder(order);
                            setOpenActionInvoice(null);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-neutral-300 transition hover:bg-neutral-900 hover:text-white"
                        >
                          <FaEye size={13} /> View
                        </button>

                        <Link
                          href={`/${panelType}/orders/${encodeURIComponent(
                            order.invoiceNo
                          )}`}
                          onClick={() => setOpenActionInvoice(null)}
                          className="flex items-center gap-2 px-4 py-3 text-sm text-neutral-300 transition hover:bg-neutral-900 hover:text-white"
                        >
                          <FaEdit size={13} /> Edit
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            setDeleteOrder(order);
                            setOpenActionInvoice(null);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-300 transition hover:bg-red-600 hover:text-white"
                        >
                          <FaTrash size={13} /> Delete
                        </button>
                      </div>
                    )}
                  </td>

                  <td className="px-2 py-3">
                    <ShortText
                      title={order.invoiceNo}
                      className="font-black text-white"
                    >
                      {order.invoiceNo}
                    </ShortText>

                    <p className="mt-1 truncate text-[11px] text-neutral-500">
                      {formatDate(order.createdAt)}
                    </p>
                  </td>

                  <td className="px-2 py-3">
                    <ShortText
                      title={order.customerName}
                      className="font-black text-white"
                    >
                      {order.customerName}
                    </ShortText>

                    <ShortText
                      title={order.customerEmail || "No email"}
                      className="mt-1 text-[11px] text-neutral-500"
                    >
                      {order.customerEmail || "No email"}
                    </ShortText>

                    <ShortText
                      title={order.customerPhone}
                      className="mt-1 font-bold text-[11px] text-neutral-300"
                    >
                      {order.customerPhone}
                    </ShortText>
                  </td>

                  <td className="px-2 py-3 font-black text-orange-400">
                    <ShortText title={formatPrice(orderGrandTotal(order))}>
                      {formatPrice(orderGrandTotal(order))}
                    </ShortText>
                  </td>

                  <td className="px-2 py-3 font-black text-emerald-300">
                    <ShortText title={formatPrice(order.paidAmount)}>
                      {formatPrice(order.paidAmount)}
                    </ShortText>
                  </td>

                  <td className="px-2 py-3 font-black text-red-300">
                    <ShortText title={formatPrice(order.dueAmount)}>
                      {formatPrice(order.dueAmount)}
                    </ShortText>
                  </td>

                  <td className="px-2 py-3">
                    <ShortText
                      title={order.courierName || "Manual"}
                      className="font-bold text-neutral-200"
                    >
                      {order.courierName || "Manual"}
                    </ShortText>

                    <ShortText
                      title={order.courierTrackingNumber || "No tracking yet"}
                      className="mt-1 text-[11px] text-neutral-500"
                    >
                      {order.courierTrackingNumber || "No tracking yet"}
                    </ShortText>
                  </td>

                  <td className="px-2 py-3 text-[11px] leading-5 text-neutral-500">
                    <div
                      title={order.note || "-"}
                      className="max-h-10 overflow-hidden break-words"
                    >
                      {order.note || "-"}
                    </div>
                  </td>

                  <td className="px-2 py-3">
                    <span
                      title={orderStatusLabels[order.status]}
                      className={`inline-flex max-w-full truncate rounded-full border px-2 py-1 text-[10px] font-black ${getStatusBadgeClass(
                        order.status
                      )}`}
                    >
                      {orderStatusLabels[order.status]}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing{" "}
          <span className="font-bold text-white">
            {startEntry} to {endEntry}
          </span>{" "}
          of <span className="font-bold text-white">{pagination.total}</span>{" "}
          entries
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            className="rounded-xl border border-neutral-800 px-4 py-2 font-bold text-neutral-200 transition hover:border-orange-500/50 hover:text-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>

          <span className="rounded-xl border border-neutral-800 bg-black px-4 py-2 font-black text-orange-400">
            {pagination.page} / {pagination.totalPages}
          </span>

          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-xl border border-neutral-800 px-4 py-2 font-bold text-neutral-200 transition hover:border-orange-500/50 hover:text-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <BulkStatusModal
        isOpen={isBulkStatusModalOpen}
        selectedCount={selectedInvoices.length}
        selectedStatus={bulkStatus}
        onChange={setBulkStatus}
        onClose={() => setIsBulkStatusModalOpen(false)}
        onSubmit={startBulkStatusConfirm}
      />

      <CourierInfoModal
        isOpen={isCourierModalOpen}
        selectedCount={selectedInvoices.length}
        form={courierForm}
        onChange={(nextForm) => setCourierForm(nextForm)}
        onClose={() => setIsCourierModalOpen(false)}
        onSubmit={startCourierConfirm}
      />

      {viewOrder && (
        <OrderViewModal order={viewOrder} onClose={() => setViewOrder(null)} />
      )}

      <ConfirmationModal
        isOpen={isBulkConfirmOpen}
        onClose={() => setIsBulkConfirmOpen(false)}
        onConfirm={handleBulkStatus}
        title="Confirm Status Change"
        message={
          bulkStatus === "shipped"
            ? `Are you sure you want to change ${selectedInvoices.length} selected order status to ${selectedStatusLabel}? Courier information will be added to all selected orders.`
            : `Are you sure you want to change ${selectedInvoices.length} selected order status to ${selectedStatusLabel}?`
        }
        confirmText="Confirm Change"
        isLoading={actionLoading === "bulk-status"}
      />

      <ConfirmationModal
        isOpen={Boolean(deleteOrder)}
        onClose={() => setDeleteOrder(null)}
        onConfirm={handleDelete}
        title="Delete Order"
        message={`Are you sure you want to delete ${
          deleteOrder?.invoiceNo || "this order"
        }?`}
        confirmText="Yes, Delete"
        confirmVariant="danger"
        isLoading={actionLoading === `delete-${deleteOrder?.invoiceNo}`}
      />
    </div>
  );
}

function CourierInfoModal({
  isOpen,
  selectedCount,
  form,
  onChange,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  selectedCount: number;
  form: CourierForm;
  onChange: (form: CourierForm) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!isOpen) return null;

  const setField = <K extends keyof CourierForm>(key: K, value: CourierForm[K]) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-black/75 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl border border-neutral-800 bg-neutral-950 p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
              <FaTruck size={18} />
            </div>
            <h2 className="text-xl font-black text-white">Courier Information</h2>
            <p className="mt-1 text-sm leading-6 text-neutral-400">
              {selectedCount} selected order shipped korte courier info add koro. Ei info sob selected order e add hobe.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-2xl border border-neutral-800 text-neutral-400 transition hover:border-orange-500/50 hover:text-orange-300"
            aria-label="Close courier modal"
          >
            <FaTimes size={14} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-neutral-300">Courier Name *</span>
            <input
              value={form.courierName}
              onChange={(event) => setField("courierName", event.target.value)}
              placeholder="Pathao / RedX / Paperfly / SA Paribahan"
              className="mt-2 w-full rounded-2xl border border-neutral-800 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-orange-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-neutral-300">Tracking Number</span>
            <input
              value={form.courierTrackingNumber}
              onChange={(event) => setField("courierTrackingNumber", event.target.value)}
              placeholder="Type tracking or consignment number"
              className="mt-2 w-full rounded-2xl border border-neutral-800 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-orange-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-neutral-300">Courier Note</span>
            <textarea
              value={form.courierNote}
              onChange={(event) => setField("courierNote", event.target.value)}
              maxLength={400}
              rows={4}
              placeholder="Any courier note"
              className="mt-2 w-full resize-none rounded-2xl border border-neutral-800 bg-black px-4 py-3 text-sm leading-7 text-white outline-none transition placeholder:text-neutral-600 focus:border-orange-500"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-neutral-800 px-5 py-3 text-sm font-bold text-neutral-300 transition hover:bg-black hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            className="rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-700"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

function BulkStatusModal({
  isOpen,
  selectedCount,
  selectedStatus,
  onChange,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  selectedCount: number;
  selectedStatus: OrderStatus;
  onChange: (status: OrderStatus) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-black/75 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl border border-neutral-800 bg-neutral-950 p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <h2 className="text-xl font-black text-white">Edit Status</h2>
            <p className="mt-1 text-sm text-neutral-400">
              {selectedCount} selected order status update hobe.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-2xl border border-neutral-800 text-neutral-400 transition hover:border-orange-500/50 hover:text-orange-300"
            aria-label="Close modal"
          >
            <FaTimes size={14} />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {orderStatusOptions.map((option) => {
            const isSelected = selectedStatus === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? "border-orange-500 bg-orange-500/10 text-white"
                    : "border-neutral-800 bg-black text-neutral-400 hover:border-orange-500/50 hover:text-orange-300"
                }`}
              >
                <span>
                  <span className="block text-sm font-black">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-xs text-neutral-500">
                    Change selected orders to this status
                  </span>
                </span>

                {isSelected && (
                  <FaCheckCircle className="shrink-0 text-orange-400" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-neutral-800 px-5 py-3 text-sm font-bold text-neutral-300 transition hover:bg-black hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            className="rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-700"
          >
            Change Status
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderViewModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-black/75 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-neutral-800 bg-neutral-950 p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-3 border-b border-neutral-800 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">
              {order.invoiceNo}
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              Full order details with customer, products, payment, courier, and
              status.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-neutral-800 px-4 py-2 text-sm font-bold text-neutral-300 transition hover:bg-black hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-neutral-800 bg-black p-4">
            <h3 className="font-black text-white">Customer Information</h3>

            <div className="mt-3 space-y-2 text-sm text-neutral-300">
              <Detail label="Name" value={order.customerName} />
              <Detail label="Email" value={order.customerEmail || "-"} />
              <Detail label="Phone" value={order.customerPhone} />
              <Detail
                label="Alternative Phone"
                value={order.alternativePhone || "-"}
              />
              <Detail
                label="Recipient Email"
                value={order.recipientEmail || "-"}
              />
              <Detail
                label="Address"
                value={`${order.customerAddress}, ${
                  order.thana ? `${order.thana}, ` : ""
                }${order.district}`}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-800 bg-black p-4">
            <h3 className="font-black text-white">Order Summary</h3>

            <div className="mt-3 space-y-2 text-sm text-neutral-300">
              <Detail label="Status" value={orderStatusLabels[order.status]} />
              <Detail label="Payment" value={order.paymentStatus} />
              <Detail label="Total" value={formatPrice(orderGrandTotal(order))} />
              <Detail label="Paid" value={formatPrice(order.paidAmount)} />
              <Detail label="Due" value={formatPrice(order.dueAmount)} />
              <Detail label="COD" value={formatPrice(order.codAmount)} />
              <Detail
                label="Delivery Type"
                value={
                  order.deliveryType === "point"
                    ? "Point Delivery"
                    : "Home Delivery"
                }
              />
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-2xl border border-neutral-800 bg-black p-4">
          <h3 className="font-black text-white">Courier Information</h3>

          <div className="mt-3 grid gap-2 text-sm text-neutral-300 sm:grid-cols-2">
            <Detail
              label="Courier"
              value={order.courierName || "Not selected"}
            />
            <Detail
              label="Tracking"
              value={order.courierTrackingNumber || "No tracking yet"}
            />
            <Detail
              label="Courier Added"
              value={formatDate(order.courierAssignedAt)}
            />
            <Detail label="Courier Note" value={order.courierNote || "-"} />
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-neutral-800 bg-black p-4">
          <h3 className="font-black text-white">Products</h3>

          <div className="mt-3 space-y-2">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-950 p-3"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black">
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="h-full w-full object-contain p-1"
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-white">
                    {item.productName}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    SKU: {item.sku || "-"}
                  </p>
                </div>

                <div className="text-right text-sm">
                  <p className="font-bold text-neutral-300">
                    Qty {item.quantity}
                  </p>
                  <p className="mt-1 font-black text-orange-400">
                    {formatPrice(item.totalPrice)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {(order.note || order.itemDescription) && (
          <section className="mt-4 rounded-2xl border border-neutral-800 bg-black p-4 text-sm leading-7 text-neutral-300">
            <h3 className="mb-2 font-black text-white">
              Note & Item Description
            </h3>

            {order.itemDescription && (
              <p>
                <span className="text-neutral-500">Items:</span>{" "}
                {order.itemDescription}
              </p>
            )}

            {order.note && (
              <p>
                <span className="text-neutral-500">Note:</span> {order.note}
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-neutral-800/80 pb-2 last:border-b-0">
      <span className="text-neutral-500">{label}</span>
      <span className="text-right font-semibold text-neutral-200">{value}</span>
    </div>
  );
}