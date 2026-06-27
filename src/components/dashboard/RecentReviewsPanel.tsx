"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { ProductReview } from "@/types/review";

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

function Stars({ value }: { value: number }) {
  const rating = Math.min(Math.max(Math.round(Number(value) || 0), 0), 5);

  return (
    <div className="flex items-center gap-0.5 text-xs">
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={index < rating ? "text-orange-400" : "text-gray-700"}>★</span>
      ))}
    </div>
  );
}

export default function RecentReviewsPanel({ panelType }: { panelType: "admin" | "moderator" }) {
  const { data: session, status } = useSession();
  const token = getSessionToken(session);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = useCallback(async () => {
    if (!API_BASE || status === "loading") return;

    try {
      setLoading(true);
      const headers = new Headers();
      if (token) headers.set("Authorization", `Bearer ${token}`);

      const response = await fetch(`${API_BASE}/api/v1/reviews/admin/recent?limit=6`, {
        credentials: "include",
        headers,
        cache: "no-store",
      });

      const data = await response.json();
      if (!response.ok || !data.success) return;
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [status, token]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const basePath = panelType === "admin" ? "/admin" : "/moderator";

  return (
    <div className="overflow-hidden rounded-xl border border-gray-800 bg-black">
      <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Recent Reviews</h2>
          <p className="mt-1 text-xs text-gray-500">Latest customer product feedback</p>
        </div>
        <Link href={`${basePath}/reviews`} className="text-sm font-semibold text-orange-500 hover:underline">
          View all
        </Link>
      </div>

      <div className="divide-y divide-gray-800">
        {reviews.map((review) => (
          <div key={review.id} className="grid gap-3 px-6 py-4 transition hover:bg-gray-900/40 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex min-w-0 items-start gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-950">
                {review.product?.mainImageUrl ? (
                  <img src={review.product.mainImageUrl} alt={review.product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-[10px] text-gray-600">No Img</div>
                )}
              </div>

              <div className="min-w-0">
                <p className="line-clamp-1 text-sm font-bold text-white">{review.product?.name || "Product removed"}</p>
                <p className="mt-1 text-xs text-gray-500">{review.userName || "Customer"} · {formatDate(review.createdAt)}</p>
                <p className="mt-2 line-clamp-2 text-sm italic leading-6 text-gray-300">“{review.comment}”</p>
              </div>
            </div>

            <div className="md:text-right">
              <Stars value={review.rating} />
              <p className="mt-1 text-xs text-gray-500">{review.rating}/5</p>
            </div>
          </div>
        ))}
      </div>

      {!loading && reviews.length === 0 && (
        <div className="px-6 py-10 text-center">
          <p className="font-semibold text-white">No reviews yet</p>
          <p className="mt-1 text-sm text-gray-500">Customer reviews will appear here after delivery.</p>
        </div>
      )}

      {loading && (
        <div className="px-6 py-10 text-center text-sm text-gray-500">Loading recent reviews...</div>
      )}
    </div>
  );
}
