// src/app/products/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PRODUCTS } from "@/lib/products";
import { Product } from "@/types/product";

const ProductDetailsPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState("description");

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      const foundProduct = PRODUCTS.find((p) => p.id === Number(id));
      if (foundProduct) {
        setProduct(foundProduct);
        const related = PRODUCTS.filter(
          (p) => p.category === foundProduct.category && p.id !== foundProduct.id
        ).slice(0, 4);
        setRelatedProducts(related);
      }
      setLoading(false);
    }, 500);
  }, [id]);

  const handleQuantityChange = (change: number) => {
    setQuantity((prev) => Math.max(1, prev + change));
  };

  const renderRatingStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={i < Math.floor(rating) ? "text-orange-400" : "text-gray-600"}>
        ★
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white mt-4 text-lg">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Product Not Found</h1>
          <Link href="/products" className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-orange-400">Home</Link> &gt;{" "}
          <Link href="/products" className="hover:text-orange-400">Products</Link> &gt;{" "}
          <span className="text-orange-400">{product.name}</span>
        </div>

        {/* Product Main Section */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Product Image */}
          <div className="lg:w-1/2">
            <div className=" rounded-xl border border-gray-700 p-8 flex items-center justify-center">
              <img src={product.image} alt={product.name} className="max-h-96 w-auto object-contain" />
            </div>
          </div>

          {/* Product Info */}
          <div className="lg:w-1/2">
            <div className=" rounded-xl border border-gray-700 p-6">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-orange-400">{product.name}</h1>
                <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">{product.brand}</span>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex">{renderRatingStars(product.rating)}</div>
                <span className="text-gray-400 text-sm">({product.reviews.toLocaleString()} reviews)</span>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-bold text-orange-400">${product.price.toFixed(2)}</div>
                {product.discount && (
                  <div className="text-gray-400 text-sm">
                    <span className="line-through">${product.originalPrice?.toFixed(2)}</span>
                    <span className="ml-2 text-green-500">Save {product.discount}%</span>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className={product.inStock ? "text-green-500" : "text-red-500"}>
                  {product.inStock ? `In Stock (${product.stock} available)` : "Out of Stock"}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2 text-orange-400">Key Features</h3>
                <ul className="space-y-1">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-orange-400">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2 text-orange-400">Quantity</h3>
                <div className="flex items-center gap-4">
                  <div className="flex border border-gray-700 rounded-lg overflow-hidden">
                    <button onClick={() => handleQuantityChange(-1)} className="px-3 py-2  ">
                      -
                    </button>
                    <span className="px-4 py-2  min-w-[50px] text-center">{quantity}</span>
                    <button onClick={() => handleQuantityChange(1)} className="px-3 py-2 ">
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button className="flex-1 bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition">
                  Add to Cart
                </button>
                <button className="flex-1 border border-orange-500 text-orange-500 py-3 rounded-lg hover:bg-orange-500/10 transition">
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-12">
          <div className=" rounded-xl border border-gray-700 overflow-hidden">
            <div className="flex border-b border-gray-700">
              {["description", "specifications", "reviews"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-6 py-3 capitalize transition ${
                    selectedTab === tab
                      ? " text-orange-400 border-b-2 border-orange-400"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-6">
              {selectedTab === "description" && (
                <div>
                  <h2 className="text-xl font-bold text-orange-400 mb-4">Product Description</h2>
                  <p className="text-gray-300 mb-4">
                    Experience the ultimate performance with the {product.name} from {product.brand}. 
                    This cutting-edge device combines innovative technology with premium craftsmanship 
                    to deliver an exceptional user experience.
                  </p>
                  <p className="text-gray-300">
                    Whether you're a professional or an enthusiast, the {product.name} is designed 
                    to meet your needs with its powerful features and sleek design. Available now 
                    at Digital Xpress.
                  </p>
                </div>
              )}

              {selectedTab === "specifications" && (
                <div>
                  <h2 className="text-xl font-bold text-orange-400 mb-4">Technical Specifications</h2>
                  <div className="space-y-2">
                    <div className="flex py-2 border-b border-gray-700">
                      <span className="w-1/3 font-medium">Brand</span>
                      <span className="w-2/3 text-gray-300">{product.brand}</span>
                    </div>
                    <div className="flex py-2 border-b border-gray-700">
                      <span className="w-1/3 font-medium">Model</span>
                      <span className="w-2/3 text-gray-300">{product.name}</span>
                    </div>
                    <div className="flex py-2 border-b border-gray-700">
                      <span className="w-1/3 font-medium">Price</span>
                      <span className="w-2/3 text-gray-300">${product.price.toFixed(2)}</span>
                    </div>
                    <div className="flex py-2 border-b border-gray-700">
                      <span className="w-1/3 font-medium">Rating</span>
                      <span className="w-2/3 text-gray-300">{product.rating} / 5</span>
                    </div>
                    <div className="flex py-2">
                      <span className="w-1/3 font-medium">Features</span>
                      <span className="w-2/3 text-gray-300">{product.features.join(", ")}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === "reviews" && (
                <div>
                  <h2 className="text-xl font-bold text-orange-400 mb-4">Customer Reviews</h2>
                  <div className="flex items-center gap-4 mb-6 p-4 bg-gray-700/50 rounded-lg">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-orange-400">{product.rating.toFixed(1)}</div>
                      <div className="flex">{renderRatingStars(product.rating)}</div>
                      <div className="text-gray-400 text-sm">Based on {product.reviews.toLocaleString()} reviews</div>
                    </div>
                    <div className="flex-1">
                      <div className="space-y-1">
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <div key={rating} className="flex items-center gap-2">
                            <span className="text-sm w-8">{rating}★</span>
                            <div className="flex-1 h-2  rounded-full overflow-hidden">
                              <div
                                className="h-full bg-orange-400 rounded-full"
                                style={{ width: `${Math.random() * 30 + 60}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-gray-400">
                    <p>Customer reviews will appear here</p>
                    <button className="mt-4 border border-orange-500 text-orange-500 px-6 py-2 rounded-lg hover:bg-orange-500/10 transition">
                      Write a Review
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-orange-400 mb-6">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((related) => (
                <Link key={related.id} href={`/products/${related.id}`}>
                  <div className=" rounded-xl border border-gray-700 hover:border-orange-500 transition overflow-hidden">
                    <div className="bg-black h-40 flex items-center justify-center p-4">
                      <img src={related.image} alt={related.name} className="h-full w-full object-fit" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-2 hover:text-orange-400 transition">
                        {related.name}
                      </h3>
                      <div className="flex items-center gap-1 mb-2">
                        <div className="flex">{renderRatingStars(related.rating)}</div>
                        <span className="text-gray-400 text-xs">({related.reviews})</span>
                      </div>
                      <div className="text-orange-400 font-bold">${related.price.toFixed(2)}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailsPage;