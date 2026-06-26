"use client";

import {
  isValidElement,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import type { Product } from "@/types/product";
import {
  canProductBeAddedToCart,
  getDiscountPercentage,
  getProductBadges,
  getStockStatusLabel,
  productTypeLabels,
} from "@/types/product";
import { formatPrice } from "@/lib/formatPrice";
import ProductDetailsPageSkeleton from "@/components/products/ProductDetailsPageSkeleton";

interface ProductDetailsPageProps {
  categoryKey?: string;
  productKey: string;
}

type ProductDetailsTab =
  | "description"
  | "features"
  | "sizeChart"
  | "warranty"
  | "reviews";

type ProductTabConfig = {
  id: ProductDetailsTab;
  label: string;
};

type InfoField = {
  label: string;
  value: ReactNode;
};

type TableData = {
  rows: Record<string, unknown>[];
  columns: string[];
};

type StoredCartProduct = Product & {
  quantity: number;
  addedAt: string;
  updatedAt: string;
};

type StoredWishlistProduct = Product & {
  addedAt: string;
};

type ProductReviewImage = {
  id: string;
  reviewId: string;
  imageUrl: string;
  cloudinaryPublicId?: string;
  altText?: string | null;
  sortOrder?: number;
  createdAt?: string;
};

type ProductReview = {
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
};

type ReviewImageDraft = {
  id: string;
  file: File;
  previewUrl: string;
};

type ProductWithReviewData = Omit<Product, "reviews"> & {
  reviews?: ProductReview[];
  averageRating?: number;
  totalReviews?: number;
};

const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");
const MAX_REVIEW_IMAGES = 10;
const REVIEW_IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const CART_STORAGE_KEY = "digital-xpress-cart";
const WISHLIST_STORAGE_KEY = "digital-xpress-wishlist";

const readLocalStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;

  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeLocalStorage = <T,>(key: string, value: T) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

function dispatchCartUpdated(cart: StoredCartProduct[]) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("digital-xpress-cart-updated", {
      detail: cart,
    })
  );
}

function dispatchWishlistUpdated(wishlist: StoredWishlistProduct[]) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("digital-xpress-wishlist-updated", {
      detail: wishlist,
    })
  );
}

function saveProductToCart(
  product: Product,
  options: { incrementExisting?: boolean } = {}
) {
  const currentCart = readLocalStorage<StoredCartProduct[]>(
    CART_STORAGE_KEY,
    []
  );

  const now = new Date().toISOString();
  const existing = currentCart.find((item) => item.id === product.id);

  const updatedCart = existing
    ? currentCart.map((item) =>
      item.id === product.id
        ? {
          ...item,
          quantity: options.incrementExisting
            ? (item.quantity || 1) + 1
            : item.quantity || 1,
          updatedAt: now,
        }
        : item
    )
    : [
      ...currentCart,
      {
        ...product,
        quantity: 1,
        addedAt: now,
        updatedAt: now,
      },
    ];

  writeLocalStorage(CART_STORAGE_KEY, updatedCart);
  dispatchCartUpdated(updatedCart);

  return updatedCart;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isPlainJsonObject(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  if (isValidElement(value)) return false;
  if ("$$typeof" in value) return false;

  const proto = Object.getPrototypeOf(value);

  return proto === Object.prototype || proto === null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function toSafeSrc(value?: string | null) {
  return value || undefined;
}

function isUsableMediaSrc(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;

  const cleanValue = value.trim();

  if (cleanValue.includes("PASTE_")) return false;
  if (cleanValue.includes("_HERE")) return false;

  return true;
}

function parseJsonLike(value: unknown, seen = new WeakSet<object>()): unknown {
  if (isValidElement(value)) return value;

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        return parseJsonLike(JSON.parse(trimmed), seen);
      } catch {
        return value;
      }
    }

    return value;
  }

  if (Array.isArray(value)) {
    if (seen.has(value)) return [];

    seen.add(value);

    return value
      .map((item) => parseJsonLike(item, seen))
      .filter((item) => item !== undefined);
  }

  if (isPlainJsonObject(value)) {
    if (seen.has(value)) return {};

    seen.add(value);

    const entries = Object.entries(value)
      .map(([key, item]) => [key, parseJsonLike(item, seen)] as const)
      .filter(([, item]) => item !== undefined);

    return Object.fromEntries(entries);
  }

  return value;
}

function hasRenderableValue(value: unknown): boolean {
  if (isValidElement(value)) return true;

  const parsedValue = parseJsonLike(value);

  if (parsedValue === null || parsedValue === undefined) return false;

  if (typeof parsedValue === "string") {
    return parsedValue.trim().length > 0;
  }

  if (typeof parsedValue === "number") {
    return Number.isFinite(parsedValue);
  }

  if (typeof parsedValue === "boolean") {
    return true;
  }

  if (Array.isArray(parsedValue)) {
    return parsedValue.some((item) => hasRenderableValue(item));
  }

  if (parsedValue instanceof Date) {
    return !Number.isNaN(parsedValue.getTime());
  }

  if (isPlainJsonObject(parsedValue)) {
    return Object.values(parsedValue).some((item) => hasRenderableValue(item));
  }

  return true;
}

function displayValue(value: unknown): ReactNode {
  if (isValidElement(value)) return value;

  const parsedValue = parseJsonLike(value);

  if (!hasRenderableValue(parsedValue)) return null;

  if (typeof parsedValue === "boolean") {
    return parsedValue ? "Yes" : "No";
  }

  if (typeof parsedValue === "string") {
    return parsedValue.trim();
  }

  if (typeof parsedValue === "number") {
    return parsedValue;
  }

  if (Array.isArray(parsedValue)) {
    return parsedValue.filter(hasRenderableValue).map(String).join(", ");
  }

  if (isPlainJsonObject(parsedValue)) {
    return JSON.stringify(parsedValue);
  }

  return String(parsedValue);
}

