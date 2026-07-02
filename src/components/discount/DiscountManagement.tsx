"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaChevronDown,
  FaEdit,
  FaPlus,
  FaSearch,
  FaSpinner,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { formatPrice } from "@/lib/formatPrice";
import type { Coupon, CouponScope } from "@/types/order";
import { couponScopeLabels } from "@/types/order";

const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");

type PanelType = "admin" | "moderator";

type SessionTokenShape = {
  accessToken?: unknown;
  user?: {
    accessToken?: unknown;
    token?: unknown;
  } | null;
} | null | undefined;

type CouponMetaCategory = {
  id: string;
  name: string;
  slug: string;
};

type CouponMetaProduct = {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  sellingPrice: number;
  categoryId: string;
};

type CouponFormState = {
  id: string;
  code: string;
  title: string;
  description: string;
  scope: CouponScope;
  discountPercentage: string;
  maxDiscountAmount: string;
  minOrderAmount: string;
  usageLimit: string;
  categoryId: string;
  productId: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

type CouponRequestParams = {
  search?: string;
  scope?: "all" | CouponScope;
  status?: "all" | "active" | "inactive";
};

const initialForm: CouponFormState = {
  id: "",
  code: "",
  title: "",
  description: "",
  scope: "ALL_PRODUCTS",
  discountPercentage: "10",
  maxDiscountAmount: "",
  minOrderAmount: "",
  usageLimit: "",
  categoryId: "",
  productId: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
};

function getSessionToken(session: unknown): string {
  const sessionData = session as SessionTokenShape;

  const token =
    sessionData?.accessToken ||
    sessionData?.user?.accessToken ||
    sessionData?.user?.token;

  return typeof token === "string" ? token : "";
}

function formatDateTimeInput(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);

  return local.toISOString().slice(0, 16);
}

function statusBadge(coupon: Coupon) {
  if (!coupon.isActive) {
    return {
      label: "Inactive",
      className: "border-gray-700 bg-gray-800 text-gray-300",
    };
  }

  if (coupon.isExpired) {
    return {
      label: "Expired",
      className: "border-red-500/30 bg-red-500/10 text-red-300",
    };
  }

  if (coupon.isUpcoming) {
    return {
      label: "Upcoming",
      className: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    };
  }

  if (coupon.isUsageFinished) {
    return {
      label: "Used Up",
      className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    };
  }

  return {
    label: "Active",
    className: "border-green-500/30 bg-green-500/10 text-green-300",
  };
}

