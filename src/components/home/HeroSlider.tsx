"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

interface Banner {
  id: string;
  imageUrl: string;
  productLink?: string | null;
  isPublished?: boolean;
  createdAt?: string;
}

interface BannerApiResponse {
  success: boolean;
  banners: Banner[];
  message?: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

function getBannerHref(productLink?: string | null) {
  if (!productLink) return "";

  const trimmedLink = productLink.trim();

  if (!trimmedLink) return "";

  if (/^https?:\/\//i.test(trimmedLink)) {
    return trimmedLink;
  }

  if (trimmedLink.startsWith("/")) {
    return trimmedLink;
  }

  return `/products/${trimmedLink}`;
}

function isExternalUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

function HeroBannerSkeleton() {
  return (
    <section className="w-full bg-[#080b12] py-3 sm:py-4 md:py-6">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-gray-900 sm:aspect-[16/7] md:aspect-auto md:h-[390px] md:rounded-2xl lg:h-[460px] xl:h-[520px]">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900" />

          <div className="absolute inset-0 animate-pulse">
            <div className="absolute inset-0 bg-gray-800/70" />

            <div className="absolute bottom-4 right-4 flex gap-2 sm:bottom-6 sm:right-6">
              <span className="h-2.5 w-7 rounded-full bg-gray-600" />
              <span className="h-2.5 w-2.5 rounded-full bg-gray-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-gray-700" />
            </div>
          </div>

          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </div>
    </section>
  );
}

export default function HeroSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadBanners() {
      try {
        setIsLoading(true);

        const res = await fetch(`${API_BASE_URL}/api/v1/banners/published`, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });

        const data: BannerApiResponse = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to load banners");
        }

        setBanners(data.banners || []);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Banner load error:", error.message);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadBanners();

    return () => controller.abort();
  }, []);

  if (isLoading) {
    return <HeroBannerSkeleton />;
  }

  if (!banners.length) {
    return null;
  }

  return (
    <section className="w-full bg-[#080b12] py-3 sm:py-4 md:py-6">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6">
        <Swiper
          modules={[Autoplay, Pagination]}
          slidesPerView={1}
          spaceBetween={0}
          loop={banners.length > 1}
          grabCursor={banners.length > 1}
          observer
          observeParents
          resizeObserver
          speed={950}
          autoplay={
            banners.length > 1
              ? {
                  delay: 3500,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }
              : false
          }
          pagination={
            banners.length > 1
              ? {
                  clickable: true,
                }
              : false
          }
          className="hero-overlap-swiper rounded-xl md:rounded-2xl"
        >
          {banners.map((banner, index) => {
            const href = getBannerHref(banner.productLink);

            const bannerImage = (
              <div className="relative block aspect-[16/9] w-full overflow-hidden rounded-xl bg-neutral-900 sm:aspect-[16/7] md:aspect-auto md:h-[390px] md:rounded-2xl lg:h-[460px] xl:h-[520px]">
                <Image
                  src={banner.imageUrl}
                  alt={`Digital Xpress banner ${index + 1}`}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 768px) 100vw, 1280px"
                  className="block object-cover"
                />
              </div>
            );

            return (
              <SwiperSlide key={banner.id}>
                {href ? (
                  isExternalUrl(href) ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open banner ${index + 1}`}
                      className="block"
                    >
                      {bannerImage}
                    </a>
                  ) : (
                    <Link
                      href={href}
                      aria-label={`Open banner ${index + 1}`}
                      className="block"
                    >
                      {bannerImage}
                    </Link>
                  )
                ) : (
                  bannerImage
                )}
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </section>
  );
}