function formatMoney(value: unknown): ReactNode {
  const parsedValue = parseJsonLike(value);

  if (!hasRenderableValue(parsedValue)) return null;

  if (typeof parsedValue === "number") {
    return formatPrice(parsedValue);
  }

  if (typeof parsedValue === "string") {
    const numericValue = Number(parsedValue.trim());

    if (Number.isFinite(numericValue)) {
      return formatPrice(numericValue);
    }

    return parsedValue.trim();
  }

  return displayValue(parsedValue);
}

function compactFields(
  fields: Array<InfoField | false | null | undefined>
): InfoField[] {
  return fields.filter(Boolean) as InfoField[];
}

function slugify(value: unknown) {
  if (!value) return "products";

  return String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatLabel(value: unknown) {
  if (!value) return "";

  const cleanValue = String(value)
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();

  return cleanValue
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();

      if (["id", "gsm", "url", "seo", "og"].includes(lower)) {
        return lower.toUpperCase();
      }

      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function normalizeColumnKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getValueByColumn(row: Record<string, unknown>, column: string) {
  if (column in row) return row[column];

  const normalizedColumn = normalizeColumnKey(column);

  const matchedKey = Object.keys(row).find(
    (key) => normalizeColumnKey(key) === normalizedColumn
  );

  return matchedKey ? row[matchedKey] : undefined;
}

function getCategoryName(product: Product, fallback?: string) {
  return product.category?.name || fallback || "Products";
}

function getCategorySlug(product: Product, fallback?: string) {
  const category = product.category as
    | {
      name?: string | null;
      slug?: string | null;
    }
    | undefined
    | null;

  return slugify(category?.slug || category?.name || fallback || "products");
}

function getProductSlug(product: Product, fallbackKey: string) {
  const productWithSlug = product as Product & {
    slug?: string | null;
  };

  return slugify(productWithSlug.slug || fallbackKey || product.name);
}

function getTableData(value: unknown): TableData | null {
  const parsedValue = parseJsonLike(value);

  if (!hasRenderableValue(parsedValue)) return null;

  if (Array.isArray(parsedValue)) {
    const rows = parsedValue.filter(isPlainJsonObject);

    if (rows.length === 0) return null;

    const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));

    return { rows, columns };
  }

  if (!isPlainJsonObject(parsedValue)) return null;

  const directRows = parsedValue.rows;
  const directColumns = parsedValue.columns;

  if (Array.isArray(directRows)) {
    const rows = directRows.filter(isPlainJsonObject);

    if (rows.length === 0) return null;

    const dataColumns = Array.from(
      new Set(rows.flatMap((row) => Object.keys(row)))
    );

    const configuredColumns = Array.isArray(directColumns)
      ? directColumns.map(String).filter(Boolean)
      : [];

    return {
      rows,
      columns: configuredColumns.length > 0 ? configuredColumns : dataColumns,
    };
  }

  if (hasRenderableValue(parsedValue.chartData)) {
    return getTableData(parsedValue.chartData);
  }

  return null;
}

function getSizeChartRecord(value: unknown): Record<string, unknown> | null {
  const parsedValue = parseJsonLike(value);

  if (!isPlainJsonObject(parsedValue)) return null;

  const chartData = parsedValue.chartData;

  if (isPlainJsonObject(chartData) && hasRenderableValue(chartData.name)) {
    return {
      ...parsedValue,
      ...chartData,
      chartData: chartData.chartData || chartData,
    };
  }

  return parsedValue;
}

function getSizeChartTableSource(sizeChart: unknown) {
  const record = getSizeChartRecord(sizeChart);

  if (!record) return null;

  if (hasRenderableValue(record.chartData)) {
    return record.chartData;
  }

  return record;
}

function hasFeatureTabData(product: Product) {
  return (
    hasRenderableValue(product.keyFeatures) ||
    hasRenderableValue(product.highlights) ||
    hasRenderableValue(product.tags) ||
    hasRenderableValue(product.specifications)
  );
}

function hasSizeChartTabData(product: Product) {
  const sizeChartRecord = getSizeChartRecord(product.sizeChart);

  if (!sizeChartRecord) return false;

  return (
    hasRenderableValue(sizeChartRecord.name) ||
    hasRenderableValue(sizeChartRecord.title) ||
    hasRenderableValue(sizeChartRecord.unit) ||
    hasRenderableValue(sizeChartRecord.note) ||
    hasRenderableValue(sizeChartRecord.description) ||
    isUsableMediaSrc(sizeChartRecord.imageUrl) ||
    hasRenderableValue(getSizeChartTableSource(sizeChartRecord))
  );
}

function hasWarrantyTabData(product: Product) {
  return (
    hasRenderableValue(product.warrantyDuration) ||
    hasRenderableValue(product.warrantyDetails) ||
    hasRenderableValue(product.returnPolicy) ||
    hasRenderableValue(product.replacementPolicy) ||
    hasRenderableValue(product.refundPolicy) ||
    hasRenderableValue(product.deliveryInfo) ||
    hasRenderableValue(product.deliveryCharge) ||
    hasRenderableValue(product.insideDhakaDeliveryCharge) ||
    hasRenderableValue(product.outsideDhakaDeliveryCharge) ||
    hasRenderableValue(product.deliveryTime) ||
    hasRenderableValue(product.cashOnDelivery) ||
    hasRenderableValue(product.freeDelivery) ||
    hasRenderableValue(product.freeDeliveryMinAmount) ||
    hasRenderableValue(product.packageIncludes) ||
    hasRenderableValue(product.packageWeight) ||
    hasRenderableValue(product.packageDimensions)
  );
}

