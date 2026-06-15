"use client";

import { useMemo, useRef, useState } from "react";
import type { Product } from "@/types/product";

type MediaItem = {
  type: "image" | "video";
  url: string;
  label: string;
};

interface ProductMediaGalleryProps {
  product: Product;
}

export default function ProductMediaGallery({ product }: ProductMediaGalleryProps) {
  const thumbnailRef = useRef<HTMLDivElement | null>(null);

  const media = useMemo<MediaItem[]>(() => {
    const items: MediaItem[] = [];

    if (product.videoUrl) {
      items.push({
        type: "video",
        url: product.videoUrl,
        label: "Product video",
      });
    }

    items.push({
      type: "image",
      url: product.mainImageUrl,
      label: product.name,
    });

    if (product.hoverImageUrl) {
      items.push({
        type: "image",
        url: product.hoverImageUrl,
        label: `${product.name} hover`,
      });
    }

    product.extraImages?.forEach((image, index) => {
      items.push({
        type: "image",
        url: image.imageUrl,
        label: `${product.name} extra ${index + 1}`,
      });
    });

    return items;
  }, [product]);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeMedia = media[activeIndex] || media[0];

  const scrollThumbs = (direction: "up" | "down") => {
    thumbnailRef.current?.scrollBy({
      top: direction === "up" ? -180 : 180,
      left: direction === "up" ? -180 : 180,
      behavior: "smooth",
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[92px_1fr]">
      <div className="order-2 lg:order-1">
        {media.length > 4 && (
          <button
            type="button"
            onClick={() => scrollThumbs("up")}
            className="mb-2 hidden h-9 w-full rounded-xl border border-gray-800 bg-gray-950 text-gray-300 hover:border-orange-500 hover:text-orange-400 lg:block"
          >
            ↑
          </button>
        )}

        <div
          ref={thumbnailRef}
          className="flex max-h-[520px] gap-3 overflow-x-auto scroll-smooth lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden"
        >
          {media.map((item, index) => (
            <button
              key={`${item.url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border bg-gray-950 transition lg:h-24 lg:w-full ${
                activeIndex === index
                  ? "border-orange-500"
                  : "border-gray-800 hover:border-orange-400"
              }`}
            >
              {item.type === "video" ? (
                <div className="grid h-full w-full place-items-center bg-black text-xs font-semibold text-orange-400">
                  ▶ Video
                </div>
              ) : (
                <img
                  src={item.url}
                  alt={item.label}
                  className="h-full w-full object-contain p-2"
                />
              )}
            </button>
          ))}
        </div>

        {media.length > 4 && (
          <button
            type="button"
            onClick={() => scrollThumbs("down")}
            className="mt-2 hidden h-9 w-full rounded-xl border border-gray-800 bg-gray-950 text-gray-300 hover:border-orange-500 hover:text-orange-400 lg:block"
          >
            ↓
          </button>
        )}
      </div>

      <div className="order-1 overflow-hidden rounded-3xl border border-gray-800 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.12),rgba(17,24,39,0.75)_45%,rgba(0,0,0,1)_100%)] lg:order-2">
        <div
          className={`flex items-center justify-center p-5 ${
            activeMedia?.type === "video"
              ? "aspect-video"
              : "aspect-square max-h-[620px] lg:aspect-[1.05]"
          }`}
        >
          {activeMedia?.type === "video" ? (
            <video
              key={activeMedia.url}
              src={activeMedia.url}
              className="h-full w-full rounded-2xl object-contain"
              autoPlay
              muted
              loop
              controls
              playsInline
            />
          ) : (
            <img
              src={activeMedia?.url}
              alt={activeMedia?.label || product.name}
              className="max-h-full w-full object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
}