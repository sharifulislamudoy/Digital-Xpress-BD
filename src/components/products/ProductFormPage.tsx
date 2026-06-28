// src/components/products/ProductFormPage.tsx

"use client";

import {
  ChangeEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import type {
  Product,
  ProductBrand,
  ProductCategory,
  ProductType,
  StockStatus,
} from "@/types/product";
import { formatPrice } from "@/lib/formatPrice";

interface ProductFormPageProps {
  mode: "create" | "edit";
  panelType: "admin" | "moderator";
  productId?: string;
}

type RelationMode = "existing" | "new";

type ProductFormState = {
  name: string;
  slug: string;
  productType: ProductType;

  sku: string;
  productCode: string;
  barcode: string;
  modelName: string;

  shortDescription: string;
  description: string;

  keyFeatures: string;
  highlights: string;
  specifications: string;
  tags: string;
  searchKeywords: string;

  mrp: string;
  costPrice: string;
  sellingPrice: string;

  stock: string;
  stockStatus: StockStatus;
  lowStockAlertQuantity: string;
  soldQuantity: string;
  reservedQuantity: string;

  inStock: boolean;
  isPublished: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isTrending: boolean;
  isRecommended: boolean;
  isFlashSale: boolean;

  mainImageAlt: string;
  hoverImageAlt: string;
  extraImagesAlt: string;

  warrantyDuration: string;
  warrantyDetails: string;
  returnPolicy: string;
  replacementPolicy: string;
  refundPolicy: string;

  deliveryInfo: string;
  deliveryCharge: string;
  insideDhakaDeliveryCharge: string;
  outsideDhakaDeliveryCharge: string;
  deliveryTime: string;
  cashOnDelivery: boolean;
  freeDelivery: boolean;
  freeDeliveryMinAmount: string;

  packageIncludes: string;
  packageWeight: string;
  packageDimensions: string;

  supplierName: string;
  supplierPhone: string;
  supplierEmail: string;
  supplierAddress: string;
  supplierInvoiceNumber: string;
  internalNote: string;

  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  focusKeyword: string;
  canonicalUrl: string;

  ogTitle: string;
  ogDescription: string;
  ogImage: string;

  metaRobots: string;
  schemaJson: string;

  viewCount: string;
  wishlistCount: string;
  cartCount: string;
  orderCount: string;
  averageRating: string;
  totalReviews: string;

  publishedAt: string;

  sizeChartName: string;
  sizeChartTitle: string;
  sizeChartDescription: string;
  sizeChartUnit: string;
  sizeChartData: string;
  sizeChartNote: string;
  sizeChartIsActive: boolean;
  sizeChartSortOrder: string;
  removeSizeChart: boolean;
  removeSizeChartImage: boolean;
  removeHoverImage: boolean;
  removeVideo: boolean;
};

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

const inputClass =
  "w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-orange-500";
const textareaClass = `${inputClass} min-h-[110px] resize-y`;
const labelClass = "mb-2 block text-sm font-medium text-gray-300";

const productTypeOptions: { value: ProductType; label: string }[] = [
  { value: "single", label: "Single Product" },
  { value: "combo", label: "Combo Product" },
];

const stockStatusOptions: { value: StockStatus; label: string }[] = [
  { value: "IN_STOCK", label: "In stock" },
  { value: "LIMITED_STOCK", label: "Limited stock" },
  { value: "LOW_STOCK", label: "Low stock" },
  { value: "OUT_OF_STOCK", label: "Out of stock" },
  { value: "PRE_ORDER", label: "Pre-order" },
  { value: "COMING_SOON", label: "Coming soon" },
];

const defaultForm: ProductFormState = {
  name: "",
  slug: "",
  productType: "single",

  sku: "",
  productCode: "",
  barcode: "",
  modelName: "",

  shortDescription: "",
  description: "",

  keyFeatures: "",
  highlights: "",
  specifications: "",
  tags: "",
  searchKeywords: "",

  mrp: "",
  costPrice: "",
  sellingPrice: "",

  stock: "0",
  stockStatus: "IN_STOCK",
  lowStockAlertQuantity: "5",
  soldQuantity: "0",
  reservedQuantity: "0",

  inStock: true,
  isPublished: true,
  isFeatured: false,
  isNewArrival: false,
  isBestSeller: false,
  isTrending: false,
  isRecommended: false,
  isFlashSale: false,

  mainImageAlt: "",
  hoverImageAlt: "",
  extraImagesAlt: "",

  warrantyDuration: "",
  warrantyDetails: "",
  returnPolicy: "",
  replacementPolicy: "",
  refundPolicy: "",

  deliveryInfo: "",
  deliveryCharge: "",
  insideDhakaDeliveryCharge: "",
  outsideDhakaDeliveryCharge: "",
  deliveryTime: "",
  cashOnDelivery: true,
  freeDelivery: false,
  freeDeliveryMinAmount: "",

  packageIncludes: "",
  packageWeight: "",
  packageDimensions: "",

  supplierName: "",
  supplierPhone: "",
  supplierEmail: "",
  supplierAddress: "",
  supplierInvoiceNumber: "",
  internalNote: "",

  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  focusKeyword: "",
  canonicalUrl: "",

  ogTitle: "",
  ogDescription: "",
  ogImage: "",

  metaRobots: "index,follow",
  schemaJson: "",

  viewCount: "0",
  wishlistCount: "0",
  cartCount: "0",
  orderCount: "0",
  averageRating: "0",
  totalReviews: "0",

  publishedAt: "",

  sizeChartName: "",
  sizeChartTitle: "",
  sizeChartDescription: "",
  sizeChartUnit: "inch",
  sizeChartData: "",
  sizeChartNote: "",
  sizeChartIsActive: true,
  sizeChartSortOrder: "0",
  removeSizeChart: false,
  removeSizeChartImage: false,
  removeHoverImage: false,
  removeVideo: false,
};

const stringFields: Array<keyof ProductFormState> = [
  "name",
  "slug",
  "productType",
  "sku",
  "productCode",
  "barcode",
  "modelName",
  "shortDescription",
  "description",
  "keyFeatures",
  "highlights",
  "specifications",
  "tags",
  "searchKeywords",
  "mrp",
  "costPrice",
  "sellingPrice",
  "stock",
  "stockStatus",
  "lowStockAlertQuantity",
  "soldQuantity",
  "reservedQuantity",
  "mainImageAlt",
  "hoverImageAlt",
  "extraImagesAlt",
  "warrantyDuration",
  "warrantyDetails",
  "returnPolicy",
  "replacementPolicy",
  "refundPolicy",
  "deliveryInfo",
  "deliveryCharge",
  "insideDhakaDeliveryCharge",
  "outsideDhakaDeliveryCharge",
  "deliveryTime",
  "freeDeliveryMinAmount",
  "packageIncludes",
  "packageWeight",
  "packageDimensions",
  "supplierName",
  "supplierPhone",
  "supplierEmail",
  "supplierAddress",
  "supplierInvoiceNumber",
  "internalNote",
  "seoTitle",
  "seoDescription",
  "seoKeywords",
  "focusKeyword",
  "canonicalUrl",
  "ogTitle",
  "ogDescription",
  "ogImage",
  "metaRobots",
  "schemaJson",
  "viewCount",
  "wishlistCount",
  "cartCount",
  "orderCount",
  "averageRating",
  "totalReviews",
  "publishedAt",
  "sizeChartName",
  "sizeChartTitle",
  "sizeChartDescription",
  "sizeChartUnit",
  "sizeChartData",
  "sizeChartNote",
  "sizeChartSortOrder",
];

const booleanFields: Array<keyof ProductFormState> = [
  "inStock",
  "isPublished",
  "isFeatured",
  "isNewArrival",
  "isBestSeller",
  "isTrending",
  "isRecommended",
  "isFlashSale",
  "cashOnDelivery",
  "freeDelivery",
  "sizeChartIsActive",
  "removeSizeChart",
  "removeSizeChartImage",
  "removeHoverImage",
  "removeVideo",
];

function numberText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function listText(value?: string[]) {
  return Array.isArray(value) ? value.join(", ") : "";
}

function jsonText(value: unknown) {
  if (value === null || value === undefined) return "";

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

function datetimeLocal(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);

  return local.toISOString().slice(0, 16);
}

function formFromProduct(product: Product): ProductFormState {
  return {
    ...defaultForm,
    name: product.name || "",
    slug: product.slug || "",
    productType: product.productType || "single",

    sku: product.sku || "",
    productCode: product.productCode || "",
    barcode: product.barcode || "",
    modelName: product.modelName || "",

    shortDescription: product.shortDescription || "",
    description: product.description || "",

    keyFeatures: listText(product.keyFeatures),
    highlights: listText(product.highlights),
    specifications: jsonText(product.specifications),
    tags: listText(product.tags),
    searchKeywords: listText(product.searchKeywords),

    mrp: numberText(product.mrp),
    costPrice: numberText(product.costPrice),
    sellingPrice: numberText(product.sellingPrice),

    stock: numberText(product.stock ?? 0),
    stockStatus: product.stockStatus || "IN_STOCK",
    lowStockAlertQuantity: numberText(product.lowStockAlertQuantity ?? 5),
    soldQuantity: numberText(product.soldQuantity ?? 0),
    reservedQuantity: numberText(product.reservedQuantity ?? 0),

    inStock: product.inStock ?? true,
    isPublished: product.isPublished ?? true,
    isFeatured: product.isFeatured ?? false,
    isNewArrival: product.isNewArrival ?? false,
    isBestSeller: product.isBestSeller ?? false,
    isTrending: product.isTrending ?? false,
    isRecommended: product.isRecommended ?? false,
    isFlashSale: product.isFlashSale ?? false,

    mainImageAlt: product.mainImageAlt || "",
    hoverImageAlt: product.hoverImageAlt || "",
    extraImagesAlt: product.name || "",

    warrantyDuration: product.warrantyDuration || "",
    warrantyDetails: product.warrantyDetails || "",
    returnPolicy: product.returnPolicy || "",
    replacementPolicy: product.replacementPolicy || "",
    refundPolicy: product.refundPolicy || "",

    deliveryInfo: product.deliveryInfo || "",
    deliveryCharge: numberText(product.deliveryCharge),
    insideDhakaDeliveryCharge: numberText(product.insideDhakaDeliveryCharge),
    outsideDhakaDeliveryCharge: numberText(product.outsideDhakaDeliveryCharge),
    deliveryTime: product.deliveryTime || "",
    cashOnDelivery: product.cashOnDelivery ?? true,
    freeDelivery: product.freeDelivery ?? false,
    freeDeliveryMinAmount: numberText(product.freeDeliveryMinAmount),

    packageIncludes: listText(product.packageIncludes),
    packageWeight: product.packageWeight || "",
    packageDimensions: product.packageDimensions || "",

    supplierName: product.supplierName || "",
    supplierPhone: product.supplierPhone || "",
    supplierEmail: product.supplierEmail || "",
    supplierAddress: product.supplierAddress || "",
    supplierInvoiceNumber: product.supplierInvoiceNumber || "",
    internalNote: product.internalNote || "",

    seoTitle: product.seoTitle || "",
    seoDescription: product.seoDescription || "",
    seoKeywords: listText(product.seoKeywords),
    focusKeyword: product.focusKeyword || "",
    canonicalUrl: product.canonicalUrl || "",

    ogTitle: product.ogTitle || "",
    ogDescription: product.ogDescription || "",
    ogImage: product.ogImage || "",

    metaRobots: product.metaRobots || "index,follow",
    schemaJson: jsonText(product.schemaJson),

    viewCount: numberText(product.viewCount ?? 0),
    wishlistCount: numberText(product.wishlistCount ?? 0),
    cartCount: numberText(product.cartCount ?? 0),
    orderCount: numberText(product.orderCount ?? 0),
    averageRating: numberText(product.averageRating ?? 0),
    totalReviews: numberText(product.totalReviews ?? 0),

    publishedAt: datetimeLocal(product.publishedAt),

    sizeChartName: product.sizeChart?.name || "",
    sizeChartTitle: product.sizeChart?.title || "",
    sizeChartDescription: product.sizeChart?.description || "",
    sizeChartUnit: product.sizeChart?.unit || "inch",
    sizeChartData: jsonText(product.sizeChart?.chartData),
    sizeChartNote: product.sizeChart?.note || "",
    sizeChartIsActive: product.sizeChart?.isActive ?? true,
    sizeChartSortOrder: numberText(product.sizeChart?.sortOrder ?? 0),
    removeSizeChart: false,
    removeSizeChartImage: false,
    removeHoverImage: false,
    removeVideo: false,
  };
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-800 bg-black p-4">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-orange-400">{title}</h3>
        {note && <p className="mt-1 text-xs text-gray-500">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  readOnly,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required ? " *" : ""}
      </label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`${inputClass} ${readOnly ? "cursor-not-allowed bg-gray-950 text-gray-500" : ""}`}
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  required,
  mono,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required ? " *" : ""}
      </label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`${textareaClass} ${mono ? "font-mono text-xs" : ""}`}
      />
    </div>
  );
}