function getVisibleProductTabs(product: Product): ProductTabConfig[] {
  const tabs: ProductTabConfig[] = [];

  if (hasRenderableValue(product.description)) {
    tabs.push({ id: "description", label: "Description" });
  }

  if (hasFeatureTabData(product)) {
    tabs.push({ id: "features", label: "Features & Specs" });
  }

  if (hasSizeChartTabData(product)) {
    tabs.push({ id: "sizeChart", label: "Size Chart" });
  }

  if (hasWarrantyTabData(product)) {
    tabs.push({ id: "warranty", label: "Warranty & Delivery" });
  }

  tabs.push({ id: "reviews", label: "Reviews" });

  return tabs;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-2xl border border-gray-800 bg-black p-4 sm:p-5">
      <h2 className="mb-4 text-base font-bold text-orange-400 sm:text-lg">
        {title}
      </h2>
      {children}
    </section>
  );
}

function InfoGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-3 grid-cols-2">
      {children}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-800 bg-gray-950 p-3 sm:p-4">
      <p className="break-words text-[10px] uppercase tracking-[0.14em] text-gray-500 sm:text-xs sm:tracking-[0.18em]">
        {label}
      </p>

      <div className="mt-2 min-w-0 break-words text-xs leading-6 text-gray-200 sm:text-sm">
        {value}
      </div>
    </div>
  );
}

function InfoFieldGrid({ fields }: { fields: InfoField[] }) {
  if (fields.length === 0) return null;

  return (
    <InfoGrid>
      {fields.map((field) => (
        <InfoItem key={field.label} label={field.label} value={field.value} />
      ))}
    </InfoGrid>
  );
}

function ChipList({ items }: { items?: unknown[] | null }) {
  const cleanItems = (items || [])
    .map((item) => parseJsonLike(item))
    .filter(hasRenderableValue);

  if (cleanItems.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {cleanItems.map((item, index) => (
        <span
          key={`${String(item)}-${index}`}
          className="rounded-full border border-gray-800 bg-gray-950 px-2.5 py-1 text-[11px] text-gray-300 sm:px-3 sm:text-xs"
        >
          {displayValue(item)}
        </span>
      ))}
    </div>
  );
}

function ValueRenderer({ value }: { value: unknown }) {
  const parsedValue = parseJsonLike(value);

  if (!hasRenderableValue(parsedValue)) return null;

  const tableData = getTableData(parsedValue);

  if (tableData) {
    return <DataTable value={parsedValue} />;
  }

  if (Array.isArray(parsedValue)) {
    return <ChipList items={parsedValue} />;
  }

  if (isPlainJsonObject(parsedValue)) {
    const fields = Object.entries(parsedValue)
      .filter(([, item]) => hasRenderableValue(item))
      .map(([key, item]) => ({
        label: formatLabel(key),
        value: <ValueRenderer value={item} />,
      }));

    if (fields.length === 0) return null;

    return (
      <div className="space-y-2">
        {fields.map((field) => (
          <div
            key={field.label}
            className="rounded-lg border border-gray-800 bg-black/40 p-3"
          >
            <p className="text-[10px] uppercase tracking-[0.12em] text-gray-500 sm:text-[11px] sm:tracking-[0.14em]">
              {field.label}
            </p>

            <div className="mt-1 min-w-0 break-words text-xs leading-6 text-gray-200 sm:text-sm">{field.value}</div>
          </div>
        ))}
      </div>
    );
  }

  return <span>{displayValue(parsedValue)}</span>;
}

function SpecificationView({ value }: { value: unknown }) {
  const parsedValue = parseJsonLike(value);

  if (!hasRenderableValue(parsedValue)) return null;

  const tableData = getTableData(parsedValue);

  if (tableData) {
    return <DataTable value={parsedValue} />;
  }

  if (Array.isArray(parsedValue)) {
    return <ChipList items={parsedValue} />;
  }

  if (!isPlainJsonObject(parsedValue)) {
    return (
      <p className="text-sm leading-7 text-gray-300">
        {displayValue(parsedValue)}
      </p>
    );
  }

  const fields = Object.entries(parsedValue)
    .filter(([, item]) => hasRenderableValue(item))
    .map(([key, item]) => ({
      label: formatLabel(key),
      value: <ValueRenderer value={item} />,
    }));

  if (fields.length === 0) return null;

  return <InfoFieldGrid fields={fields} />;
}

