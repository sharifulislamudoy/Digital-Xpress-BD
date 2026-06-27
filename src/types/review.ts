export type ProductReviewImage = {
  id: string;
  reviewId: string;
  imageUrl: string;
  cloudinaryPublicId?: string;
  altText?: string | null;
  sortOrder?: number;
  createdAt?: string;
};

export type ReviewProductSummary = {
  id: string;
  name: string;
  slug?: string | null;
  mainImageUrl?: string | null;
  sellingPrice?: number;
};

export type ProductReview = {
  id: string;
  productId: string;
  userId?: string | null;
  userName?: string | null;
  userEmail: string;
  rating: number;
  comment: string;
  images?: ProductReviewImage[];
  product?: ReviewProductSummary | null;
  isPublished?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DeliveredReviewPromptItem = {
  id: string;
  productId: string;
  productName: string;
  productSlug?: string | null;
  productImage?: string | null;
  sku?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: ReviewProductSummary | null;
};

export type DeliveredReviewPrompt = {
  order: {
    id: string;
    invoiceNo: string;
    deliveredAt?: string | null;
    updatedAt?: string | null;
  };
  items: DeliveredReviewPromptItem[];
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
