// src/app/products/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { PRODUCTS, priceRanges } from "@/lib/products";
import { Product, Category } from "@/types/product";
import CollapsibleSection from "@/components/products/CollapsibleSection";

const ProductsPage = () => {
  const [loading, setLoading] = useState(true);
  const [products] = useState<Product[]>(PRODUCTS);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(PRODUCTS);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [allFeatures, setAllFeatures] = useState<string[]>([]);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<typeof priceRanges[0] | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState("popularity");
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const productsPerPage = 9;

  useEffect(() => {
    const uniqueCategories = Array.from(new Set(products.map((p) => p.category))).map((cat) => ({
      slug: cat,
      name: cat.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" "),
    }));
    const uniqueBrands = Array.from(new Set(products.map((p) => p.brand)));
    const uniqueFeatures = Array.from(new Set(products.flatMap((p) => p.features)));

    setCategories(uniqueCategories);
    setBrands(uniqueBrands);
    setAllFeatures(uniqueFeatures);
    setTimeout(() => setLoading(false), 600);
  }, [products]);

  // Apply filters and sorting whenever any filter changes
  useEffect(() => {
    let filtered = [...products];

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }

    // Brand filter
    if (selectedBrands.length > 0) {
      filtered = filtered.filter((product) => selectedBrands.includes(product.brand));
    }

    // Price range filter
    if (selectedPriceRange) {
      filtered = filtered.filter(
        (product) => product.price >= selectedPriceRange.min && product.price <= selectedPriceRange.max
      );
    }

    // Rating filter
    if (selectedRating) {
      filtered = filtered.filter((product) => Math.floor(product.rating) === selectedRating);
    }

    // Features filter
    if (selectedFeatures.length > 0) {
      filtered = filtered.filter((product) =>
        selectedFeatures.every((feature) => product.features.includes(feature))
      );
    }

    // Sorting
    switch (sortOption) {
      case "newest":
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [products, selectedCategory, selectedBrands, selectedPriceRange, selectedRating, selectedFeatures, sortOption]);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  const paginate = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategoryClick = (categorySlug: string) => {
    setSelectedCategory((prev) => (prev === categorySlug ? null : categorySlug));
    setCurrentPage(1);
  };

  const handleBrandChange = (brand: string) => {
    setSelectedBrands((prev) => (prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]));
  };

  const handlePriceRangeChange = (range: typeof priceRanges[0]) => {
    setSelectedPriceRange((prev) => (prev === range ? null : range));
  };

  const handleRatingChange = (rating: number) => {
    setSelectedRating((prev) => (prev === rating ? null : rating));
  };

  const handleFeatureChange = (feature: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategory(null);
    setSelectedBrands([]);
    setSelectedPriceRange(null);
    setSelectedRating(null);
    setSelectedFeatures([]);
  };

  const getSelectedCategoryName = () => {
    if (!selectedCategory) return null;
    const cat = categories.find((c) => c.slug === selectedCategory);
    return cat ? cat.name : selectedCategory;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white mt-4 text-lg">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Mobile Filter Button */}
        <div className="md:hidden flex justify-between items-center mb-6 bg-gray-800 p-4 rounded-xl border border-gray-700">
          <h1 className="text-xl font-bold text-orange-400">
            {getSelectedCategoryName() ? `${getSelectedCategoryName()}` : "All Products"}
          </h1>
          <button
            onClick={() => setShowMobileFilters(true)}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
          >
            Filters
          </button>
        </div>

        {/* Mobile Filters Drawer */}
        <AnimatePresence>
          {showMobileFilters && (
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              className="fixed inset-0 z-50 bg-black/95 overflow-y-auto"
            >
              <div className="bg-gray-900 min-h-screen p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-orange-400">Filters</h2>
                  <button onClick={() => setShowMobileFilters(false)} className="text-white text-2xl">
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Categories - OPEN by default */}
                  <CollapsibleSection title="Categories" defaultOpen={true}>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleCategoryClick("")}
                        className={`block w-full text-left px-2 py-1 rounded transition ${
                          !selectedCategory ? "bg-orange-500/20 text-orange-400" : "hover:text-orange-400"
                        }`}
                      >
                        All Categories
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category.slug}
                          onClick={() => handleCategoryClick(category.slug)}
                          className={`block w-full text-left px-2 py-1 rounded transition ${
                            selectedCategory === category.slug ? "bg-orange-500/20 text-orange-400" : "hover:text-orange-400"
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </CollapsibleSection>

                  {/* Brands - CLOSED by default */}
                  <CollapsibleSection title="Brands" defaultOpen={false}>
                    <div className="space-y-2">
                      {brands.map((brand) => (
                        <label key={brand} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedBrands.includes(brand)}
                            onChange={() => handleBrandChange(brand)}
                            className="w-4 h-4 accent-orange-500"
                          />
                          <span>{brand}</span>
                        </label>
                      ))}
                    </div>
                  </CollapsibleSection>

                  {/* Price Range - CLOSED by default */}
                  <CollapsibleSection title="Price Range" defaultOpen={false}>
                    <div className="space-y-2">
                      {priceRanges.map((range, idx) => (
                        <label key={idx} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="priceRange"
                            checked={selectedPriceRange?.min === range.min}
                            onChange={() => handlePriceRangeChange(range)}
                            className="w-4 h-4 accent-orange-500"
                          />
                          <span>{range.label}</span>
                        </label>
                      ))}
                    </div>
                  </CollapsibleSection>

                  {/* Ratings - CLOSED by default */}
                  <CollapsibleSection title="Rating" defaultOpen={false}>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <label key={rating} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="rating"
                            checked={selectedRating === rating}
                            onChange={() => handleRatingChange(rating)}
                            className="w-4 h-4 accent-orange-500"
                          />
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} className={i < rating ? "text-orange-400" : "text-gray-600"}>
                                ★
                              </span>
                            ))}
                            <span className="ml-1 text-gray-400">& Up</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </CollapsibleSection>

                  {/* Features - CLOSED by default */}
                  {allFeatures.length > 0 && (
                    <CollapsibleSection title="Features" defaultOpen={false}>
                      <div className="space-y-2">
                        {allFeatures.map((feature) => (
                          <label key={feature} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedFeatures.includes(feature)}
                              onChange={() => handleFeatureChange(feature)}
                              className="w-4 h-4 accent-orange-500"
                            />
                            <span>{feature}</span>
                          </label>
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={clearAllFilters}
                    className="w-full border border-orange-500 text-orange-500 py-3 rounded-lg hover:bg-orange-500/10 transition"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Layout */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Desktop Filters Sidebar */}
          <div className="hidden md:block w-72 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              {/* Categories - OPEN by default */}
              <CollapsibleSection title="Categories" defaultOpen={true}>
                <div className="space-y-2">
                  <button
                    onClick={() => handleCategoryClick("")}
                    className={`block w-full text-left px-2 py-1 rounded transition ${
                      !selectedCategory ? "bg-orange-500/20 text-orange-400" : "hover:text-orange-400"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.slug}
                      onClick={() => handleCategoryClick(category.slug)}
                      className={`block w-full text-left px-2 py-1 rounded transition ${
                        selectedCategory === category.slug ? "bg-orange-500/20 text-orange-400" : "hover:text-orange-400"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </CollapsibleSection>

              {/* Brands - CLOSED by default */}
              <CollapsibleSection title="Brands" defaultOpen={false}>
                <div className="space-y-2">
                  {brands.map((brand) => (
                    <label key={brand} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => handleBrandChange(brand)}
                        className="w-4 h-4 accent-orange-500"
                      />
                      <span>{brand}</span>
                    </label>
                  ))}
                </div>
              </CollapsibleSection>

              {/* Price Range - CLOSED by default */}
              <CollapsibleSection title="Price Range" defaultOpen={false}>
                <div className="space-y-2">
                  {priceRanges.map((range, idx) => (
                    <label key={idx} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="desktop-price"
                        checked={selectedPriceRange?.min === range.min}
                        onChange={() => handlePriceRangeChange(range)}
                        className="w-4 h-4 accent-orange-500"
                      />
                      <span>{range.label}</span>
                    </label>
                  ))}
                </div>
              </CollapsibleSection>

              {/* Ratings - CLOSED by default */}
              <CollapsibleSection title="Rating" defaultOpen={false}>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <label key={rating} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="desktop-rating"
                        checked={selectedRating === rating}
                        onChange={() => handleRatingChange(rating)}
                        className="w-4 h-4 accent-orange-500"
                      />
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < rating ? "text-orange-400" : "text-gray-600"}>
                            ★
                          </span>
                        ))}
                        <span className="ml-1 text-gray-400">& Up</span>
                      </div>
                    </label>
                  ))}
                </div>
              </CollapsibleSection>

              {/* Features - CLOSED by default */}
              {allFeatures.length > 0 && (
                <CollapsibleSection title="Features" defaultOpen={false}>
                  <div className="space-y-2">
                    {allFeatures.map((feature) => (
                      <label key={feature} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFeatures.includes(feature)}
                          onChange={() => handleFeatureChange(feature)}
                          className="w-4 h-4 accent-orange-500"
                        />
                        <span>{feature}</span>
                      </label>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              <button
                onClick={clearAllFilters}
                className="w-full border border-orange-500 text-orange-500 py-2 rounded-lg hover:bg-orange-500/10 transition"
              >
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Header and Sorting */}
            <div className="p-6 rounded-xl border border-gray-700 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-orange-400">
                    {getSelectedCategoryName() ? `${getSelectedCategoryName()}` : "All Products"}
                  </h1>
                  <p className="text-gray-400 text-sm">Showing {filteredProducts.length} products</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Sort by:</span>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="popularity">Popularity</option>
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Active Filters */}
              {(selectedCategory || selectedBrands.length > 0 || selectedPriceRange || selectedRating || selectedFeatures.length > 0) && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-700">
                  <span className="text-gray-400 text-sm">Active filters:</span>
                  {selectedCategory && (
                    <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                      Category: {getSelectedCategoryName()}
                      <button onClick={() => setSelectedCategory(null)} className="hover:text-white">✕</button>
                    </span>
                  )}
                  {selectedBrands.map((brand) => (
                    <span key={brand} className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                      {brand}
                      <button onClick={() => handleBrandChange(brand)} className="hover:text-white">✕</button>
                    </span>
                  ))}
                  {selectedPriceRange && (
                    <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                      {selectedPriceRange.label}
                      <button onClick={() => setSelectedPriceRange(null)}>✕</button>
                    </span>
                  )}
                  {selectedRating && (
                    <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                      {selectedRating} Stars & Up
                      <button onClick={() => setSelectedRating(null)}>✕</button>
                    </span>
                  )}
                  {selectedFeatures.map((feature) => (
                    <span key={feature} className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                      {feature}
                      <button onClick={() => handleFeatureChange(feature)}>✕</button>
                    </span>
                  ))}
                  <button onClick={clearAllFilters} className="text-orange-400 text-sm hover:underline">
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Products Grid */}
            {currentProducts.length === 0 ? (
              <div className="text-center py-16  rounded-xl border border-gray-700">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-medium mb-2">No products found</h3>
                <p className="text-gray-400 mb-6">Try adjusting your filters</p>
                <button onClick={clearAllFilters} className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition">
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -5 }}
                      className=" rounded-xl border border-gray-700 hover:border-orange-500 transition overflow-hidden"
                    >
                      <Link href={`/products/${product.id}`}>
                        <div className="bg-black h-48 flex items-center justify-center p-4">
                          <img src={product.image} alt={product.name} className="h-full w-full object-fit rounded-md" loading="lazy" />
                        </div>
                        <div className="p-4 ">
                          <h2 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-orange-400 transition">{product.name}</h2>
                          <div className="flex items-center gap-1 mb-2">
                            <div className="flex">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i} className={i < Math.floor(product.rating) ? "text-orange-400" : "text-gray-600"}>★</span>
                              ))}
                            </div>
                            <span className="text-gray-400 text-sm">({product.reviews})</span>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl font-bold text-orange-400">${product.price.toFixed(2)}</span>
                            {product.discount && (
                              <>
                                <span className="text-gray-400 line-through text-sm">${product.originalPrice?.toFixed(2)}</span>
                                <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded">-{product.discount}%</span>
                              </>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mb-4">
                            {product.features.slice(0, 2).map((feature) => (
                              <span key={feature} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">{feature}</span>
                            ))}
                            {product.features.length > 2 && (
                              <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">+{product.features.length - 2}</span>
                            )}
                          </div>
                          <button className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition">Add to Cart</button>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <div className="flex gap-2">
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-700 rounded disabled:opacity-50 hover:bg-gray-800 transition"
                      >
                        Previous
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                        let pageNum;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (currentPage <= 3) pageNum = i + 1;
                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = currentPage - 2 + i;
                        return (
                          <button
                            key={i}
                            onClick={() => paginate(pageNum)}
                            className={`px-3 py-1 rounded transition ${
                              currentPage === pageNum ? "bg-orange-500 text-white" : "border border-gray-700 hover:bg-gray-800"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-700 rounded disabled:opacity-50 hover:bg-gray-800 transition"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;