"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Product, ProductBrand, ProductCategory, ProfitType } from "@/types/product";
import { formatPrice } from "@/lib/formatPrice";

interface ProductModalProps {
  isOpen: boolean;
  title: string;
  initialData?: Product | null;
  categories: ProductCategory[];
  brands: ProductBrand[];
  isEdit?: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (formData: FormData) => void;
}

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function ProductModal({
  isOpen,
  title,
  initialData,
  categories,
  brands,
  isEdit = false,
  isLoading = false,
  onClose,
  onConfirm,
}: ProductModalProps) {
  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [mrp, setMrp] = useState("");              // NEW
  const [costPrice, setCostPrice] = useState("");
  const [profitType, setProfitType] = useState<ProfitType>("PERCENTAGE");
  const [profitValue, setProfitValue] = useState("");
  const [stock, setStock] = useState("0");
  const [isPublished, setIsPublished] = useState(true);

  const [mainImage, setMainImage] = useState<File | null>(null);
  const [hoverImage, setHoverImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [extraImages, setExtraImages] = useState<File[]>([]);

  const [mainPreview, setMainPreview] = useState("");
  const [hoverPreview, setHoverPreview] = useState("");
  const [videoPreview, setVideoPreview] = useState("");
  const [removedExtraImageIds, setRemovedExtraImageIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setName(initialData?.name || "");
    setShortDescription(initialData?.shortDescription || "");
    setDescription(initialData?.description || "");
    setCategoryId(initialData?.category?.id || categories[0]?.id || "");
    setSubCategoryId(initialData?.subCategory?.id || "");
    setBrandId(initialData?.brand?.id || brands[0]?.id || "");
    setMrp(initialData?.mrp?.toString() || "");
    setCostPrice(initialData?.costPrice?.toString() || "");
    setProfitType(initialData?.profitType || "PERCENTAGE");
    setProfitValue(initialData?.profitValue?.toString() || "");
    setStock(initialData?.stock?.toString() || "0");
    setIsPublished(initialData?.isPublished ?? true);

    setMainImage(null);
    setHoverImage(null);
    setVideo(null);
    setExtraImages([]);
    setMainPreview(initialData?.mainImageUrl || "");
    setHoverPreview(initialData?.hoverImageUrl || "");
    setVideoPreview(initialData?.videoUrl || "");
    setRemovedExtraImageIds([]);
  }, [isOpen, initialData, categories, brands]);

  const subCategories = useMemo(() => {
    return categories.find((c) => c.id === categoryId)?.subCategories || [];
  }, [categories, categoryId]);

  useEffect(() => {
    if (subCategoryId && !subCategories.some((sc) => sc.id === subCategoryId)) {
      setSubCategoryId("");
    }
  }, [subCategories, subCategoryId]);

  const calculatedSellingPrice = useMemo(() => {
    const cost = numberValue(costPrice);
    const profit = numberValue(profitValue);
    return profitType === "FIXED" ? cost + profit : cost + (cost * profit) / 100;
  }, [costPrice, profitValue, profitType]);

  const handleFilePreview = (
    file: File | null,
    setter: (f: File | null) => void,
    previewSetter: (url: string) => void,
    fallback = ""
  ) => {
    setter(file);
    previewSetter(file ? URL.createObjectURL(file) : fallback);
  };

  // Append extra images instead of replacing
  const handleExtraImagesChange = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setExtraImages((prev) => [...prev, ...newFiles]);
  };

  const toggleRemoveExtraImage = (id: string) => {
    setRemovedExtraImageIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (!description.trim()) return;
    if (!categoryId) return;
    if (!brandId) return;
    if (!isEdit && !mainImage) return;

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("shortDescription", shortDescription.trim());
    formData.append("description", description.trim());
    formData.append("categoryId", categoryId);
    formData.append("subCategoryId", subCategoryId);
    formData.append("brandId", brandId);
    formData.append("mrp", mrp || "0");
    formData.append("costPrice", costPrice || "0");
    formData.append("profitType", profitType);
    formData.append("profitValue", profitValue || "0");
    formData.append("stock", stock || "0");
    formData.append("isPublished", String(isPublished));
    formData.append("removeExtraImageIds", JSON.stringify(removedExtraImageIds));

    if (mainImage) formData.append("mainImage", mainImage);
    if (hoverImage) formData.append("hoverImage", hoverImage);
    if (video) formData.append("video", video);
    extraImages.forEach((image) => formData.append("extraImages", image));

    onConfirm(formData);
  };

  const visibleExistingExtraImages = initialData?.extraImages || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/80 p-4"
          onClick={isLoading ? undefined : onClose}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-gray-800 bg-gray-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-950/95 p-5 backdrop-blur">
              <div>
                <h2 className="text-xl font-bold text-white">{title}</h2>
                <p className="text-sm text-gray-500">Main image required. Hover, video, extra images optional.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="grid h-10 w-10 place-items-center rounded-full bg-gray-900 text-gray-300 hover:text-white disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-300">Product Name *</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                      placeholder="iPhone 15 Pro Max"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">Category *</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">Sub-category</label>
                    <select
                      value={subCategoryId}
                      onChange={(e) => setSubCategoryId(e.target.value)}
                      className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                    >
                      <option value="">No sub-category</option>
                      {subCategories.map((sc) => (
                        <option key={sc.id} value={sc.id}>{sc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">Brand *</label>
                    <select
                      value={brandId}
                      onChange={(e) => setBrandId(e.target.value)}
                      className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                    >
                      <option value="">Select brand</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">Stock *</label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Short Description</label>
                  <textarea
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="Small summary shown on product details page"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Full Description *</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                    placeholder="Write product details, benefits, package info..."
                  />
                </div>

                <div className="rounded-2xl border border-gray-800 bg-black p-4">
                  <h3 className="mb-4 font-semibold text-orange-400">Pricing</h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">MRP *</label>
                      <input
                        type="number"
                        value={mrp}
                        onChange={(e) => setMrp(e.target.value)}
                        className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">Cost Price *</label>
                      <input
                        type="number"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                        className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-white outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">Profit Type *</label>
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
                      <label className="mb-2 block text-sm font-medium text-gray-300">Profit Value *</label>
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
                    <p className="text-2xl font-bold text-orange-400">{formatPrice(calculatedSellingPrice)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Main Image */}
                <label className="block rounded-2xl border border-dashed border-gray-700 bg-black p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300">Main Image {!isEdit && "*"}</span>
                    <span className="text-xs text-gray-500">JPG/PNG/WEBP</span>
                  </div>
                  <div className="grid min-h-[180px] place-items-center overflow-hidden rounded-xl bg-gray-950">
                    {mainPreview ? (
                      <img src={mainPreview} alt="Main preview" className="h-48 w-full object-contain p-3" />
                    ) : (
                      <span className="text-sm text-gray-500">Click to upload main image</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleFilePreview(e.target.files?.[0] || null, setMainImage, setMainPreview, initialData?.mainImageUrl || "")
                    }
                  />
                </label>

                {/* Hover Image */}
                <label className="block rounded-2xl border border-dashed border-gray-700 bg-black p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300">Hover Image</span>
                    <span className="text-xs text-gray-500">Shows on card hover</span>
                  </div>
                  <div className="grid min-h-[140px] place-items-center overflow-hidden rounded-xl bg-gray-950">
                    {hoverPreview ? (
                      <img src={hoverPreview} alt="Hover preview" className="h-40 w-full object-contain p-3" />
                    ) : (
                      <span className="text-sm text-gray-500">Click to upload hover image</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleFilePreview(e.target.files?.[0] || null, setHoverImage, setHoverPreview, initialData?.hoverImageUrl || "")
                    }
                  />
                </label>

                {/* Video */}
                <label className="block rounded-2xl border border-dashed border-gray-700 bg-black p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300">Product Video</span>
                    <span className="text-xs text-gray-500">Optional</span>
                  </div>
                  <div className="grid min-h-[120px] place-items-center overflow-hidden rounded-xl bg-gray-950">
                    {videoPreview ? (
                      <video src={videoPreview} className="h-36 w-full object-contain" controls muted />
                    ) : (
                      <span className="text-sm text-gray-500">Click to upload product video</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) =>
                      handleFilePreview(e.target.files?.[0] || null, setVideo, setVideoPreview, initialData?.videoUrl || "")
                    }
                  />
                </label>

                {/* Existing Extra Images with remove toggle */}
                {visibleExistingExtraImages.length > 0 && (
                  <div className="rounded-2xl border border-gray-800 bg-black p-4">
                    <p className="mb-3 text-sm font-medium text-gray-300">Existing Extra Images</p>
                    <div className="grid grid-cols-3 gap-3">
                      {visibleExistingExtraImages.map((img) => {
                        const removed = removedExtraImageIds.includes(img.id);
                        return (
                          <button
                            type="button"
                            key={img.id}
                            onClick={() => toggleRemoveExtraImage(img.id)}
                            className={`relative overflow-hidden rounded-xl border ${removed ? "border-red-500 opacity-40" : "border-gray-800"}`}
                          >
                            <img src={img.imageUrl} alt="Extra" className="h-20 w-full object-contain p-2" />
                            <span className="absolute bottom-1 left-1 right-1 rounded bg-black/70 py-1 text-[10px] text-white">
                              {removed ? "Will remove" : "Click remove"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Extra Images (append mode) */}
                <label className="block rounded-2xl border border-dashed border-gray-700 bg-black p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300">Extra Images (max 20)</span>
                    <span className="text-xs text-gray-500">JPG/PNG/WEBP (multiple)</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleExtraImagesChange(e.target.files)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-3 text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-600 file:px-3 file:py-2 file:text-white"
                  />
                  {extraImages.length > 0 && (
                    <p className="mt-2 text-xs text-orange-400">{extraImages.length} new extra image(s) selected</p>
                  )}
                </label>

                <div className="flex items-center justify-between rounded-2xl border border-gray-800 bg-black p-4">
                  <div>
                    <p className="font-medium text-white">Published Status</p>
                    <p className="text-sm text-gray-500">Hide product from frontend when off.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPublished((p) => !p)}
                    className={`relative h-7 w-12 rounded-full transition ${isPublished ? "bg-orange-500" : "bg-gray-700"}`}
                  >
                    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${isPublished ? "left-6" : "left-1"}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-800 bg-gray-950/95 p-5 backdrop-blur">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-xl bg-gray-800 px-5 py-3 text-white hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  isLoading ||
                  !name.trim() ||
                  !description.trim() ||
                  !categoryId ||
                  !brandId ||
                  (!isEdit && !mainImage)
                }
                className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {isLoading ? "Processing..." : isEdit ? "Update Product" : "Create Product"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}