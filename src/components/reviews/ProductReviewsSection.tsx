"use client";

import {
  type ChangeEvent,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import type { Product } from "@/types/product";
import type { ProductReview, ProductReviewImage } from "@/types/review";

const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");
const MAX_REVIEW_IMAGES = 10;
const REVIEW_IMAGE_MAX_SIZE = 5 * 1024 * 1024;

type ProductWithReviewData = Omit<Product, "reviews"> & {
  reviews?: ProductReview[];
  averageRating?: number;
  totalReviews?: number;
};

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

type EditReviewState = {
  review: ProductReview;
  rating: number;
  comment: string;
  newImages: ReviewImageDraft[];
  removeImageIds: string[];
};

interface ProductReviewsSectionProps {
  product: ProductWithReviewData;
  reviews: ProductReview[];
  setReviews: Dispatch<SetStateAction<ProductReview[]>>;
  setProduct: Dispatch<SetStateAction<ProductWithReviewData | null>>;
}

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

function formatReviewDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function RatingStars({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const safeValue = Math.min(Math.max(Number(value) || 0, 0), 5);
  const roundedValue = Math.round(safeValue);

  return (
    <div
      aria-label={`${safeValue.toFixed(1)} out of 5 stars`}
      className={`flex items-center gap-0.5 ${size === "md" ? "text-lg" : "text-sm"}`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={index < roundedValue ? "text-orange-400" : "text-gray-700"}>
          ★
        </span>
      ))}
    </div>
  );
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
              ? "border-orange-500 bg-orange-500/15 text-orange-300 shadow-[0_0_0_1px_rgba(249,115,22,0.18)]"
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

function ReviewPhotoList({ images }: { images?: ProductReviewImage[] }) {
  if (!Array.isArray(images) || images.length === 0) return null;

  return (
    <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
      {images.map((image, index) => (
        <a
          key={image.id}
          href={image.imageUrl}
          target="_blank"
          rel="noreferrer"
          className="group relative block h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-gray-800 bg-black sm:h-28 sm:w-28"
        >
          <img
            src={image.imageUrl}
            alt={image.altText || `Review photo ${index + 1}`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
            View
          </span>
        </a>
      ))}
    </div>
  );
}

function ReviewCard({ review, isOwner, onEdit, onDelete, deleting }: { review: ProductReview; isOwner: boolean; onEdit: () => void; onDelete: () => void; deleting: boolean }) {
  const reviewerName = review.userName || "Customer";
  const avatarText = reviewerName.trim().charAt(0).toUpperCase() || "C";
  const reviewDate = formatReviewDate(review.createdAt);

  return (
    <article className="h-full rounded-3xl border border-gray-800 bg-gray-950/90 p-4 transition hover:border-gray-700 sm:p-5">
      <div className="flex gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-sm font-black text-orange-300 sm:h-12 sm:w-12">
          {avatarText}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="break-words text-sm font-black text-white sm:text-base">{reviewerName}</h4>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <RatingStars value={review.rating} />
                <span className="rounded-full border border-gray-800 bg-black px-2 py-0.5 text-[11px] font-semibold text-gray-400">
                  {review.rating}/5
                </span>
              </div>
            </div>

            {isOwner && (
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={onEdit}
                  className="rounded-full border border-gray-800 px-3 py-1.5 text-xs font-bold text-gray-300 transition hover:border-orange-500 hover:text-orange-300"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={deleting}
                  className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-300 transition hover:bg-red-600 hover:text-white disabled:opacity-60"
                >
                  {deleting ? "Deleting" : "Delete"}
                </button>
              </div>
            )}
          </div>

          {reviewDate && <p className="mt-1 text-xs font-medium text-gray-500">{reviewDate}</p>}
        </div>
      </div>

      <p className="mt-4 whitespace-pre-line break-words text-sm italic leading-7 text-gray-300">
        <span className="text-xl text-orange-400">“</span>
        {review.comment}
        <span className="text-xl text-orange-400">”</span>
      </p>

      <ReviewPhotoList images={review.images} />
    </article>
  );
}

export default function ProductReviewsSection({ product, reviews, setReviews, setProduct }: ProductReviewsSectionProps) {
  const { data: session } = useSession();
  const token = getSessionToken(session);
  const user = session?.user ?? null;
  const currentUserEmail = (user?.email || "").trim().toLowerCase();

  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState<ReviewImageDraft[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState("");
  const [editState, setEditState] = useState<EditReviewState | null>(null);
  const [isUpdatingReview, setIsUpdatingReview] = useState(false);

  const averageRating = Number(product.averageRating || 0);
  const totalReviews = Math.max(Number(product.totalReviews || 0), reviews.length);
  const reviewPhotoCount = reviews.reduce((total, review) => total + (Array.isArray(review.images) ? review.images.length : 0), 0);

  const ratingBreakdown = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((rating) => {
        const count = reviews.filter((review) => Number(review.rating) === rating).length;
        const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

        return { rating, count, percentage };
      }),
    [reviews, totalReviews],
  );

  const syncReviewResponse = (data: any) => {
    const nextReviews = Array.isArray(data.reviews) ? data.reviews : [];

    setReviews(nextReviews);
    setProduct((currentProduct) =>
      currentProduct
        ? {
            ...currentProduct,
            reviews: nextReviews,
            averageRating: Number(data.averageRating || 0),
            totalReviews: Number(data.totalReviews || nextReviews.length),
          }
        : currentProduct,
    );
  };

  const createHeaders = () => {
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  };

  const addImageDraft = (
    event: ChangeEvent<HTMLInputElement>,
    setter: (updater: (current: ReviewImageDraft[]) => ReviewImageDraft[]) => void,
    currentLength: number,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (currentLength >= MAX_REVIEW_IMAGES) {
      toast.error(`You can upload maximum ${MAX_REVIEW_IMAGES} review photos`);
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    if (file.size > REVIEW_IMAGE_MAX_SIZE) {
      toast.error("Each review photo must be 5MB or smaller");
      return;
    }

    setter((currentImages) => [
      ...currentImages,
      {
        id: `${file.name}-${file.lastModified}-${safeUuid()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      },
    ]);
  };

  const clearDraftImages = (drafts: ReviewImageDraft[]) => {
    drafts.forEach((image) => URL.revokeObjectURL(image.previewUrl));
  };

  const removeReviewImageDraft = (imageId: string) => {
    setReviewImages((currentImages) => {
      const imageToRemove = currentImages.find((image) => image.id === imageId);
      if (imageToRemove) URL.revokeObjectURL(imageToRemove.previewUrl);
      return currentImages.filter((image) => image.id !== imageId);
    });
  };

  const handleReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      toast.error("Please login to submit a review", { icon: "🔒" });
      return;
    }

    if (!API_BASE) {
      toast.error("NEXT_PUBLIC_BACKEND_URL is missing");
      return;
    }

    const cleanComment = reviewComment.trim();

    if (cleanComment.length < 3) {
      toast.error("Review comment must be at least 3 characters");
      return;
    }

    try {
      setIsSubmittingReview(true);

      const formData = new FormData();
      formData.set("rating", String(reviewRating));
      formData.set("comment", cleanComment);
      formData.set("userName", user.name || "Customer");
      reviewImages.forEach((image) => formData.append("images", image.file));

      const response = await fetch(`${API_BASE}/api/v1/reviews/customer/${encodeURIComponent(product.id)}`, {
        method: "POST",
        credentials: "include",
        headers: createHeaders(),
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to save review");
        return;
      }

      syncReviewResponse(data);
      setReviewComment("");
      setReviewRating(5);
      setReviewImages((currentImages) => {
        clearDraftImages(currentImages);
        return [];
      });

      toast.success(data.message || "Review submitted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Error saving review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const startEditReview = (review: ProductReview) => {
    setEditState({
      review,
      rating: review.rating,
      comment: review.comment,
      newImages: [],
      removeImageIds: [],
    });
  };

  const closeEditModal = () => {
    if (editState) clearDraftImages(editState.newImages);
    setEditState(null);
  };

  const handleReviewUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editState || !API_BASE) return;

    const cleanComment = editState.comment.trim();

    if (cleanComment.length < 3) {
      toast.error("Review comment must be at least 3 characters");
      return;
    }

    try {
      setIsUpdatingReview(true);

      const formData = new FormData();
      formData.set("rating", String(editState.rating));
      formData.set("comment", cleanComment);
      formData.set("userName", user?.name || editState.review.userName || "Customer");
      formData.set("removeImageIds", JSON.stringify(editState.removeImageIds));
      editState.newImages.forEach((image) => formData.append("images", image.file));

      const response = await fetch(`${API_BASE}/api/v1/reviews/my/${encodeURIComponent(editState.review.id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: createHeaders(),
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to update review");
        return;
      }

      syncReviewResponse(data);
      toast.success(data.message || "Review updated successfully");
      closeEditModal();
    } catch (error) {
      console.error(error);
      toast.error("Error updating review");
    } finally {
      setIsUpdatingReview(false);
    }
  };

  const handleReviewDelete = async (reviewId: string) => {
    if (!API_BASE) return;

    const confirmed = window.confirm("Delete this review?");
    if (!confirmed) return;

    try {
      setDeletingReviewId(reviewId);

      const response = await fetch(`${API_BASE}/api/v1/reviews/my/${encodeURIComponent(reviewId)}`, {
        method: "DELETE",
        credentials: "include",
        headers: createHeaders(),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to delete review");
        return;
      }

      syncReviewResponse(data);
      toast.success(data.message || "Review deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Error deleting review");
    } finally {
      setDeletingReviewId("");
    }
  };

  const scrollReviews = (direction: "left" | "right") => {
    const element = sliderRef.current;
    if (!element) return;

    element.scrollBy({
      left: direction === "left" ? -element.clientWidth : element.clientWidth,
      behavior: "smooth",
    });
  };

  return (
    <section className="min-w-0 rounded-2xl border border-gray-800 bg-black p-4 sm:p-5">
      <h2 className="mb-4 text-base font-bold text-orange-400 sm:text-lg">Customer Reviews</h2>

      <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-orange-500/20 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_36%),linear-gradient(145deg,rgba(17,24,39,0.98),rgba(3,7,18,0.98))] p-4 shadow-[0_18px_55px_rgba(0,0,0,0.35)] sm:p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-300/80">Review Snapshot</p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-5xl font-black leading-none text-white sm:text-6xl">{averageRating.toFixed(1)}</span>
                  <span className="pb-1.5 text-sm font-semibold text-gray-400">/ 5</span>
                </div>
                <div className="mt-3">
                  <RatingStars value={averageRating} size="md" />
                </div>
                <p className="mt-2 text-sm text-gray-400">Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:min-w-40 sm:grid-cols-1">
                <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
                  <p className="text-2xl font-black text-white">{totalReviews}</p>
                  <p className="mt-1 text-xs text-gray-500">Total reviews</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
                  <p className="text-2xl font-black text-white">{reviewPhotoCount}</p>
                  <p className="mt-1 text-xs text-gray-500">Customer photos</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-800 bg-gray-950/80 p-4 sm:p-5">
            <h3 className="text-sm font-bold text-white sm:text-base">Rating breakdown</h3>
            <p className="mt-1 text-xs text-gray-500">Ratings update automatically after every review.</p>

            <div className="mt-4 space-y-3">
              {ratingBreakdown.map((item) => (
                <div key={item.rating} className="grid grid-cols-[48px_1fr_42px] items-center gap-3">
                  <div className="flex items-center gap-1 text-xs font-semibold text-gray-300">
                    <span>{item.rating}</span>
                    <span className="text-orange-400">★</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-gray-900">
                    <div className="h-full rounded-full bg-orange-500 transition-all duration-500" style={{ width: `${item.percentage}%` }} />
                  </div>
                  <p className="text-right text-xs text-gray-500">{item.count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleReviewSubmit} className="rounded-3xl border border-gray-800 bg-gray-950 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.25)] sm:p-5">
          <h3 className="text-lg font-black text-white">Share your experience</h3>
          <p className="mt-1 max-w-xl text-sm leading-6 text-gray-500">
            Review submit korte hole product delivered hote hobe. Delivered popup thekeo review dite parbe.
          </p>

          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-gray-200">Your rating</p>
            <RatingInput value={reviewRating} disabled={isSubmittingReview} onChange={setReviewRating} />
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="review-comment" className="text-sm font-semibold text-gray-200">Your review</label>
              <span className="text-xs text-gray-500">{reviewComment.trim().length}/1000</span>
            </div>
            <textarea
              id="review-comment"
              value={reviewComment}
              onChange={(event) => setReviewComment(event.target.value)}
              rows={5}
              maxLength={1000}
              placeholder="Product quality, delivery, packaging, size, color..."
              className="w-full resize-none rounded-2xl border border-gray-800 bg-black px-4 py-3 text-sm leading-7 text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
            />
          </div>

          <div className="mt-5 rounded-3xl border border-dashed border-gray-800 bg-black/55 p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-white">Add product photos</p>
                <p className="mt-1 text-xs leading-5 text-gray-500">{reviewImages.length}/{MAX_REVIEW_IMAGES} selected. Each photo max 5MB.</p>
              </div>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-orange-500/40 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-300 transition hover:border-orange-500 hover:bg-orange-500/15">
                Add Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => addImageDraft(event, setReviewImages, reviewImages.length)}
                  disabled={isSubmittingReview}
                  className="hidden"
                />
              </label>
            </div>

            {reviewImages.length > 0 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {reviewImages.map((image, index) => (
                  <div key={image.id} className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-gray-800 bg-gray-950 sm:h-28 sm:w-28">
                    <img src={image.previewUrl} alt={`Selected review photo ${index + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeReviewImageDraft(image.id)}
                      className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/80 text-sm font-black text-white transition hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-gray-500">Same product e abar submit korle previous review update hobe.</p>
            <button
              type="submit"
              disabled={isSubmittingReview}
              className="inline-flex items-center justify-center rounded-2xl bg-orange-600 px-6 py-3.5 text-sm font-black text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
            >
              {isSubmittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-7">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-black text-white">Customer feedback</h3>
            <p className="mt-1 text-sm text-gray-500">Per product review slider. LG 3, MD 2, small 1 card visible.</p>
          </div>

          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => scrollReviews("left")} className="grid h-10 w-10 place-items-center rounded-full border border-gray-800 text-white hover:border-orange-500 hover:text-orange-300">‹</button>
              <button type="button" onClick={() => scrollReviews("right")} className="grid h-10 w-10 place-items-center rounded-full border border-gray-800 text-white hover:border-orange-500 hover:text-orange-300">›</button>
            </div>
          )}
        </div>

        {reviews.length > 0 ? (
          <div ref={sliderRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3">
            {reviews.map((review) => {
              const isOwner = Boolean(currentUserEmail && review.userEmail?.toLowerCase() === currentUserEmail);

              return (
                <div key={review.id} className="min-w-0 shrink-0 basis-full snap-start md:basis-[calc((100%_-_1rem)/2)] lg:basis-[calc((100%_-_2rem)/3)]">
                  <ReviewCard
                    review={review}
                    isOwner={isOwner}
                    onEdit={() => startEditReview(review)}
                    onDelete={() => handleReviewDelete(review.id)}
                    deleting={deletingReviewId === review.id}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-gray-800 bg-gray-950 px-5 py-10 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-2xl text-orange-300">★</div>
            <h3 className="mt-4 text-lg font-black text-white">No reviews yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">Be the first customer to share rating, feedback, and real product photos.</p>
          </div>
        )}
      </div>

      {editState && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[130] grid place-items-center bg-black/75 px-3 py-6 backdrop-blur-sm" onClick={closeEditModal}>
          <form onSubmit={handleReviewUpdate} onClick={(event) => event.stopPropagation()} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-gray-800 bg-black p-4 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-400">Edit Review</p>
                <h3 className="mt-2 text-xl font-black text-white">Update your experience</h3>
              </div>
              <button type="button" onClick={closeEditModal} className="grid h-10 w-10 place-items-center rounded-full border border-gray-800 text-xl text-gray-400 hover:border-red-500 hover:text-red-300">×</button>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold text-gray-200">Rating</p>
              <RatingInput value={editState.rating} disabled={isUpdatingReview} onChange={(rating) => setEditState((current) => current ? { ...current, rating } : current)} />
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="edit-review-comment" className="text-sm font-semibold text-gray-200">Comment</label>
                <span className="text-xs text-gray-500">{editState.comment.trim().length}/1000</span>
              </div>
              <textarea
                id="edit-review-comment"
                value={editState.comment}
                onChange={(event) => setEditState((current) => current ? { ...current, comment: event.target.value } : current)}
                rows={5}
                maxLength={1000}
                className="w-full resize-none rounded-2xl border border-gray-800 bg-black px-4 py-3 text-sm leading-7 text-gray-200 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
              />
            </div>

            {Array.isArray(editState.review.images) && editState.review.images.length > 0 && (
              <div className="mt-5">
                <p className="mb-3 text-sm font-bold text-white">Current photos</p>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {editState.review.images.map((image) => {
                    const removing = editState.removeImageIds.includes(image.id);

                    return (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() =>
                          setEditState((current) => {
                            if (!current) return current;
                            const exists = current.removeImageIds.includes(image.id);
                            return {
                              ...current,
                              removeImageIds: exists
                                ? current.removeImageIds.filter((id) => id !== image.id)
                                : [...current.removeImageIds, image.id],
                            };
                          })
                        }
                        className={`relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border bg-black ${removing ? "border-red-500 opacity-50" : "border-gray-800"}`}
                      >
                        <img src={image.imageUrl} alt={image.altText || "Review photo"} className="h-full w-full object-cover" />
                        <span className="absolute inset-x-2 bottom-2 rounded-full bg-black/75 px-2 py-1 text-[10px] font-bold text-white">
                          {removing ? "Will remove" : "Tap remove"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-5 rounded-3xl border border-dashed border-gray-800 bg-gray-950/70 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Add new photos</p>
                  <p className="mt-1 text-xs text-gray-500">{editState.newImages.length}/{MAX_REVIEW_IMAGES} selected</p>
                </div>
                <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-orange-500/40 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-300 hover:border-orange-500">
                  Add Photo
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUpdatingReview}
                    onChange={(event) =>
                      addImageDraft(
                        event,
                        (updater) =>
                          setEditState((current) => current ? { ...current, newImages: updater(current.newImages) } : current),
                        editState.newImages.length,
                      )
                    }
                    className="hidden"
                  />
                </label>
              </div>

              {editState.newImages.length > 0 && (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                  {editState.newImages.map((image, index) => (
                    <div key={image.id} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-gray-800 bg-gray-950">
                      <img src={image.previewUrl} alt={`New review photo ${index + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setEditState((current) => {
                            if (!current) return current;
                            const removed = current.newImages.find((item) => item.id === image.id);
                            if (removed) URL.revokeObjectURL(removed.previewUrl);
                            return { ...current, newImages: current.newImages.filter((item) => item.id !== image.id) };
                          })
                        }
                        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/80 text-white hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={closeEditModal} disabled={isUpdatingReview} className="rounded-2xl border border-gray-800 px-5 py-3.5 text-sm font-bold text-gray-300 hover:bg-gray-950 disabled:opacity-60">
                Cancel
              </button>
              <button type="submit" disabled={isUpdatingReview} className="rounded-2xl bg-orange-600 px-5 py-3.5 text-sm font-black text-white hover:bg-orange-700 disabled:bg-gray-700">
                {isUpdatingReview ? "Updating..." : "Update Review"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
