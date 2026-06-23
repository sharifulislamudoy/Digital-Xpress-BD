"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import type { Product, ProductBrand, ProductCategory } from "@/types/product";
import { priceRanges } from "@/types/product";
import CollapsibleSection from "@/components/products/CollapsibleSection";
import ProductCard from "@/components/products/ProductCard";
import ProductCategoryPageSkeleton from "@/components/products/ProductCategoryPageSkeleton";

const productsPerPage = 9;
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

interface ProductCategoryPageProps {
  categoryKey: string;
}

type SubCategoryFilter = {
  id: string;
  name: string;
  slug: string;
};

function slugify(value: unknown) {
  if (!value) return "";

  return String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isSameSlug(a: unknown, b: unknown) {
  return slugify(a) === slugify(b);
}

function getCategorySlugFromProduct(product: Product) {
  return slugify(product.category?.slug || product.category?.name || "");
}

function getBrandSlugFromProduct(product: Product) {
  return slugify(product.brand?.slug || product.brand?.name || "");
}

function getSubCategorySlugFromProduct(product: Product) {
  return slugify(product.subCategory?.slug || product.subCategory?.name || "");
}

const ProductCategoryPage = ({ categoryKey }: ProductCategoryPageProps) => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [brands, setBrands] = useState<ProductBrand[]>([]);

  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(
    null
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<
    (typeof priceRanges)[number] | null
  >(null);
  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const normalizedCategoryKey = useMemo(() => slugify(categoryKey), [categoryKey]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!API_BASE) {
          setProducts([]);
          setCategories([]);
          setBrands([]);
          return;
        }

        const [productRes, metaRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/products?limit=100`, {
            cache: "no-store",
          }),
          fetch(`${API_BASE}/api/v1/products/meta`, {
            cache: "no-store",
          }),
        ]);

        const productData = await productRes.json();
        const metaData = await metaRes.json();

        if (productData.success) {
          setProducts(productData.products || []);
        }

        if (metaData.success) {
          setCategories(metaData.categories || []);
          setBrands(metaData.brands || []);
        }
      } catch {
        setProducts([]);
        setCategories([]);
        setBrands([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const activeCategory = useMemo(() => {
    return (
      categories.find(
        (category) =>
          isSameSlug(category.slug, normalizedCategoryKey) ||
          isSameSlug(category.name, normalizedCategoryKey)
      ) || null
    );
  }, [categories, normalizedCategoryKey]);

  const categoryProducts = useMemo(() => {
    return products.filter((product) => {
      const productCategorySlug = getCategorySlugFromProduct(product);

      return productCategorySlug === normalizedCategoryKey;
    });
  }, [products, normalizedCategoryKey]);

  const derivedSubCategories = useMemo<SubCategoryFilter[]>(() => {
    if (activeCategory?.subCategories?.length) {
      return activeCategory.subCategories.map((subCategory) => ({
        id: subCategory.id,
        name: subCategory.name,
        slug: subCategory.slug,
      }));
    }

    const map = new Map<string, SubCategoryFilter>();

    categoryProducts.forEach((product) => {
      const slug = getSubCategorySlugFromProduct(product);
      const name = product.subCategory?.name;

      if (!slug || !name) return;

      map.set(slug, {
        id: slug,
        name,
        slug,
      });
    });

    return Array.from(map.values());
  }, [activeCategory, categoryProducts]);

  const categoryBrands = useMemo(() => {
    const usedBrandSlugs = new Set(
      categoryProducts
        .map((product) => getBrandSlugFromProduct(product))
        .filter(Boolean)
    );

    const metaBrands = brands.filter((brand) =>
      usedBrandSlugs.has(slugify(brand.slug || brand.name))
    );

    if (metaBrands.length > 0) return metaBrands;

    const map = new Map<string, ProductBrand>();

    categoryProducts.forEach((product) => {
      const slug = getBrandSlugFromProduct(product);

      if (!slug || !product.brand?.name) return;

      map.set(slug, {
        id: product.brand.id || slug,
        name: product.brand.name,
        slug,
      } as ProductBrand);
    });

    return Array.from(map.values());
  }, [brands, categoryProducts]);

  const filteredProducts = useMemo(() => {
    let filtered = [...categoryProducts];

    if (selectedSubCategory) {
      filtered = filtered.filter(
        (product) => getSubCategorySlugFromProduct(product) === selectedSubCategory
      );
    }

    if (selectedBrands.length > 0) {
      filtered = filtered.filter((product) => {
        const brandSlug = getBrandSlugFromProduct(product);
        return brandSlug ? selectedBrands.includes(brandSlug) : false;
      });
    }

    if (selectedPriceRange) {
      filtered = filtered.filter((product) => {
        const sellingPrice = Number(product.sellingPrice || 0);

        return (
          sellingPrice >= selectedPriceRange.min &&
          sellingPrice <= selectedPriceRange.max
        );
      });
    }

    switch (sortOption) {
      case "price-low":
        filtered.sort(
          (a, b) => Number(a.sellingPrice || 0) - Number(b.sellingPrice || 0)
        );
        break;

      case "price-high":
        filtered.sort(
          (a, b) => Number(b.sellingPrice || 0) - Number(a.sellingPrice || 0)
        );
        break;

      default:
        filtered.sort((a, b) => {
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;

          return bTime - aTime;
        });
        break;
    }

    return filtered;
  }, [
    categoryProducts,
    selectedSubCategory,
    selectedBrands,
    selectedPriceRange,
    sortOption,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSubCategory, selectedBrands, selectedPriceRange, sortOption]);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  const pageTitle =
    activeCategory?.name ||
    categoryProducts[0]?.category?.name ||
    categoryKey
      .split("-")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const handleSubCategoryClick = (subCategorySlug: string) => {
    setSelectedSubCategory((prev) =>
      prev === subCategorySlug ? null : subCategorySlug
    );
  };

  const handleBrandChange = (brandSlug?: string | null) => {
    const normalizedBrandSlug = slugify(brandSlug);

    if (!normalizedBrandSlug) return;

    setSelectedBrands((prev) =>
      prev.includes(normalizedBrandSlug)
        ? prev.filter((item) => item !== normalizedBrandSlug)
        : [...prev, normalizedBrandSlug]
    );
  };

  const handlePriceRangeChange = (range: (typeof priceRanges)[number]) => {
    setSelectedPriceRange((prev) =>
      prev?.min === range.min && prev?.max === range.max ? null : range
    );
  };

  const clearAllFilters = () => {
    setSelectedSubCategory(null);
    setSelectedBrands([]);
    setSelectedPriceRange(null);
  };

  const paginate = (page: number) => {
    if (page < 1 || page > totalPages) return;

    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filterContent = (
    <>
      <CollapsibleSection title="Sub Categories" defaultOpen>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setSelectedSubCategory(null)}
            className={`block w-full rounded-lg px-3 py-2 text-left transition ${
              !selectedSubCategory
                ? "bg-orange-500/20 text-orange-400"
                : "hover:bg-gray-900 hover:text-orange-400"
            }`}
          >
            All {pageTitle}
          </button>

          {derivedSubCategories.length > 0 ? (
            derivedSubCategories.map((subCategory) => (
              <button
                key={subCategory.id}
                type="button"
                onClick={() => handleSubCategoryClick(slugify(subCategory.slug))}
                className={`block w-full rounded-lg px-3 py-2 text-left transition ${
                  selectedSubCategory === slugify(subCategory.slug)
                    ? "bg-orange-500/15 text-orange-300"
                    : "text-gray-400 hover:bg-gray-900 hover:text-orange-400"
                }`}
              >
                {subCategory.name}
              </button>
            ))
          ) : (
            <p className="px-2 py-1 text-sm text-gray-500">
              No sub-category found
            </p>
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Brands">
        <div className="space-y-2">
          {categoryBrands.length > 0 ? (
            categoryBrands.map((brand) => {
              const brandSlug = slugify(brand.slug || brand.name);

              return (
                <label
                  key={brand.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-900"
                >
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brandSlug)}
                    onChange={() => handleBrandChange(brandSlug)}
                    disabled={!brandSlug}
                    className="h-4 w-4 accent-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <span>{brand.name}</span>
                </label>
              );
            })
          ) : (
            <p className="px-2 py-1 text-sm text-gray-500">No brand found</p>
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Price Range">
        <div className="space-y-2">
          {priceRanges.map((range) => (
            <label
              key={range.label}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-900"
            >
              <input
                type="radio"
                name="priceRange"
                checked={
                  selectedPriceRange?.min === range.min &&
                  selectedPriceRange?.max === range.max
                }
                onChange={() => handlePriceRangeChange(range)}
                className="h-4 w-4 accent-orange-500"
              />
              <span>{range.label}</span>
            </label>
          ))}
        </div>
      </CollapsibleSection>
    </>
  );

  if (loading) {
    return <ProductCategoryPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-5 rounded-2xl border border-gray-800 bg-black px-4 py-3 text-sm text-gray-400">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/" className="transition hover:text-orange-400">
              Home
            </Link>

            <span className="text-gray-700">/</span>

            <Link href="/products" className="transition hover:text-orange-400">
              Products
            </Link>

            <span className="text-gray-700">/</span>

            <span className="text-orange-400">{pageTitle}</span>
          </div>
        </nav>

        <div className="mb-6 flex items-center justify-between md:hidden">
          <h1 className="text-2xl font-bold text-orange-400">{pageTitle}</h1>

          <button
            type="button"
            onClick={() => setShowMobileFilters(true)}
            className="rounded-xl bg-orange-500 px-4 py-2 font-semibold text-white"
          >
            Filters
          </button>
        </div>

        <AnimatePresence>
          {showMobileFilters && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden"
            >
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="ml-auto h-full w-[86%] max-w-sm overflow-y-auto bg-black p-5"
              >
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-orange-400">Filters</h2>

                  <button
                    type="button"
                    onClick={() => setShowMobileFilters(false)}
                    className="grid h-10 w-10 place-items-center rounded-full bg-gray-900 text-xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">{filterContent}</div>

                <button
                  type="button"
                  onClick={() => setShowMobileFilters(false)}
                  className="mt-5 w-full rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white"
                >
                  Apply Filters
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-6 md:flex-row">
          <aside className="hidden w-72 shrink-0 md:block">
            <div className="sticky top-24 space-y-4">{filterContent}</div>
          </aside>

          <main className="flex-1">
            <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-950 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-orange-400">
                    {pageTitle}
                  </h1>

                  <p className="text-sm text-gray-400">
                    Showing {filteredProducts.length} products
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Sort by:</span>

                  <select
                    value={sortOption}
                    onChange={(event) => setSortOption(event.target.value)}
                    className="rounded-xl border border-gray-700 bg-black px-3 py-2 text-sm text-white outline-none transition focus:border-orange-500"
                  >
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {(selectedSubCategory ||
                selectedBrands.length > 0 ||
                selectedPriceRange) && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-800 pt-4">
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-sm text-orange-400 hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            {currentProducts.length === 0 ? (
              <div className="rounded-2xl border border-gray-800 bg-gray-950 py-16 text-center">
                <div className="mb-4 text-5xl">🔍</div>

                <h3 className="mb-2 text-xl font-semibold">No products found</h3>

                <p className="mb-6 text-gray-400">
                  Try changing filters or check another category.
                </p>

                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
                  >
                    Clear Filters
                  </button>

                  <Link
                    href="/products"
                    className="rounded-xl border border-gray-800 px-6 py-3 font-semibold text-gray-300 transition hover:border-orange-500 hover:text-orange-400"
                  >
                    All Products
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {currentProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center lg:justify-end">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="rounded-xl border border-gray-800 px-4 py-2 text-sm transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Previous
                      </button>

                      {Array.from({ length: totalPages }).map((_, index) => {
                        const pageNumber = index + 1;

                        return (
                          <button
                            type="button"
                            key={pageNumber}
                            onClick={() => paginate(pageNumber)}
                            className={`rounded-xl px-4 py-2 text-sm transition ${
                              currentPage === pageNumber
                                ? "bg-orange-500 text-white"
                                : "border border-gray-800 hover:bg-gray-900"
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="rounded-xl border border-gray-800 px-4 py-2 text-sm transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProductCategoryPage;