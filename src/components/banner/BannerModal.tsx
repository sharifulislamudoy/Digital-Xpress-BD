"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaUpload } from "react-icons/fa";

export interface BannerFormData {
  image: File | null;
  productLink: string;
  isPublished: boolean;
}

interface BannerModalProps {
  isOpen: boolean;
  title: string;
  initialData?: {
    imageUrl?: string;
    productLink?: string | null;
    isPublished?: boolean;
  } | null;
  isEdit?: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (data: BannerFormData) => void;
}

export default function BannerModal({
  isOpen,
  title,
  initialData,
  isEdit = false,
  isLoading = false,
  onClose,
  onConfirm,
}: BannerModalProps) {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [productLink, setProductLink] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setImage(null);
      setPreview(initialData?.imageUrl || "");
      setProductLink(initialData?.productLink || "");
      setIsPublished(initialData?.isPublished ?? true);
    }
  }, [isOpen, initialData]);

  const handleImageChange = (file: File | null) => {
    setImage(file);

    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreview(imageUrl);
    } else {
      setPreview(initialData?.imageUrl || "");
    }
  };

  const handleSubmit = () => {
    if (!isEdit && !image) return;

    onConfirm({
      image,
      productLink,
      isPublished,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[220] bg-black/80 flex items-center justify-center p-4"
          onClick={isLoading ? undefined : onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className="bg-gray-900 rounded-xl max-w-xl w-full border border-gray-700 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="text-gray-400 hover:text-white transition disabled:opacity-50"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Banner Image {!isEdit && <span className="text-red-400">*</span>}
                </label>

                <label className="flex flex-col items-center justify-center w-full min-h-[170px] border-2 border-dashed border-gray-700 rounded-xl cursor-pointer bg-gray-800/60 hover:bg-gray-800 transition overflow-hidden">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Banner preview"
                      className="w-full h-[170px] object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <FaUpload size={28} />
                      <span className="text-sm">Click to upload banner image</span>
                      <span className="text-xs text-gray-500">PNG, JPG, WEBP. Max 5MB.</span>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isLoading}
                    onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Product Link <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  type="text"
                  value={productLink}
                  onChange={(e) => setProductLink(e.target.value)}
                  disabled={isLoading}
                  placeholder="/products/product-id or full URL"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                />
              </div>

              {isEdit && (
                <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-white font-medium">Published Status</p>
                    <p className="text-gray-400 text-sm">
                      Turn off if you want to hide this banner.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setIsPublished((prev) => !prev)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition disabled:opacity-50 ${
                      isPublished ? "bg-orange-500" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                        isPublished ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-gray-700">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={isLoading || (!isEdit && !image)}
                className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition disabled:opacity-50"
              >
                {isLoading ? "Processing..." : isEdit ? "Update Banner" : "Create Banner"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}