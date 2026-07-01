"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FaEdit,
  FaImage,
  FaPlus,
  FaSave,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import type { ProductCategory, ProductSubCategory } from "@/types/product";

interface CategoryManagementProps {
  panelType: "admin" | "moderator";
}

type ManagedSubCategory = ProductSubCategory & {
  productCount?: number;
};

type ManagedCategory = ProductCategory & {
  productCount?: number;
  subCategories?: ManagedSubCategory[];
};

type CategoryFormState = {
  name: string;
  slug: string;
  description: string;
  iconSvg: string;
  sortOrder: string;
  isPublished: boolean;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  removeImage: boolean;
};

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

const inputClass =
  "w-full rounded-xl border border-gray-800 bg-black px-3 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-orange-500";
const textareaClass = `${inputClass} min-h-[90px] resize-y`;
const labelClass = "mb-2 block text-sm font-medium text-gray-300";

const defaultForm: CategoryFormState = {
  name: "",
  slug: "",
  description: "",
  iconSvg: "",
  sortOrder: "0",
  isPublished: true,
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  removeImage: false,
};

export default function CategoryManagement({
  panelType,
}: CategoryManagementProps) {
  const { data: session } = useSession();
  const accessToken = (session?.user as any)?.accessToken;

  const [categories, setCategories] = useState<ManagedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ManagedCategory | null>(null);
  const [categoryForm, setCategoryForm] =
    useState<CategoryFormState>(defaultForm);
  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const [categoryPreview, setCategoryPreview] = useState("");

  const [subCategoryFormOpen, setSubCategoryFormOpen] = useState(false);
  const [subCategoryParentId, setSubCategoryParentId] = useState("");
  const [editingSubCategory, setEditingSubCategory] =
    useState<ManagedSubCategory | null>(null);
  const [subCategoryForm, setSubCategoryForm] =
    useState<CategoryFormState>(defaultForm);
  const [subCategoryImage, setSubCategoryImage] = useState<File | null>(null);
  const [subCategoryPreview, setSubCategoryPreview] = useState("");
  const [pendingReset, setPendingReset] = useState<
    "category" | "subCategory" | null
  >(null);

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${accessToken}`,
    }),
    [accessToken],
  );

  const fetchCategories = useCallback(async () => {
    if (!accessToken) return;

    try {
      if (!API_BASE) {
        toast.error("NEXT_PUBLIC_BACKEND_URL is missing");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/v1/categories/admin`, {
        headers: authHeaders,
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to load categories");
        return;
      }

      setCategories(data.categories || []);
    } catch (error) {
      console.error(error);
      toast.error("Error loading categories");
    } finally {
      setLoading(false);
    }
  }, [accessToken, authHeaders]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  function resetCategoryForm() {
    setEditingCategory(null);
    setCategoryForm(defaultForm);
    setCategoryImage(null);
    setCategoryPreview("");
  }

  function resetSubCategoryForm() {
    setEditingSubCategory(null);
    setSubCategoryParentId("");
    setSubCategoryForm(defaultForm);
    setSubCategoryImage(null);
    setSubCategoryPreview("");
  }

  function handleFormExitComplete() {
    if (pendingReset === "category") {
      resetCategoryForm();
    }

    if (pendingReset === "subCategory") {
      resetSubCategoryForm();
    }

    setPendingReset(null);
  }

  function closeCategoryForm() {
    setCategoryFormOpen(false);
    setPendingReset("category");
  }

  function closeSubCategoryForm() {
    setSubCategoryFormOpen(false);
    setPendingReset("subCategory");
  }

  function openCreateCategory() {
    resetCategoryForm();
    setCategoryFormOpen(true);

    if (subCategoryFormOpen) {
      setSubCategoryFormOpen(false);
      setPendingReset("subCategory");
    } else {
      setPendingReset(null);
    }
  }

  function openEditCategory(category: ManagedCategory) {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
      iconSvg: category.iconSvg || "",
      sortOrder: String(category.sortOrder ?? 0),
      isPublished: category.isPublished ?? true,
      seoTitle: category.seoTitle || "",
      seoDescription: category.seoDescription || "",
      seoKeywords: (category.seoKeywords || []).join(", "),
      removeImage: false,
    });
    setCategoryImage(null);
    setCategoryPreview(category.imageUrl || "");
    setCategoryFormOpen(true);

    if (subCategoryFormOpen) {
      setSubCategoryFormOpen(false);
      setPendingReset("subCategory");
    } else {
      setPendingReset(null);
    }
  }

  function openCreateSubCategory(categoryId: string) {
    resetSubCategoryForm();
    setSubCategoryParentId(categoryId);
    setSubCategoryFormOpen(true);

    if (categoryFormOpen) {
      setCategoryFormOpen(false);
      setPendingReset("category");
    } else {
      setPendingReset(null);
    }
  }

  function openEditSubCategory(
    categoryId: string,
    subCategory: ManagedSubCategory,
  ) {
    setEditingSubCategory(subCategory);
    setSubCategoryParentId(categoryId);
    setSubCategoryForm({
      name: subCategory.name || "",
      slug: subCategory.slug || "",
      description: subCategory.description || "",
      iconSvg: subCategory.iconSvg || "",
      sortOrder: String(subCategory.sortOrder ?? 0),
      isPublished: subCategory.isPublished ?? true,
      seoTitle: subCategory.seoTitle || "",
      seoDescription: subCategory.seoDescription || "",
      seoKeywords: (subCategory.seoKeywords || []).join(", "),
      removeImage: false,
    });
    setSubCategoryImage(null);
    setSubCategoryPreview(subCategory.imageUrl || "");
    setSubCategoryFormOpen(true);

    if (categoryFormOpen) {
      setCategoryFormOpen(false);
      setPendingReset("category");
    } else {
      setPendingReset(null);
    }
  }

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void,
    previewSetter: (value: string) => void,
  ) {
    const file = event.target.files?.[0] || null;

    if (file && !file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      event.target.value = "";
      setter(null);
      previewSetter("");
      return;
    }

    setter(file);
    previewSetter(file ? URL.createObjectURL(file) : "");
  }

  function appendCommonFormData(formData: FormData, form: CategoryFormState) {
    formData.append("name", form.name.trim());
    formData.append("slug", form.slug.trim());
    formData.append("description", form.description.trim());
    formData.append("iconSvg", form.iconSvg.trim());
    formData.append("sortOrder", form.sortOrder.trim());
    formData.append("isPublished", String(form.isPublished));
    formData.append("seoTitle", form.seoTitle.trim());
    formData.append("seoDescription", form.seoDescription.trim());
    formData.append("seoKeywords", form.seoKeywords.trim());
    formData.append("removeImage", String(form.removeImage));
  }

  async function handleSaveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!categoryForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    if (!accessToken) {
      toast.error("You are not authorized");
      return;
    }

    if (!API_BASE) {
      toast.error("NEXT_PUBLIC_BACKEND_URL is missing");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();
      appendCommonFormData(formData, categoryForm);

      if (categoryImage) {
        formData.append("categoryImage", categoryImage, categoryImage.name);
      }

      const endpoint = editingCategory
        ? `${API_BASE}/api/v1/categories/${editingCategory.id}`
        : `${API_BASE}/api/v1/categories`;

      const res = await fetch(endpoint, {
        method: editingCategory ? "PATCH" : "POST",
        headers: authHeaders,
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to save category");
        return;
      }

      toast.success(
        editingCategory
          ? "Category updated successfully"
          : "Category created successfully",
      );

      closeCategoryForm();
      await fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error("Error saving category");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSubCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!subCategoryParentId) {
      toast.error("Parent category is required");
      return;
    }

    if (!subCategoryForm.name.trim()) {
      toast.error("Sub-category name is required");
      return;
    }

    if (!accessToken) {
      toast.error("You are not authorized");
      return;
    }

    if (!API_BASE) {
      toast.error("NEXT_PUBLIC_BACKEND_URL is missing");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();
      appendCommonFormData(formData, subCategoryForm);

      if (subCategoryImage) {
        formData.append(
          "subCategoryImage",
          subCategoryImage,
          subCategoryImage.name,
        );
      }

      const endpoint = editingSubCategory
        ? `${API_BASE}/api/v1/categories/sub-categories/${editingSubCategory.id}`
        : `${API_BASE}/api/v1/categories/${subCategoryParentId}/sub-categories`;

      const res = await fetch(endpoint, {
        method: editingSubCategory ? "PATCH" : "POST",
        headers: authHeaders,
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to save sub-category");
        return;
      }

      toast.success(
        editingSubCategory
          ? "Sub-category updated successfully"
          : "Sub-category created successfully",
      );

      closeSubCategoryForm();
      await fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error("Error saving sub-category");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCategory(category: ManagedCategory) {
    const ok = window.confirm(
      `Delete category "${category.name}"? Category with products cannot be deleted.`,
    );

    if (!ok) return;

    if (!accessToken || !API_BASE) {
      toast.error("Missing auth or API URL");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/categories/${category.id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to delete category");
        return;
      }

      toast.success("Category deleted successfully");
      await fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error("Error deleting category");
    }
  }

  async function handleDeleteSubCategory(subCategory: ManagedSubCategory) {
    const ok = window.confirm(
      `Delete sub-category "${subCategory.name}"? Products under it will keep category, but sub-category will be removed.`,
    );

    if (!ok) return;

    if (!accessToken || !API_BASE) {
      toast.error("Missing auth or API URL");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/v1/categories/sub-categories/${subCategory.id}`,
        {
          method: "DELETE",
          headers: authHeaders,
        },
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to delete sub-category");
        return;
      }

      toast.success("Sub-category deleted successfully");
      await fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error("Error deleting sub-category");
    }
  }

  const selectedSubCategoryParent = categories.find(
    (category) => category.id === subCategoryParentId,
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-gray-400">Loading categories...</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Category Management {panelType === "moderator" ? "(Moderator)" : ""}
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Category and sub-category create/edit/delete korar separate page.
          </p>
        </div>

        <motion.button
          type="button"
          onClick={openCreateCategory}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
        >
          <FaPlus size={13} />
          Create Category
        </motion.button>
      </div>

      <AnimatePresence
        mode="wait"
        initial={false}
        onExitComplete={handleFormExitComplete}
      >
        {categoryFormOpen ? (
          <FormCard
            key="category-form"
            title={editingCategory ? "Edit Category" : "Create Category"}
            onClose={closeCategoryForm}
          >
            <form onSubmit={handleSaveCategory} className="space-y-5">
              <CommonFields
                form={categoryForm}
                setForm={setCategoryForm}
                imagePreview={categoryPreview}
                imageLabel="Category Image"
                onImageChange={(event) =>
                  handleImageChange(event, setCategoryImage, setCategoryPreview)
                }
              />

              <div className="flex justify-end gap-3 border-t border-gray-800 pt-5">
                <CancelButton onClick={closeCategoryForm} />
                <SaveButton loading={saving}>
                  {editingCategory ? "Update Category" : "Create Category"}
                </SaveButton>
              </div>
            </form>
          </FormCard>
        ) : subCategoryFormOpen ? (
          <FormCard
            key="sub-category-form"
            title={
              editingSubCategory ? "Edit Sub-category" : "Create Sub-category"
            }
            subtitle={
              selectedSubCategoryParent
                ? `Parent category: ${selectedSubCategoryParent.name}`
                : ""
            }
            onClose={closeSubCategoryForm}
          >
            <form onSubmit={handleSaveSubCategory} className="space-y-5">
              <CommonFields
                form={subCategoryForm}
                setForm={setSubCategoryForm}
                imagePreview={subCategoryPreview}
                imageLabel="Sub-category Image"
                onImageChange={(event) =>
                  handleImageChange(
                    event,
                    setSubCategoryImage,
                    setSubCategoryPreview,
                  )
                }
              />

              <div className="flex justify-end gap-3 border-t border-gray-800 pt-5">
                <CancelButton onClick={closeSubCategoryForm} />
                <SaveButton loading={saving}>
                  {editingSubCategory
                    ? "Update Sub-category"
                    : "Create Sub-category"}
                </SaveButton>
              </div>
            </form>
          </FormCard>
        ) : null}
      </AnimatePresence>

      <div className="overflow-x-auto rounded-2xl border border-gray-800 bg-[#0a0a0a]">
        <table className="w-full divide-y divide-gray-800">
          <thead className="bg-gray-950">
            <tr>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase text-gray-400">
                Category Name
              </th>
              <th className="px-4 py-3 text-center text-[11px] font-medium uppercase text-gray-400">
                Category Products
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase text-gray-400">
                Sub-category Name
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase text-gray-400">
                Sub-category Products
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-medium uppercase text-gray-400">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-800">
            {categories.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-gray-400"
                >
                  No category found. Create your first category.
                </td>
              </tr>
            ) : (
              categories.map((category) => {
                const subCategories = category.subCategories || [];

                return (
                  <tr key={category.id} className="align-top hover:bg-gray-950">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <PreviewBox
                          imageUrl={category.imageUrl}
                          iconSvg={category.iconSvg}
                          name={category.name}
                        />

                        <div>
                          <p className="font-semibold text-white">
                            {category.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            /{category.slug}
                          </p>
                          <p
                            className={`mt-1 text-[10px] font-semibold ${
                              category.isPublished
                                ? "text-green-400"
                                : "text-gray-500"
                            }`}
                          >
                            {category.isPublished ? "Published" : "Hidden"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-sm font-bold text-orange-300">
                        {category.productCount || 0}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      {subCategories.length === 0 ? (
                        <span className="text-sm text-gray-500">
                          No sub-category
                        </span>
                      ) : (
                        <div className="space-y-2">
                          {subCategories.map((subCategory) => (
                            <div
                              key={subCategory.id}
                              className="flex items-center justify-between gap-3 rounded-xl border border-gray-800 bg-black px-3 py-2"
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <PreviewBox
                                  imageUrl={subCategory.imageUrl}
                                  iconSvg={subCategory.iconSvg}
                                  name={subCategory.name}
                                  small
                                />

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-gray-200">
                                    {subCategory.name}
                                  </p>
                                  <p className="truncate text-[10px] text-gray-500">
                                    /{subCategory.slug}
                                  </p>
                                </div>
                              </div>

                              <div className="flex shrink-0 gap-1">
                                <motion.button
                                  type="button"
                                  onClick={() =>
                                    openEditSubCategory(
                                      category.id,
                                      subCategory,
                                    )
                                  }
                                  whileTap={{ scale: 0.92 }}
                                  transition={{ duration: 0.16, ease: "easeOut" }}
                                  className="rounded-lg border border-gray-700 p-2 text-gray-300 transition hover:border-orange-500 hover:text-orange-400"
                                  title="Edit sub-category"
                                >
                                  <FaEdit size={12} />
                                </motion.button>

                                <motion.button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteSubCategory(subCategory)
                                  }
                                  whileTap={{ scale: 0.92 }}
                                  transition={{ duration: 0.16, ease: "easeOut" }}
                                  className="rounded-lg border border-red-500/30 p-2 text-red-400 transition hover:bg-red-500/10"
                                  title="Delete sub-category"
                                >
                                  <FaTrash size={12} />
                                </motion.button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {subCategories.length === 0 ? (
                        <span className="text-sm text-gray-500">0</span>
                      ) : (
                        <div className="space-y-2">
                          {subCategories.map((subCategory) => (
                            <div
                              key={subCategory.id}
                              className="rounded-xl border border-gray-800 bg-black px-3 py-3 text-sm font-semibold text-gray-200"
                            >
                              {subCategory.name}:{" "}
                              <span className="text-orange-400">
                                {subCategory.productCount || 0}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <motion.button
                          type="button"
                          onClick={() => openEditCategory(category)}
                          whileTap={{ scale: 0.96 }}
                          transition={{ duration: 0.16, ease: "easeOut" }}
                          className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 py-2 text-xs font-semibold text-gray-200 transition hover:border-orange-500 hover:text-orange-400"
                        >
                          <FaEdit size={12} />
                          Edit
                        </motion.button>

                        <motion.button
                          type="button"
                          onClick={() => openCreateSubCategory(category.id)}
                          whileTap={{ scale: 0.96 }}
                          transition={{ duration: 0.16, ease: "easeOut" }}
                          className="inline-flex items-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-xs font-semibold text-orange-300 transition hover:bg-orange-500/20"
                        >
                          <FaPlus size={12} />
                          Sub
                        </motion.button>

                        <motion.button
                          type="button"
                          onClick={() => handleDeleteCategory(category)}
                          whileTap={{ scale: 0.96 }}
                          transition={{ duration: 0.16, ease: "easeOut" }}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10"
                        >
                          <FaTrash size={12} />
                          Delete
                        </motion.button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CommonFields({
  form,
  setForm,
  imagePreview,
  imageLabel,
  onImageChange,
}: {
  form: CategoryFormState;
  setForm: React.Dispatch<React.SetStateAction<CategoryFormState>>;
  imagePreview: string;
  imageLabel: string;
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const setField = <K extends keyof CategoryFormState>(
    field: K,
    value: CategoryFormState[K],
  ) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField
        label="Name"
        required
        value={form.name}
        onChange={(value) => setField("name", value)}
        placeholder="Mobile Phones"
      />

      <TextField
        label="Slug"
        value={form.slug}
        onChange={(value) => setField("slug", value)}
        placeholder="Auto generated if empty"
      />

      <TextField
        label="Sort Order"
        type="number"
        value={form.sortOrder}
        onChange={(value) => setField("sortOrder", value)}
      />

      <SwitchField
        label="Published"
        checked={form.isPublished}
        onChange={(value) => setField("isPublished", value)}
      />

      <div className="md:col-span-2">
        <TextAreaField
          label="Description"
          value={form.description}
          onChange={(value) => setField("description", value)}
          placeholder="Write category description"
        />
      </div>

      <div>
        <label className={labelClass}>{imageLabel}</label>

        <label className="grid min-h-[170px] cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed border-gray-700 bg-gray-950 p-4 transition hover:border-orange-500/70">
          {imagePreview ? (
            <img
              src={imagePreview}
              alt={imageLabel}
              className="h-40 w-full object-contain"
            />
          ) : (
            <span className="flex items-center gap-2 text-sm text-gray-500">
              <FaImage size={14} />
              Click to upload image
            </span>
          )}

          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onImageChange}
          />
        </label>

        {imagePreview && (
          <motion.button
            type="button"
            onClick={() => setField("removeImage", true)}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="mt-2 text-xs font-semibold text-red-400 hover:text-red-300"
          >
            Remove saved image on update
          </motion.button>
        )}

        {form.removeImage && (
          <p className="mt-1 text-xs text-red-300">
            Image will be removed after save.
          </p>
        )}
      </div>

      <TextAreaField
        label="Inline SVG Icon"
        value={form.iconSvg}
        onChange={(value) => setField("iconSvg", value)}
        placeholder="Paste safe <svg> icon here"
        mono
      />

      <TextField
        label="SEO Title"
        value={form.seoTitle}
        onChange={(value) => setField("seoTitle", value)}
      />

      <TextField
        label="SEO Keywords"
        value={form.seoKeywords}
        onChange={(value) => setField("seoKeywords", value)}
        placeholder="Comma separated"
      />

      <div className="md:col-span-2">
        <TextAreaField
          label="SEO Description"
          value={form.seoDescription}
          onChange={(value) => setField("seoDescription", value)}
        />
      </div>
    </div>
  );
}

function FormCard({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -18, scale: 0.985, height: 0 }}
      animate={{ opacity: 1, y: 0, scale: 1, height: "auto" }}
      exit={{ opacity: 0, y: -14, scale: 0.985, height: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="mb-6 overflow-hidden rounded-2xl border border-gray-800 bg-[#0a0a0a] shadow-xl"
    >
      <div className="p-5">
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-gray-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>

          <motion.button
            type="button"
            onClick={onClose}
            whileTap={{ scale: 0.92 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="rounded-xl border border-gray-700 p-2 text-gray-300 transition hover:border-red-400 hover:text-red-300"
          >
            <FaTimes size={14} />
          </motion.button>
        </div>

        {children}
      </div>
    </motion.div>
  );
}

function PreviewBox({
  imageUrl,
  iconSvg,
  name,
  small,
}: {
  imageUrl?: string | null;
  iconSvg?: string | null;
  name: string;
  small?: boolean;
}) {
  return (
    <div
      className={`grid shrink-0 place-items-center overflow-hidden rounded-lg border border-gray-800 bg-black ${
        small ? "h-9 w-9" : "h-12 w-12"
      }`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-contain p-1"
        />
      ) : iconSvg ? (
        <span
          className="text-orange-400 [&_svg]:h-5 [&_svg]:w-5"
          dangerouslySetInnerHTML={{ __html: iconSvg }}
        />
      ) : (
        <span className="text-[9px] text-gray-600">No img</span>
      )}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
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
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`${textareaClass} ${mono ? "font-mono text-xs" : ""}`}
      />
    </div>
  );
}

function SwitchField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={() => onChange(!checked)}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="flex w-full items-center justify-between rounded-xl border border-gray-800 bg-gray-950 px-4 py-3 text-left transition hover:border-orange-500/70"
    >
      <span className="text-sm font-medium text-gray-200">{label}</span>

      <span
        className={`relative h-7 w-12 rounded-full transition-colors duration-200 ${
          checked ? "bg-orange-500" : "bg-gray-700"
        }`}
      >
        <motion.span
          animate={{ x: checked ? 24 : 4 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute left-0 top-1 h-5 w-5 rounded-full bg-white"
        />
      </span>
    </motion.button>
  );
}

function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="rounded-xl bg-gray-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-700"
    >
      Cancel
    </motion.button>
  );
}

function SaveButton({
  children,
  loading,
}: {
  children: React.ReactNode;
  loading: boolean;
}) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <FaSave size={13} />
      {loading ? "Saving..." : children}
    </motion.button>
  );
}