function DataTable({
  value,
  mobileRowLabel = "Row",
}: {
  value: unknown;
  mobileRowLabel?: string;
}) {
  const tableData = getTableData(value);

  if (!tableData) return null;

  const visibleColumns = tableData.columns.filter((column) =>
    tableData.rows.some((row) =>
      hasRenderableValue(getValueByColumn(row, column))
    )
  );

  if (visibleColumns.length === 0) return null;

  return (
    <div className="w-full min-w-0">
      <div className="space-y-3 sm:hidden">
        {tableData.rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="min-w-0 rounded-xl border border-gray-800 bg-gray-950/70 p-3"
          >
            <div className="mb-2 flex items-center justify-between border-b border-gray-800 pb-2">
              <span className="text-[10px] uppercase tracking-[0.14em] text-gray-500">
                {mobileRowLabel}
              </span>
              <span className="text-xs font-semibold text-orange-400">
                #{rowIndex + 1}
              </span>
            </div>

            <div className="space-y-2">
              {visibleColumns.map((column) => {
                const cellValue = getValueByColumn(row, column);

                if (!hasRenderableValue(cellValue)) return null;

                return (
                  <div
                    key={column}
                    className="grid min-w-0 grid-cols-[minmax(76px,0.42fr)_minmax(0,1fr)] gap-2 rounded-lg border border-gray-800/70 bg-black/35 px-2.5 py-2"
                  >
                    <span className="min-w-0 break-words text-[10px] font-semibold uppercase leading-5 tracking-[0.08em] text-gray-500">
                      {formatLabel(column)}
                    </span>
                    <div className="min-w-0 break-words text-right text-xs leading-5 text-gray-200">
                      <ValueRenderer value={cellValue} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-gray-800 sm:block">
        <table className="min-w-full divide-y divide-gray-800 text-xs md:text-sm">
          <thead className="bg-gray-950 text-left text-[10px] uppercase tracking-[0.12em] text-gray-500 md:text-xs md:tracking-[0.14em]">
            <tr>
              {visibleColumns.map((column) => (
                <th key={column} className="px-3 py-2.5 md:px-4 md:py-3">
                  {formatLabel(column)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-800 bg-black text-gray-300">
            {tableData.rows.map((row, index) => (
              <tr key={index}>
                {visibleColumns.map((column) => (
                  <td
                    key={column}
                    className="min-w-[90px] px-3 py-2.5 align-top leading-6 md:px-4 md:py-3"
                  >
                    <ValueRenderer value={getValueByColumn(row, column)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


const SoftLoveIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="h-5 w-5"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
  </svg>
);

const ShoppingTrolleyIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="9" cy="20" r="1.6" />
    <circle cx="18" cy="20" r="1.6" />
    <path d="M2.5 3.5h2.2l2.4 11.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4l1.6-6.2H6.1" />
    <path d="M8.2 8.7h13" />
  </svg>
);

const LightningIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
  </svg>
);

function RatingStars({
  value,
  size = "sm",
}: {
  value: number;
  size?: "sm" | "md";
}) {
  const safeValue = Math.min(Math.max(Number(value) || 0, 0), 5);
  const roundedValue = Math.round(safeValue);

  return (
    <div
      aria-label={`${safeValue.toFixed(1)} out of 5 stars`}
      className={`flex items-center gap-0.5 ${size === "md" ? "text-lg" : "text-sm"
        }`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={index < roundedValue ? "text-orange-400" : "text-gray-700"}
        >
          ★
        </span>
      ))}
    </div>
  );
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

export default function ProductDetailsPage({
  categoryKey,
  productKey,
}: ProductDetailsPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user ?? null;

  const [product, setProduct] = useState<ProductWithReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState("");
  const [activeTab, setActiveTab] = useState<ProductDetailsTab>("description");
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isCartAdded, setIsCartAdded] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState<ReviewImageDraft[]>([]);
  const reviewImagesRef = useRef<ReviewImageDraft[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const badges = useMemo(
    () => (product ? getProductBadges(product) : []),
    [product]
  );

  const discount = useMemo(
    () => (product ? getDiscountPercentage(product) : 0),
    [product]
  );

  const tabs = useMemo(
    () => (product ? getVisibleProductTabs(product) : []),
    [product]
  );

  const canAddToCart = product ? canProductBeAddedToCart(product) : false;

  useEffect(() => {
    const loadProduct = async () => {
      try {
        if (!API_BASE) {
          toast.error("NEXT_PUBLIC_BACKEND_URL is missing");
          setLoading(false);
          return;
        }

        const safeProductKey = encodeURIComponent(productKey);

        const response = await fetch(
          `${API_BASE}/api/v1/products/${safeProductKey}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          toast.error(data.message || "Failed to load product");
          setLoading(false);
          return;
        }

        setProduct(data.product);
        setReviews(Array.isArray(data.product.reviews) ? data.product.reviews : []);
        setSelectedImage(data.product.mainImageUrl || "");
        setActiveTab("description");
      } catch (error) {
        console.error(error);
        toast.error("Error loading product details");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productKey]);

  useEffect(() => {
    if (!product || tabs.length === 0) return;

    const currentTabExists = tabs.some((tab) => tab.id === activeTab);

    if (!currentTabExists) {
      setActiveTab(tabs[0].id);
    }
  }, [activeTab, product, tabs]);

  useEffect(() => {
    if (!product) return;

    const syncWishlistStatus = () => {
      const wishlist = readLocalStorage<StoredWishlistProduct[]>(
        WISHLIST_STORAGE_KEY,
        []
      );

      setIsWishlisted(wishlist.some((item) => item.id === product.id));
    };

    syncWishlistStatus();

    window.addEventListener(
      "digital-xpress-wishlist-updated",
      syncWishlistStatus
    );

    return () => {
      window.removeEventListener(
        "digital-xpress-wishlist-updated",
        syncWishlistStatus
      );
    };
  }, [product]);

  useEffect(() => {
    reviewImagesRef.current = reviewImages;
  }, [reviewImages]);

  useEffect(() => {
    return () => {
      reviewImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  if (loading) {
    return <ProductDetailsPageSkeleton />;
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-5xl rounded-2xl border border-gray-800 bg-black p-10 text-center">
        <h1 className="text-2xl font-bold text-white">Product not found</h1>

        <p className="mt-2 text-gray-400">
          This product may be unpublished or removed.
        </p>

        <Link
          href={categoryKey ? `/products/${slugify(categoryKey)}` : "/products"}
          className="mt-6 inline-flex rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white transition hover:bg-orange-700"
        >
          Back to products
        </Link>
      </div>
    );
  }

  const categoryName = getCategoryName(product, categoryKey);
  const categorySlug = getCategorySlug(product, categoryKey);
  const productSlug = getProductSlug(product, productKey);

  const galleryImages = [
    product.mainImageUrl,
    product.hoverImageUrl || undefined,
    ...(product.extraImages || []).map((image) => image.imageUrl),
  ].filter(isUsableMediaSrc);

  const mainDisplayImage = selectedImage || product.mainImageUrl || "";

  const productInfoFields = compactFields([
    hasRenderableValue(product.productType) && {
      label: "Product Type",
      value: productTypeLabels[product.productType] || product.productType,
    },
    hasRenderableValue(product.stockStatus) && {
      label: "Stock Status",
      value: getStockStatusLabel(product.stockStatus),
    },
    hasRenderableValue(product.category?.name) && {
      label: "Category",
      value: product.category?.name,
    },
    hasRenderableValue(product.subCategory?.name) && {
      label: "Sub-category",
      value: product.subCategory?.name,
    },
    hasRenderableValue(product.brand?.name) && {
      label: "Brand",
      value: product.brand?.name,
    },
    hasRenderableValue(product.modelName) && {
      label: "Model",
      value: displayValue(product.modelName),
    },
  ]);

  const handleAddToCart = () => {
    if (!user) {
      toast.error("Please login to add items to cart", {
        duration: 3000,
        icon: "🔒",
      });
      return;
    }

    if (!canAddToCart) {
      toast.error("This product is currently not available");
      return;
    }

    saveProductToCart(product, { incrementExisting: true });

    setIsCartAdded(true);
    window.setTimeout(() => setIsCartAdded(false), 1200);

    toast.success("Item added to cart!");
  };

  const handleBuyNow = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!canAddToCart) {
      toast.error("This product is currently not available");
      return;
    }

    saveProductToCart(product);
    toast.success("Item ready for checkout");
    router.push("/checkout");
  };

  const handleFavorite = () => {
    if (!user) {
      toast.error("Please login to add items to favorites", {
        duration: 3000,
        icon: "❤️",
      });
      return;
    }

    const currentWishlist = readLocalStorage<StoredWishlistProduct[]>(
      WISHLIST_STORAGE_KEY,
      []
    );

    const already = currentWishlist.some((item) => item.id === product.id);

    const updatedWishlist = already
      ? currentWishlist.filter((item) => item.id !== product.id)
      : [
        ...currentWishlist,
        {
          ...product,
          addedAt: new Date().toISOString(),
        },
      ];

    writeLocalStorage(WISHLIST_STORAGE_KEY, updatedWishlist);
    dispatchWishlistUpdated(updatedWishlist);

    setIsWishlisted(!already);

    toast.success(already ? "Removed from favorites" : "Added to favorites");
  };

  const handleReviewImageAdd = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (reviewImages.length >= MAX_REVIEW_IMAGES) {
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

    setReviewImages((currentImages) => [
      ...currentImages,
      {
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      },
    ]);
  };

  const handleReviewImageRemove = (imageId: string) => {
    setReviewImages((currentImages) => {
      const imageToRemove = currentImages.find((image) => image.id === imageId);

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      return currentImages.filter((image) => image.id !== imageId);
    });
  };

  const handleReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      toast.error("Please login to submit a review", {
        duration: 3000,
        icon: "🔒",
      });
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

      const headers = new Headers();

      const sessionWithToken = session as
        | (typeof session & {
          accessToken?: string;
          user?: { accessToken?: string; token?: string } | null;
        })
        | null;

      const token =
        sessionWithToken?.accessToken ||
        sessionWithToken?.user?.accessToken ||
        sessionWithToken?.user?.token;

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      const formData = new FormData();
      formData.set("rating", String(reviewRating));
      formData.set("comment", cleanComment);
      formData.set("userName", user.name || "Customer");

      reviewImages.forEach((image) => {
        formData.append("images", image.file);
      });

      const response = await fetch(
        `${API_BASE}/api/v1/products/${encodeURIComponent(product.id)}/reviews`,
        {
          method: "POST",
          credentials: "include",
          headers,
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to save review");
        return;
      }

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
          : currentProduct
      );
      setReviewComment("");
      setReviewRating(5);
      setReviewImages((currentImages) => {
        currentImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
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

  const activeTabToRender = tabs.some((tab) => tab.id === activeTab)
    ? activeTab
    : tabs[0]?.id;

  const renderActiveTabContent = () => {
    if (!activeTabToRender) return null;

    if (activeTabToRender === "features") {
      const featureFields = compactFields([
        hasRenderableValue(product.keyFeatures) && {
          label: "Key Features",
          value: <ChipList items={product.keyFeatures} />,
        },
        hasRenderableValue(product.highlights) && {
          label: "Highlights",
          value: <ChipList items={product.highlights} />,
        },
        hasRenderableValue(product.tags) && {
          label: "Tags",
          value: <ChipList items={product.tags} />,
        },
      ]);

      return (
        <Section title="Features & Specifications">
          <div className="space-y-5">
            <InfoFieldGrid fields={featureFields} />

            {hasRenderableValue(product.specifications) && (
              <div>
                <p className="mb-3 text-sm font-semibold text-gray-300">
                  Specifications
                </p>

                <SpecificationView value={product.specifications} />
              </div>
            )}
          </div>
        </Section>
      );
    }

    if (activeTabToRender === "sizeChart") {
      const sizeChartRecord = getSizeChartRecord(product.sizeChart);

      if (!sizeChartRecord) return null;

      const sizeChartImage = isUsableMediaSrc(sizeChartRecord.imageUrl)
        ? String(sizeChartRecord.imageUrl)
        : undefined;

      const sizeChartFields = compactFields([
        hasRenderableValue(sizeChartRecord.name) && {
          label: "Name",
          value: displayValue(sizeChartRecord.name),
        },
        hasRenderableValue(sizeChartRecord.title) && {
          label: "Title",
          value: displayValue(sizeChartRecord.title),
        },
        hasRenderableValue(sizeChartRecord.unit) && {
          label: "Unit",
          value: displayValue(sizeChartRecord.unit),
        },
        hasRenderableValue(sizeChartRecord.note) && {
          label: "Note",
          value: displayValue(sizeChartRecord.note),
        },
      ]);

      const tableSource = getSizeChartTableSource(sizeChartRecord);

      return (
        <Section title="Size Chart">
          <div
            className={`grid min-w-0 items-start gap-4 sm:gap-5 ${sizeChartImage ? "lg:grid-cols-[0.7fr_1.3fr]" : ""
              }`}
          >
            {sizeChartImage && (
              <div className="h-fit">
                <img
                  src={toSafeSrc(sizeChartImage)}
                  alt={String(sizeChartRecord.name || "Size chart")}
                  className="max-h-[260px] w-full rounded-2xl border border-gray-800 bg-gray-950 object-contain p-2 sm:max-h-none sm:p-3"
                />
              </div>
            )}

            <div className="min-w-0 space-y-4">
              <InfoFieldGrid fields={sizeChartFields} />

              {hasRenderableValue(sizeChartRecord.description) && (
                <p className="break-words text-xs leading-6 text-gray-300 sm:text-sm sm:leading-7">
                  {displayValue(sizeChartRecord.description)}
                </p>
              )}

              {hasRenderableValue(tableSource) && (
                <DataTable value={tableSource} mobileRowLabel="Size Row" />
              )}
            </div>
          </div>
        </Section>
      );
    }

    if (activeTabToRender === "reviews") {
      const averageRating = Number(product.averageRating || 0);
      const totalReviews = Math.max(Number(product.totalReviews || 0), reviews.length);
      const reviewPhotoCount = reviews.reduce(
        (total, review) => total + (Array.isArray(review.images) ? review.images.length : 0),
        0
      );
      const ratingBreakdown = [5, 4, 3, 2, 1].map((rating) => {
        const count = reviews.filter((review) => Number(review.rating) === rating).length;
        const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

        return { rating, count, percentage };
      });

      return (
        <Section title="Customer Reviews">
          <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-3xl border border-orange-500/20 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_36%),linear-gradient(145deg,rgba(17,24,39,0.98),rgba(3,7,18,0.98))] p-4 shadow-[0_18px_55px_rgba(0,0,0,0.35)] sm:p-5">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-300/80">
                      Review Snapshot
                    </p>

                    <div className="mt-3 flex items-end gap-2">
                      <span className="text-5xl font-black leading-none text-white sm:text-6xl">
                        {averageRating.toFixed(1)}
                      </span>
                      <span className="pb-1.5 text-sm font-semibold text-gray-400">/ 5</span>
                    </div>

                    <div className="mt-3">
                      <RatingStars value={averageRating} size="md" />
                    </div>

                    <p className="mt-2 text-sm text-gray-400">
                      Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
                    </p>
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
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white sm:text-base">
                      Rating breakdown
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Ratings update automatically after every review.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {ratingBreakdown.map((item) => (
                    <div key={item.rating} className="grid grid-cols-[48px_1fr_42px] items-center gap-3">
                      <div className="flex items-center gap-1 text-xs font-semibold text-gray-300">
                        <span>{item.rating}</span>
                        <span className="text-orange-400">★</span>
                      </div>

                      <div className="h-2.5 overflow-hidden rounded-full bg-gray-900">
                        <div
                          className="h-full rounded-full bg-orange-500 transition-all duration-500"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>

                      <p className="text-right text-xs text-gray-500">{item.count}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <form
              onSubmit={handleReviewSubmit}
              className="rounded-3xl border border-gray-800 bg-gray-950 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.25)] sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-black text-white">Share your experience</h3>
                  <p className="mt-1 max-w-xl text-sm leading-6 text-gray-500">
                    Product quality, size, delivery, packaging, or real-life photos, ja helpful mone hoy likhe dao.
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-sm font-semibold text-gray-200">Your rating</p>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setReviewRating(rating)}
                      disabled={isSubmittingReview}
                      className={`rounded-2xl border px-2 py-3 text-center transition disabled:cursor-not-allowed disabled:opacity-60 ${reviewRating >= rating
                        ? "border-orange-500 bg-orange-500/15 text-orange-300 shadow-[0_0_0_1px_rgba(249,115,22,0.18)]"
                        : "border-gray-800 bg-black text-gray-500 hover:border-gray-700 hover:text-gray-300"
                        }`}
                      aria-label={`${rating} star rating`}
                    >
                      <span className="block text-lg leading-none">★</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="review-comment" className="text-sm font-semibold text-gray-200">
                    Your review
                  </label>
                  <span className="text-xs text-gray-500">
                    {reviewComment.trim().length}/1000
                  </span>
                </div>

                <textarea
                  id="review-comment"
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  rows={5}
                  maxLength={1000}
                  placeholder="Example: fabric quality, fitting, delivery experience, packaging, color accuracy..."
                  className="w-full resize-none rounded-2xl border border-gray-800 bg-black px-4 py-3 text-sm leading-7 text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                />
              </div>

              <div className="mt-5 rounded-3xl border border-dashed border-gray-800 bg-black/55 p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Add product photos</p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      One photo at a time. {reviewImages.length}/{MAX_REVIEW_IMAGES} selected. Each photo max 5MB.
                    </p>
                  </div>

                  <label
                    htmlFor="review-photo-input"
                    className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition ${reviewImages.length >= MAX_REVIEW_IMAGES || isSubmittingReview
                      ? "pointer-events-none border-gray-800 bg-gray-900 text-gray-600"
                      : "border-orange-500/40 bg-orange-500/10 text-orange-300 hover:border-orange-500 hover:bg-orange-500/15"
                      }`}
                  >
                    <span className="text-lg leading-none">＋</span>
                    Add Photo
                    <input
                      id="review-photo-input"
                      type="file"
                      accept="image/*"
                      onChange={handleReviewImageAdd}
                      disabled={reviewImages.length >= MAX_REVIEW_IMAGES || isSubmittingReview}
                      className="hidden"
                    />
                  </label>
                </div>

                {reviewImages.length > 0 ? (
                  <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                    {reviewImages.map((image, index) => (
                      <div
                        key={image.id}
                        className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-gray-800 bg-gray-950 sm:h-28 sm:w-28"
                      >
                        <img
                          src={image.previewUrl}
                          alt={`Selected review photo ${index + 1}`}
                          className="h-full w-full object-cover"
                        />

                        <div className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
                          {index + 1}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleReviewImageRemove(image.id)}
                          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/80 text-sm font-black text-white transition hover:bg-red-600"
                          aria-label="Remove review photo"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-gray-800 bg-gray-950/80 px-4 py-5 text-center">
                    <p className="text-sm font-semibold text-gray-300">No photos selected yet</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Real product photos help other customers decide faster.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-gray-500">
                  Same product e abar submit korle tomar previous review update hobe.
                </p>

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
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-lg font-black text-white">Customer feedback</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Latest reviews with photos and honest product experience.
                </p>
              </div>

              {reviews.length > 0 && (
                <span className="inline-flex w-fit rounded-full border border-gray-800 bg-gray-950 px-3 py-1.5 text-xs font-semibold text-gray-400">
                  {reviews.length} visible {reviews.length === 1 ? "review" : "reviews"}
                </span>
              )}
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-4 grid grid-cols-1 gap-4 lg:grid-cols-3 w-full">
                {reviews.map((review) => {
                  const reviewerName = review.userName || "Customer";
                  const avatarText = reviewerName.trim().charAt(0).toUpperCase() || "C";
                  const reviewDate = formatReviewDate(review.createdAt);

                  return (
                    <article
                      key={review.id}
                      className="rounded-3xl border border-gray-800 bg-gray-950/90 p-4 transition hover:border-gray-700 sm:p-5"
                    >
                      <div className="flex gap-3 sm:gap-4 flex-col">
                        <div className="flex gap-3 sm:gap-4">
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-sm font-black text-orange-300 sm:h-12 sm:w-12">
                            {avatarText}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <h4 className="break-words text-sm font-black text-white sm:text-base">
                                  {reviewerName}
                                </h4>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                  <RatingStars value={review.rating} />
                                  <span className="rounded-full border border-gray-800 bg-black px-2 py-0.5 text-[11px] font-semibold text-gray-400">
                                    {review.rating}/5
                                  </span>
                                </div>
                                {reviewDate && (
                                  <p className="shrink-0 text-xs font-medium text-gray-500">
                                    {reviewDate}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="w-full h-auto">
                          <p className="mt-4 whitespace-pre-line break-words text-sm leading-7 text-gray-300">
                            {review.comment}
                          </p>

                          {Array.isArray(review.images) && review.images.length > 0 && (
                            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                              {review.images.map((image, index) => (
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
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-gray-800 bg-gray-950 px-5 py-10 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-2xl text-orange-300">
                  ★
                </div>
                <h3 className="mt-4 text-lg font-black text-white">No reviews yet</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                  Be the first customer to share rating, feedback, and real product photos.
                </p>
              </div>
            )}
          </div>
        </Section>
      );
    }

    if (activeTabToRender === "warranty") {
      const warrantyFields = compactFields([
        hasRenderableValue(product.warrantyDuration) && {
          label: "Warranty Duration",
          value: displayValue(product.warrantyDuration),
        },
        hasRenderableValue(product.warrantyDetails) && {
          label: "Warranty Details",
          value: displayValue(product.warrantyDetails),
        },
        hasRenderableValue(product.returnPolicy) && {
          label: "Return Policy",
          value: displayValue(product.returnPolicy),
        },
        hasRenderableValue(product.replacementPolicy) && {
          label: "Replacement Policy",
          value: displayValue(product.replacementPolicy),
        },
        hasRenderableValue(product.refundPolicy) && {
          label: "Refund Policy",
          value: displayValue(product.refundPolicy),
        },
        hasRenderableValue(product.deliveryInfo) && {
          label: "Delivery Info",
          value: displayValue(product.deliveryInfo),
        },
        hasRenderableValue(product.deliveryCharge) && {
          label: "Delivery Charge",
          value: formatMoney(product.deliveryCharge),
        },
        hasRenderableValue(product.insideDhakaDeliveryCharge) && {
          label: "Inside Dhaka Charge",
          value: formatMoney(product.insideDhakaDeliveryCharge),
        },
        hasRenderableValue(product.outsideDhakaDeliveryCharge) && {
          label: "Outside Dhaka Charge",
          value: formatMoney(product.outsideDhakaDeliveryCharge),
        },
        hasRenderableValue(product.deliveryTime) && {
          label: "Delivery Time",
          value: displayValue(product.deliveryTime),
        },
        hasRenderableValue(product.cashOnDelivery) && {
          label: "Cash On Delivery",
          value: displayValue(product.cashOnDelivery),
        },
        hasRenderableValue(product.freeDelivery) && {
          label: "Free Delivery",
          value: displayValue(product.freeDelivery),
        },
        hasRenderableValue(product.freeDeliveryMinAmount) && {
          label: "Free Delivery Min Amount",
          value: formatMoney(product.freeDeliveryMinAmount),
        },
        hasRenderableValue(product.packageIncludes) && {
          label: "Package Includes",
          value: <ChipList items={product.packageIncludes} />,
        },
        hasRenderableValue(product.packageWeight) && {
          label: "Package Weight",
          value: displayValue(product.packageWeight),
        },
        hasRenderableValue(product.packageDimensions) && {
          label: "Package Dimensions",
          value: displayValue(product.packageDimensions),
        },
      ]);

      return (
        <Section title="Warranty, Return & Delivery">
          <InfoFieldGrid fields={warrantyFields} />
        </Section>
      );
    }

    return (
      <Section title="Description">
        <p className="whitespace-pre-line text-sm leading-7 text-gray-300">
          {displayValue(product.description)}
        </p>
      </Section>
    );
  };

  return (
    <div className="mx-auto w-full max-w-full space-y-5 overflow-x-hidden px-3 sm:max-w-7xl sm:px-4">
      <nav className="rounded-2xl border border-gray-800 bg-black px-4 py-3 text-sm text-gray-400">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Link href="/" className="transition hover:text-orange-400">
            Home
          </Link>

          <span className="text-gray-700">/</span>

          <Link href="/products" className="transition hover:text-orange-400">
            Products
          </Link>

          <span className="text-gray-700">/</span>

          <Link
            href={`/products/${encodeURIComponent(categorySlug)}`}
            className="transition hover:text-orange-400"
          >
            {categoryName}
          </Link>

          <span className="text-gray-700">/</span>

          <Link
            href={`/products/${encodeURIComponent(categorySlug)}/${encodeURIComponent(
              productSlug
            )}`}
            className="line-clamp-1 min-w-0 max-w-[180px] break-all text-orange-400 sm:max-w-md sm:break-normal"
          >
            {product.name}
          </Link>
        </div>
      </nav>

      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="min-w-0 h-fit rounded-2xl border border-gray-800 bg-black p-3 sm:p-4">
          <div className="relative grid aspect-square place-items-center overflow-hidden rounded-2xl bg-gray-950">
            {isUsableMediaSrc(mainDisplayImage) ? (
              <img
                src={toSafeSrc(mainDisplayImage)}
                alt={product.mainImageAlt || product.name}
                className="h-full w-full object-contain p-4"
              />
            ) : (
              <div className="px-4 text-center text-sm text-gray-500">
                Product image not available
              </div>
            )}

            <button
              type="button"
              onClick={handleFavorite}
              aria-label={
                isWishlisted ? "Remove from favorites" : "Add to favorites"
              }
              aria-pressed={isWishlisted}
              className={`absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border text-lg shadow-lg backdrop-blur-md transition duration-300 ${isWishlisted
                ? "border-orange-400/70 bg-orange-500 text-white"
                : "border-white/10 bg-black/65 text-white hover:border-orange-400/70 hover:bg-orange-500 hover:text-white"
                }`}
            >
              <SoftLoveIcon filled={isWishlisted} />
            </button>
          </div>

          {galleryImages.length > 1 && (
            <div className="mt-4 min-w-0">
              <div className="flex max-w-full cursor-grab snap-x snap-mandatory gap-2 overflow-x-auto pb-2 active:cursor-grabbing">
                {galleryImages.map((imageUrl, index) => (
                  <button
                    type="button"
                    key={`${imageUrl}-${index}`}
                    onClick={() => setSelectedImage(imageUrl)}
                    className={`aspect-square shrink-0 basis-[4.25rem] snap-start overflow-hidden rounded-xl border bg-gray-950 transition hover:border-orange-500 sm:basis-[calc((100%_-_2rem)/5)] ${mainDisplayImage === imageUrl
                      ? "border-orange-500"
                      : "border-gray-800"
                      }`}
                  >
                    <img
                      src={imageUrl}
                      alt={`${product.name} image ${index + 1}`}
                      className="h-full w-full object-contain p-2"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {isUsableMediaSrc(product.videoUrl) && (
            <video
              src={toSafeSrc(product.videoUrl)}
              controls
              muted
              className="mt-4 w-full rounded-2xl border border-gray-800 bg-black"
            />
          )}
        </div>

        <div className="min-w-0 h-fit rounded-2xl border border-gray-800 bg-black p-4 sm:p-5 lg:mt-6">
          {(badges.length > 0 || discount > 0) && (
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400"
                >
                  {badge}
                </span>
              ))}

              {discount > 0 && (
                <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                  {discount}% Off
                </span>
              )}
            </div>
          )}

          <h1 className="mt-4 break-words text-2xl font-bold leading-tight text-white sm:text-3xl">{product.name}</h1>

          {hasRenderableValue(product.shortDescription) && (
            <p className="mt-3 text-gray-400">
              {displayValue(product.shortDescription)}
            </p>
          )}

          <div className="mt-5 flex min-w-0 flex-wrap items-end gap-3">
            <span className="break-words text-2xl font-extrabold text-orange-400 sm:text-3xl">
              {formatPrice(product.sellingPrice)}
            </span>

            {product.mrp > product.sellingPrice && (
              <span className="text-lg text-gray-500 line-through">
                {formatPrice(product.mrp)}
              </span>
            )}
          </div>

          {Number(product.totalReviews || 0) > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-400">
              <RatingStars value={Number(product.averageRating || 0)} />
              <span>
                {Number(product.averageRating || 0).toFixed(1)} ({Number(product.totalReviews || 0)} reviews)
              </span>
            </div>
          )}

          {productInfoFields.length > 0 && (
            <div className="mt-5">
              <InfoFieldGrid fields={productInfoFields} />
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-600 px-3 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400 sm:gap-2 sm:px-5 sm:text-base"
            >
              <ShoppingTrolleyIcon />
              {isCartAdded ? "Added" : canAddToCart ? "Add to Cart" : "Not Available"}
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!canAddToCart}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-orange-500 bg-orange-500/10 px-3 py-3 text-sm font-semibold text-orange-300 transition hover:bg-orange-500 hover:text-white disabled:cursor-not-allowed disabled:border-gray-700 disabled:bg-gray-900 disabled:text-gray-500 sm:gap-2 sm:px-5 sm:text-base"
            >
              <LightningIcon />
              Buy Now
            </button>
          </div>
        </div>
      </div>

      {tabs.length > 0 && (
        <>
          <div className="max-w-full overflow-hidden rounded-2xl border border-gray-800 bg-black p-2">
            <div className="flex min-w-0 gap-2 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-xs font-semibold transition sm:px-4 sm:py-3 sm:text-sm ${activeTabToRender === tab.id
                    ? "bg-orange-600 text-white"
                    : "text-gray-400 hover:bg-gray-950 hover:text-orange-400"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {renderActiveTabContent()}
        </>
      )}

      {showLoginModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[80] grid place-items-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-gray-800 bg-black p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-orange-500/10 text-orange-400">
              <SoftLoveIcon filled />
            </div>

            <h2 className="mt-4 text-center text-2xl font-bold text-white">
              Login Required
            </h2>

            <p className="mt-2 text-center text-sm leading-6 text-gray-400">
              Buy Now use korte hole age login korte hobe. Login korar por
              checkout page e giye order complete korte parbe.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="rounded-xl border border-gray-800 px-5 py-3 font-semibold text-gray-300 transition hover:border-gray-700 hover:bg-gray-950"
              >
                Cancel
              </button>

              <Link
                href={`/login?callbackUrl=${encodeURIComponent("/checkout")}`}
                className="rounded-xl bg-orange-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-orange-700"
              >
                Login Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}