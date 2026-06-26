"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import type { DeliveryType, Order, OrderStatus } from "@/types/order";
import { bdDistrictOptions, getDeliveryChargeByDistrict, orderStatusOptions } from "@/types/order";
import { formatPrice } from "@/lib/formatPrice";

const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");

type SessionTokenShape = {
  accessToken?: unknown;
  user?: {
    accessToken?: unknown;
    token?: unknown;
  } | null;
} | null | undefined;

type OrderEditForm = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  alternativePhone: string;
  recipientEmail: string;
  customerAddress: string;
  district: string;
  thana: string;
  deliveryType: DeliveryType;
  totalAmount: string;
  deliveryCharge: string;
  discountAmount: string;
  paidAmount: string;
  note: string;
  itemDescription: string;
  courierName: string;
  courierTrackingNumber: string;
  courierNote: string;
  status: OrderStatus;
};

interface OrderEditPageProps {
  panelType: "admin" | "moderator";
  invoiceNo: string;
}

function getSessionToken(session: unknown): string {
  const sessionData = session as SessionTokenShape;

  const token =
    sessionData?.accessToken ||
    sessionData?.user?.accessToken ||
    sessionData?.user?.token;

  return typeof token === "string" ? token : "";
}

function toInput(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function createForm(order: Order): OrderEditForm {
  const district = order.district || "Dhaka City";

  return {
    customerName: order.customerName || "",
    customerEmail: order.customerEmail || "",
    customerPhone: order.customerPhone || "",
    alternativePhone: order.alternativePhone || "",
    recipientEmail: order.recipientEmail || "",
    customerAddress: order.customerAddress || "",
    district,
    thana: order.thana || "",
    deliveryType: order.deliveryType || "home",
    totalAmount: toInput(order.totalAmount),
    deliveryCharge: toInput(order.deliveryCharge || getDeliveryChargeByDistrict(district)),
    discountAmount: toInput(order.discountAmount),
    paidAmount: toInput(order.paidAmount),
    note: order.note || "",
    itemDescription: order.itemDescription || "",
    courierName: order.courierName || "",
    courierTrackingNumber: order.courierTrackingNumber || "",
    courierNote: order.courierNote || "",
    status: order.status,
  };
}

function numeric(value: string) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function OrderEditPage({ panelType, invoiceNo }: OrderEditPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const token = getSessionToken(session);

  const [order, setOrder] = useState<Order | null>(null);
  const [form, setForm] = useState<OrderEditForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const listHref = `/${panelType}/orders`;

  const dueAmount = useMemo(() => {
    if (!form) return 0;
    const grandTotal = numeric(form.totalAmount) + numeric(form.deliveryCharge) - numeric(form.discountAmount);
    return Math.max(grandTotal - numeric(form.paidAmount), 0);
  }, [form]);

  useEffect(() => {
    if (!token || !API_BASE || !invoiceNo) return;

    const loadOrder = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/v1/orders/admin/${encodeURIComponent(invoiceNo)}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          toast.error(data.message || "Order load failed");
          return;
        }

        setOrder(data.order);
        setForm(createForm(data.order));
      } catch {
        toast.error("Order load failed");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [token, invoiceNo]);

  const setField = <K extends keyof OrderEditForm>(key: K, value: OrderEditForm[K]) => {
    setForm((current) => {
      if (!current) return current;

      if (key === "district") {
        return {
          ...current,
          district: value as string,
          deliveryCharge: String(getDeliveryChargeByDistrict(value as string)),
        };
      }

      return { ...current, [key]: value };
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form) return;

    if (form.status === "shipped" && !form.courierName.trim()) {
      toast.error("Shipped korte hole courier name dite hobe");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/api/v1/orders/admin/${encodeURIComponent(invoiceNo)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Order update failed");
        return;
      }

      toast.success("Order updated successfully");
      router.push(listHref);
    } catch {
      toast.error("Order update failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="rounded-3xl border border-gray-800 bg-black p-8 text-center text-gray-400">Loading order...</div>;
  }

  if (!order || !form) {
    return <div className="rounded-3xl border border-gray-800 bg-black p-8 text-center text-gray-400">Order not found</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-3xl border border-gray-800 bg-black p-4 sm:p-5">
        <div className="flex flex-col gap-3 border-b border-gray-800 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">Edit Order {order.invoiceNo}</h1>
            <p className="mt-2 text-sm text-gray-400">Customer info, payment amount, courier details, note, and manual status update koro.</p>
          </div>
          <Link href={listHref} className="w-fit rounded-2xl border border-gray-700 px-5 py-3 text-sm font-bold text-gray-200 transition hover:bg-gray-900">
            Back to Orders
          </Link>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.78fr]">
          <div className="space-y-5">
            <Section title="Customer Information">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Customer Name" value={form.customerName} onChange={(value) => setField("customerName", value)} required />
                <TextField label="Phone" value={form.customerPhone} onChange={(value) => setField("customerPhone", value)} required />
                <TextField label="Customer Email" value={form.customerEmail} onChange={(value) => setField("customerEmail", value)} />
                <TextField label="Recipient Email" value={form.recipientEmail} onChange={(value) => setField("recipientEmail", value)} />
                <TextField label="Alternative Phone" value={form.alternativePhone} onChange={(value) => setField("alternativePhone", value)} />
                <DistrictSelect label="District" value={form.district} onChange={(value) => setField("district", value)} required />
                <TextField label="Thana" value={form.thana} onChange={(value) => setField("thana", value)} />
                <label className="block">
                  <span className="text-sm font-semibold text-gray-300">Delivery Type</span>
                  <select
                    value={form.deliveryType}
                    onChange={(event) => setField("deliveryType", event.target.value as DeliveryType)}
                    className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-orange-500"
                  >
                    <option value="home">Home Delivery</option>
                    <option value="point">Point Delivery</option>
                  </select>
                </label>
                <div className="sm:col-span-2">
                  <TextAreaField label="Address" value={form.customerAddress} onChange={(value) => setField("customerAddress", value)} required rows={4} />
                </div>
              </div>
            </Section>

            <Section title="Products">
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-gray-800 bg-gray-950 p-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black">
                      {item.productImage ? <img src={item.productImage} alt={item.productName} className="h-full w-full object-contain p-1" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-black text-white">{item.productName}</p>
                      <p className="mt-1 text-xs text-gray-500">Qty {item.quantity} × {formatPrice(item.unitPrice)}</p>
                    </div>
                    <p className="shrink-0 text-sm font-black text-orange-400">{formatPrice(item.totalPrice)}</p>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          <div className="space-y-5">
            <Section title="Payment & Status">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <NumberField label="Product Total" value={form.totalAmount} onChange={(value) => setField("totalAmount", value)} />
                <NumberField label="Delivery Charge" value={form.deliveryCharge} onChange={(value) => setField("deliveryCharge", value)} />
                <NumberField label="Discount Amount" value={form.discountAmount} onChange={(value) => setField("discountAmount", value)} />
                <NumberField label="Paid Amount" value={form.paidAmount} onChange={(value) => setField("paidAmount", value)} />
                <label className="block">
                  <span className="text-sm font-semibold text-gray-300">Status</span>
                  <select
                    value={form.status}
                    onChange={(event) => setField("status", event.target.value as OrderStatus)}
                    className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-orange-500"
                  >
                    {orderStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-5 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-orange-300/80">Auto Due Amount</p>
                <p className="mt-2 text-3xl font-black text-white">{formatPrice(dueAmount)}</p>
                <p className="mt-2 text-xs text-gray-400">COD amount due amount er sathe auto update hobe.</p>
              </div>
            </Section>

            <Section title="Courier Information">
              <div className="space-y-4">
                <TextField label="Courier Name" value={form.courierName} onChange={(value) => setField("courierName", value)} placeholder="Pathao / RedX / Paperfly / SA Paribahan" />
                <TextField label="Tracking Number" value={form.courierTrackingNumber} onChange={(value) => setField("courierTrackingNumber", value)} />
                <TextAreaField label="Courier Note" value={form.courierNote} onChange={(value) => setField("courierNote", value)} rows={3} maxLength={400} />
                <p className="text-xs leading-5 text-gray-500">Status shipped dile courier name required. Processing থেকে Shipped হলে user email a courier info সহ shipped mail যাবে.</p>
              </div>
            </Section>

            <Section title="Note & Item Description">
              <div className="space-y-4">
                <TextAreaField label="Item Description" value={form.itemDescription} onChange={(value) => setField("itemDescription", value)} rows={4} maxLength={400} />
                <TextAreaField label="Customer Note" value={form.note} onChange={(value) => setField("note", value)} rows={4} maxLength={400} />
              </div>
            </Section>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-20 flex justify-end gap-3 border-t border-gray-800 bg-black/95 p-4 backdrop-blur">
        <Link href={listHref} className="rounded-2xl border border-gray-700 px-5 py-3 font-bold text-gray-200 transition hover:bg-gray-900">Cancel</Link>
        <button disabled={submitting} className="rounded-2xl bg-orange-600 px-6 py-3 font-black text-white transition hover:bg-orange-700 disabled:opacity-60">
          {submitting ? "Updating..." : "Update Order"}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-gray-800 bg-black p-4 sm:p-5">
      <h2 className="mb-4 text-lg font-black text-white">{title}</h2>
      {children}
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-gray-300">{label}{required ? " *" : ""}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-orange-500"
      />
    </label>
  );
}

function DistrictSelect({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-gray-300">{label}{required ? " *" : ""}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
      >
        {bdDistrictOptions.map((district) => (
          <option key={district} value={district} className="bg-black text-white">
            {district}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-gray-300">{label}</span>
      <input type="number" min="0" step="0.01" value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-orange-500" />
    </label>
  );
}

function TextAreaField({ label, value, onChange, rows = 3, required, maxLength }: { label: string; value: string; onChange: (value: string) => void; rows?: number; required?: boolean; maxLength?: number }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-gray-300">{label}{required ? " *" : ""}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} maxLength={maxLength} className="mt-2 w-full resize-none rounded-2xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm leading-7 text-white outline-none focus:border-orange-500" />
    </label>
  );
}
