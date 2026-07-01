"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProductCategory } from "@/types/product";

type CategorySubCategory = {
  id: string;
  name: string;
  slug: string;
  isPublished?: boolean | null;
};

type CategoryWithSubCategories = ProductCategory & {
  subCategories?: CategorySubCategory[];
  _count?: {
    subCategories?: number;
    products?: number;
  };
};

interface ProductMetaApiResponse {
  success: boolean;
  categories: CategoryWithSubCategories[];
  message?: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

function CategoriesPageSkeleton() {
  return (
    <main className="min-h-screen bg-black">
      <section className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-4 md:px-6 md:py-10">
        <div className="mb-7 rounded-3xl border border-gray-800 bg-[#080b12] p-5 sm:p-6 md:p-8">
          <div className="mb-4 h-5 w-36 animate-pulse rounded bg-gray-800" />
          <div className="h-9 w-64 animate-pulse rounded bg-gray-800 sm:w-80" />
          <div className="mt-4 h-4 w-full max-w-xl animate-pulse rounded bg-gray-800" />
        </div>

        <div className="mb-6 h-12 w-full animate-pulse rounded-2xl bg-gray-900" />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-gray-800 bg-[#080b12]"
            >
              <div className="aspect-square animate-pulse bg-gray-900" />
              <div className="border-t border-gray-800 p-3">
                <div className="mx-auto h-4 w-24 animate-pulse rounded bg-gray-800" />
                <div className="mx-auto mt-3 h-3 w-20 animate-pulse rounded bg-gray-800" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithSubCategories[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchText, setSearchText] = useState("");
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  async function loadCategories(signal?: AbortSignal) {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const res = await fetch(`${API_BASE_URL}/api/v1/products/meta`, {
        method: "GET",
        signal,
        cache: "no-store",
      });

      const data: ProductMetaApiResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load categories");
      }

      setCategories(Array.isArray(data.categories) ? data.categories : []);
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Categories page load error:", error.message);
        setErrorMessage(error.message || "Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    loadCategories(controller.signal);

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

  const filteredCategories = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) return publishedCategories;

    return publishedCategories.filter((category) => {
      const name = category.name.toLowerCase();
      const slug = category.slug.toLowerCase();
      const description = category.description?.toLowerCase() || "";

      return (
        name.includes(query) ||
        slug.includes(query) ||
        description.includes(query)
      );
    });
  }, [publishedCategories, searchText]);

  if (isLoading) {
    return <CategoriesPageSkeleton />;
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-4 md:px-6 md:py-10">
        <div className="mb-7 overflow-hidden rounded-3xl border border-gray-800 bg-[#080b12]">
          <div className="relative p-5 sm:p-6 md:p-8">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-orange-500/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-orange-500/5 blur-3xl" />

            <div className="relative z-10">
              <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
                <Link
                  href="/"
                  className="text-gray-400 transition hover:text-orange-400"
                >
                  Home
                </Link>
                <span className="text-gray-600">/</span>
                <span className="font-medium text-orange-400">Categories</span>
              </div>

              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl">
                    All Categories
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
                    Explore all Digital Xpress product categories and find the
                    collection you need faster.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-red-300">
                {errorMessage}
              </p>

              <button
                type="button"
                onClick={() => loadCategories()}
                className="w-fit rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-400"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : null}

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-gray-800 bg-[#080b12] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search category..."
              className="w-full rounded-xl border border-gray-800 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-orange-500"
            />

            {searchText ? (
              <button
                type="button"
                onClick={() => setSearchText("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 text-sm font-bold text-gray-400 transition hover:text-orange-400"
                aria-label="Clear search"
              >
                ✕
              </button>
            ) : null}
          </div>

          <p className="text-sm text-gray-400">
            Showing{" "}
            <span className="font-bold text-orange-400">
              {filteredCategories.length}
            </span>{" "}
            category
            {filteredCategories.length === 1 ? "" : "s"}
          </p>
        </div>

        {!filteredCategories.length ? (
          <div className="rounded-3xl border border-gray-800 bg-[#080b12] px-5 py-14 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-orange-500/10 text-2xl font-black text-orange-400">
              !
            </div>

            <h2 className="text-xl font-bold text-white">No category found</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-400">
              No category matched your search. Try another keyword or clear the
              search field.
            </p>

            {searchText ? (
              <button
                type="button"
                onClick={() => setSearchText("")}
                className="mt-5 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-black transition hover:bg-orange-400"
              >
                Clear Search
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {filteredCategories.map((category) => {
              const hasImage = Boolean(
                category.imageUrl && !imageErrors[category.id],
              );

              const publishedSubCategories =
                category.subCategories?.filter(
                  (subCategory) => subCategory.isPublished !== false,
                ) || [];

              const subCategoryCount =
                category._count?.subCategories ?? publishedSubCategories.length;

              const productCount = category._count?.products;

              return (
                <Link
                  key={category.id}
                  href={`/products/${category.slug}`}
                  className="group overflow-hidden rounded-2xl border border-gray-800 bg-[#080b12] transition duration-300 hover:-translate-y-1 hover:border-orange-500/70 hover:shadow-2xl hover:shadow-orange-500/10"
                >
                  <div className="relative grid aspect-square place-items-center bg-black">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

                    {hasImage ? (
                      <Image
                        src={category.imageUrl as string}
                        alt={category.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
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
                        className="relative z-10 text-orange-400 [&_svg]:h-16 [&_svg]:w-16"
                        dangerouslySetInnerHTML={{
                          __html: category.iconSvg,
                        }}
                      />
                    ) : (
                      <span className="relative z-10 grid h-16 w-16 place-items-center rounded-full bg-orange-500/10 text-2xl font-bold text-orange-400">
                        {category.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="border-t border-gray-800 p-3 text-center">
                    <h2 className="line-clamp-1 text-sm font-bold text-white transition group-hover:text-orange-400 sm:text-base">
                      {category.name}
                    </h2>

                    {category.description ? (
                      <p className="mx-auto mt-1 line-clamp-2 max-w-[210px] text-xs leading-5 text-gray-500">
                        {category.description}
                      </p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">

                      {typeof productCount === "number" ? (
                        <span className="rounded-full border border-gray-800 bg-black px-2.5 py-1 text-[11px] font-semibold text-gray-400">
                          {productCount} Products
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 rounded-full border border-orange-500/40 px-3 py-2 text-xs font-bold text-orange-400 transition group-hover:border-orange-500 group-hover:bg-orange-500 group-hover:text-black">
                      View Products
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}