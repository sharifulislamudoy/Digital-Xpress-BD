"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PRODUCTS, priceRanges } from "@/lib/products";
import { Category, Product } from "@/types/product";
import CollapsibleSection from "@/components/products/CollapsibleSection";
import ProductCard from "@/components/products/ProductCard";
import ProductCardSkeleton from "@/components/products/ProductCardSkeleton";

const productsPerPage = 9;

const ProductsPage = () => {
  const [loading, setLoading] = useState(true);
  const [products] = useState<Product[]>(PRODUCTS);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<
    (typeof priceRanges)[number] | null
  >(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState("popularity");
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const categories = useMemo<Category[]>(() => {
    return Array.from(new Set(products.map((product) => product.category))).map(
      (category) => ({
        slug: category,
        name: category
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
      })
    );
  }, [products]);

  const brands = useMemo(() => {
    return Array.from(new Set(products.map((product) => product.brand)));
  }, [products]);

  const allFeatures = useMemo(() => {
    return Array.from(new Set(products.flatMap((product) => product.features)));
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    if (selectedBrands.length > 0) {
      filtered = filtered.filter((product) =>
        selectedBrands.includes(product.brand)
      );
    }

    if (selectedPriceRange) {
      filtered = filtered.filter(
        (product) =>
          product.price >= selectedPriceRange.min &&
          product.price <= selectedPriceRange.max
      );
    }

    if (selectedRating) {
      filtered = filtered.filter(
        (product) => Math.floor(product.rating) >= selectedRating
      );
    }

    if (selectedFeatures.length > 0) {
      filtered = filtered.filter((product) =>
        selectedFeatures.every((feature) => product.features.includes(feature))
      );
    }

    switch (sortOption) {
      case "newest":
        filtered.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        break;
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      default:
        filtered.sort((a, b) => b.popularity - a.popularity);
        break;
    }

    return filtered;
  }, [
    products,
    selectedCategory,
    selectedBrands,
    selectedPriceRange,
    selectedRating,
    selectedFeatures,
    sortOption,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedCategory,
    selectedBrands,
    selectedPriceRange,
    selectedRating,
    selectedFeatures,
    sortOption,
  ]);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  const getSelectedCategoryName = () => {
    if (!selectedCategory) return null;
    return (
      categories.find((category) => category.slug === selectedCategory)?.name ||
      selectedCategory
    );
  };

  const handleCategoryClick = (categorySlug: string | null) => {
    setSelectedCategory((prev) => (prev === categorySlug ? null : categorySlug));
  };

  const handleBrandChange = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand)
        ? prev.filter((item) => item !== brand)
        : [...prev, brand]
    );
  };

  const handlePriceRangeChange = (range: (typeof priceRanges)[number]) => {
    setSelectedPriceRange((prev) =>
      prev?.min === range.min && prev?.max === range.max ? null : range
    );
  };

  const handleRatingChange = (rating: number) => {
    setSelectedRating((prev) => (prev === rating ? null : rating));
  };

  const handleFeatureChange = (feature: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((item) => item !== feature)
        : [...prev, feature]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategory(null);
    setSelectedBrands([]);
    setSelectedPriceRange(null);
    setSelectedRating(null);
    setSelectedFeatures([]);
  };

  const paginate = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddToCart = (product: Product) => {
    console.log("Add to cart:", product);
  };

  const handleToggleFavorite = (product: Product) => {
    console.log("Favourite:", product);
  };

  const filterContent = (
    <>
      <CollapsibleSection title="Categories" defaultOpen>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handleCategoryClick(null)}
            className={`block w-full rounded-lg px-3 py-2 text-left transition ${
              !selectedCategory
                ? "bg-orange-500/20 text-orange-400"
                : "hover:bg-gray-900 hover:text-orange-400"
            }`}
          >
            All Categories
          </button>

          {categories.map((category) => (
            <button
              type="button"
              key={category.slug}
              onClick={() => handleCategoryClick(category.slug)}
              className={`block w-full rounded-lg px-3 py-2 text-left transition ${
                selectedCategory === category.slug
                  ? "bg-orange-500/20 text-orange-400"
                  : "hover:bg-gray-900 hover:text-orange-400"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Brands">
        <div className="space-y-2">
          {brands.map((brand) => (
            <label
              key={brand}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-900"
            >
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand)}
                onChange={() => handleBrandChange(brand)}
                className="h-4 w-4 accent-orange-500"
              />
              <span>{brand}</span>
            </label>
          ))}
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

      <CollapsibleSection title="Rating">
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => (
            <label
              key={rating}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-900"
            >
              <input
                type="radio"
                name="rating"
                checked={selectedRating === rating}
                onChange={() => handleRatingChange(rating)}
                className="h-4 w-4 accent-orange-500"
              />

              <span className="flex items-center">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span
                    key={index}
                    className={
                      index < rating ? "text-orange-400" : "text-gray-600"
                    }
                  >
                    ★
                  </span>
                ))}
                <span className="ml-1 text-gray-400">& Up</span>
              </span>
            </label>
          ))}
        </div>
      </CollapsibleSection>

      {allFeatures.length > 0 && (
        <CollapsibleSection title="Features">
          <div className="space-y-2">
            {allFeatures.map((feature) => (
              <label
                key={feature}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-900"
              >
                <input
                  type="checkbox"
                  checked={selectedFeatures.includes(feature)}
                  onChange={() => handleFeatureChange(feature)}
                  className="h-4 w-4 accent-orange-500"
                />
                <span>{feature}</span>
              </label>
            ))}
          </div>
        </CollapsibleSection>
      )}

      <button
        type="button"
        onClick={clearAllFilters}
        className="w-full rounded-xl border border-orange-500 px-4 py-3 text-sm font-semibold text-orange-500 transition hover:bg-orange-500/10"
      >
        Clear All Filters
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-gray-800 bg-gray-950 p-4 md:hidden">
          <div>
            <h1 className="text-xl font-bold text-orange-400">
              {getSelectedCategoryName() || "All Products"}
            </h1>
            <p className="text-sm text-gray-400">
              {filteredProducts.length} products found
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowMobileFilters(true)}
            className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
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
                  <h2 className="text-xl font-bold text-orange-400">
                    Filters
                  </h2>

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
                    {getSelectedCategoryName() || "All Products"}
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
                    <option value="popularity">Popularity</option>
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {(selectedCategory ||
                selectedBrands.length > 0 ||
                selectedPriceRange ||
                selectedRating ||
                selectedFeatures.length > 0) && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-800 pt-4">
                  {selectedCategory && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(null)}
                      className="rounded-full bg-orange-500/15 px-3 py-1 text-sm text-orange-400"
                    >
                      {getSelectedCategoryName()} ×
                    </button>
                  )}

                  {selectedBrands.map((brand) => (
                    <button
                      type="button"
                      key={brand}
                      onClick={() => handleBrandChange(brand)}
                      className="rounded-full bg-orange-500/15 px-3 py-1 text-sm text-orange-400"
                    >
                      {brand} ×
                    </button>
                  ))}

                  {selectedPriceRange && (
                    <button
                      type="button"
                      onClick={() => setSelectedPriceRange(null)}
                      className="rounded-full bg-orange-500/15 px-3 py-1 text-sm text-orange-400"
                    >
                      {selectedPriceRange.label} ×
                    </button>
                  )}

                  {selectedRating && (
                    <button
                      type="button"
                      onClick={() => setSelectedRating(null)}
                      className="rounded-full bg-orange-500/15 px-3 py-1 text-sm text-orange-400"
                    >
                      {selectedRating} Stars & Up ×
                    </button>
                  )}

                  {selectedFeatures.map((feature) => (
                    <button
                      type="button"
                      key={feature}
                      onClick={() => handleFeatureChange(feature)}
                      className="rounded-full bg-orange-500/15 px-3 py-1 text-sm text-orange-400"
                    >
                      {feature} ×
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-sm text-orange-400 hover:underline"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 9 }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            ) : currentProducts.length === 0 ? (
              <div className="rounded-2xl border border-gray-800 bg-gray-950 py-16 text-center">
                <div className="mb-4 text-5xl">🔍</div>
                <h3 className="mb-2 text-xl font-semibold">
                  No products found
                </h3>
                <p className="mb-6 text-gray-400">Try adjusting your filters</p>

                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {currentProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      onToggleFavorite={handleToggleFavorite}
                    />
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

                      {Array.from({ length: Math.min(5, totalPages) }).map(
                        (_, index) => {
                          let pageNumber: number;

                          if (totalPages <= 5) pageNumber = index + 1;
                          else if (currentPage <= 3) pageNumber = index + 1;
                          else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + index;
                          } else {
                            pageNumber = currentPage - 2 + index;
                          }

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
                        }
                      )}

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

export default ProductsPage;