export default function DiscountManagement({
  panelType,
}: {
  panelType: PanelType;
}) {
  const { data: session, status } = useSession();
  const token = getSessionToken(session);

  const initialLoadedRef = useRef(false);
  const latestTableRequestRef = useRef(0);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<CouponMetaCategory[]>([]);
  const [products, setProducts] = useState<CouponMetaProduct[]>([]);

  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [scopeFilter, setScopeFilter] = useState<"all" | CouponScope>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [form, setForm] = useState<CouponFormState>(initialForm);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const isEditing = Boolean(form.id);

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  const filteredProducts = useMemo(() => {
    if (form.scope !== "CATEGORY" || !form.categoryId) return products;

    return products.filter((product) => product.categoryId === form.categoryId);
  }, [form.categoryId, form.scope, products]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 450);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadMeta = useCallback(async () => {
    if (!API_BASE || !token) return;

    const res = await fetch(`${API_BASE}/api/v1/discounts/admin/meta`, {
      headers,
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Coupon meta load failed");
    }

    setCategories(Array.isArray(data.categories) ? data.categories : []);
    setProducts(Array.isArray(data.products) ? data.products : []);
  }, [headers, token]);

  const fetchCoupons = useCallback(
    async (paramsData: CouponRequestParams = {}) => {
      if (!API_BASE || !token) return [];

      const params = new URLSearchParams();

      const finalSearch = paramsData.search || "";
      const finalScope = paramsData.scope || "all";
      const finalStatus = paramsData.status || "all";

      if (finalSearch.trim()) params.set("search", finalSearch.trim());
      if (finalScope !== "all") params.set("scope", finalScope);
      if (finalStatus !== "all") params.set("status", finalStatus);

      params.set("limit", "100");

      const res = await fetch(`${API_BASE}/api/v1/discounts/admin?${params}`, {
        headers,
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Coupon load failed");
      }

      return Array.isArray(data.coupons) ? data.coupons : [];
    },
    [headers, token],
  );

  useEffect(() => {
    if (status === "loading") return;

    if (!token) {
      setInitialLoading(false);
      return;
    }

    let cancelled = false;

    const runInitialLoad = async () => {
      try {
        setInitialLoading(true);

        const [couponList] = await Promise.all([
          fetchCoupons({
            search: "",
            scope: "all",
            status: "all",
          }),
          loadMeta(),
        ]);

        if (cancelled) return;

        setCoupons(couponList);
        initialLoadedRef.current = true;
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          toast.error("Coupon data load korte problem hocche");
        }
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
        }
      }
    };

    runInitialLoad();

    return () => {
      cancelled = true;
    };
  }, [fetchCoupons, loadMeta, status, token]);

  useEffect(() => {
    if (!initialLoadedRef.current) return;
    if (!token) return;

    const requestId = latestTableRequestRef.current + 1;
    latestTableRequestRef.current = requestId;

    let cancelled = false;

    const runTableLoad = async () => {
      try {
        setTableLoading(true);

        const couponList = await fetchCoupons({
          search: debouncedSearch,
          scope: scopeFilter,
          status: statusFilter,
        });

        if (cancelled) return;
        if (latestTableRequestRef.current !== requestId) return;

        setCoupons(couponList);
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          toast.error("Coupon list update korte problem hocche");
        }
      } finally {
        if (!cancelled && latestTableRequestRef.current === requestId) {
          setTableLoading(false);
        }
      }
    };

    runTableLoad();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, fetchCoupons, scopeFilter, statusFilter, token]);

  const reloadTableOnly = async () => {
    const requestId = latestTableRequestRef.current + 1;
    latestTableRequestRef.current = requestId;

    try {
      setTableLoading(true);

      const couponList = await fetchCoupons({
        search: debouncedSearch,
        scope: scopeFilter,
        status: statusFilter,
      });

      if (latestTableRequestRef.current !== requestId) return;

      setCoupons(couponList);
    } catch (error) {
      console.error(error);
      toast.error("Coupon list reload korte problem hocche");
    } finally {
      if (latestTableRequestRef.current === requestId) {
        setTableLoading(false);
      }
    }
  };

  const setField = <K extends keyof CouponFormState>(
    key: K,
    value: CouponFormState[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleScopeChange = (value: string) => {
    const nextScope = value as CouponScope;

    setForm((current) => ({
      ...current,
      scope: nextScope,
      categoryId: nextScope === "CATEGORY" ? current.categoryId : "",
      productId: nextScope === "PRODUCT" ? current.productId : "",
    }));
  };

  const openCreateForm = () => {
    setForm(initialForm);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setForm(initialForm);
    setIsFormOpen(false);
  };

  const resetForm = () => {
    setForm(initialForm);
  };

  const editCoupon = (coupon: Coupon) => {
    setForm({
      id: coupon.id,
      code: coupon.code,
      title: coupon.title || "",
      description: coupon.description || "",
      scope: coupon.scope,
      discountPercentage: String(coupon.discountPercentage || ""),
      maxDiscountAmount: coupon.maxDiscountAmount
        ? String(coupon.maxDiscountAmount)
        : "",
      minOrderAmount: coupon.minOrderAmount
        ? String(coupon.minOrderAmount)
        : "",
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
      categoryId: coupon.categoryId || "",
      productId: coupon.productId || "",
      startsAt: formatDateTimeInput(coupon.startsAt),
      endsAt: formatDateTimeInput(coupon.endsAt),
      isActive: coupon.isActive,
    });

    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validateForm = () => {
    if (!form.code.trim()) return "Coupon code is required";

    const percentage = Number(form.discountPercentage);

    if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
      return "Discount percentage must be between 1 and 100";
    }

    if (form.maxDiscountAmount) {
      const maxDiscount = Number(form.maxDiscountAmount);

      if (!Number.isFinite(maxDiscount) || maxDiscount < 0) {
        return "Max discount amount must be a valid positive number";
      }
    }

    if (form.minOrderAmount) {
      const minOrder = Number(form.minOrderAmount);

      if (!Number.isFinite(minOrder) || minOrder < 0) {
        return "Minimum order amount must be a valid positive number";
      }
    }

    if (form.usageLimit) {
      const usageLimit = Number(form.usageLimit);

      if (!Number.isFinite(usageLimit) || usageLimit <= 0) {
        return "Usage limit must be greater than 0";
      }
    }

    if (form.startsAt && form.endsAt) {
      const startDate = new Date(form.startsAt);
      const endDate = new Date(form.endsAt);

      if (startDate.getTime() >= endDate.getTime()) {
        return "End date must be after start date";
      }
    }

    if (form.scope === "CATEGORY" && !form.categoryId) {
      return "Select one category for category coupon";
    }

    if (form.scope === "PRODUCT" && !form.productId) {
      return "Select one product for product coupon";
    }

    return "";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!API_BASE) {
      toast.error("NEXT_PUBLIC_BACKEND_URL missing");
      return;
    }

    if (!token) {
      toast.error("Login token missing");
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setSaving(true);

      const url = isEditing
        ? `${API_BASE}/api/v1/discounts/admin/${form.id}`
        : `${API_BASE}/api/v1/discounts/admin`;

      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers,
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          title: form.title.trim(),
          description: form.description.trim(),
          scope: form.scope,
          discountPercentage: Number(form.discountPercentage),
          maxDiscountAmount: form.maxDiscountAmount
            ? Number(form.maxDiscountAmount)
            : null,
          minOrderAmount: form.minOrderAmount
            ? Number(form.minOrderAmount)
            : 0,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
          categoryId: form.scope === "CATEGORY" ? form.categoryId : null,
          productId: form.scope === "PRODUCT" ? form.productId : null,
          startsAt: form.startsAt || null,
          endsAt: form.endsAt || null,
          isActive: form.isActive,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        toast.error(data.message || "Coupon save failed");
        return;
      }

      toast.success(data.message || "Coupon saved");
      setForm(initialForm);
      setIsFormOpen(false);
      await reloadTableOnly();
    } catch (error) {
      console.error(error);
      toast.error("Coupon save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleCouponStatus = async (coupon: Coupon) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/discounts/admin/${coupon.id}/status`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ isActive: !coupon.isActive }),
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        toast.error(data.message || "Status update failed");
        return;
      }

      toast.success(data.message || "Status updated");
      await reloadTableOnly();
    } catch (error) {
      console.error(error);
      toast.error("Status update failed");
    }
  };

  const deleteCoupon = async (coupon: Coupon) => {
    const confirmed = window.confirm(
      `Delete coupon ${coupon.code}? If it has order history it will be deactivated.`,
    );

    if (!confirmed) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/v1/discounts/admin/${coupon.id}`,
        {
          method: "DELETE",
          headers,
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        toast.error(data.message || "Delete failed");
        return;
      }

      toast.success(data.message || "Coupon deleted");
      await reloadTableOnly();
    } catch (error) {
      console.error(error);
      toast.error("Delete failed");
    }
  };

  if (initialLoading) {
    return (
      <div className="rounded-3xl border border-gray-800 bg-black p-8 text-center text-gray-400">
        Loading discounts...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-400">
            {panelType} discount setup
          </p>

          <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">
            Coupon Discounts
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-400">
            Create coupons for all products, one category, or one product.
            Every user can use one coupon only once, and all final selling
            prices are saved into order items.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isFormOpen && !isEditing) {
              setIsFormOpen(false);
              return;
            }

            openCreateForm();
          }}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-700"
        >
          <FaPlus size={13} />
          Create New Coupon
          <FaChevronDown
            size={12}
            className={`transition ${isFormOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isFormOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -8 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-gray-800 bg-black p-4 sm:p-6"
            >
              <div className="flex flex-col gap-4 border-b border-gray-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-orange-500/10 text-orange-400">
                    {isEditing ? <FaEdit /> : <FaPlus />}
                  </div>

                  <div>
                    <h2 className="font-black text-white">
                      {isEditing ? "Update Coupon" : "Create New Coupon"}
                    </h2>

                    <p className="text-xs text-gray-500">
                      Percentage discount will apply on product selling price.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-700 px-4 py-2.5 text-sm font-bold text-gray-300 transition hover:bg-gray-900 hover:text-white"
                >
                  <FaTimes size={12} />
                  Close
                </button>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-4">
                <TextField
                  label="Coupon Code"
                  value={form.code}
                  onChange={(value) => setField("code", value.toUpperCase())}
                  placeholder="EID10"
                  required
                />

                <TextField
                  label="Title"
                  value={form.title}
                  onChange={(value) => setField("title", value)}
                  placeholder="Eid offer"
                />

                <SelectField
                  label="Coupon Type"
                  value={form.scope}
                  onChange={handleScopeChange}
                  options={[
                    { value: "ALL_PRODUCTS", label: "All Products" },
                    { value: "CATEGORY", label: "Single Category" },
                    { value: "PRODUCT", label: "Single Product" },
                  ]}
                />

                <TextField
                  label="Discount %"
                  type="number"
                  value={form.discountPercentage}
                  onChange={(value) => setField("discountPercentage", value)}
                  placeholder="10"
                  required
                />

                {form.scope === "CATEGORY" && (
                  <SelectField
                    label="Category"
                    value={form.categoryId}
                    onChange={(value) => setField("categoryId", value)}
                    options={[
                      { value: "", label: "Select category" },
                      ...categories.map((category) => ({
                        value: category.id,
                        label: category.name,
                      })),
                    ]}
                  />
                )}

                {form.scope === "PRODUCT" && (
                  <SelectField
                    label="Product"
                    value={form.productId}
                    onChange={(value) => setField("productId", value)}
                    options={[
                      { value: "", label: "Select product" },
                      ...filteredProducts.map((product) => ({
                        value: product.id,
                        label: `${product.name}${
                          product.sku ? ` (${product.sku})` : ""
                        } - ${formatPrice(product.sellingPrice)}`,
                      })),
                    ]}
                    className="lg:col-span-2"
                  />
                )}

                <TextField
                  label="Max Discount Cap"
                  type="number"
                  value={form.maxDiscountAmount}
                  onChange={(value) => setField("maxDiscountAmount", value)}
                  placeholder="Optional"
                />

                <TextField
                  label="Minimum Order"
                  type="number"
                  value={form.minOrderAmount}
                  onChange={(value) => setField("minOrderAmount", value)}
                  placeholder="Optional"
                />

                <TextField
                  label="Total Usage Limit"
                  type="number"
                  value={form.usageLimit}
                  onChange={(value) => setField("usageLimit", value)}
                  placeholder="Example: 100"
                />

                <TextField
                  label="Start Date"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(value) => setField("startsAt", value)}
                />

                <TextField
                  label="End Date"
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(value) => setField("endsAt", value)}
                />

                <label className="flex items-center gap-3 rounded-2xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm font-bold text-gray-200">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      setField("isActive", event.target.checked)
                    }
                    className="h-4 w-4 accent-orange-600"
                  />
                  Active coupon
                </label>

                <label className="block lg:col-span-4">
                  <span className="text-sm font-semibold text-gray-300">
                    Description
                  </span>

                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setField("description", event.target.value)
                    }
                    rows={3}
                    placeholder="Internal note or public offer details"
                    className="mt-2 w-full resize-none rounded-2xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  disabled={saving}
                  type="submit"
                  className="rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-700"
                >
                  {saving
                    ? "Saving..."
                    : isEditing
                      ? "Update Coupon"
                      : "Create Coupon"}
                </button>

                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-2xl border border-gray-700 px-5 py-3 text-sm font-bold text-gray-200 transition hover:bg-gray-900"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="rounded-2xl border border-gray-800 bg-[#0a0a0a] p-3 sm:p-4">
        <div className="flex flex-col gap-3 border-b border-gray-800 pb-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-black text-white">All Coupons</h2>
            <p className="mt-1 text-xs text-gray-500">
              Created coupons, usage count, status, and quick actions.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:w-[600px]">
            <div className="relative">
              <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />

              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search coupon"
                autoComplete="off"
                className="w-full rounded-xl border border-gray-800 bg-gray-950 py-2.5 pl-10 pr-9 text-xs text-white outline-none transition placeholder:text-gray-600 focus:border-orange-500"
              />

              {tableLoading && (
                <FaSpinner className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-orange-400" />
              )}
            </div>

            <select
              value={scopeFilter}
              onChange={(event) =>
                setScopeFilter(event.target.value as "all" | CouponScope)
              }
              className="rounded-xl border border-gray-800 bg-gray-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
            >
              <option value="all">All Types</option>
              <option value="ALL_PRODUCTS">All Products</option>
              <option value="CATEGORY">Single Category</option>
              <option value="PRODUCT">Single Product</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "all" | "active" | "inactive",
                )
              }
              className="rounded-xl border border-gray-800 bg-gray-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="relative mt-4 overflow-hidden rounded-2xl border border-gray-800 bg-black">
          {tableLoading && (
            <div className="absolute inset-0 z-20 flex items-start justify-center bg-black/35 pt-16 backdrop-blur-[1px]">
              <div className="flex items-center gap-2 rounded-2xl border border-orange-500/20 bg-black px-4 py-2 text-sm font-bold text-orange-300 shadow-xl">
                <FaSpinner className="animate-spin" />
                Loading table data...
              </div>
            </div>
          )}

          <table
            className={`w-full table-fixed divide-y divide-gray-800 text-left text-xs transition ${
              tableLoading ? "opacity-45" : "opacity-100"
            }`}
          >
            <colgroup>
              <col className="w-[21%]" />
              <col className="w-[13%]" />
              <col className="w-[16%]" />
              <col className="w-[20%]" />
              <col className="w-[9%]" />
              <col className="w-[11%]" />
              <col className="w-[10%]" />
            </colgroup>

            <thead className="bg-gray-950">
              <tr>
                <th className="px-2.5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Coupon
                </th>
                <th className="px-2.5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Type
                </th>
                <th className="px-2.5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Discount
                </th>
                <th className="px-2.5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Target
                </th>
                <th className="px-2.5 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Usage
                </th>
                <th className="px-2.5 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="px-2.5 py-3 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-900">
              {coupons.map((coupon) => {
                const badge = statusBadge(coupon);

                const target =
                  coupon.scope === "CATEGORY"
                    ? coupon.category?.name || "Category missing"
                    : coupon.scope === "PRODUCT"
                      ? coupon.product?.name || "Product missing"
                      : "All products";

                return (
                  <tr
                    key={coupon.id}
                    className="text-gray-300 hover:bg-gray-950"
                  >
                    <td className="px-2.5 py-3">
                      <p className="truncate text-sm font-black text-white">
                        {coupon.code}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-gray-500">
                        {coupon.title || "No title"}
                      </p>
                    </td>

                    <td className="px-2.5 py-3">
                      <span className="block truncate text-[11px] font-semibold text-gray-300">
                        {couponScopeLabels[coupon.scope]}
                      </span>
                    </td>

                    <td className="px-2.5 py-3">
                      <p className="text-sm font-bold text-orange-300">
                        {coupon.discountPercentage}%
                      </p>

                      <p className="truncate text-[10px] text-gray-500">
                        {coupon.maxDiscountAmount
                          ? `Cap ${formatPrice(coupon.maxDiscountAmount)}`
                          : "No cap"}
                      </p>
                    </td>

                    <td className="px-2.5 py-3">
                      <p className="truncate text-[11px] font-medium text-gray-300" title={target}>
                        {target}
                      </p>
                    </td>

                    <td className="px-2.5 py-3 text-center">
                      <p className="truncate text-xs font-bold text-white">
                        {coupon.usedCount}/{coupon.usageLimit ?? "∞"}
                      </p>

                      <p className="truncate text-[10px] text-gray-500">
                        {coupon.orderCount || 0} orders
                      </p>
                    </td>

                    <td className="px-2.5 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleCouponStatus(coupon)}
                        className={`max-w-full truncate rounded-full border px-2 py-1 text-[10px] font-black ${badge.className}`}
                        title="Click to toggle status"
                      >
                        {badge.label}
                      </button>
                    </td>

                    <td className="px-2.5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => editCoupon(coupon)}
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-300 transition hover:bg-blue-600 hover:text-white"
                          title="Edit coupon"
                        >
                          <FaEdit size={11} />
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteCoupon(coupon)}
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 transition hover:bg-red-600 hover:text-white"
                          title="Delete coupon"
                        >
                          <FaTrash size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {coupons.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-xs text-gray-500"
                  >
                    {tableLoading ? "Searching coupons..." : "No coupons found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-gray-300">
        {label}
        {required ? " *" : ""}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-semibold text-gray-300">{label}</span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
      >
        {options.map((option) => (
          <option
            key={option.value || option.label}
            value={option.value}
            className="bg-black text-white"
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}