function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className={inputClass}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SwitchField({
  label,
  checked,
  onChange,
  note,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  note?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-xl border border-gray-800 bg-gray-950 px-4 py-3 text-left transition hover:border-orange-500/70"
    >
      <span>
        <span className="block text-sm font-medium text-gray-200">{label}</span>
        {note && (
          <span className="mt-1 block text-xs text-gray-500">{note}</span>
        )}
      </span>
      <span
        className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-orange-500" : "bg-gray-700"}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${checked ? "left-6" : "left-1"}`}
        />
      </span>
    </button>
  );
}

export default function ProductFormPage({
  mode,
  panelType,
  productId,
}: ProductFormPageProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const accessToken = (session?.user as any)?.accessToken;

  const isEdit = mode === "edit";
  const listHref =
    panelType === "admin" ? "/admin/products" : "/moderator/products";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [brands, setBrands] = useState<ProductBrand[]>([]);
  const [initialProduct, setInitialProduct] = useState<Product | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");

  const [brandMode, setBrandMode] = useState<RelationMode>("existing");
  const [brandId, setBrandId] = useState("");
  const [brandName, setBrandName] = useState("");

  const [form, setForm] = useState<ProductFormState>(defaultForm);

  const [mainImage, setMainImage] = useState<File | null>(null);
  const [hoverImage, setHoverImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [sizeChartImage, setSizeChartImage] = useState<File | null>(null);
  const [extraImages, setExtraImages] = useState<File[]>([]);
  const extraImagesInputRef = useRef<HTMLInputElement | null>(null);

  const [mainPreview, setMainPreview] = useState("");
  const [hoverPreview, setHoverPreview] = useState("");
  const [videoPreview, setVideoPreview] = useState("");
  const [sizeChartPreview, setSizeChartPreview] = useState("");
  const [removedExtraImageIds, setRemovedExtraImageIds] = useState<string[]>(
    [],
  );

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${accessToken}`,
    }),
    [accessToken],
  );

  const selectedCategory = useMemo(() => {
    return categories.find((category) => category.id === categoryId) || null;
  }, [categories, categoryId]);

  const subCategories = useMemo(() => {
    return selectedCategory?.subCategories || [];
  }, [selectedCategory]);

  const sellingPricePreview = useMemo(
    () => Number(form.sellingPrice) || 0,
    [form.sellingPrice],
  );

  const setField = <K extends keyof ProductFormState>(
    field: K,
    value: ProductFormState[K],
  ) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [router, status]);

  useEffect(() => {
    if (status === "loading") return;

    const load = async () => {
      try {
        if (!API_BASE) {
          toast.error("NEXT_PUBLIC_BACKEND_URL is missing");
          setLoading(false);
          return;
        }

        setLoading(true);

        const metaResponse = await fetch(
          `${API_BASE}/api/v1/products/meta?scope=admin`,
          {
            cache: "no-store",
          },
        );
        const metaData = await metaResponse.json();

        if (!metaResponse.ok || !metaData.success) {
          toast.error(metaData.message || "Failed to load product meta");
          setLoading(false);
          return;
        }

        const loadedCategories: ProductCategory[] = metaData.categories || [];
        const loadedBrands: ProductBrand[] = metaData.brands || [];

        setCategories(loadedCategories);
        setBrands(loadedBrands);

        if (loadedCategories.length > 0) {
          setCategoryId(loadedCategories[0].id);
        } else {
          setCategoryId("");
        }

        if (loadedBrands.length > 0) {
          setBrandMode("existing");
          setBrandId(loadedBrands[0].id);
        } else {
          setBrandMode("new");
        }

        if (isEdit) {
          if (!productId) {
            toast.error("Product ID is missing");
            router.push(listHref);
            return;
          }

          if (!accessToken) {
            setLoading(false);
            return;
          }

          const productResponse = await fetch(
            `${API_BASE}/api/v1/products/admin/${productId}`,
            {
              headers: authHeaders,
              cache: "no-store",
            },
          );
          const productData = await productResponse.json();

          if (!productResponse.ok || !productData.success) {
            toast.error(productData.message || "Failed to load product");
            router.push(listHref);
            return;
          }

          const product: Product = productData.product;

          setInitialProduct(product);
          setForm(formFromProduct(product));
          setCategoryId(
            product.category?.id ||
              product.categoryId ||
              loadedCategories[0]?.id ||
              "",
          );
          setSubCategoryId(
            product.subCategory?.id || product.subCategoryId || "",
          );
          setBrandMode("existing");
          setBrandId(
            product.brand?.id || product.brandId || loadedBrands[0]?.id || "",
          );

          setMainPreview(product.mainImageUrl || "");
          setHoverPreview(product.hoverImageUrl || "");
          setVideoPreview(product.videoUrl || "");
          setSizeChartPreview(product.sizeChart?.imageUrl || "");
        }
      } catch (error) {
        console.error(error);
        toast.error("Error loading product form");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [accessToken, authHeaders, isEdit, listHref, productId, router, status]);

  useEffect(() => {
    if (
      subCategoryId &&
      !subCategories.some((item) => item.id === subCategoryId)
    ) {
      setSubCategoryId("");
    }
  }, [subCategories, subCategoryId]);

  function updateFilePreview(
    event: ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void,
    previewSetter: (url: string) => void,
    fallback = "",
  ) {
    const file = event.target.files?.[0] || null;
    setter(file);
    previewSetter(file ? URL.createObjectURL(file) : fallback);
  }

  function getFileKey(file: File) {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  function handleExtraImagesChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.currentTarget.files || []);

    if (selectedFiles.length === 0) {
      event.currentTarget.value = "";
      return;
    }

    const imageFiles = selectedFiles.filter((file) =>
      file.type.startsWith("image/"),
    );

    if (imageFiles.length === 0) {
      toast.error("Please select image files only");
      event.currentTarget.value = "";
      return;
    }

    setExtraImages((previous) => {
      const previousKeys = new Set(previous.map(getFileKey));
      const uniqueNewFiles = imageFiles.filter(
        (file) => !previousKeys.has(getFileKey(file)),
      );

      if (uniqueNewFiles.length === 0) {
        toast.error("Selected image already added");
        return previous;
      }

      toast.success(
        `${uniqueNewFiles.length} extra image${uniqueNewFiles.length > 1 ? "s" : ""} added`,
      );
      return [...previous, ...uniqueNewFiles];
    });

    event.currentTarget.value = "";
  }

  function removeNewExtraImage(index: number) {
    setExtraImages((previous) =>
      previous.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  function toggleRemoveExistingExtraImage(id: string) {
    setRemovedExtraImageIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  }

  function validateForm() {
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return false;
    }

    if (!form.description.trim()) {
      toast.error("Description is required");
      return false;
    }

    if (!categoryId) {
      toast.error(
        "Select a category. Create category from Product Management first.",
      );
      return false;
    }

    if (brandMode === "existing" && !brandId) {
      toast.error("Select a brand");
      return false;
    }

    if (brandMode === "new" && !brandName.trim()) {
      toast.error("Type new brand name");
      return false;
    }

    if (!form.mrp.trim()) {
      toast.error("MRP is required");
      return false;
    }

    if (!form.sellingPrice.trim()) {
      toast.error("Selling price is required");
      return false;
    }

    if (!isEdit && !mainImage) {
      toast.error("Main image is required");
      return false;
    }

    return true;
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    if (!accessToken) {
      toast.error("Please login again");
      return;
    }

    try {
      if (!API_BASE) {
        toast.error("NEXT_PUBLIC_BACKEND_URL is missing");
        return;
      }

      setSubmitting(true);

      const formData = new FormData();

      for (const key of stringFields) {
        formData.append(key, String(form[key] ?? ""));
      }

      for (const key of booleanFields) {
        formData.append(key, String(Boolean(form[key])));
      }

      formData.append("categoryId", categoryId);

      if (subCategoryId) {
        formData.append("subCategoryId", subCategoryId);
      }

      if (brandMode === "existing") {
        formData.append("brandId", brandId);
      } else {
        formData.append("brandName", brandName.trim());
      }

      formData.append(
        "removeExtraImageIds",
        JSON.stringify(removedExtraImageIds),
      );

      if (mainImage) formData.append("mainImage", mainImage);
      if (hoverImage) formData.append("hoverImage", hoverImage);
      if (video) formData.append("video", video);
      if (sizeChartImage) formData.append("sizeChartImage", sizeChartImage);

      extraImages.forEach((image) => {
        formData.append("extraImages", image, image.name);
      });

      formData.append("extraImagesCount", String(extraImages.length));

      const endpoint =
        isEdit && productId
          ? `${API_BASE}/api/v1/products/${productId}`
          : `${API_BASE}/api/v1/products`;

      const response = await fetch(endpoint, {
        method: isEdit ? "PATCH" : "POST",
        headers: authHeaders,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to save product");
        return;
      }

      toast.success(
        isEdit
          ? "Product updated successfully"
          : "Product created successfully",
      );
      router.push(listHref);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Error saving product");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || status === "loading") {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-gray-400">Loading product form...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isEdit ? "Edit Product" : "Create Product"}{" "}
            {panelType === "moderator" ? "(Moderator)" : ""}
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Clean product form with every schema field grouped into maintainable
            sections.
          </p>
        </div>

        <Link
          href={listHref}
          className="rounded-xl border border-gray-700 px-4 py-2 text-sm text-gray-200 transition hover:border-orange-500 hover:text-orange-400"
        >
          Back to Products
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-950 shadow-2xl">
        <div className="border-b border-gray-800 bg-gray-950/95 p-5">
          <h2 className="text-xl font-bold text-white">
            {isEdit ? "Update Product Details" : "New Product Details"}
          </h2>
          <p className="text-sm text-gray-500">
            SKU is auto generated if empty. Slug is auto generated from name if
            empty.
          </p>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <Section title="Basic Information">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Product Name"
                  required
                  value={form.name}
                  onChange={(value) => setField("name", value)}
                  placeholder="iPhone 15 Pro Max"
                />
                <SelectField
                  label="Product Type"
                  value={form.productType}
                  onChange={(value) => setField("productType", value)}
                  options={productTypeOptions}
                />
                <TextField
                  label="Slug"
                  value={form.slug}
                  onChange={(value) => setField("slug", value)}
                  placeholder="Auto generated if empty"
                />
                <TextField
                  label="SKU"
                  value={form.sku}
                  onChange={(value) => setField("sku", value)}
                  placeholder="Auto generated 0001 if empty"
                />
                <TextField
                  label="Product Code"
                  value={form.productCode}
                  onChange={(value) => setField("productCode", value)}
                  placeholder="Internal product code"
                />
                <TextField
                  label="Barcode"
                  value={form.barcode}
                  onChange={(value) => setField("barcode", value)}
                  placeholder="UPC/EAN barcode"
                />
                <TextField
                  label="Model Name"
                  value={form.modelName}
                  onChange={(value) => setField("modelName", value)}
                  placeholder="A3108 / SM-S928B"
                />
              </div>
            </Section>

            <Section
              title="Category, Sub-category & Brand"
              note="Category/sub-category create হবে Product Management page এর modal থেকে. এখানে শুধু select করা যাবে."
            >
              <div className="space-y-6">
                <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        Category *
                      </h4>
                      <p className="mt-1 text-xs text-gray-500">
                        নতুন category দরকার হলে Product Management page থেকে
                        Create Category & Sub-category button ব্যবহার করো.
                      </p>
                    </div>
                    <Link
                      href={listHref}
                      className="shrink-0 rounded-lg border border-orange-500/40 px-3 py-2 text-xs font-semibold text-orange-300 transition hover:bg-orange-500/10"
                    >
                      Manage Category
                    </Link>
                  </div>

                  {categories.length === 0 ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                      No category found. আগে Product Management থেকে category
                      create করো, তারপর product create/update করো.
                    </div>
                  ) : (
                    <select
                      value={categoryId}
                      onChange={(event) => {
                        setCategoryId(event.target.value);
                        setSubCategoryId("");
                      }}
                      className={inputClass}
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  )}

                  {selectedCategory && (
                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-gray-800 bg-black p-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
                        {selectedCategory.imageUrl ? (
                          <img
                            src={selectedCategory.imageUrl}
                            alt={selectedCategory.name}
                            className="h-full w-full object-contain p-1"
                          />
                        ) : selectedCategory.iconSvg ? (
                          <span
                            className="text-orange-400 [&_svg]:h-6 [&_svg]:w-6"
                            dangerouslySetInnerHTML={{
                              __html: selectedCategory.iconSvg,
                            }}
                          />
                        ) : (
                          <span className="text-[10px] text-gray-600">
                            No icon
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {selectedCategory.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          /{selectedCategory.slug}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-white">
                      Sub-category
                    </h4>
                    <p className="mt-1 text-xs text-gray-500">
                      Optional. Selected category অনুযায়ী sub-category list
                      দেখাবে.
                    </p>
                  </div>

                  <select
                    value={subCategoryId}
                    onChange={(event) => setSubCategoryId(event.target.value)}
                    disabled={!categoryId || subCategories.length === 0}
                    className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <option value="">No sub-category</option>
                    {subCategories.map((subCategory) => (
                      <option key={subCategory.id} value={subCategory.id}>
                        {subCategory.name}
                      </option>
                    ))}
                  </select>

                  {categoryId && subCategories.length === 0 && (
                    <p className="mt-2 text-xs text-gray-500">
                      এই category এর under এ এখনো কোনো sub-category নেই.
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <label className="block text-sm font-semibold text-white">
                      Brand *
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setBrandMode((previous) =>
                          previous === "existing" ? "new" : "existing",
                        )
                      }
                      className="text-xs font-semibold text-orange-400 hover:text-orange-300"
                    >
                      {brandMode === "existing" ? "Add new" : "Use existing"}
                    </button>
                  </div>

                  {brandMode === "existing" ? (
                    <select
                      value={brandId}
                      onChange={(event) => setBrandId(event.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select brand</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={brandName}
                      onChange={(event) => setBrandName(event.target.value)}
                      className={inputClass}
                      placeholder="New brand name"
                    />
                  )}
                </div>
              </div>
            </Section>

            <Section title="Description & Search Content">
              <div className="space-y-4">
                <TextAreaField
                  label="Short Description"
                  value={form.shortDescription}
                  onChange={(value) => setField("shortDescription", value)}
                  rows={2}
                  placeholder="Small summary for cards and details page"
                />
                <TextAreaField
                  label="Full Description"
                  required
                  value={form.description}
                  onChange={(value) => setField("description", value)}
                  rows={6}
                  placeholder="Write full product description"
                />
                <TextField
                  label="Key Features"
                  value={form.keyFeatures}
                  onChange={(value) => setField("keyFeatures", value)}
                  placeholder="Comma separated: 5G, OLED, 48MP camera"
                />
                <TextField
                  label="Highlights"
                  value={form.highlights}
                  onChange={(value) => setField("highlights", value)}
                  placeholder="Comma separated: Fast charging, Warranty"
                />
                <TextAreaField
                  label="Specifications JSON"
                  value={form.specifications}
                  onChange={(value) => setField("specifications", value)}
                  mono
                  placeholder='{"Display":"6.7 inch","RAM":"8GB"}'
                />
                <TextField
                  label="Tags"
                  value={form.tags}
                  onChange={(value) => setField("tags", value)}
                  placeholder="Comma separated: mobile, apple, smartphone"
                />
                <TextField
                  label="Search Keywords"
                  value={form.searchKeywords}
                  onChange={(value) => setField("searchKeywords", value)}
                  placeholder="Comma separated: buy iphone, best phone"
                />
              </div>
            </Section>

            <Section title="Pricing">
              <div className="grid gap-4 sm:grid-cols-3">
                <TextField
                  label="MRP"
                  required
                  type="number"
                  value={form.mrp}
                  onChange={(value) => setField("mrp", value)}
                />
                <TextField
                  label="Cost Price"
                  type="number"
                  value={form.costPrice}
                  onChange={(value) => setField("costPrice", value)}
                  placeholder="Internal cost only"
                />
                <TextField
                  label="Selling Price"
                  required
                  type="number"
                  value={form.sellingPrice}
                  onChange={(value) => setField("sellingPrice", value)}
                  placeholder="Customer price"
                />
              </div>

              <div className="mt-4 rounded-xl border border-orange-500/20 bg-orange-500/10 p-4">
                <p className="text-sm text-gray-400">
                  Final selling price preview
                </p>
                <p className="text-2xl font-bold text-orange-400">
                  {formatPrice(sellingPricePreview)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Cost price is internal only. Selling price is saved directly
                  and is not calculated from cost.
                </p>
              </div>
            </Section>

            <Section title="Stock & Status">
              <div className="grid gap-4 sm:grid-cols-3">
                <TextField
                  label="Stock Quantity"
                  type="number"
                  value={form.stock}
                  onChange={(value) => setField("stock", value)}
                />
                <SelectField
                  label="Stock Status"
                  value={form.stockStatus}
                  onChange={(value) => setField("stockStatus", value)}
                  options={stockStatusOptions}
                />
                <TextField
                  label="Low Stock Alert Qty"
                  type="number"
                  value={form.lowStockAlertQuantity}
                  onChange={(value) => setField("lowStockAlertQuantity", value)}
                />
                <TextField
                  label="Sold Quantity"
                  type="number"
                  value={form.soldQuantity}
                  onChange={(value) => setField("soldQuantity", value)}
                />
                <TextField
                  label="Reserved Quantity"
                  type="number"
                  value={form.reservedQuantity}
                  onChange={(value) => setField("reservedQuantity", value)}
                />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <SwitchField
                  label="In Stock"
                  checked={form.inStock}
                  onChange={(value) => setField("inStock", value)}
                />
                <SwitchField
                  label="Published"
                  checked={form.isPublished}
                  onChange={(value) => setField("isPublished", value)}
                />
                <SwitchField
                  label="Featured"
                  checked={form.isFeatured}
                  onChange={(value) => setField("isFeatured", value)}
                />
                <SwitchField
                  label="New Arrival"
                  checked={form.isNewArrival}
                  onChange={(value) => setField("isNewArrival", value)}
                />
                <SwitchField
                  label="Best Seller"
                  checked={form.isBestSeller}
                  onChange={(value) => setField("isBestSeller", value)}
                />
                <SwitchField
                  label="Trending"
                  checked={form.isTrending}
                  onChange={(value) => setField("isTrending", value)}
                />
                <SwitchField
                  label="Recommended"
                  checked={form.isRecommended}
                  onChange={(value) => setField("isRecommended", value)}
                />
                <SwitchField
                  label="Flash Sale"
                  checked={form.isFlashSale}
                  onChange={(value) => setField("isFlashSale", value)}
                />
              </div>
            </Section>

            <Section title="Warranty, Return & Delivery">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Warranty Duration"
                  value={form.warrantyDuration}
                  onChange={(value) => setField("warrantyDuration", value)}
                  placeholder="1 year"
                />
                <TextField
                  label="Warranty Details"
                  value={form.warrantyDetails}
                  onChange={(value) => setField("warrantyDetails", value)}
                />
                <TextField
                  label="Return Policy"
                  value={form.returnPolicy}
                  onChange={(value) => setField("returnPolicy", value)}
                />
                <TextField
                  label="Replacement Policy"
                  value={form.replacementPolicy}
                  onChange={(value) => setField("replacementPolicy", value)}
                />
                <TextField
                  label="Refund Policy"
                  value={form.refundPolicy}
                  onChange={(value) => setField("refundPolicy", value)}
                />
                <TextField
                  label="Delivery Info"
                  value={form.deliveryInfo}
                  onChange={(value) => setField("deliveryInfo", value)}
                />
                <TextField
                  label="Delivery Charge"
                  type="number"
                  value={form.deliveryCharge}
                  onChange={(value) => setField("deliveryCharge", value)}
                />
                <TextField
                  label="Inside Dhaka Charge"
                  type="number"
                  value={form.insideDhakaDeliveryCharge}
                  onChange={(value) =>
                    setField("insideDhakaDeliveryCharge", value)
                  }
                />
                <TextField
                  label="Outside Dhaka Charge"
                  type="number"
                  value={form.outsideDhakaDeliveryCharge}
                  onChange={(value) =>
                    setField("outsideDhakaDeliveryCharge", value)
                  }
                />
                <TextField
                  label="Delivery Time"
                  value={form.deliveryTime}
                  onChange={(value) => setField("deliveryTime", value)}
                  placeholder="2-3 business days"
                />
                <TextField
                  label="Free Delivery Min Amount"
                  type="number"
                  value={form.freeDeliveryMinAmount}
                  onChange={(value) => setField("freeDeliveryMinAmount", value)}
                />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <SwitchField
                  label="Cash on Delivery"
                  checked={form.cashOnDelivery}
                  onChange={(value) => setField("cashOnDelivery", value)}
                />
                <SwitchField
                  label="Free Delivery"
                  checked={form.freeDelivery}
                  onChange={(value) => setField("freeDelivery", value)}
                />
              </div>
            </Section>

            <Section title="Package Information">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <TextField
                    label="Package Includes"
                    value={form.packageIncludes}
                    onChange={(value) => setField("packageIncludes", value)}
                    placeholder="Comma separated: Phone, Charger, Cable"
                  />
                </div>
                <TextField
                  label="Package Weight"
                  value={form.packageWeight}
                  onChange={(value) => setField("packageWeight", value)}
                  placeholder="500g"
                />
                <TextField
                  label="Package Dimensions"
                  value={form.packageDimensions}
                  onChange={(value) => setField("packageDimensions", value)}
                  placeholder="20x10x5 cm"
                />
              </div>
            </Section>

            <Section
              title="Supplier & Internal Note"
              note="This section is returned only from admin product API."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Supplier Name"
                  value={form.supplierName}
                  onChange={(value) => setField("supplierName", value)}
                />
                <TextField
                  label="Supplier Phone"
                  value={form.supplierPhone}
                  onChange={(value) => setField("supplierPhone", value)}
                />
                <TextField
                  label="Supplier Email"
                  value={form.supplierEmail}
                  onChange={(value) => setField("supplierEmail", value)}
                />
                <TextField
                  label="Supplier Address"
                  value={form.supplierAddress}
                  onChange={(value) => setField("supplierAddress", value)}
                />
                <TextField
                  label="Supplier Invoice Number"
                  value={form.supplierInvoiceNumber}
                  onChange={(value) => setField("supplierInvoiceNumber", value)}
                />
                <TextField
                  label="Internal Note"
                  value={form.internalNote}
                  onChange={(value) => setField("internalNote", value)}
                />
              </div>
            </Section>

            <Section title="SEO & Metadata">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="SEO Title"
                  value={form.seoTitle}
                  onChange={(value) => setField("seoTitle", value)}
                />
                <TextField
                  label="SEO Description"
                  value={form.seoDescription}
                  onChange={(value) => setField("seoDescription", value)}
                />
                <TextField
                  label="SEO Keywords"
                  value={form.seoKeywords}
                  onChange={(value) => setField("seoKeywords", value)}
                  placeholder="Comma separated"
                />
                <TextField
                  label="Focus Keyword"
                  value={form.focusKeyword}
                  onChange={(value) => setField("focusKeyword", value)}
                />
                <TextField
                  label="Canonical URL"
                  value={form.canonicalUrl}
                  onChange={(value) => setField("canonicalUrl", value)}
                />
                <TextField
                  label="Meta Robots"
                  value={form.metaRobots}
                  onChange={(value) => setField("metaRobots", value)}
                />
                <TextField
                  label="OG Title"
                  value={form.ogTitle}
                  onChange={(value) => setField("ogTitle", value)}
                />
                <TextField
                  label="OG Description"
                  value={form.ogDescription}
                  onChange={(value) => setField("ogDescription", value)}
                />
                <TextField
                  label="OG Image URL"
                  value={form.ogImage}
                  onChange={(value) => setField("ogImage", value)}
                />
                <TextAreaField
                  label="Schema JSON"
                  value={form.schemaJson}
                  onChange={(value) => setField("schemaJson", value)}
                  mono
                  placeholder='{"@context":"https://schema.org","@type":"Product"}'
                />
              </div>
            </Section>

            <Section
              title="Stats & Audit Values"
              note="You can leave these as default. Usually order/review logic should update these automatically."
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <TextField
                  label="View Count"
                  type="number"
                  value={form.viewCount}
                  onChange={(value) => setField("viewCount", value)}
                />
                <TextField
                  label="Wishlist Count"
                  type="number"
                  value={form.wishlistCount}
                  onChange={(value) => setField("wishlistCount", value)}
                />
                <TextField
                  label="Cart Count"
                  type="number"
                  value={form.cartCount}
                  onChange={(value) => setField("cartCount", value)}
                />
                <TextField
                  label="Order Count"
                  type="number"
                  value={form.orderCount}
                  onChange={(value) => setField("orderCount", value)}
                />
                <TextField
                  label="Average Rating"
                  type="number"
                  value={form.averageRating}
                  onChange={(value) => setField("averageRating", value)}
                />
                <TextField
                  label="Total Reviews"
                  type="number"
                  value={form.totalReviews}
                  onChange={(value) => setField("totalReviews", value)}
                />
                <TextField
                  label="Published At"
                  type="datetime-local"
                  value={form.publishedAt}
                  onChange={(value) => setField("publishedAt", value)}
                />
              </div>

              {initialProduct && (
                <div className="mt-4 grid gap-3 rounded-xl border border-gray-800 bg-gray-950 p-4 text-xs text-gray-400 sm:grid-cols-2">
                  <p>Created By: {initialProduct.createdByEmail || "N/A"}</p>
                  <p>Updated By: {initialProduct.updatedByEmail || "N/A"}</p>
                  <p>
                    Created At:{" "}
                    {initialProduct.createdAt
                      ? new Date(initialProduct.createdAt).toLocaleString()
                      : "N/A"}
                  </p>
                  <p>
                    Updated At:{" "}
                    {initialProduct.updatedAt
                      ? new Date(initialProduct.updatedAt).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
              )}
            </Section>
          </div>

          <div className="space-y-4">
            <Section title="Main Image">
              <label className="block cursor-pointer rounded-2xl border border-dashed border-gray-700 bg-gray-950 p-4 transition hover:border-orange-500/70">
                <div className="grid min-h-[220px] place-items-center overflow-hidden rounded-xl bg-black">
                  {mainPreview ? (
                    <img
                      src={mainPreview}
                      alt="Main preview"
                      className="h-56 w-full object-contain p-3"
                    />
                  ) : (
                    <span className="text-sm text-gray-500">
                      Click to upload main image
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) =>
                    updateFilePreview(
                      event,
                      setMainImage,
                      setMainPreview,
                      initialProduct?.mainImageUrl || "",
                    )
                  }
                />
              </label>
              <div className="mt-4">
                <TextField
                  label="Main Image Alt Text"
                  value={form.mainImageAlt}
                  onChange={(value) => setField("mainImageAlt", value)}
                />
              </div>
            </Section>

            <Section title="Hover Image">
              <label className="block cursor-pointer rounded-2xl border border-dashed border-gray-700 bg-gray-950 p-4 transition hover:border-orange-500/70">
                <div className="grid min-h-[160px] place-items-center overflow-hidden rounded-xl bg-black">
                  {hoverPreview ? (
                    <img
                      src={hoverPreview}
                      alt="Hover preview"
                      className="h-40 w-full object-contain p-3"
                    />
                  ) : (
                    <span className="text-sm text-gray-500">
                      Click to upload hover image
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) =>
                    updateFilePreview(
                      event,
                      setHoverImage,
                      setHoverPreview,
                      initialProduct?.hoverImageUrl || "",
                    )
                  }
                />
              </label>
              <div className="mt-4 space-y-3">
                <TextField
                  label="Hover Image Alt Text"
                  value={form.hoverImageAlt}
                  onChange={(value) => setField("hoverImageAlt", value)}
                />
                {initialProduct?.hoverImageUrl && (
                  <SwitchField
                    label="Remove Existing Hover Image"
                    checked={form.removeHoverImage}
                    onChange={(value) => setField("removeHoverImage", value)}
                  />
                )}
              </div>
            </Section>

            <Section title="Product Video">
              <label className="block cursor-pointer rounded-2xl border border-dashed border-gray-700 bg-gray-950 p-4 transition hover:border-orange-500/70">
                <div className="grid aspect-video place-items-center overflow-hidden rounded-xl bg-black">
                  {videoPreview ? (
                    <video
                      src={videoPreview}
                      className="h-full w-full object-contain"
                      controls
                      muted
                    />
                  ) : (
                    <span className="text-sm text-gray-500">
                      Click to upload product video
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(event) =>
                    updateFilePreview(
                      event,
                      setVideo,
                      setVideoPreview,
                      initialProduct?.videoUrl || "",
                    )
                  }
                />
              </label>
              {initialProduct?.videoUrl && (
                <div className="mt-4">
                  <SwitchField
                    label="Remove Existing Video"
                    checked={form.removeVideo}
                    onChange={(value) => setField("removeVideo", value)}
                  />
                </div>
              )}
            </Section>

            <Section title="Extra Images">
              {(initialProduct?.extraImages?.length || 0) > 0 && (
                <div className="mb-4 grid grid-cols-3 gap-3">
                  {initialProduct?.extraImages?.map((image) => {
                    const removed = removedExtraImageIds.includes(image.id);

                    return (
                      <button
                        type="button"
                        key={image.id}
                        onClick={() => toggleRemoveExistingExtraImage(image.id)}
                        className={`relative overflow-hidden rounded-xl border ${removed ? "border-red-500 opacity-45" : "border-gray-800"}`}
                      >
                        <img
                          src={image.imageUrl}
                          alt={image.altText || "Extra image"}
                          className="h-24 w-full object-contain p-2"
                        />
                        <span className="absolute bottom-1 left-1 right-1 rounded bg-black/80 py-1 text-[10px] text-white">
                          {removed ? "Will remove" : "Click remove"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <input
                ref={extraImagesInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleExtraImagesChange}
                className="hidden"
              />

              <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-950 p-4">
                <button
                  type="button"
                  onClick={() => extraImagesInputRef.current?.click()}
                  className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-500"
                >
                  Add Extra Images
                </button>

                <p className="mt-3 text-xs text-gray-400">
                  You can select 1 image or many images together. Selected new
                  images: {extraImages.length}
                </p>
              </div>

              <div className="mt-4">
                <TextField
                  label="Extra Images Alt Text"
                  value={form.extraImagesAlt}
                  onChange={(value) => setField("extraImagesAlt", value)}
                />
              </div>

              {extraImages.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {extraImages.map((file, index) => (
                    <div
                      key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                      className="rounded-xl border border-gray-800 bg-gray-950 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-gray-200">
                            {file.name}
                          </p>
                          <p className="mt-1 text-[11px] text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeNewExtraImage(index)}
                          className="shrink-0 rounded-lg border border-red-500/40 px-2 py-1 text-[11px] text-red-300 hover:bg-red-500/10"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Size Chart">
              <div className="space-y-4">
                <label className="block cursor-pointer rounded-2xl border border-dashed border-gray-700 bg-gray-950 p-4 transition hover:border-orange-500/70">
                  <div className="grid min-h-[150px] place-items-center overflow-hidden rounded-xl bg-black">
                    {sizeChartPreview ? (
                      <img
                        src={sizeChartPreview}
                        alt="Size chart preview"
                        className="h-40 w-full object-contain p-3"
                      />
                    ) : (
                      <span className="text-sm text-gray-500">
                        Click to upload size chart image
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) =>
                      updateFilePreview(
                        event,
                        setSizeChartImage,
                        setSizeChartPreview,
                        initialProduct?.sizeChart?.imageUrl || "",
                      )
                    }
                  />
                </label>

                <TextField
                  label="Size Chart Name"
                  value={form.sizeChartName}
                  onChange={(value) => setField("sizeChartName", value)}
                  placeholder="Men Shirt Size Chart"
                />
                <TextField
                  label="Size Chart Title"
                  value={form.sizeChartTitle}
                  onChange={(value) => setField("sizeChartTitle", value)}
                />
                <TextAreaField
                  label="Size Chart Description"
                  value={form.sizeChartDescription}
                  onChange={(value) => setField("sizeChartDescription", value)}
                  rows={3}
                />
                <TextField
                  label="Unit"
                  value={form.sizeChartUnit}
                  onChange={(value) => setField("sizeChartUnit", value)}
                  placeholder="inch / cm"
                />
                <TextAreaField
                  label="Chart Data JSON"
                  value={form.sizeChartData}
                  onChange={(value) => setField("sizeChartData", value)}
                  mono
                  placeholder='[{"size":"M","chest":"38","length":"27"}]'
                />
                <TextField
                  label="Note"
                  value={form.sizeChartNote}
                  onChange={(value) => setField("sizeChartNote", value)}
                />
                <TextField
                  label="Sort Order"
                  type="number"
                  value={form.sizeChartSortOrder}
                  onChange={(value) => setField("sizeChartSortOrder", value)}
                />

                <SwitchField
                  label="Size Chart Active"
                  checked={form.sizeChartIsActive}
                  onChange={(value) => setField("sizeChartIsActive", value)}
                />

                {initialProduct?.sizeChart && (
                  <>
                    <SwitchField
                      label="Remove Size Chart"
                      checked={form.removeSizeChart}
                      onChange={(value) => setField("removeSizeChart", value)}
                    />
                    <SwitchField
                      label="Remove Size Chart Image"
                      checked={form.removeSizeChartImage}
                      onChange={(value) =>
                        setField("removeSizeChartImage", value)
                      }
                    />
                  </>
                )}
              </div>
            </Section>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-800 bg-gray-950/95 p-5">
          <Link
            href={listHref}
            className="rounded-xl bg-gray-800 px-5 py-3 text-white transition hover:bg-gray-700"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Processing..."
              : isEdit
                ? "Update Product"
                : "Create Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
