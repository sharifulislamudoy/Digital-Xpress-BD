"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { ProductCategory } from "@/types/product";

import "swiper/css";

interface ProductMetaApiResponse {
  success: boolean;
  categories: ProductCategory[];
  message?: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

function CategorySectionSkeleton() {
  return (
    <section className="w-full bg-black py-6 sm:py-8 md:py-10">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="h-7 w-44 animate-pulse rounded bg-gray-800" />
          <div className="h-9 w-28 animate-pulse rounded-full bg-gray-800" />
        </div>

        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="min-w-[42%] overflow-hidden rounded-2xl border border-gray-800 bg-[#080b12] sm:min-w-[38%] md:min-w-[28%] lg:min-w-[17%]"
            >
              <div className="aspect-square animate-pulse bg-gray-900" />
              <div className="border-t border-gray-800 p-3">
                <div className="mx-auto h-4 w-24 animate-pulse rounded bg-gray-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function CategorySection() {
  const swiperRef = useRef<SwiperType | null>(null);

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    async function loadCategories() {
      try {
        setIsLoading(true);

        const res = await fetch(`${API_BASE_URL}/api/v1/products/meta`, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });

        const data: ProductMetaApiResponse = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to load categories");
        }

        if (isActive) {
          setCategories(Array.isArray(data.categories) ? data.categories : []);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Category load error:", error.message);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  const publishedCategories = useMemo(() => {
    return categories
      .filter((category) => category.isPublished !== false)
      .sort((a, b) => {
        const sortA = Number(a.sortOrder ?? 0);
        const sortB = Number(b.sortOrder ?? 0);

        if (sortA !== sortB) return sortA - sortB;

        return a.name.localeCompare(b.name);
      });
  }, [categories]);

  const canSlide = publishedCategories.length > 2;

  function handlePrevSlide() {
    swiperRef.current?.slidePrev();
  }

  function handleNextSlide() {
    swiperRef.current?.slideNext();
  }

  if (isLoading) {
    return <CategorySectionSkeleton />;
  }

  if (!publishedCategories.length) {
    return null;
  }

  return (
    <section className="w-full bg-black py-6 sm:py-8 md:py-10">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white sm:text-2xl">
              Shop by Category
            </h2>
            <p className="my-1 hidden text-sm text-gray-400 sm:block">
              Browse your favorite Digital Xpress collections
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {canSlide ? (
              <div className="hidden items-center gap-2 sm:flex">
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  aria-label="Previous categories"
                  className="grid h-9 w-9 place-items-center rounded-full border border-gray-800 bg-[#080b12] text-lg text-white transition hover:border-orange-500 hover:bg-orange-500 hover:text-black"
                >
                  ‹
                </button>

                <button
                  type="button"
                  onClick={handleNextSlide}
                  aria-label="Next categories"
                  className="grid h-9 w-9 place-items-center rounded-full border border-gray-800 bg-[#080b12] text-lg text-white transition hover:border-orange-500 hover:bg-orange-500 hover:text-black"
                >
                  ›
                </button>
              </div>
            ) : null}

            <Link
              href="/categories"
              className="rounded-full border border-orange-500/70 bg-orange-500 px-4 py-2 text-xs font-bold text-black transition hover:bg-orange-400 sm:px-5 sm:text-sm"
            >
              View Details
            </Link>
          </div>
        </div>

        <Swiper
          modules={[Autoplay]}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          slidesPerView={2.25}
          slidesPerGroup={1}
          spaceBetween={10}
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
                  delay: 2600,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }
              : false
          }
          breakpoints={{
            0: {
              slidesPerView: 2.25,
              spaceBetween: 10,
            },
            640: {
              slidesPerView: 2.5,
              spaceBetween: 12,
            },
            768: {
              slidesPerView: 3.5,
              spaceBetween: 14,
            },
            1024: {
              slidesPerView: 5.5,
              spaceBetween: 16,
            },
          }}
          className="category-card-swiper"
        >
          {publishedCategories.map((category) => {
            const hasImage = Boolean(
              category.imageUrl && !imageErrors[category.id],
            );

            return (
              <SwiperSlide key={category.id}>
                <Link
                  href={`/products/${category.slug}`}
                  className="group block h-full overflow-hidden rounded-2xl border border-gray-800 bg-[#080b12] transition duration-300  hover:border-orange-500/70 hover:shadow-2xl hover:shadow-orange-500/10"
                >
                  <div className="relative grid aspect-square place-items-center bg-black">
                    {hasImage ? (
                      <Image
                        src={category.imageUrl as string}
                        alt={category.name}
                        fill
                        sizes="(max-width: 640px) 45vw, (max-width: 768px) 40vw, (max-width: 1024px) 30vw, 18vw"
                        className="object-contain"
                        onError={() =>
                          setImageErrors((previous) => ({
                            ...previous,
                            [category.id]: true,
                          }))
                        }
                      />
                    ) : category.iconSvg ? (
                      <span
                        className="text-orange-400 [&_svg]:h-14 [&_svg]:w-14"
                        dangerouslySetInnerHTML={{
                          __html: category.iconSvg,
                        }}
                      />
                    ) : (
                      <span className="grid h-16 w-16 place-items-center rounded-full bg-orange-500/10 text-2xl font-bold text-orange-400">
                        {category.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="border-t border-gray-800 px-3 py-3 text-center">
                    <h3 className="line-clamp-1 text-sm font-semibold text-white transition group-hover:text-orange-400">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </section>
  );
}