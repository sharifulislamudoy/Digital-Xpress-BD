"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ProductCategory } from "@/types/product";

type QuickCreateType = "category" | "subCategory" | "brand";

interface QuickCreateModalProps {
  isOpen: boolean;
  type: QuickCreateType;
  categories: ProductCategory[];
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (payload: { name: string; categoryId?: string }) => void;
}

const titleMap: Record<QuickCreateType, string> = {
  category: "Create Category",
  subCategory: "Create Sub-category",
  brand: "Create Brand",
};

export default function QuickCreateModal({
  isOpen,
  type,
  categories,
  isLoading = false,
  onClose,
  onConfirm,
}: QuickCreateModalProps) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName("");
      setCategoryId(categories[0]?.id || "");
    }
  }, [isOpen, categories]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onConfirm({ name: name.trim(), categoryId: type === "subCategory" ? categoryId : undefined });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[230] flex items-center justify-center bg-black/80 p-4"
          onClick={isLoading ? undefined : onClose}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-950 p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{titleMap[type]}</h2>
              <button
                type="button"
                disabled={isLoading}
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full bg-gray-900 text-gray-300 hover:text-white disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {type === "subCategory" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Parent Category</label>
                  <select
                    value={categoryId}
                    onChange={(event) => setCategoryId(event.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none focus:border-orange-500"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Name</label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Type name"
                  className="w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-white outline-none placeholder:text-gray-600 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-xl bg-gray-800 px-4 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || !name.trim() || (type === "subCategory" && !categoryId)}
                className="rounded-xl bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {isLoading ? "Saving..." : "Create"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
