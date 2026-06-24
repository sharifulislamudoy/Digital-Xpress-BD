import { Suspense } from "react";
import FavoritesClient from "@/components/favorites/FavoritesClient";

const FavoritesPageLoading = () => {
  return (
    <div className="min-h-screen bg-black px-4 pb-20 pt-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-2 h-9 w-56 animate-pulse rounded-lg bg-gray-800" />
        <div className="mb-8 h-5 w-32 animate-pulse rounded-lg bg-gray-800" />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-gray-800 bg-black/60"
            >
              <div className="aspect-square animate-pulse bg-gray-900" />

              <div className="space-y-4 p-4">
                <div className="h-5 animate-pulse rounded bg-gray-800" />
                <div className="h-5 w-24 animate-pulse rounded bg-gray-800" />
                <div className="h-9 animate-pulse rounded-lg bg-gray-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function FavoritesPage() {
  return (
    <Suspense fallback={<FavoritesPageLoading />}>
      <FavoritesClient />
    </Suspense>
  );
}