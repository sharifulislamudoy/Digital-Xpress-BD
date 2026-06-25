"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { FaCheckCircle, FaMinus, FaPlus, FaTrash } from "react-icons/fa";
import type { Product } from "@/types/product";
import type { DeliveryType, Order } from "@/types/order";
import { formatPrice } from "@/lib/formatPrice";

const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");
const CART_STORAGE_KEY = "digital-xpress-cart";

type SessionTokenShape = {
  accessToken?: unknown;
  user?: {
    accessToken?: unknown;
    token?: unknown;
  } | null;
} | null | undefined;


type CartProduct = Product & {
  quantity: number;
  addedAt?: string;
  updatedAt?: string;
};

type CheckoutProfile = {
  id: string;
  name?: string | null;
  email?: string | null;
  mobile?: string | null;
  address?: string | null;
  district?: string | null;
  thana?: string | null;
};

type CheckoutFormState = {
  deliveryType: DeliveryType;
  customerName: string;
  customerPhone: string;
  alternativePhone: string;
  customerEmail: string;
  recipientEmail: string;
  customerAddress: string;
  district: string;
  thana: string;
  note: string;
};

const initialForm: CheckoutFormState = {
  deliveryType: "home",
  customerName: "",
  customerPhone: "",
  alternativePhone: "",
  customerEmail: "",
  recipientEmail: "",
  customerAddress: "",
  district: "Dhaka City",
  thana: "",
  note: "",
};

function readCart(): CartProduct[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartProduct[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("digital-xpress-cart-updated", { detail: items }));
}

function getSessionToken(session: unknown): string {
  const sessionData = session as SessionTokenShape;

  const token =
    sessionData?.accessToken ||
    sessionData?.user?.accessToken ||
    sessionData?.user?.token;

  return typeof token === "string" ? token : "";
}

function money(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isValidPhone(value: string) {
  return /^01\d{9}$/.test(value.trim());
}

function requiredMissingFields(form: CheckoutFormState) {
  const missing: string[] = [];

  if (!form.customerName.trim()) missing.push("recipient name");
  if (!form.customerPhone.trim()) missing.push("phone number");
  if (!form.customerAddress.trim()) missing.push("address");
  if (!form.district.trim()) missing.push("district");

  return missing;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [cartItems, setCartItems] = useState<CartProduct[]>([]);
  const [form, setForm] = useState<CheckoutFormState>(initialForm);
  const [profileLoading, setProfileLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const token = getSessionToken(session);
  const user = session?.user;

  const subtotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const price = money(item.sellingPrice || item.price || 0);
      return total + price * Math.max(Number(item.quantity || 1), 1);
    }, 0);
  }, [cartItems]);

  useEffect(() => {
    setCartItems(readCart());
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      setProfileLoading(false);
      return;
    }

    if (status !== "authenticated" || !token || !API_BASE) return;

    const loadProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/orders/checkout-profile`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        const data = await res.json();
        const profile = data.profile as CheckoutProfile | null;

        setForm((current) => ({
          ...current,
          customerName: profile?.name || user?.name || current.customerName,
          customerEmail: profile?.email || user?.email || current.customerEmail,
          recipientEmail: profile?.email || user?.email || current.recipientEmail,
          customerPhone: profile?.mobile || current.customerPhone,
          customerAddress: profile?.address || current.customerAddress,
          district: profile?.district || current.district || "Dhaka City",
          thana: profile?.thana || current.thana,
        }));
      } catch {
        toast.error("Checkout profile load korte problem hocche");
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [status, token, user?.email, user?.name]);

  const setField = <K extends keyof CheckoutFormState>(key: K, value: CheckoutFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateQuantity = (productId: string, nextQuantity: number) => {
    const updated = cartItems.map((item) =>
      item.id === productId ? { ...item, quantity: Math.max(nextQuantity, 1) } : item
    );
    setCartItems(updated);
    writeCart(updated);
  };

  const removeItem = (productId: string) => {
    const updated = cartItems.filter((item) => item.id !== productId);
    setCartItems(updated);
    writeCart(updated);
    toast.success("Item removed from cart");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (status !== "authenticated") {
      toast.error("Checkout korte hole age login korte hobe");
      router.push(`/login?callbackUrl=${encodeURIComponent("/checkout")}`);
      return;
    }

    if (!API_BASE) {
      toast.error("NEXT_PUBLIC_BACKEND_URL missing");
      return;
    }

    if (!token) {
      toast.error("Login token missing. Please login again.");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Cart empty");
      return;
    }

    const missing = requiredMissingFields(form);
    if (missing.length > 0) {
      toast.error(`Please provide ${missing.join(", ")}`);
      return;
    }

    if (!isValidPhone(form.customerPhone)) {
      toast.error("Phone number 11 digit Bangladeshi number hote hobe, example 017xxxxxxxx");
      return;
    }

    if (form.alternativePhone.trim() && !isValidPhone(form.alternativePhone)) {
      toast.error("Alternative phone number valid na");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(`${API_BASE}/api/v1/orders/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          items: cartItems.map((item) => ({ productId: item.id, quantity: item.quantity || 1 })),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Order create korte parlam na");
        return;
      }

      setCreatedOrder(data.order);
      setCartItems([]);
      writeCart([]);
    } catch (error) {
      console.error(error);
      toast.error("Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || profileLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-3xl border border-gray-800 bg-black p-8 text-center text-gray-400">
          Loading checkout...
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-3xl border border-gray-800 bg-black p-8 text-center">
          <h1 className="text-2xl font-black text-white">Login Required</h1>
          <p className="mt-3 text-sm leading-6 text-gray-400">
            Checkout korte hole age login korte hobe. Login korar por tomar cart thekei order complete korte parbe.
          </p>
          <Link
            href={`/login?callbackUrl=${encodeURIComponent("/checkout")}`}
            className="mt-6 inline-flex rounded-2xl bg-orange-600 px-6 py-3 font-bold text-white transition hover:bg-orange-700"
          >
            Login Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 lg:py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white sm:text-3xl">Checkout</h1>
        <p className="mt-2 text-sm text-gray-400">
          Missing information thakle ekhane fill kore order submit koro.
        </p>
      </div>

      {cartItems.length === 0 ? (
        <div className="rounded-3xl border border-gray-800 bg-black p-8 text-center">
          <h2 className="text-xl font-bold text-white">Your cart is empty</h2>
          <p className="mt-2 text-sm text-gray-400">Order korte hole first e product add korte hobe.</p>
          <Link
            href="/products"
            className="mt-6 inline-flex rounded-2xl bg-orange-600 px-6 py-3 font-bold text-white transition hover:bg-orange-700"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <section className="rounded-3xl border border-gray-800 bg-black p-4 sm:p-5">
              <h2 className="text-lg font-black text-white">Delivery Information</h2>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-300">
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    checked={form.deliveryType === "home"}
                    onChange={() => setField("deliveryType", "home")}
                    className="h-4 w-4 accent-orange-500"
                  />
                  Home Delivery
                </label>

                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    checked={form.deliveryType === "point"}
                    onChange={() => setField("deliveryType", "point")}
                    className="h-4 w-4 accent-orange-500"
                  />
                  Point Delivery
                </label>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <TextField label="Phone#" value={form.customerPhone} onChange={(value) => setField("customerPhone", value)} placeholder="Type Phone Number" required />
                <TextField label="Name" value={form.customerName} onChange={(value) => setField("customerName", value)} placeholder="Type Recipient Name" required />
                <TextField label="Email" value={form.customerEmail} onChange={(value) => setField("customerEmail", value)} placeholder="Type Customer Email" />
                <TextField label="Recipient Email" value={form.recipientEmail} onChange={(value) => setField("recipientEmail", value)} placeholder="Type Recipient Email" />
                <TextAreaField label="Address" value={form.customerAddress} onChange={(value) => setField("customerAddress", value)} placeholder="Type Address" required />
                <TextField label="District" value={form.district} onChange={(value) => setField("district", value)} placeholder="Dhaka City" required />
                <TextField label="Thana" value={form.thana} onChange={(value) => setField("thana", value)} placeholder="Type Thana" />
                <TextField label="Alternative Phone" value={form.alternativePhone} onChange={(value) => setField("alternativePhone", value)} placeholder="Type Alternative Phone" />
                <div className="sm:col-span-2">
                  <TextAreaField label="Note" value={form.note} onChange={(value) => setField("note", value)} placeholder="Type note max 400 chars" maxLength={400} />
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-gray-800 bg-black p-4 sm:p-5">
              <h2 className="text-lg font-black text-white">Order Items</h2>
              <div className="mt-4 space-y-3">
                {cartItems.map((item) => {
                  const price = money(item.sellingPrice || item.price || 0);
                  const quantity = Math.max(Number(item.quantity || 1), 1);

                  return (
                    <div key={item.id} className="flex gap-3 rounded-2xl border border-gray-800 bg-gray-950 p-3">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-black">
                        {item.mainImageUrl || item.image ? (
                          <img src={item.mainImageUrl || item.image} alt={item.name} className="h-full w-full object-contain p-1" />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-sm font-bold text-white">{item.name}</h3>
                        <p className="mt-1 text-xs text-gray-500">{formatPrice(price)} each</p>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          <div className="inline-flex items-center overflow-hidden rounded-xl border border-gray-800 bg-black">
                            <button type="button" onClick={() => updateQuantity(item.id, quantity - 1)} className="grid h-9 w-9 place-items-center text-gray-300 transition hover:bg-gray-900">
                              <FaMinus size={11} />
                            </button>
                            <span className="min-w-10 px-3 text-center text-sm font-bold text-white">{quantity}</span>
                            <button type="button" onClick={() => updateQuantity(item.id, quantity + 1)} className="grid h-9 w-9 place-items-center text-gray-300 transition hover:bg-gray-900">
                              <FaPlus size={11} />
                            </button>
                          </div>

                          <div className="flex items-center gap-3">
                            <p className="text-sm font-black text-orange-400">{formatPrice(price * quantity)}</p>
                            <button type="button" onClick={() => removeItem(item.id)} className="grid h-9 w-9 place-items-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 transition hover:bg-red-600 hover:text-white">
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-3xl border border-gray-800 bg-black p-4 sm:p-5 lg:sticky lg:top-24">
            <h2 className="text-lg font-black text-white">Order Summary</h2>

            <div className="mt-5 space-y-3 text-sm">
              <SummaryRow label="Subtotal" value={formatPrice(subtotal)} />
              <SummaryRow label="Delivery Charge" value="Calculated after submit" />
              <SummaryRow label="Payment Method" value="Cash on Delivery" />
            </div>

            <div className="mt-5 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-orange-300/80">Estimated Product Total</p>
              <p className="mt-2 text-3xl font-black text-white">{formatPrice(subtotal)}</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 w-full rounded-2xl bg-orange-600 px-5 py-4 text-sm font-black text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
            >
              {submitting ? "Placing Order..." : "Confirm Order"}
            </button>
          </aside>
        </form>
      )}

      {createdOrder && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-gray-800 bg-black p-6 text-center shadow-2xl">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-500/10 text-green-400">
              <FaCheckCircle size={34} />
            </div>
            <h2 className="mt-5 text-2xl font-black text-white">Order Received</h2>
            <p className="mt-3 text-sm leading-7 text-gray-300">
              আপনার অর্ডারটি গ্রহণ করা হয়েছে। খুব শীঘ্রই আমাদের প্রতিনিধি আপনাকে call করবে order টি confirm করার জন্য।
            </p>
            <div className="mt-5 rounded-2xl border border-gray-800 bg-gray-950 p-4 text-left text-sm">
              <SummaryRow label="Invoice" value={createdOrder.invoiceNo} />
              <SummaryRow label="Status" value="Pending" />
              <SummaryRow label="COD Amount" value={formatPrice(createdOrder.codAmount)} />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link href="/my-orders" className="rounded-2xl border border-gray-700 px-5 py-3 font-bold text-gray-200 transition hover:bg-gray-900">
                View My Orders
              </Link>
              <Link href="/products" className="rounded-2xl bg-orange-600 px-5 py-3 font-bold text-white transition hover:bg-orange-700">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-gray-300">{label}{required ? " *" : ""}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  required,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-gray-300">{label}{required ? " *" : ""}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={4}
        className="mt-2 w-full resize-none rounded-2xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm leading-7 text-white outline-none transition placeholder:text-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
      />
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-bold text-gray-200">{value}</span>
    </div>
  );
}
