"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import toast from "react-hot-toast";
import { useRef } from "react";
import ProductCard from "@/components/products/ProductCard";
import type { Product } from "@/types/product";

import "swiper/css";

interface ProductListApiResponse {
  success: boolean;
  products: Product[];
  message?: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

function LatestProductsSkeleton() {
  return (
    <section className="w-full bg-black py-6 sm:py-8 md:py-10">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="h-7 w-56 animate-pulse rounded bg-gray-800" />
          <div className="h-9 w-28 animate-pulse rounded-full bg-gray-800" />
        </div>

        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="min-w-[45%] sm:min-w-[35%] md:min-w-[28%] lg:min-w-[20%] rounded-2xl border border-gray-800 bg-[#080b12]"
            >
              <div className="aspect-square animate-pulse bg-gray-900" />
              <div className="p-3 border-t border-gray-800">
                <div className="h-4 w-full animate-pulse rounded bg-gray-800 mb-2" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-gray-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LatestProductsSection() {
  const swiperRef = useRef<SwiperType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    async function loadLatestProducts() {
      try {
        setIsLoading(true);
        const res = await fetch(
          `${API_BASE_URL}/api/v1/products?sort=newest&limit=15`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        const data: ProductListApiResponse = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to load latest products");
        }

        if (isActive) {
          setProducts(data.products || []);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          toast.error("Could not load latest products");
          console.error("Latest products load error:", error.message);
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadLatestProducts();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  const canSlide = products.length > 2;

  function handlePrevSlide() {
    swiperRef.current?.slidePrev();
  }

  function handleNextSlide() {
    swiperRef.current?.slideNext();
  }

  if (isLoading) return <LatestProductsSkeleton />;

  if (!products.length) return null;

  return (
    <section className="w-full bg-black py-6 sm:py-8 md:py-10">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white sm:text-2xl">
              Latest Products
            </h2>
            <p className="my-1 hidden text-sm text-gray-400 sm:block">
              Fresh arrivals just for you
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {canSlide && (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  aria-label="Previous products"
                  className="grid h-9 w-9 place-items-center rounded-full border border-gray-800 bg-[#080b12] text-lg text-white transition hover:border-orange-500 hover:bg-orange-500 hover:text-black"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={handleNextSlide}
                  aria-label="Next products"
                  className="grid h-9 w-9 place-items-center rounded-full border border-gray-800 bg-[#080b12] text-lg text-white transition hover:border-orange-500 hover:bg-orange-500 hover:text-black"
                >
                  ›
                </button>
              </div>
            )}

            <Link
              href="/products"
              className="rounded-full border border-orange-500/70 bg-orange-500 px-4 py-2 text-xs font-bold text-black transition hover:bg-orange-400 sm:px-5 sm:text-sm"
            >
              View All
            </Link>
          </div>
        </div>

        <Swiper
          modules={[Autoplay]}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          slidesPerView={1.8}
          slidesPerGroup={1}
          spaceBetween={12}
          speed={900}
          rewind={canSlide}
          grabCursor={canSlide}
          watchOverflow
          observer
          observeParents
          resizeObserver
          autoplay={
            canSlide
              ? {
                  delay: 3000,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }
              : false
          }
          breakpoints={{
            0: { slidesPerView: 1.8, spaceBetween: 12 },
            640: { slidesPerView: 2.5, spaceBetween: 16 },
            768: { slidesPerView: 3.2, spaceBetween: 20 },
            1024: { slidesPerView: 4.5, spaceBetween: 24 },
          }}
          className="latest-product-swiper"
        >
          {products.map((product) => (
            <SwiperSlide key={product.id}>
              <ProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}