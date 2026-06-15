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

  const [name, setName] = useState("");
  const [modelName, setModelName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");

  const [categoryMode, setCategoryMode] = useState<RelationMode>("existing");
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");

  const [subCategoryMode, setSubCategoryMode] = useState<SubCategoryMode>("none");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [subCategoryName, setSubCategoryName] = useState("");

  const [brandMode, setBrandMode] = useState<RelationMode>("existing");
  const [brandId, setBrandId] = useState("");
  const [brandName, setBrandName] = useState("");

  const [mrp, setMrp] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [profitType, setProfitType] = useState<ProfitType>("PERCENTAGE");
  const [profitValue, setProfitValue] = useState("");

  const [stock, setStock] = useState("0");
  const [stockStatus, setStockStatus] = useState<StockStatus>("IN_STOCK");
  const [isPublished, setIsPublished] = useState(true);

  const [mainImage, setMainImage] = useState<File | null>(null);
  const [hoverImage, setHoverImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [extraImages, setExtraImages] = useState<File[]>([]);

  const [mainPreview, setMainPreview] = useState("");
  const [hoverPreview, setHoverPreview] = useState("");
  const [videoPreview, setVideoPreview] = useState("");
  const [removedExtraImageIds, setRemovedExtraImageIds] = useState<string[]>([]);

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${accessToken}`,
    }),
    [accessToken]
  );

  const subCategories = useMemo(() => {
    return categories.find((category) => category.id === categoryId)?.subCategories || [];
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
    if (!accessToken) return;

    const loadData = async () => {
      try {
        const metaRes = await fetch(`${API_BASE}/api/v1/products/meta`);
        const metaData = await metaRes.json();

        if (metaData.success) {
          setCategories(metaData.categories || []);
          setBrands(metaData.brands || []);

          setCategoryId(metaData.categories?.[0]?.id || "");
          setBrandId(metaData.brands?.[0]?.id || "");

          if (!metaData.categories?.length) setCategoryMode("new");
          if (!metaData.brands?.length) setBrandMode("new");
        }

        if (isEdit && productId) {
          const productRes = await fetch(`${API_BASE}/api/v1/products/admin/${productId}`, {
            headers: authHeaders,
          });

          const productData = await productRes.json();

          if (!productData.success) {
            toast.error(productData.message || "Failed to load product");
            router.push(listHref);
            return;
          }

          const product: Product = productData.product;
          setInitialData(product);

          setName(product.name || "");
          setModelName(product.modelName || "");
          setShortDescription(product.shortDescription || "");
          setDescription(product.description || "");

          setCategoryMode("existing");
          setCategoryId(product.category?.id || metaData.categories?.[0]?.id || "");

          setSubCategoryMode(product.subCategory?.id ? "existing" : "none");
          setSubCategoryId(product.subCategory?.id || "");

          setBrandMode("existing");
          setBrandId(product.brand?.id || metaData.brands?.[0]?.id || "");

          setMrp(product.mrp?.toString() || "");
          setCostPrice(product.costPrice?.toString() || "");
          setProfitType(product.profitType || "PERCENTAGE");
          setProfitValue(product.profitValue?.toString() || "");

          if (typeof product.stock === "number") {
            setStock(product.stock.toString());
          }

          setStockStatus(product.stockStatus || "IN_STOCK");
          setIsPublished(product.isPublished ?? true);

          setMainPreview(product.mainImageUrl || "");
          setHoverPreview(product.hoverImageUrl || "");
          setVideoPreview(product.videoUrl || "");
        }
      } catch {
        toast.error("Error loading product form");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [accessToken, authHeaders, isEdit, listHref, productId, router]);

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
      const formData = new FormData();

      formData.append("name", name.trim());
      formData.append("modelName", modelName.trim());
      formData.append("shortDescription", shortDescription.trim());
      formData.append("description", description.trim());

      if (categoryMode === "existing") {
        formData.append("categoryId", categoryId);
      } else {
        formData.append("categoryName", categoryName.trim());
      }

      if (subCategoryMode === "existing") {
        formData.append("subCategoryId", subCategoryId);
      }

      if (subCategoryMode === "new") {
        formData.append("subCategoryName", subCategoryName.trim());
      }

      if (brandMode === "existing") {
        formData.append("brandId", brandId);
      } else {
        formData.append("brandName", brandName.trim());
      }

      formData.append("mrp", mrp || "0");
      formData.append("costPrice", costPrice || "0");
      formData.append("profitType", profitType);
      formData.append("profitValue", profitValue || "0");

      if (isAdmin) {
        formData.append("stock", stock || "0");
      }

      formData.append("stockStatus", stockStatus);
      formData.append("isPublished", String(isPublished));
      formData.append("removeExtraImageIds", JSON.stringify(removedExtraImageIds));

      if (mainImage) formData.append("mainImage", mainImage);
      if (hoverImage) formData.append("hoverImage", hoverImage);
      if (video) formData.append("video", video);
      extraImages.forEach((image) => formData.append("extraImages", image));

      const endpoint =
        isEdit && productId
          ? `${API_BASE}/api/v1/products/${productId}`
          : `${API_BASE}/api/v1/products`;

      const res = await fetch(endpoint, {
        method: isEdit ? "PATCH" : "POST",
        headers: authHeaders,
        body: formData,
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || "Failed to save product");
        return;
      }

      toast.success(isEdit ? "Product updated successfully" : "Product created successfully");
      router.push(listHref);
      router.refresh();
    } catch {
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Product Name *
                </label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                  placeholder="iPhone 15 Pro Max"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Model Name
                </label>
                <input
                  value={modelName}
                  onChange={(event) => setModelName(event.target.value)}
                  className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                  placeholder="A3108 / SM-S928B"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Stock Status *
                </label>
                <select
                  value={stockStatus}
                  onChange={(event) => setStockStatus(event.target.value as StockStatus)}
                  className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                >
                  {stockStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-300">
                    Category *
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setCategoryMode((prev) => (prev === "existing" ? "new" : "existing"))
                    }
                    className="text-xs font-semibold text-orange-400 hover:text-orange-300"
                  >
                    {categoryMode === "existing" ? "Add new" : "Use existing"}
                  </button>
                </div>

                {categoryMode === "existing" ? (
                  <select
                    value={categoryId}
                    onChange={(event) => setCategoryId(event.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={categoryName}
                    onChange={(event) => setCategoryName(event.target.value)}
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
                    onChange={(event) =>
                      setSubCategoryMode(event.target.value as SubCategoryMode)
                    }
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
                    onChange={(event) => setSubCategoryId(event.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                  >
                    <option value="">Select sub-category</option>
                    {subCategories.map((subCategory) => (
                      <option key={subCategory.id} value={subCategory.id}>
                        {subCategory.name}
                      </option>
                    ))}
                  </select>
                )}

                {subCategoryMode === "new" && (
                  <input
                    value={subCategoryName}
                    onChange={(event) => setSubCategoryName(event.target.value)}
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
                    onClick={() =>
                      setBrandMode((prev) => (prev === "existing" ? "new" : "existing"))
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
                    className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
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
                    className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="Type new brand name"
                  />
                )}
              </div>

              {isAdmin && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(event) => setStock(event.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="Only admin can see this"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Short Description
              </label>
              <textarea
                value={shortDescription}
                onChange={(event) => setShortDescription(event.target.value)}
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
                onChange={(event) => setDescription(event.target.value)}
                rows={6}
                className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                placeholder="Write product details, benefits, package info..."
              />
            </div>

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
                    onChange={(event) => setMrp(event.target.value)}
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
                    onChange={(event) => setCostPrice(event.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Profit Type *
                  </label>
                  <select
                    value={profitType}
                    onChange={(event) => setProfitType(event.target.value as ProfitType)}
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
                    onChange={(event) => setProfitValue(event.target.value)}
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
          </div>

          <div className="space-y-4">
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
                onChange={(event) =>
                  handleFilePreview(
                    event.target.files?.[0] || null,
                    setMainImage,
                    setMainPreview,
                    initialData?.mainImageUrl || ""
                  )
                }
              />
            </label>

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
                onChange={(event) =>
                  handleFilePreview(
                    event.target.files?.[0] || null,
                    setHoverImage,
                    setHoverPreview,
                    initialData?.hoverImageUrl || ""
                  )
                }
              />
            </label>

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
                onChange={(event) =>
                  handleFilePreview(
                    event.target.files?.[0] || null,
                    setVideo,
                    setVideoPreview,
                    initialData?.videoUrl || ""
                  )
                }
              />
            </label>

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

            <label className="block rounded-2xl border border-dashed border-gray-700 bg-black p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">
                  Extra Images
                </span>
                <span className="text-xs text-gray-500">JPG/PNG/WEBP multiple</span>
              </div>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => handleExtraImagesChange(event.target.files)}
                className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-600 file:px-3 file:py-2 file:text-white"
              />

              {extraImages.length > 0 && (
                <p className="mt-2 text-xs text-orange-400">
                  {extraImages.length} new extra image(s) selected
                </p>
              )}
            </label>

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