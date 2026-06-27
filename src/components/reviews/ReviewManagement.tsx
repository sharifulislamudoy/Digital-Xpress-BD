"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { FaSearch, FaStar, FaTrash } from "react-icons/fa";
import type { Pagination, ProductReview } from "@/types/review";
import { formatPrice } from "@/lib/formatPrice";

const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");
const limitOptions = [10, 25, 50, 100];

type SessionTokenShape = {
  accessToken?: unknown;
  user?: {
    accessToken?: unknown;
    token?: unknown;
  } | null;
} | null | undefined;

interface ReviewManagementProps {
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

function RatingStars({ value }: { value: number }) {
  const rating = Math.min(Math.max(Math.round(Number(value) || 0), 0), 5);

  return (
    <div className="flex items-center gap-0.5 text-sm">
      {Array.from({ length: 5 }).map((_, index) => (
        <FaStar key={index} className={index < rating ? "text-orange-400" : "text-gray-700"} />
      ))}
    </div>
  );
}

export default function ReviewManagement({ panelType }: ReviewManagementProps) {
  const { data: session, status } = useSession();
  const token = getSessionToken(session);

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [deletingReviewId, setDeletingReviewId] = useState("");

  const createHeaders = useCallback(() => {
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  }, [token]);

  const loadReviews = useCallback(async () => {
    if (!API_BASE || status === "loading") return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (search.trim()) params.set("search", search.trim());

      const response = await fetch(`${API_BASE}/api/v1/reviews/admin?${params.toString()}`, {
        credentials: "include",
        headers: createHeaders(),
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to load reviews");
        return;
      }

      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      setPagination(data.pagination || { page, limit, total: 0, totalPages: 1 });
    } catch (error) {
      console.error(error);
      toast.error("Error loading reviews");
    } finally {
      setLoading(false);
    }
  }, [createHeaders, limit, page, search, status]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleDeleteReview = async (review: ProductReview) => {
    const confirmed = window.confirm(`Delete review from ${review.userName || review.userEmail}?`);
    if (!confirmed) return;

    try {
      setDeletingReviewId(review.id);

      const response = await fetch(`${API_BASE}/api/v1/reviews/admin/${encodeURIComponent(review.id)}`, {
        method: "DELETE",
        credentials: "include",
        headers: createHeaders(),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to delete review");
        return;
      }

      toast.success(data.message || "Review deleted successfully");
      loadReviews();
    } catch (error) {
      console.error(error);
      toast.error("Error deleting review");
    } finally {
      setDeletingReviewId("");
    }
  };

  const panelBase = panelType === "admin" ? "/admin" : "/moderator";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-400">Reviews</p>
          <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">All Customer Reviews</h1>
          <p className="mt-2 text-sm text-gray-400">Product wise review management. Delete fake or abusive review from here.</p>
        </div>

        <Link href={panelBase} className="inline-flex w-fit rounded-2xl border border-gray-800 px-4 py-3 text-sm font-bold text-gray-300 transition hover:border-orange-500 hover:text-orange-300">
          Back to Dashboard
        </Link>
      </div>

      <div className="rounded-3xl border border-gray-800 bg-black p-4 sm:p-5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setSearch(searchInput);
          }}
          className="grid gap-3 lg:grid-cols-[1fr_auto_auto]"
        >
          <div className="relative">
            <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by customer, email, comment, product..."
              className="w-full rounded-2xl border border-gray-800 bg-gray-950 py-3 pl-11 pr-4 text-sm text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-orange-500"
            />
          </div>

          <select
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value));
              setPage(1);
            }}
            className="rounded-2xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-gray-200 outline-none focus:border-orange-500"
          >
            {limitOptions.map((item) => (
              <option key={item} value={item}>{item} / page</option>
            ))}
          </select>

          <button type="submit" className="rounded-2xl bg-orange-600 px-6 py-3 text-sm font-black text-white transition hover:bg-orange-700">
            Search
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-800 bg-black">
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3 sm:px-5">
          <div>
            <h2 className="font-black text-white">Review List</h2>
            <p className="mt-1 text-xs text-gray-500">Total {pagination.total} reviews</p>
          </div>
          {loading && <span className="text-xs font-semibold text-orange-400">Loading...</span>}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-gray-950 text-xs uppercase tracking-[0.14em] text-gray-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Comment</th>
                <th className="px-4 py-3">Photos</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {reviews.map((review) => (
                <tr key={review.id} className="align-top transition hover:bg-gray-950/70">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-950">
                        {review.product?.mainImageUrl ? (
                          <img src={review.product.mainImageUrl} alt={review.product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-[10px] text-gray-600">No Img</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-bold text-white">{review.product?.name || "Product removed"}</p>
                        <p className="mt-1 text-xs text-gray-500">{review.product?.sellingPrice ? formatPrice(review.product.sellingPrice) : "-"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-gray-200">{review.userName || "Customer"}</p>
                    <p className="mt-1 text-xs text-gray-500">{review.userEmail}</p>
                  </td>
                  <td className="px-4 py-4">
                    <RatingStars value={review.rating} />
                    <p className="mt-1 text-xs text-gray-500">{review.rating}/5</p>
                  </td>
                  <td className="max-w-[340px] px-4 py-4">
                    <p className="line-clamp-3 italic leading-6 text-gray-300">“{review.comment}”</p>
                  </td>
                  <td className="px-4 py-4 text-gray-300">{review.images?.length || 0}</td>
                  <td className="px-4 py-4 text-gray-400">{formatDate(review.createdAt)}</td>
                  <td className="px-4 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteReview(review)}
                      disabled={deletingReviewId === review.id}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-600 hover:text-white disabled:opacity-60"
                    >
                      <FaTrash />
                      {deletingReviewId === review.id ? "Deleting" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 p-4 lg:hidden">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-3xl border border-gray-800 bg-gray-950 p-4">
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-black">
                  {review.product?.mainImageUrl ? (
                    <img src={review.product.mainImageUrl} alt={review.product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xs text-gray-600">No Img</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 font-black text-white">{review.product?.name || "Product removed"}</p>
                  <p className="mt-1 text-xs text-gray-500">{review.userName || "Customer"} · {review.userEmail}</p>
                  <div className="mt-2"><RatingStars value={review.rating} /></div>
                </div>
              </div>
              <p className="mt-4 italic leading-6 text-gray-300">“{review.comment}”</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xs text-gray-500">{formatDate(review.createdAt)} · {review.images?.length || 0} photos</span>
                <button onClick={() => handleDeleteReview(review)} disabled={deletingReviewId === review.id} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {!loading && reviews.length === 0 && (
          <div className="px-5 py-12 text-center">
            <p className="text-lg font-black text-white">No reviews found</p>
            <p className="mt-2 text-sm text-gray-500">Try another search keyword.</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">
          Page {pagination.page} of {pagination.totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            className="rounded-xl border border-gray-800 px-4 py-2 text-sm font-bold text-gray-300 transition hover:border-orange-500 hover:text-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= pagination.totalPages || loading}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-xl border border-gray-800 px-4 py-2 text-sm font-bold text-gray-300 transition hover:border-orange-500 hover:text-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
