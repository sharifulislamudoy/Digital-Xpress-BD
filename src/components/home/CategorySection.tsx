"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProductCategory } from "@/types/product";

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
        <div className="mb-5 h-7 w-44 animate-pulse rounded bg-gray-800" />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-gray-800 bg-[#080b12]"
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
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const controller = new AbortController();

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

        setCategories(Array.isArray(data.categories) ? data.categories : []);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Category load error:", error.message);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadCategories();

    return () => controller.abort();
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

  if (isLoading) {
    return <CategorySectionSkeleton />;
  }

  if (!publishedCategories.length) {
    return null;
  }

  return (
    <section className="w-full bg-black py-6 sm:py-8 md:py-10">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6">
        <h2 className="mb-5 text-xl font-bold text-white sm:text-2xl">
          Shop by Category
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {publishedCategories.map((category) => {
            const hasImage = Boolean(
              category.imageUrl && !imageErrors[category.id],
            );

            return (
              <Link
                key={category.id}
                href={`/products/${category.slug}`}
                className="group overflow-hidden rounded-2xl border border-gray-800 bg-[#080b12] transition duration-300 hover:-translate-y-1 hover:border-orange-500/70 hover:shadow-2xl hover:shadow-orange-500/10"
              >
                <div className="relative grid aspect-square place-items-center bg-black">
                  {hasImage ? (
                    <Image
                      src={category.imageUrl as string}
                      alt={category.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                      className="object-contain p-5 transition duration-300 group-hover:scale-105"
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
            );
          })}
        </div>
      </div>
    </section>
  );
}