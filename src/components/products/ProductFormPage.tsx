"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import type {
  Product,
  ProductBrand,
  ProductCategory,
  ProfitType,
  StockStatus,
} from "@/types/product";
import { formatPrice } from "@/lib/formatPrice";

interface ProductFormPageProps {
  mode: "create" | "edit";
  panelType: "admin" | "moderator";
  productId?: string;
}

type RelationMode = "existing" | "new";
type SubCategoryMode = "none" | "existing" | "new";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

const stockStatusOptions: { value: StockStatus; label: string }[] = [
  { value: "IN_STOCK", label: "In stock" },
  { value: "LIMITED_STOCK", label: "Limited stock" },
  { value: "LOW_STOCK", label: "Low stock" },
  { value: "OUT_OF_STOCK", label: "Out of stock" },
  { value: "PRE_ORDER", label: "Pre-order" },
  { value: "COMING_SOON", label: "Coming soon" },
];

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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
  const isAdmin = panelType === "admin";
  const listHref = panelType === "admin" ? "/admin/products" : "/moderator/products";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [brands, setBrands] = useState<ProductBrand[]>([]);
  const [initialData, setInitialData] = useState<Product | null>(null);

  // Basic fields
  const [name, setName] = useState("");
  const [modelName, setModelName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState(""); // read‑only
  const [productCode, setProductCode] = useState("");
  const [barcode, setBarcode] = useState("");

  // Relations
  const [categoryMode, setCategoryMode] = useState<RelationMode>("existing");
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");

  const [subCategoryMode, setSubCategoryMode] = useState<SubCategoryMode>("none");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [subCategoryName, setSubCategoryName] = useState("");

  const [brandMode, setBrandMode] = useState<RelationMode>("existing");
  const [brandId, setBrandId] = useState("");
  const [brandName, setBrandName] = useState("");

  // Pricing
  const [mrp, setMrp] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [profitType, setProfitType] = useState<ProfitType>("PERCENTAGE");
  const [profitValue, setProfitValue] = useState("");

  // Stock
  const [stock, setStock] = useState("0");
  const [stockStatus, setStockStatus] = useState<StockStatus>("IN_STOCK");
  const [lowStockAlertQuantity, setLowStockAlertQuantity] = useState("5");

  // Additional attributes
  const [keyFeatures, setKeyFeatures] = useState<string[]>([]);
  const [keyFeaturesInput, setKeyFeaturesInput] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [highlightsInput, setHighlightsInput] = useState("");
  const [specifications, setSpecifications] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState("");
  const [searchKeywords, setSearchKeywords] = useState<string[]>([]);
  const [searchKeywordsInput, setSearchKeywordsInput] = useState("");

  // Delivery & Policy
  const [warrantyDuration, setWarrantyDuration] = useState("");
  const [warrantyDetails, setWarrantyDetails] = useState("");
  const [returnPolicy, setReturnPolicy] = useState("");
  const [replacementPolicy, setReplacementPolicy] = useState("");
  const [refundPolicy, setRefundPolicy] = useState("");
  const [deliveryInfo, setDeliveryInfo] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState("");
  const [insideDhakaDeliveryCharge, setInsideDhakaDeliveryCharge] = useState("");
  const [outsideDhakaDeliveryCharge, setOutsideDhakaDeliveryCharge] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [cashOnDelivery, setCashOnDelivery] = useState(true);
  const [freeDelivery, setFreeDelivery] = useState(false);
  const [freeDeliveryMinAmount, setFreeDeliveryMinAmount] = useState("");
  const [packageIncludes, setPackageIncludes] = useState<string[]>([]);
  const [packageIncludesInput, setPackageIncludesInput] = useState("");
  const [packageWeight, setPackageWeight] = useState("");
  const [packageDimensions, setPackageDimensions] = useState("");

  // Supplier
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");
  const [internalNote, setInternalNote] = useState("");

  // SEO
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState<string[]>([]);
  const [seoKeywordsInput, setSeoKeywordsInput] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [metaRobots, setMetaRobots] = useState("index,follow");
  const [schemaJson, setSchemaJson] = useState("");

  // Publishing
  const [isPublished, setIsPublished] = useState(true);

  // Images
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [hoverImage, setHoverImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [extraImages, setExtraImages] = useState<File[]>([]);

  const [mainPreview, setMainPreview] = useState("");
  const [hoverPreview, setHoverPreview] = useState("");
  const [videoPreview, setVideoPreview] = useState("");
  const [removedExtraImageIds, setRemovedExtraImageIds] = useState<string[]>([]);

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${accessToken}`,
  }), [accessToken]);

  const subCategories = useMemo(() => {
    return categories.find((c) => c.id === categoryId)?.subCategories || [];
  }, [categories, categoryId]);

  const calculatedSellingPrice = useMemo(() => {
    const cost = numberValue(costPrice);
    const profit = numberValue(profitValue);
    return profitType === "FIXED" ? cost + profit : cost + (cost * profit) / 100;
  }, [costPrice, profitValue, profitType]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [router, status]);

  useEffect(() => {
    if (status === "loading") return;

    if (!accessToken) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        if (!API_BASE) {
          toast.error("NEXT_PUBLIC_BACKEND_URL is missing");
          setLoading(false);
          return;
        }

        setLoading(true);

        const metaRes = await fetch(`${API_BASE}/api/v1/products/meta`, {
          cache: "no-store",
        });
        const metaData = await metaRes.json();

        const loadedCategories: ProductCategory[] = metaData.success ? metaData.categories || [] : [];
        const loadedBrands: ProductBrand[] = metaData.success ? metaData.brands || [] : [];

        setCategories(loadedCategories);
        setBrands(loadedBrands);

        if (loadedCategories.length > 0) {
          setCategoryId(loadedCategories[0].id);
          setCategoryMode("existing");
        } else {
          setCategoryId("");
          setCategoryMode("new");
        }

        if (loadedBrands.length > 0) {
          setBrandId(loadedBrands[0].id);
          setBrandMode("existing");
        } else {
          setBrandId("");
          setBrandMode("new");
        }

        if (isEdit) {
          if (!productId) {
            toast.error("Product ID is missing");
            router.push(listHref);
            return;
          }

          const productRes = await fetch(`${API_BASE}/api/v1/products/admin/${productId}`, {
            headers: authHeaders,
            cache: "no-store",
          });
          const productData = await productRes.json();

          if (!productRes.ok || !productData.success) {
            toast.error(productData.message || "Failed to load product");
            router.push(listHref);
            return;
          }

          const product: Product = productData.product;
          setInitialData(product);

          // Populate all fields
          setName(product.name || "");
          setModelName(product.modelName || "");
          setShortDescription(product.shortDescription || "");
          setDescription(product.description || "");
          setSku(product.sku || "");
          setProductCode(product.productCode || "");
          setBarcode(product.barcode || "");

          setCategoryMode("existing");
          setCategoryId(product.category?.id || loadedCategories[0]?.id || "");

          setSubCategoryMode(product.subCategory?.id ? "existing" : "none");
          setSubCategoryId(product.subCategory?.id || "");

          setBrandMode("existing");
          setBrandId(product.brand?.id || loadedBrands[0]?.id || "");

          setMrp(product.mrp?.toString() || "");
          setCostPrice(product.costPrice?.toString() || "");
          setProfitType(product.profitType || "PERCENTAGE");
          setProfitValue(product.profitValue?.toString() || "");

          setStock(typeof product.stock === "number" ? product.stock.toString() : "0");
          setStockStatus(product.stockStatus || "IN_STOCK");
          setLowStockAlertQuantity(product.lowStockAlertQuantity?.toString() || "5");

          setKeyFeatures(product.keyFeatures || []);
          setKeyFeaturesInput((product.keyFeatures || []).join(", "));
          setHighlights(product.highlights || []);
          setHighlightsInput((product.highlights || []).join(", "));
          setSpecifications(product.specifications ? JSON.stringify(product.specifications, null, 2) : "");
          setTags(product.tags || []);
          setTagsInput((product.tags || []).join(", "));
          setSearchKeywords(product.searchKeywords || []);
          setSearchKeywordsInput((product.searchKeywords || []).join(", "));

          setWarrantyDuration(product.warrantyDuration || "");
          setWarrantyDetails(product.warrantyDetails || "");
          setReturnPolicy(product.returnPolicy || "");
          setReplacementPolicy(product.replacementPolicy || "");
          setRefundPolicy(product.refundPolicy || "");
          setDeliveryInfo(product.deliveryInfo || "");
          setDeliveryCharge(product.deliveryCharge?.toString() || "");
          setInsideDhakaDeliveryCharge(product.insideDhakaDeliveryCharge?.toString() || "");
          setOutsideDhakaDeliveryCharge(product.outsideDhakaDeliveryCharge?.toString() || "");
          setDeliveryTime(product.deliveryTime || "");
          setCashOnDelivery(product.cashOnDelivery ?? true);
          setFreeDelivery(product.freeDelivery ?? false);
          setFreeDeliveryMinAmount(product.freeDeliveryMinAmount?.toString() || "");
          setPackageIncludes(product.packageIncludes || []);
          setPackageIncludesInput((product.packageIncludes || []).join(", "));
          setPackageWeight(product.packageWeight || "");
          setPackageDimensions(product.packageDimensions || "");

          setSupplierName(product.supplierName || "");
          setSupplierPhone(product.supplierPhone || "");
          setSupplierEmail(product.supplierEmail || "");
          setSupplierAddress(product.supplierAddress || "");
          setSupplierInvoiceNumber(product.supplierInvoiceNumber || "");
          setInternalNote(product.internalNote || "");

          setSeoTitle(product.seoTitle || "");
          setSeoDescription(product.seoDescription || "");
          setSeoKeywords(product.seoKeywords || []);
          setSeoKeywordsInput((product.seoKeywords || []).join(", "));
          setFocusKeyword(product.focusKeyword || "");
          setCanonicalUrl(product.canonicalUrl || "");
          setOgTitle(product.ogTitle || "");
          setOgDescription(product.ogDescription || "");
          setOgImage(product.ogImage || "");
          setMetaRobots(product.metaRobots || "index,follow");
          setSchemaJson(product.schemaJson ? JSON.stringify(product.schemaJson, null, 2) : "");

          setIsPublished(product.isPublished ?? true);

          setMainPreview(product.mainImageUrl || "");
          setHoverPreview(product.hoverImageUrl || "");
          setVideoPreview(product.videoUrl || "");
        }
      } catch (error) {
        console.error(error);
        toast.error("Error loading product form");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [accessToken, authHeaders, isEdit, listHref, productId, router, status]);

  useEffect(() => {
    if (categoryMode === "new") {
      setSubCategoryMode("none");
      setSubCategoryId("");
    }
  }, [categoryMode]);

  useEffect(() => {
    if (subCategoryId && !subCategories.some((item) => item.id === subCategoryId)) {
      setSubCategoryId("");
    }
  }, [subCategories, subCategoryId]);

  const handleFilePreview = (
    file: File | null,
    setter: (file: File | null) => void,
    previewSetter: (url: string) => void,
    fallback = ""
  ) => {
    setter(file);
    previewSetter(file ? URL.createObjectURL(file) : fallback);
  };

  const handleExtraImagesChange = (files: FileList | null) => {
    if (!files) return;
    setExtraImages((prev) => [...prev, ...Array.from(files)]);
  };

  const removeNewExtraImage = (index: number) => {
    setExtraImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleRemoveExtraImage = (id: string) => {
    setRemovedExtraImageIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const validateForm = () => {
    if (!name.trim()) {
      toast.error("Product name is required");
      return false;
    }
    if (!description.trim()) {
      toast.error("Description is required");
      return false;
    }
    if (categoryMode === "existing" && !categoryId) {
      toast.error("Select a category");
      return false;
    }
    if (categoryMode === "new" && !categoryName.trim()) {
      toast.error("Type new category name");
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
    if (subCategoryMode === "existing" && !subCategoryId) {
      toast.error("Select a sub-category");
      return false;
    }
    if (subCategoryMode === "new" && !subCategoryName.trim()) {
      toast.error("Type new sub-category name");
      return false;
    }
    if (!isEdit && !mainImage) {
      toast.error("Main image is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !accessToken) return;

    setSubmitting(true);

    try {
      if (!API_BASE) {
        toast.error("NEXT_PUBLIC_BACKEND_URL is missing");
        return;
      }

      const formData = new FormData();

      // Basic fields
      formData.append("name", name.trim());
      formData.append("modelName", modelName.trim());
      formData.append("shortDescription", shortDescription.trim());
      formData.append("description", description.trim());
      formData.append("productCode", productCode.trim());
      formData.append("barcode", barcode.trim());

      // Relations
      if (categoryMode === "existing") {
        formData.append("categoryId", categoryId);
      } else {
        formData.append("categoryName", categoryName.trim());
      }

      if (subCategoryMode === "existing") {
        formData.append("subCategoryId", subCategoryId);
      } else if (subCategoryMode === "new") {
        formData.append("subCategoryName", subCategoryName.trim());
      }

      if (brandMode === "existing") {
        formData.append("brandId", brandId);
      } else {
        formData.append("brandName", brandName.trim());
      }

      // Pricing
      formData.append("mrp", mrp || "0");
      formData.append("costPrice", costPrice || "0");
      formData.append("profitType", profitType);
      formData.append("profitValue", profitValue || "0");

      // Stock
      if (isAdmin) {
        formData.append("stock", stock || "0");
      }
      formData.append("stockStatus", stockStatus);
      formData.append("lowStockAlertQuantity", lowStockAlertQuantity || "5");

      // Additional attributes (arrays as JSON or comma-separated)
      // We'll send as JSON array strings
      formData.append("keyFeatures", JSON.stringify(keyFeatures));
      formData.append("highlights", JSON.stringify(highlights));
      formData.append("tags", JSON.stringify(tags));
      formData.append("searchKeywords", JSON.stringify(searchKeywords));
      formData.append("specifications", specifications.trim() || "null");

      // Delivery & Policy
      formData.append("warrantyDuration", warrantyDuration.trim());
      formData.append("warrantyDetails", warrantyDetails.trim());
      formData.append("returnPolicy", returnPolicy.trim());
      formData.append("replacementPolicy", replacementPolicy.trim());
      formData.append("refundPolicy", refundPolicy.trim());
      formData.append("deliveryInfo", deliveryInfo.trim());
      formData.append("deliveryCharge", deliveryCharge || "0");
      formData.append("insideDhakaDeliveryCharge", insideDhakaDeliveryCharge || "0");
      formData.append("outsideDhakaDeliveryCharge", outsideDhakaDeliveryCharge || "0");
      formData.append("deliveryTime", deliveryTime.trim());
      formData.append("cashOnDelivery", String(cashOnDelivery));
      formData.append("freeDelivery", String(freeDelivery));
      formData.append("freeDeliveryMinAmount", freeDeliveryMinAmount || "0");
      formData.append("packageIncludes", JSON.stringify(packageIncludes));
      formData.append("packageWeight", packageWeight.trim());
      formData.append("packageDimensions", packageDimensions.trim());

      // Supplier
      formData.append("supplierName", supplierName.trim());
      formData.append("supplierPhone", supplierPhone.trim());
      formData.append("supplierEmail", supplierEmail.trim());
      formData.append("supplierAddress", supplierAddress.trim());
      formData.append("supplierInvoiceNumber", supplierInvoiceNumber.trim());
      formData.append("internalNote", internalNote.trim());

      // SEO
      formData.append("seoTitle", seoTitle.trim());
      formData.append("seoDescription", seoDescription.trim());
      formData.append("seoKeywords", JSON.stringify(seoKeywords));
      formData.append("focusKeyword", focusKeyword.trim());
      formData.append("canonicalUrl", canonicalUrl.trim());
      formData.append("ogTitle", ogTitle.trim());
      formData.append("ogDescription", ogDescription.trim());
      formData.append("ogImage", ogImage.trim());
      formData.append("metaRobots", metaRobots.trim() || "index,follow");
      formData.append("schemaJson", schemaJson.trim() || "null");

      // Publishing
      formData.append("isPublished", String(isPublished));

      // Remove extra images
      formData.append("removeExtraImageIds", JSON.stringify(removedExtraImageIds));

      // Files
      if (mainImage) formData.append("mainImage", mainImage);
      if (hoverImage) formData.append("hoverImage", hoverImage);
      if (video) formData.append("video", video);

      extraImages.forEach((image) => {
        formData.append("extraImages", image);
      });

      const endpoint = isEdit && productId
        ? `${API_BASE}/api/v1/products/${productId}`
        : `${API_BASE}/api/v1/products`;

      const res = await fetch(endpoint, {
        method: isEdit ? "PATCH" : "POST",
        headers: authHeaders,
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to save product");
        return;
      }

      toast.success(isEdit ? "Product updated successfully" : "Product created successfully");
      router.push(listHref);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Error saving product");
    } finally {
      setSubmitting(false);
    }
  };

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
            Add product info, pricing, images, video, stock status and publishing control.
          </p>
        </div>

        <Link
          href={listHref}
          className="rounded-xl border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:border-orange-500 hover:text-orange-400"
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
            Main image required. Hover image, video and extra images are optional.
          </p>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {/* Basic info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Product Name *
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                  placeholder="iPhone 15 Pro Max"
                />
              </div>

              {isEdit && sku && (
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    SKU (auto‑generated)
                  </label>
                  <input
                    type="text"
                    value={sku}
                    readOnly
                    className="w-full rounded-xl border border-gray-800 bg-black/50 px-3 py-3 text-gray-500 outline-none cursor-not-allowed"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Model Name
                </label>
                <input
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                  placeholder="A3108 / SM-S928B"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Product Code
                </label>
                <input
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                  className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                  placeholder="Internal code"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Barcode
                </label>
                <input
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                  placeholder="UPC/EAN"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Stock Status *
                </label>
                <select
                  value={stockStatus}
                  onChange={(e) => setStockStatus(e.target.value as StockStatus)}
                  className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                >
                  {stockStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {isAdmin && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                      placeholder="Only admin can see this"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Low Stock Alert Qty
                    </label>
                    <input
                      type="number"
                      value={lowStockAlertQuantity}
                      onChange={(e) => setLowStockAlertQuantity(e.target.value)}
                      className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                      placeholder="Default 5"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Category, SubCategory, Brand */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-300">
                    Category *
                  </label>
                  <button
                    type="button"
                    onClick={() => setCategoryMode((prev) => prev === "existing" ? "new" : "existing")}
                    className="text-xs font-semibold text-orange-400 hover:text-orange-300"
                  >
                    {categoryMode === "existing" ? "Add new" : "Use existing"}
                  </button>
                </div>

                {categoryMode === "existing" ? (
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="Type new category name"
                  />
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-300">
                    Sub-category
                  </label>
                  <select
                    value={subCategoryMode}
                    onChange={(e) => setSubCategoryMode(e.target.value as SubCategoryMode)}
                    className="rounded-lg border border-gray-800 bg-black px-2 py-1 text-xs text-gray-300 outline-none focus:border-orange-500"
                  >
                    <option value="none">None</option>
                    {categoryMode === "existing" && <option value="existing">Existing</option>}
                    <option value="new">New</option>
                  </select>
                </div>

                {subCategoryMode === "none" && (
                  <div className="grid h-[50px] place-items-center rounded-xl border border-gray-800 bg-black text-sm text-gray-600">
                    No sub-category
                  </div>
                )}

                {subCategoryMode === "existing" && (
                  <select
                    value={subCategoryId}
                    onChange={(e) => setSubCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                  >
                    <option value="">Select sub-category</option>
                    {subCategories.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.name}
                      </option>
                    ))}
                  </select>
                )}

                {subCategoryMode === "new" && (
                  <input
                    value={subCategoryName}
                    onChange={(e) => setSubCategoryName(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="Type new sub-category name"
                  />
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-300">
                    Brand *
                  </label>
                  <button
                    type="button"
                    onClick={() => setBrandMode((prev) => prev === "existing" ? "new" : "existing")}
                    className="text-xs font-semibold text-orange-400 hover:text-orange-300"
                  >
                    {brandMode === "existing" ? "Add new" : "Use existing"}
                  </button>
                </div>

                {brandMode === "existing" ? (
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                  >
                    <option value="">Select brand</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="Type new brand name"
                  />
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Short Description
              </label>
              <textarea
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                placeholder="Small summary shown on product details page"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Full Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                placeholder="Write product details, benefits, package info..."
              />
            </div>

            {/* Pricing */}
            <div className="rounded-2xl border border-gray-800 bg-black p-4">
              <h3 className="mb-4 font-semibold text-orange-400">Pricing</h3>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    MRP *
                  </label>
                  <input
                    type="number"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Cost Price *
                  </label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Profit Type *
                  </label>
                  <select
                    value={profitType}
                    onChange={(e) => setProfitType(e.target.value as ProfitType)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED">Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Profit Value *
                  </label>
                  <input
                    type="number"
                    value={profitValue}
                    onChange={(e) => setProfitValue(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-orange-500/20 bg-orange-500/10 p-4">
                <p className="text-sm text-gray-400">Auto calculated selling price</p>
                <p className="text-2xl font-bold text-orange-400">
                  {formatPrice(calculatedSellingPrice)}
                </p>
              </div>
            </div>

            {/* Additional Attributes */}
            <div className="rounded-2xl border border-gray-800 bg-black p-4">
              <h3 className="mb-4 font-semibold text-orange-400">Additional Attributes</h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Key Features (comma separated)
                  </label>
                  <input
                    value={keyFeaturesInput}
                    onChange={(e) => {
                      setKeyFeaturesInput(e.target.value);
                      setKeyFeatures(e.target.value.split(",").map((s) => s.trim()).filter(Boolean));
                    }}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="5G, OLED display, 48MP camera"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Highlights (comma separated)
                  </label>
                  <input
                    value={highlightsInput}
                    onChange={(e) => {
                      setHighlightsInput(e.target.value);
                      setHighlights(e.target.value.split(",").map((s) => s.trim()).filter(Boolean));
                    }}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="Water resistant, Wireless charging"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Specifications (JSON)
                  </label>
                  <textarea
                    value={specifications}
                    onChange={(e) => setSpecifications(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 font-mono text-sm text-white outline-none focus:border-orange-500"
                    placeholder='{"CPU": "A17 Pro", "RAM": "8GB"}'
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Tags (comma separated)
                  </label>
                  <input
                    value={tagsInput}
                    onChange={(e) => {
                      setTagsInput(e.target.value);
                      setTags(e.target.value.split(",").map((s) => s.trim()).filter(Boolean));
                    }}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="iphone, apple, smartphone"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Search Keywords (comma separated)
                  </label>
                  <input
                    value={searchKeywordsInput}
                    onChange={(e) => {
                      setSearchKeywordsInput(e.target.value);
                      setSearchKeywords(e.target.value.split(",").map((s) => s.trim()).filter(Boolean));
                    }}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="buy iphone, apple phone"
                  />
                </div>
              </div>
            </div>

            {/* Delivery & Policy */}
            <div className="rounded-2xl border border-gray-800 bg-black p-4">
              <h3 className="mb-4 font-semibold text-orange-400">Delivery & Policy</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Warranty Duration
                  </label>
                  <input
                    value={warrantyDuration}
                    onChange={(e) => setWarrantyDuration(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="1 year"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Warranty Details
                  </label>
                  <input
                    value={warrantyDetails}
                    onChange={(e) => setWarrantyDetails(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="Manufacturer warranty"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Return Policy
                  </label>
                  <input
                    value={returnPolicy}
                    onChange={(e) => setReturnPolicy(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="7 days return"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Replacement Policy
                  </label>
                  <input
                    value={replacementPolicy}
                    onChange={(e) => setReplacementPolicy(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="Replace within 3 days"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Refund Policy
                  </label>
                  <input
                    value={refundPolicy}
                    onChange={(e) => setRefundPolicy(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="Refund after inspection"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Delivery Info
                  </label>
                  <input
                    value={deliveryInfo}
                    onChange={(e) => setDeliveryInfo(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="Delivery within 2-3 days"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Delivery Charge
                  </label>
                  <input
                    type="number"
                    value={deliveryCharge}
                    onChange={(e) => setDeliveryCharge(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Inside Dhaka Charge
                  </label>
                  <input
                    type="number"
                    value={insideDhakaDeliveryCharge}
                    onChange={(e) => setInsideDhakaDeliveryCharge(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Outside Dhaka Charge
                  </label>
                  <input
                    type="number"
                    value={outsideDhakaDeliveryCharge}
                    onChange={(e) => setOutsideDhakaDeliveryCharge(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Delivery Time
                  </label>
                  <input
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="2-3 business days"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={cashOnDelivery}
                      onChange={(e) => setCashOnDelivery(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-700 bg-black text-orange-500 focus:ring-orange-500"
                    />
                    Cash on Delivery
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={freeDelivery}
                      onChange={(e) => setFreeDelivery(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-700 bg-black text-orange-500 focus:ring-orange-500"
                    />
                    Free Delivery
                  </label>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Free Delivery Min Amount
                  </label>
                  <input
                    type="number"
                    value={freeDeliveryMinAmount}
                    onChange={(e) => setFreeDeliveryMinAmount(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Package Includes (comma separated)
                </label>
                <input
                  value={packageIncludesInput}
                  onChange={(e) => {
                    setPackageIncludesInput(e.target.value);
                    setPackageIncludes(e.target.value.split(",").map((s) => s.trim()).filter(Boolean));
                  }}
                  className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                  placeholder="Phone, Charger, Cable"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Package Weight
                  </label>
                  <input
                    value={packageWeight}
                    onChange={(e) => setPackageWeight(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="500g"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Package Dimensions
                  </label>
                  <input
                    value={packageDimensions}
                    onChange={(e) => setPackageDimensions(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="20x10x5 cm"
                  />
                </div>
              </div>
            </div>

            {/* Supplier Info */}
            <div className="rounded-2xl border border-gray-800 bg-black p-4">
              <h3 className="mb-4 font-semibold text-orange-400">Supplier Information</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Supplier Name
                  </label>
                  <input
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="ABC Suppliers"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Supplier Phone
                  </label>
                  <input
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="+880123456789"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Supplier Email
                  </label>
                  <input
                    value={supplierEmail}
                    onChange={(e) => setSupplierEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="supplier@example.com"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Supplier Address
                  </label>
                  <input
                    value={supplierAddress}
                    onChange={(e) => setSupplierAddress(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="Dhaka, Bangladesh"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Supplier Invoice Number
                  </label>
                  <input
                    value={supplierInvoiceNumber}
                    onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="INV-2025-001"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Internal Note
                  </label>
                  <input
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="Any internal note"
                  />
                </div>
              </div>
            </div>

            {/* SEO */}
            <div className="rounded-2xl border border-gray-800 bg-black p-4">
              <h3 className="mb-4 font-semibold text-orange-400">SEO & Metadata</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    SEO Title
                  </label>
                  <input
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="Buy iPhone 15 Pro Max - Best Price"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    SEO Description
                  </label>
                  <input
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="Get the latest iPhone at unbeatable price"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    SEO Keywords (comma separated)
                  </label>
                  <input
                    value={seoKeywordsInput}
                    onChange={(e) => {
                      setSeoKeywordsInput(e.target.value);
                      setSeoKeywords(e.target.value.split(",").map((s) => s.trim()).filter(Boolean));
                    }}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="iphone, apple, mobile"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Focus Keyword
                  </label>
                  <input
                    value={focusKeyword}
                    onChange={(e) => setFocusKeyword(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="iPhone 15 Pro Max"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Canonical URL
                  </label>
                  <input
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="https://example.com/products/iphone-15"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Meta Robots
                  </label>
                  <input
                    value={metaRobots}
                    onChange={(e) => setMetaRobots(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="index,follow"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    OG Title
                  </label>
                  <input
                    value={ogTitle}
                    onChange={(e) => setOgTitle(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="Open Graph Title"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    OG Description
                  </label>
                  <input
                    value={ogDescription}
                    onChange={(e) => setOgDescription(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="OG Description"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    OG Image URL
                  </label>
                  <input
                    value={ogImage}
                    onChange={(e) => setOgImage(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="https://example.com/og-image.jpg"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Schema JSON (JSON)
                  </label>
                  <textarea
                    value={schemaJson}
                    onChange={(e) => setSchemaJson(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 font-mono text-sm text-white outline-none focus:border-orange-500"
                    placeholder='{"@context": "https://schema.org", "@type": "Product"}'
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right column: Images and Publishing */}
          <div className="space-y-4">
            {/* Main image */}
            <label className="block rounded-2xl border border-dashed border-gray-700 bg-black p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">
                  Main Image {!isEdit && "*"}
                </span>
                <span className="text-xs text-gray-500">JPG/PNG/WEBP</span>
              </div>

              <div className="grid min-h-[180px] place-items-center overflow-hidden rounded-xl bg-gray-950">
                {mainPreview ? (
                  <img
                    src={mainPreview}
                    alt="Main preview"
                    className="h-48 w-full object-contain p-3"
                  />
                ) : (
                  <span className="text-sm text-gray-500">Click to upload main image</span>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleFilePreview(
                    e.target.files?.[0] || null,
                    setMainImage,
                    setMainPreview,
                    initialData?.mainImageUrl || ""
                  )
                }
              />
            </label>

            {/* Hover image */}
            <label className="block rounded-2xl border border-dashed border-gray-700 bg-black p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Hover Image</span>
                <span className="text-xs text-gray-500">Shows on card hover</span>
              </div>

              <div className="grid min-h-[140px] place-items-center overflow-hidden rounded-xl bg-gray-950">
                {hoverPreview ? (
                  <img
                    src={hoverPreview}
                    alt="Hover preview"
                    className="h-40 w-full object-contain p-3"
                  />
                ) : (
                  <span className="text-sm text-gray-500">Click to upload hover image</span>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleFilePreview(
                    e.target.files?.[0] || null,
                    setHoverImage,
                    setHoverPreview,
                    initialData?.hoverImageUrl || ""
                  )
                }
              />
            </label>

            {/* Video */}
            <label className="block rounded-2xl border border-dashed border-gray-700 bg-black p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Product Video</span>
                <span className="text-xs text-gray-500">Optional</span>
              </div>

              <div className="grid aspect-video place-items-center overflow-hidden rounded-xl bg-gray-950">
                {videoPreview ? (
                  <video
                    src={videoPreview}
                    className="h-full w-full object-contain"
                    controls
                    muted
                  />
                ) : (
                  <span className="text-sm text-gray-500">Click to upload product video</span>
                )}
              </div>

              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) =>
                  handleFilePreview(
                    e.target.files?.[0] || null,
                    setVideo,
                    setVideoPreview,
                    initialData?.videoUrl || ""
                  )
                }
              />
            </label>

            {/* Existing extra images */}
            {(initialData?.extraImages?.length || 0) > 0 && (
              <div className="rounded-2xl border border-gray-800 bg-black p-4">
                <p className="mb-3 text-sm font-medium text-gray-300">
                  Existing Extra Images
                </p>

                <div className="grid max-h-[260px] grid-cols-3 gap-3 overflow-y-auto">
                  {initialData?.extraImages?.map((image) => {
                    const removed = removedExtraImageIds.includes(image.id);
                    return (
                      <button
                        type="button"
                        key={image.id}
                        onClick={() => toggleRemoveExtraImage(image.id)}
                        className={`relative overflow-hidden rounded-xl border ${
                          removed ? "border-red-500 opacity-40" : "border-gray-800"
                        }`}
                      >
                        <img
                          src={image.imageUrl}
                          alt="Extra"
                          className="h-20 w-full object-contain p-2"
                        />
                        <span className="absolute bottom-1 left-1 right-1 rounded bg-black/70 py-1 text-[10px] text-white">
                          {removed ? "Will remove" : "Click remove"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* New extra images */}
            <label className="block rounded-2xl border border-dashed border-gray-700 bg-black p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Extra Images</span>
                <span className="text-xs text-gray-500">JPG/PNG/WEBP multiple</span>
              </div>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleExtraImagesChange(e.target.files)}
                className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-600 file:px-3 file:py-2 file:text-white"
              />

              {extraImages.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-orange-400">
                    {extraImages.length} new extra image(s) selected
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {extraImages.map((file, index) => (
                      <button
                        key={`${file.name}-${index}`}
                        type="button"
                        onClick={() => removeNewExtraImage(index)}
                        className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-left text-xs text-gray-300 hover:border-red-500 hover:text-red-300"
                      >
                        Remove: {file.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </label>

            {/* Publishing toggle */}
            <div className="flex items-center justify-between rounded-2xl border border-gray-800 bg-black p-4">
              <div>
                <p className="font-medium text-white">Published Status</p>
                <p className="text-sm text-gray-500">
                  Hide product from frontend when off.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsPublished((prev) => !prev)}
                className={`relative h-7 w-12 rounded-full transition ${
                  isPublished ? "bg-orange-500" : "bg-gray-700"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                    isPublished ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-800 bg-gray-950/95 p-5">
          <Link
            href={listHref}
            className="rounded-xl bg-gray-800 px-5 py-3 text-white hover:bg-gray-700"
          >
            Cancel
          </Link>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {submitting ? "Processing..." : isEdit ? "Update Product" : "Create Product"}
          </button>
        </div>
      </div>
    </div>
  );
}