// types/product.ts

export type ProfitType = "FIXED" | "PERCENTAGE";

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
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  subCategories?: ProductSubCategory[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductBrand {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  cloudinaryPublicId?: string;
  sortOrder: number;
  createdAt?: string;
}

// Extended Product interface with all fields from Prisma schema
export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  productCode?: string | null;
  barcode?: string | null;

  modelName?: string | null;
  shortDescription?: string | null;
  description: string;

  keyFeatures?: string[];
  highlights?: string[];
  specifications?: any; // JSON
  tags?: string[];
  searchKeywords?: string[];

  mrp: number;
  sellingPrice: number;
  price?: number;

  costPrice?: number;
  profitType?: ProfitType;
  profitValue?: number;

  stock?: number;
  lowStockAlertQuantity?: number;
  stockStatus: StockStatus;
  stockStatusLabel?: string;
  canAddToCart?: boolean;

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

  category?: ProductCategory | null;
  subCategory?: ProductSubCategory | null;
  brand?: ProductBrand | null;

  extraImages?: ProductImage[];

  // Delivery & Policy
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

  // Supplier
  supplierName?: string | null;
  supplierPhone?: string | null;
  supplierEmail?: string | null;
  supplierAddress?: string | null;
  supplierInvoiceNumber?: string | null;
  internalNote?: string | null;

  // SEO
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

  // Stats
  averageRating?: number;
  totalReviews?: number;

  createdAt?: string;
  updatedAt?: string;

  rating?: number;
  reviews?: number;
  discount?: number;
  originalPrice?: number;
}

export const priceRanges = [
  { min: 0, max: 500, label: "Under $500" },
  { min: 500, max: 1000, label: "$500 - $1000" },
  { min: 1000, max: 2000, label: "$1000 - $2000" },
  { min: 2000, max: 5000, label: "$2000 - $5000" },
  { min: 5000, max: Infinity, label: "Above $5000" },
];

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