import ProductCardSkeleton from "@/components/products/ProductCardSkeleton";

const SkeletonLine = ({ className = "" }: { className?: string }) => {
  return <div className={`animate-pulse rounded bg-white/10 ${className}`} />;
};

const FilterBoxSkeleton = () => {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-800 bg-black">
      <div className="flex items-center justify-between px-4 py-4">
        <SkeletonLine className="h-4 w-28" />
        <SkeletonLine className="h-6 w-6 rounded-full" />
      </div>

      <div className="space-y-2 px-4 pb-4">
        <SkeletonLine className="h-9 w-full rounded-lg" />
        <SkeletonLine className="h-9 w-5/6 rounded-lg" />
        <SkeletonLine className="h-9 w-4/6 rounded-lg" />
      </div>
    </div>
  );
};

const ProductCategoryPageSkeleton = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between md:hidden">
          <SkeletonLine className="h-8 w-40" />
          <SkeletonLine className="h-10 w-24 rounded-xl" />
        </div>

        <div className="flex flex-col gap-6 md:flex-row">
          <aside className="hidden w-72 shrink-0 md:block">
            <div className="sticky top-24 space-y-4">
              <FilterBoxSkeleton />
              <FilterBoxSkeleton />
              <FilterBoxSkeleton />
            </div>
          </aside>

          <main className="flex-1">
            <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-950 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-3">
                  <SkeletonLine className="h-8 w-56" />
                  <SkeletonLine className="h-4 w-36" />
                </div>

                <SkeletonLine className="h-10 w-44 rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProductCategoryPageSkeleton;