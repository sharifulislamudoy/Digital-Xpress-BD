"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { FaCheckCircle, FaMinus, FaPlus, FaTicketAlt, FaTrash } from "react-icons/fa";
import type { Product } from "@/types/product";
import type {
  AppliedCouponCalculation,
  Coupon,
  DeliveryChargeSetting,
  DeliveryType,
  Order,
} from "@/types/order";
import {
  bdDistrictOptions,
  getDeliveryChargeByDistrict,
  resolveBdDistrictOption,
} from "@/types/order";
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
  id: string;
  name: string;
  quantity: number;
  addedAt?: string;
  updatedAt?: string;
  sellingPrice?: number | string | null;
  price?: number | string | null;
  mainImageUrl?: string | null;
  image?: string | null;
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
  window.dispatchEvent(
    new CustomEvent("digital-xpress-cart-updated", { detail: items }),
  );
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
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
}

function isValidPhone(value: string) {
  return /^01\d{9}$/.test(value.trim());
}

function isValidEmail(value: string) {
  if (!value.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function requiredMissingFields(form: CheckoutFormState) {
  const missing: string[] = [];

  if (!form.customerName.trim()) missing.push("recipient name");
  if (!form.customerPhone.trim()) missing.push("phone number");
  if (!form.customerAddress.trim()) missing.push("address");
  if (!form.district.trim()) missing.push("district");

  return missing;
}

function normalizeDeliveryChargePayload(data: unknown): DeliveryChargeSetting[] {
  const payload = data as {
    charges?: unknown;
    chargeByDistrict?: unknown;
  };

  if (Array.isArray(payload?.charges)) {
    return payload.charges
      .map((item) => {
        const row = item as Partial<DeliveryChargeSetting>;
        const district = String(row.district || "").trim();
        const charge = Number(row.charge);

        if (!district || !Number.isFinite(charge)) return null;

        return {
          district,
          charge: Math.max(Math.round(charge), 0),
        };
      })
      .filter((item): item is DeliveryChargeSetting => Boolean(item));
  }

  if (payload?.chargeByDistrict && typeof payload.chargeByDistrict === "object") {
    return Object.entries(payload.chargeByDistrict).map(([district, charge]) => ({
      district,
      charge: Math.max(Math.round(Number(charge) || 0), 0),
    }));
  }

  return [];
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [cartItems, setCartItems] = useState<CartProduct[]>([]);
  const [form, setForm] = useState<CheckoutFormState>(initialForm);
  const [profileLoading, setProfileLoading] = useState(true);
  const [deliveryChargeSettings, setDeliveryChargeSettings] = useState<DeliveryChargeSetting[]>([]);
  const [deliveryChargeLoading, setDeliveryChargeLoading] = useState(true);
  const [deliveryChargeLoadFailed, setDeliveryChargeLoadFailed] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponCalculation, setCouponCalculation] = useState<AppliedCouponCalculation | null>(null);
  const [couponApplying, setCouponApplying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const token = getSessionToken(session);
  const user = session?.user;

  const subtotal = useMemo(() => {
    return money(
      cartItems.reduce((total, item) => {
        const price = money(item.sellingPrice || item.price || 0);
        return total + price * Math.max(Number(item.quantity || 1), 1);
      }, 0),
    );
  }, [cartItems]);

  const couponDiscount = money(couponCalculation?.discountAmount || 0);
  const discountedSubtotal = money(Math.max(subtotal - couponDiscount, 0));

  const deliveryCharge = useMemo(() => {
    return getDeliveryChargeByDistrict(form.district, deliveryChargeSettings);
  }, [form.district, deliveryChargeSettings]);

  const grandTotal = useMemo(() => {
    return money(discountedSubtotal + deliveryCharge);
  }, [discountedSubtotal, deliveryCharge]);

  const submitDisabled = submitting || deliveryChargeLoading || deliveryChargeLoadFailed || couponApplying;

  useEffect(() => {
    setCartItems(readCart());
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadDeliveryCharges = async () => {
      if (!API_BASE) {
        if (!cancelled) {
          setDeliveryChargeLoadFailed(true);
          setDeliveryChargeLoading(false);
        }
        return;
      }

      try {
        setDeliveryChargeLoading(true);
        setDeliveryChargeLoadFailed(false);

        const res = await fetch(`${API_BASE}/api/v1/orders/delivery-charges/public`, {
          cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Delivery charge load failed");
        }

        if (!cancelled) {
          setDeliveryChargeSettings(normalizeDeliveryChargePayload(data));
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setDeliveryChargeLoadFailed(true);
          toast.error("Delivery charge load korte problem hocche");
        }
      } finally {
        if (!cancelled) {
          setDeliveryChargeLoading(false);
        }
      }
    };

    loadDeliveryCharges();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      setProfileLoading(false);
      return;
    }

    if (status === "loading") return;

    if (!API_BASE || !token) {
      setProfileLoading(false);
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/orders/checkout-profile`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Profile load failed");
        }

        const profile = data.profile as CheckoutProfile | null;

        if (cancelled) return;

        setForm((current) => {
          const resolvedDistrict = resolveBdDistrictOption(profile?.district);

          return {
            ...current,
            customerName: profile?.name || user?.name || current.customerName,
            customerEmail: profile?.email || user?.email || current.customerEmail,
            recipientEmail: profile?.email || user?.email || current.recipientEmail,
            customerPhone: profile?.mobile || current.customerPhone,
            customerAddress: profile?.address || current.customerAddress,
            district: resolvedDistrict || current.district || "Dhaka City",
            thana: profile?.thana || current.thana,
          };
        });
      } catch (error) {
        console.error(error);
        toast.error("Checkout profile load korte problem hocche");
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [status, token, user?.email, user?.name]);

  const setField = <K extends keyof CheckoutFormState>(
    key: K,
    value: CheckoutFormState[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const clearAppliedCoupon = () => {
    setAppliedCoupon(null);
    setCouponCalculation(null);
  };

  const updateQuantity = (productId: string, nextQuantity: number) => {
    const updated = cartItems.map((item) =>
      item.id === productId ? { ...item, quantity: Math.max(nextQuantity, 1) } : item,
    );

    setCartItems(updated);
    writeCart(updated);
    clearAppliedCoupon();
  };

  const removeItem = (productId: string) => {
    const updated = cartItems.filter((item) => item.id !== productId);

    setCartItems(updated);
    writeCart(updated);
    clearAppliedCoupon();
    toast.success("Item removed from cart");
  };

  const applyCoupon = async () => {
    if (status !== "authenticated") {
      toast.error("Coupon use korte hole login korte hobe");
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

    const cleanCode = couponCode.trim().toUpperCase();

    if (!cleanCode) {
      toast.error("Coupon code dao");
      return;
    }

    try {
      setCouponApplying(true);

      const res = await fetch(`${API_BASE}/api/v1/discounts/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: cleanCode,
          items: cartItems.map((item) => ({
            productId: item.id,
            quantity: item.quantity || 1,
          })),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        clearAppliedCoupon();
        toast.error(data.message || "Coupon apply failed");
        return;
      }

      setCouponCode(cleanCode);
      setAppliedCoupon(data.coupon || null);
      setCouponCalculation(data.calculation || null);
      toast.success(data.message || "Coupon applied");
    } catch (error) {
      console.error(error);
      clearAppliedCoupon();
      toast.error("Coupon apply failed");
    } finally {
      setCouponApplying(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    clearAppliedCoupon();
    toast.success("Coupon removed");
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

    if (deliveryChargeLoading) {
      toast.error("Delivery charge load hocche. Ektu wait koro.");
      return;
    }

    if (deliveryChargeLoadFailed) {
      toast.error("Delivery charge load hoy nai. Page refresh kore try koro.");
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

    if (!isValidEmail(form.customerEmail) || !isValidEmail(form.recipientEmail)) {
      toast.error("Email address valid na");
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
          couponCode: couponCode.trim() || null,
          items: cartItems.map((item) => ({
            productId: item.id,
            quantity: item.quantity || 1,
          })),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        toast.error(data.message || "Order create korte parlam na");
        return;
      }

      setCreatedOrder(data.order);
      setCartItems([]);
      writeCart([]);
      clearAppliedCoupon();
      setCouponCode("");
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
          <p className="mt-3 text-gray-400">Checkout korte hole age login korte hobe.</p>
          <Link href={`/login?callbackUrl=${encodeURIComponent("/checkout")}`} className="mt-6 inline-flex rounded-2xl bg-orange-600 px-6 py-3 font-bold text-white transition hover:bg-orange-700">
            Login Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-400">Checkout</p>
        <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Complete Your Order</h1>
        <p className="mt-3 text-sm leading-7 text-gray-400">Cash on delivery order. Coupon discount final calculation backend theke confirm hobe.</p>
      </div>

      {cartItems.length === 0 && !createdOrder ? (
        <div className="rounded-3xl border border-gray-800 bg-black p-8 text-center">
          <h2 className="text-xl font-black text-white">Your cart is empty</h2>
          <p className="mt-2 text-gray-400">Order korte product add koro.</p>
          <Link href="/products" className="mt-6 inline-flex rounded-2xl bg-orange-600 px-6 py-3 font-bold text-white transition hover:bg-orange-700">
            Browse Products
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-gray-800 bg-black p-4 sm:p-5">
              <h2 className="text-lg font-black text-white">Delivery Information</h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <TextField label="Recipient Name" value={form.customerName} onChange={(value) => setField("customerName", value)} required />
                <TextField label="Phone Number" value={form.customerPhone} onChange={(value) => setField("customerPhone", value)} placeholder="017xxxxxxxx" required />
                <TextField label="Alternative Phone" value={form.alternativePhone} onChange={(value) => setField("alternativePhone", value)} placeholder="Optional" />
                <TextField label="Customer Email" value={form.customerEmail} onChange={(value) => setField("customerEmail", value)} placeholder="Optional" />
                <TextField label="Recipient Email" value={form.recipientEmail} onChange={(value) => setField("recipientEmail", value)} placeholder="Optional" />
                <DistrictSelect label="District" value={form.district} onChange={(value) => setField("district", value)} required />
                <TextField label="Thana / Area" value={form.thana} onChange={(value) => setField("thana", value)} placeholder="Jurain" />
                <label className="block">
                  <span className="text-sm font-semibold text-gray-300">Delivery Type</span>
                  <select value={form.deliveryType} onChange={(event) => setField("deliveryType", event.target.value as DeliveryType)} className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10">
                    <option value="home">Home Delivery</option>
                    <option value="point">Pickup Point</option>
                  </select>
                </label>
                <div className="sm:col-span-2">
                  <TextAreaField label="Full Address" value={form.customerAddress} onChange={(value) => setField("customerAddress", value)} required placeholder="House, road, area details" maxLength={250} />
                </div>
                <div className="sm:col-span-2">
                  <TextAreaField label="Order Note" value={form.note} onChange={(value) => setField("note", value)} placeholder="Optional note" maxLength={400} />
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-gray-800 bg-black p-4 sm:p-5">
              <h2 className="text-lg font-black text-white">Order Items</h2>

              <div className="mt-5 space-y-3">
                {cartItems.map((item) => {
                  const quantity = Math.max(Number(item.quantity || 1), 1);
                  const price = money(item.sellingPrice || item.price || 0);
                  const imageUrl = item.mainImageUrl || item.image || "";
                  const lineDiscount = couponCalculation?.itemDiscounts.find((discount) => discount.productId === item.id)?.lineDiscountAmount || 0;
                  const lineTotal = money(price * quantity - lineDiscount);

                  return (
                    <div key={item.id} className="flex gap-3 rounded-2xl border border-gray-800 bg-gray-950 p-3">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-black">
                        {imageUrl ? <img src={imageUrl} alt={item.name} className="h-full w-full object-contain p-1" /> : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-sm font-bold text-white">{item.name}</h3>
                        <p className="mt-1 text-xs text-gray-500">{formatPrice(price)} each</p>

                        {lineDiscount > 0 && (
                          <p className="mt-1 text-xs font-semibold text-green-400">Coupon discount: -{formatPrice(lineDiscount)}</p>
                        )}

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
                            <p className="text-sm font-black text-orange-400">{formatPrice(lineTotal)}</p>
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

            <div className="mt-5 rounded-2xl border border-gray-800 bg-gray-950 p-3">
              <label className="text-sm font-semibold text-gray-300">Coupon Code</label>
              <div className="mt-2 flex gap-2">
                <input value={couponCode} onChange={(event) => { setCouponCode(event.target.value.toUpperCase()); clearAppliedCoupon(); }} placeholder="EID10" className="min-w-0 flex-1 rounded-xl border border-gray-800 bg-black px-3 py-2 text-sm font-bold uppercase text-white outline-none transition placeholder:text-gray-700 focus:border-orange-500" />
                {appliedCoupon ? (
                  <button type="button" onClick={removeCoupon} className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-black text-red-300 transition hover:bg-red-600 hover:text-white">
                    Remove
                  </button>
                ) : (
                  <button type="button" onClick={applyCoupon} disabled={couponApplying} className="rounded-xl bg-orange-600 px-3 py-2 text-xs font-black text-white transition hover:bg-orange-700 disabled:bg-gray-700">
                    {couponApplying ? "..." : "Apply"}
                  </button>
                )}
              </div>

              {appliedCoupon && couponCalculation && (
                <div className="mt-3 rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-xs text-green-300">
                  <div className="flex items-center gap-2 font-black">
                    <FaTicketAlt /> {appliedCoupon.code} applied
                  </div>
                  <p className="mt-1">Discount: {appliedCoupon.discountPercentage}% = {formatPrice(couponCalculation.discountAmount)}</p>
                </div>
              )}
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <SummaryRow label="Subtotal" value={formatPrice(subtotal)} />
              <SummaryRow label="Coupon Discount" value={couponDiscount > 0 ? `-${formatPrice(couponDiscount)}` : formatPrice(0)} />
              <SummaryRow label="Discounted Subtotal" value={formatPrice(discountedSubtotal)} />
              <SummaryRow label="Delivery Charge" value={deliveryChargeLoading ? "Loading..." : deliveryChargeLoadFailed ? "Load failed" : formatPrice(deliveryCharge)} />
              <SummaryRow label="Payment Method" value="Cash on Delivery" />
            </div>

            <div className="mt-5 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-orange-300/80">Total COD Amount</p>
              <p className="mt-2 text-3xl font-black text-white">
                {deliveryChargeLoading || deliveryChargeLoadFailed ? formatPrice(discountedSubtotal) : formatPrice(grandTotal)}
              </p>
            </div>

            <button type="submit" disabled={submitDisabled} className="mt-5 w-full rounded-2xl bg-orange-600 px-5 py-4 text-sm font-black text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400">
              {submitting ? "Placing Order..." : deliveryChargeLoading ? "Loading Delivery Charge..." : deliveryChargeLoadFailed ? "Refresh Page" : "Confirm Order"}
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

            <p className="mt-3 text-sm leading-7 text-gray-300">আপনার অর্ডারটি গ্রহণ করা হয়েছে। খুব শীঘ্রই আমাদের প্রতিনিধি আপনাকে call করবে order টি confirm করার জন্য।</p>

            <div className="mt-5 rounded-2xl border border-gray-800 bg-gray-950 p-4 text-left text-sm">
              <SummaryRow label="Invoice" value={createdOrder.invoiceNo} />
              <SummaryRow label="Status" value="Pending" />
              {createdOrder.couponCode ? <SummaryRow label="Coupon" value={`${createdOrder.couponCode} (-${formatPrice(createdOrder.couponDiscountAmount || createdOrder.discountAmount || 0)})`} /> : null}
              <SummaryRow label="Delivery Charge" value={formatPrice(createdOrder.deliveryCharge)} />
              <SummaryRow label="COD Amount" value={formatPrice(createdOrder.codAmount)} />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link href="/my-orders" className="rounded-2xl border border-gray-700 px-5 py-3 font-bold text-gray-200 transition hover:bg-gray-900">View My Orders</Link>
              <Link href="/products" className="rounded-2xl bg-orange-600 px-5 py-3 font-bold text-white transition hover:bg-orange-700">Continue Shopping</Link>
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
      <span className="text-sm font-semibold text-gray-300">
        {label}
        {required ? " *" : ""}
      </span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10" />
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
      <span className="text-sm font-semibold text-gray-300">
        {label}
        {required ? " *" : ""}
      </span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10">
        {bdDistrictOptions.map((district) => (
          <option key={district} value={district} className="bg-black text-white">
            {district}
          </option>
        ))}
      </select>
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
      <span className="text-sm font-semibold text-gray-300">
        {label}
        {required ? " *" : ""}
      </span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={maxLength} rows={4} className="mt-2 w-full resize-none rounded-2xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm leading-7 text-white outline-none transition placeholder:text-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10" />
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
