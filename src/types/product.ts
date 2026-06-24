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
  productCode?: string | null;
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
  soldQuantity?: number;
  reservedQuantity?: number;

  inStock: boolean;
  isPublished?: boolean;

  isFeatured?: boolean;
  isNewArrival?: boolean;
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
  deliveryCharge?: number | null;
  insideDhakaDeliveryCharge?: number | null;
  outsideDhakaDeliveryCharge?: number | null;
  deliveryTime?: string | null;
  cashOnDelivery?: boolean;
  freeDelivery?: boolean;
  freeDeliveryMinAmount?: number | null;

  packageIncludes?: string[];
  packageWeight?: string | null;
  packageDimensions?: string | null;

  supplierName?: string | null;
  supplierPhone?: string | null;
  supplierEmail?: string | null;
  supplierAddress?: string | null;
  supplierInvoiceNumber?: string | null;
  internalNote?: string | null;

  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[];
  focusKeyword?: string | null;
  canonicalUrl?: string | null;

  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;

  metaRobots?: string;
  schemaJson?: any;

  viewCount?: number;
  wishlistCount?: number;
  cartCount?: number;
  orderCount?: number;
  averageRating?: number;
  totalReviews?: number;
  reviews?: ProductReview[];

  createdById?: string | null;
  createdByName?: string | null;
  createdByEmail?: string | null;
  updatedById?: string | null;
  updatedByName?: string | null;
  updatedByEmail?: string | null;

  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;

  rating?: number;
  reviewCount?: number;
  discount?: number;
  originalPrice?: number;
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

export const purchasableStockStatuses: StockStatus[] = [
  "IN_STOCK",
  "LIMITED_STOCK",
  "LOW_STOCK",
  "PRE_ORDER",
];

export const priceRanges = [
  { min: 0, max: 500, label: "Under ৳500" },
  { min: 500, max: 1000, label: "৳500 - ৳1000" },
  { min: 1000, max: 2000, label: "৳1000 - ৳2000" },
  { min: 2000, max: 5000, label: "৳2000 - ৳5000" },
  { min: 5000, max: Infinity, label: "Above ৳5000" },
];

export function canProductBeAddedToCart(product: Product) {
  if (typeof product.canAddToCart === "boolean") return product.canAddToCart;
  return purchasableStockStatuses.includes(product.stockStatus);
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
  if (product.isNewArrival) badges.push("New");
  if (product.isBestSeller) badges.push("Best Seller");
  if (product.isTrending) badges.push("Trending");
  if (product.isRecommended) badges.push("Recommended");
  if (product.isFlashSale) badges.push("Flash Sale");

  return badges;
}
