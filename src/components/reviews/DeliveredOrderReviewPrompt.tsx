"use client";

import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import type { DeliveredReviewPrompt, DeliveredReviewPromptItem } from "@/types/review";
import { formatPrice } from "@/lib/formatPrice";

const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");
const SEEN_STORAGE_KEY = "digital-xpress-last-seen-delivered-review-order";
const MAX_REVIEW_IMAGES = 10;
const REVIEW_IMAGE_MAX_SIZE = 5 * 1024 * 1024;

type SessionTokenShape = {
  accessToken?: unknown;
  user?: {
    accessToken?: unknown;
    token?: unknown;
  } | null;
} | null | undefined;

type ReviewImageDraft = {
  id: string;
  file: File;
  previewUrl: string;
};

function getSessionToken(session: unknown): string {
  const sessionData = session as SessionTokenShape;

  const token =
    sessionData?.accessToken ||
    sessionData?.user?.accessToken ||
    sessionData?.user?.token;

  return typeof token === "string" ? token : "";
}

function safeUuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function RatingInput({ value, disabled, onChange }: { value: number; disabled?: boolean; onChange: (value: number) => void }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onChange(rating)}
          disabled={disabled}
          className={`rounded-2xl border px-2 py-3 text-center transition disabled:cursor-not-allowed disabled:opacity-60 ${
            value >= rating
              ? "border-orange-500 bg-orange-500/15 text-orange-300"
              : "border-gray-800 bg-black text-gray-500 hover:border-gray-700 hover:text-gray-300"
          }`}
          aria-label={`${rating} star rating`}
        >
          <span className="block text-lg leading-none">★</span>
        </button>
      ))}
    </div>
  );
}

function ProductChoice({ item, active, onClick }: { item: DeliveredReviewPromptItem; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-[220px] items-center gap-3 rounded-2xl border p-3 text-left transition ${
        active
          ? "border-orange-500 bg-orange-500/10"
          : "border-gray-800 bg-gray-950 hover:border-gray-700"
      }`}
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-black">
        {item.productImage ? (
          <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-gray-600">No Img</div>
        )}
      </div>

      <div className="min-w-0">
        <p className="line-clamp-1 text-sm font-bold text-white">{item.productName}</p>
        <p className="mt-1 text-xs text-gray-500">
          Qty {item.quantity} · {formatPrice(item.unitPrice)}
        </p>
      </div>
    </button>
  );
}

export default function DeliveredOrderReviewPrompt() {
  const { data: session, status } = useSession();
  const token = getSessionToken(session);

  const [prompt, setPrompt] = useState<DeliveredReviewPrompt | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeProductId, setActiveProductId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<ReviewImageDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const imageRef = useRef<ReviewImageDraft[]>([]);

  const activeItem = useMemo(() => {
    if (!prompt) return null;
    return prompt.items.find((item) => item.productId === activeProductId) || prompt.items[0] || null;
  }, [activeProductId, prompt]);

  useEffect(() => {
    imageRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imageRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !API_BASE) return;

    let ignore = false;

    const loadPrompt = async () => {
      try {
        const headers = new Headers();
        if (token) headers.set("Authorization", `Bearer ${token}`);

        const response = await fetch(`${API_BASE}/api/v1/reviews/delivered-review-prompt`, {
          credentials: "include",
          headers,
          cache: "no-store",
        });

        const data = await response.json();

        if (ignore) return;
        if (!response.ok || !data.success || !data.prompt) return;

        const nextPrompt = data.prompt as DeliveredReviewPrompt;
        const seenOrderId = window.localStorage.getItem(SEEN_STORAGE_KEY);

        if (seenOrderId === nextPrompt.order.id) return;

        setPrompt(nextPrompt);
        setActiveProductId(nextPrompt.items[0]?.productId || "");
        setIsOpen(true);
      } catch (error) {
        console.error(error);
      }
    };

    loadPrompt();

    return () => {
      ignore = true;
    };
  }, [status, token]);

  const resetForm = () => {
    setRating(5);
    setComment("");
    setImages((currentImages) => {
      currentImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      return [];
    });
  };

  const markSeenAndClose = () => {
    if (prompt?.order.id) {
      window.localStorage.setItem(SEEN_STORAGE_KEY, prompt.order.id);
    }

    resetForm();
    setIsOpen(false);
  };

  const handleImageAdd = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (images.length >= MAX_REVIEW_IMAGES) {
      toast.error(`Maximum ${MAX_REVIEW_IMAGES} photos allowed`);
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    if (file.size > REVIEW_IMAGE_MAX_SIZE) {
      toast.error("Each image must be 5MB or smaller");
      return;
    }

    setImages((current) => [
      ...current,
      {
        id: `${file.name}-${file.lastModified}-${safeUuid()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      },
    ]);
  };

  const removeImage = (imageId: string) => {
    setImages((current) => {
      const image = current.find((item) => item.id === imageId);
      if (image) URL.revokeObjectURL(image.previewUrl);
      return current.filter((item) => item.id !== imageId);
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activeItem || !API_BASE) return;

    const cleanComment = comment.trim();

    if (cleanComment.length < 3) {
      toast.error("Review comment must be at least 3 characters");
      return;
    }

    try {
      setSubmitting(true);

      const headers = new Headers();
      if (token) headers.set("Authorization", `Bearer ${token}`);

      const formData = new FormData();
      formData.set("rating", String(rating));
      formData.set("comment", cleanComment);
      formData.set("userName", session?.user?.name || "Customer");
      images.forEach((image) => formData.append("images", image.file));

      const response = await fetch(
        `${API_BASE}/api/v1/reviews/customer/${encodeURIComponent(activeItem.productId)}`,
        {
          method: "POST",
          credentials: "include",
          headers,
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to submit review");
        return;
      }

      toast.success(data.message || "Review submitted successfully");

      setPrompt((current) => {
        if (!current) return current;

        const remainingItems = current.items.filter((item) => item.productId !== activeItem.productId);

        if (remainingItems.length === 0) {
          window.localStorage.setItem(SEEN_STORAGE_KEY, current.order.id);
          window.setTimeout(() => setIsOpen(false), 100);
          return null;
        }

        setActiveProductId(remainingItems[0].productId);
        return { ...current, items: remainingItems };
      });

      resetForm();
    } catch (error) {
      console.error(error);
      toast.error("Error submitting review");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !prompt || !activeItem) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] grid place-items-center bg-black/75 px-3 py-6 backdrop-blur-sm"
      onClick={markSeenAndClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-gray-800 bg-black shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 border-b border-gray-800 bg-black/95 p-4 backdrop-blur sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-400">Delivered Order</p>
              <h2 className="mt-2 text-xl font-black text-white sm:text-2xl">
                আপনার order টি সফল ভাবে delivered করা হয়েছে
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
                আপনি চাইলে review দিতে পারেন অথবা আপনার experience share করতে পারেন। না দিলেও সমস্যা নেই।
              </p>
              <p className="mt-2 text-xs text-gray-500">Invoice: {prompt.order.invoiceNo}</p>
            </div>

            <button
              type="button"
              onClick={markSeenAndClose}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gray-800 text-xl text-gray-400 transition hover:border-red-500 hover:bg-red-500/10 hover:text-red-300"
              aria-label="Close review modal"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="mb-5 flex gap-3 overflow-x-auto pb-1">
            {prompt.items.map((item) => (
              <ProductChoice
                key={item.id}
                item={item}
                active={item.productId === activeItem.productId}
                onClick={() => {
                  setActiveProductId(item.productId);
                  resetForm();
                }}
              />
            ))}
          </div>

          <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-3xl border border-gray-800 bg-gray-950 p-4">
              <div className="aspect-square overflow-hidden rounded-2xl bg-black">
                {activeItem.productImage ? (
                  <img src={activeItem.productImage} alt={activeItem.productName} className="h-full w-full object-contain p-4" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-gray-600">No Image</div>
                )}
              </div>

              <h3 className="mt-4 text-lg font-black text-white">{activeItem.productName}</h3>
              <p className="mt-2 text-sm text-gray-500">
                Quantity {activeItem.quantity} · {formatPrice(activeItem.unitPrice)}
              </p>
            </div>

            <div className="rounded-3xl border border-gray-800 bg-gray-950 p-4 sm:p-5">
              <label className="text-sm font-bold text-gray-200">Rating</label>
              <div className="mt-2">
                <RatingInput value={rating} disabled={submitting} onChange={setRating} />
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="delivered-review-comment" className="text-sm font-bold text-gray-200">
                    Comment
                  </label>
                  <span className="text-xs text-gray-500">{comment.trim().length}/1000</span>
                </div>
                <textarea
                  id="delivered-review-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  maxLength={1000}
                  rows={5}
                  placeholder="Product quality, delivery, packaging, size, color..."
                  className="w-full resize-none rounded-2xl border border-gray-800 bg-black px-4 py-3 text-sm leading-7 text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                />
              </div>

              <div className="mt-5 rounded-3xl border border-dashed border-gray-800 bg-black/50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Upload images optional</p>
                    <p className="mt-1 text-xs text-gray-500">{images.length}/{MAX_REVIEW_IMAGES} selected. Each image max 5MB.</p>
                  </div>

                  <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-orange-500/40 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-300 transition hover:border-orange-500 hover:bg-orange-500/15">
                    Add Photo
                    <input type="file" accept="image/*" onChange={handleImageAdd} disabled={submitting} className="hidden" />
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                    {images.map((image, index) => (
                      <div key={image.id} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-gray-800 bg-gray-950">
                        <img src={image.previewUrl} alt={`Review image ${index + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/80 text-white hover:bg-red-600"
                          aria-label="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={markSeenAndClose}
                  disabled={submitting}
                  className="rounded-2xl border border-gray-800 px-5 py-3.5 text-sm font-bold text-gray-300 transition hover:border-gray-700 hover:bg-black disabled:opacity-60"
                >
                  Maybe Later
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-2xl bg-orange-600 px-5 py-3.5 text-sm font-black text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-700"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
