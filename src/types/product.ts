// src/types/product.ts

export type ProductType = "single" | "combo";

export type StockStatus =
  | "IN_STOCK"
  | "LIMITED_STOCK"
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | "PRE_ORDER"
  | "COMING_SOON";

export interface ProductSubCategory {
  id: string;
  name: string;
  slug: string;
  categoryId: string;

  description?: string | null;
  imageUrl?: string | null;
  imageCloudinaryPublicId?: string | null;
  iconSvg?: string | null;
  sortOrder?: number | null;
  isPublished?: boolean | null;

  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;

  description?: string | null;
  imageUrl?: string | null;
  imageCloudinaryPublicId?: string | null;
  iconSvg?: string | null;
  sortOrder?: number | null;
  isPublished?: boolean | null;

  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[];
  subCategories?: ProductSubCategory[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductBrand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  logoCloudinaryId?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  cloudinaryPublicId?: string;
  altText?: string | null;
  sortOrder: number;
  createdAt?: string;
}

export interface ProductReviewImage {
  id: string;
  reviewId: string;
  imageUrl: string;
  cloudinaryPublicId?: string;
  altText?: string | null;
  sortOrder?: number;
  createdAt?: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId?: string | null;
  userName?: string | null;
  userEmail: string;
  rating: number;
  comment: string;
  images?: ProductReviewImage[];
  isPublished?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SizeChart {
  id: string;
  productId: string;
  name: string;
  title?: string | null;
  description?: string | null;
  unit: string;
  chartData: any;
  imageUrl?: string | null;
  cloudinaryPublicId?: string | null;
  note?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  productType: ProductType;

  sku?: string | null;
  barcode?: string | null;
  modelName?: string | null;

  shortDescription?: string | null;
  description: string;

  keyFeatures?: string[];
  highlights?: string[];
  specifications?: any;
  tags?: string[];
  searchKeywords?: string[];

  mrp: number;
  costPrice?: number | null;
  sellingPrice: number;
  price?: number;

  stock?: number;
  stockStatus: StockStatus;
  stockStatusLabel?: string;
  lowStockAlertQuantity?: number;

  inStock: boolean;
  isPublished?: boolean;

  isFeatured?: boolean;
  isBestSeller?: boolean;
  isTrending?: boolean;
  isRecommended?: boolean;
  isFlashSale?: boolean;

  mainImageUrl: string;
  mainImagePublicId?: string;
  mainImageAlt?: string | null;

  hoverImageUrl?: string | null;
  hoverImagePublicId?: string | null;
  hoverImageAlt?: string | null;

  videoUrl?: string | null;
  videoPublicId?: string | null;

  image?: string;
  hoverImage?: string | null;

  categoryId?: string;
  category?: ProductCategory | null;

  subCategoryId?: string | null;
  subCategory?: ProductSubCategory | null;

  brandId?: string;
  brand?: ProductBrand | null;

  extraImages?: ProductImage[];
  sizeChart?: SizeChart | null;

  warrantyDuration?: string | null;
  warrantyDetails?: string | null;

  returnPolicy?: string | null;
  replacementPolicy?: string | null;
  refundPolicy?: string | null;

  deliveryInfo?: string | null;
  deliveryTime?: string | null;
  cashOnDelivery?: boolean;
  freeDelivery?: boolean;

  packageIncludes?: string[];
  packageWeight?: string | null;
  packageDimensions?: string | null;

  averageRating?: number;
  totalReviews?: number;
  reviews?: ProductReview[];

  createdAt?: string;
  updatedAt?: string;

  rating?: number;
  reviewCount?: number;
  discount?: number;
  originalPrice?: number;

  /**
   * Backend helper field.
   * Stock quantity 0 or negative should not make this false automatically.
   * Only manual unavailable states should block cart/order.
   */
  canAddToCart?: boolean;
}

export const productTypeLabels: Record<ProductType, string> = {
  single: "Single",
  combo: "Combo",
};

export const stockStatusLabels: Record<StockStatus, string> = {
  IN_STOCK: "In stock",
  LIMITED_STOCK: "Limited stock",
  LOW_STOCK: "Low stock",
  OUT_OF_STOCK: "Out of stock",
  PRE_ORDER: "Pre-order",
  COMING_SOON: "Coming soon",
};

/**
 * UI/filter purpose.
 * Final cart/order decision should use canProductBeAddedToCart().
 */
export const purchasableStockStatuses: StockStatus[] = [
  "IN_STOCK",
  "LIMITED_STOCK",
  "LOW_STOCK",
  "PRE_ORDER",
];

export const orderBlockingStockStatuses: StockStatus[] = [
  "OUT_OF_STOCK",
  "COMING_SOON",
];

export const priceRanges = [
  { min: 0, max: 500, label: "Under ৳500" },
  { min: 500, max: 1000, label: "৳500 - ৳1000" },
  { min: 1000, max: 2000, label: "৳1000 - ৳2000" },
  { min: 2000, max: 5000, label: "৳2000 - ৳5000" },
  { min: 5000, max: Infinity, label: "Above ৳5000" },
];

export function isManualStockBlocked(status?: StockStatus | null) {
  return Boolean(status && orderBlockingStockStatuses.includes(status));
}

export function canProductBeAddedToCart(product?: Product | null) {
  if (!product) return false;

  /**
   * IMPORTANT BUSINESS RULE:
   * product.stock can be 0 or negative and the customer can still order.
   * Example: stock = 0, customer orders 5 => database stock becomes -5.
   *
   * Cart/order is blocked only when admin/moderator manually marks product unavailable:
   * - isPublished false
   * - inStock false
   * - stockStatus OUT_OF_STOCK
   * - stockStatus COMING_SOON
   */

  if (product.isPublished === false) return false;
  if (product.inStock === false) return false;
  if (isManualStockBlocked(product.stockStatus)) return false;

  return true;
}

export function getStockStatusLabel(status?: StockStatus) {
  if (!status) return "In stock";
  return stockStatusLabels[status] || "In stock";
}

export function getDiscountPercentage(product: Product) {
  const mrp = Number(product.mrp || product.originalPrice || 0);
  const sellingPrice = Number(product.sellingPrice || product.price || 0);

  if (!mrp || !sellingPrice || mrp <= sellingPrice) return 0;

  return Math.round(((mrp - sellingPrice) / mrp) * 100);
}

export function getProductBadges(product: Product): string[] {
  const badges: string[] = [];

  if (product.isFeatured) badges.push("Featured");
  if (product.isBestSeller) badges.push("Best Seller");
  if (product.isTrending) badges.push("Trending");
  if (product.isRecommended) badges.push("Recommended");
  if (product.isFlashSale) badges.push("Flash Sale");

  return badges;
}

export interface ProductInventoryFieldsPatch {
  averageCost?: number | null;
  lastPurchaseCost?: number | null;
  stockValue?: number | null;
}
