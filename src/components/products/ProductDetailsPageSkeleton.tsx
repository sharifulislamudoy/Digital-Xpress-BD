const SkeletonLine = ({ className = "" }: { className?: string }) => {
  return <div className={`animate-pulse rounded bg-white/10 ${className}`} />;
};

const InfoSkeleton = () => {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
      <SkeletonLine className="h-3 w-24" />
      <SkeletonLine className="mt-3 h-4 w-32" />
    </div>
  );
};

const ProductDetailsPageSkeleton = () => {
  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4">
      <nav className="rounded-2xl border border-gray-800 bg-black px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <SkeletonLine className="h-4 w-12" />
          <SkeletonLine className="h-4 w-3" />
          <SkeletonLine className="h-4 w-20" />
          <SkeletonLine className="h-4 w-3" />
          <SkeletonLine className="h-4 w-32" />
          <SkeletonLine className="h-4 w-3" />
          <SkeletonLine className="h-4 w-44" />
        </div>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-gray-800 bg-black p-4">
          <div className="aspect-square animate-pulse rounded-2xl bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.12),rgba(17,24,39,0.75)_45%,rgba(0,0,0,1)_100%)]" />

          <div className="mt-4 flex gap-2 overflow-hidden">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="aspect-square shrink-0 basis-[calc((100%_-_2rem)/5)] animate-pulse rounded-xl border border-gray-800 bg-gray-950"
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-black p-5">
          <div className="flex flex-wrap gap-2">
            <SkeletonLine className="h-7 w-20 rounded-full" />
            <SkeletonLine className="h-7 w-24 rounded-full" />
          </div>

          <SkeletonLine className="mt-5 h-9 w-4/5" />
          <SkeletonLine className="mt-3 h-4 w-full" />
          <SkeletonLine className="mt-2 h-4 w-2/3" />

          <div className="mt-5 flex items-end gap-3">
            <SkeletonLine className="h-10 w-36" />
            <SkeletonLine className="h-6 w-24" />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <InfoSkeleton key={index} />
            ))}
          </div>

          <SkeletonLine className="mt-5 h-12 w-full rounded-xl" />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-black p-2">
        <div className="flex gap-2 overflow-hidden">
          <SkeletonLine className="h-11 w-32 rounded-xl" />
          <SkeletonLine className="h-11 w-40 rounded-xl" />
          <SkeletonLine className="h-11 w-36 rounded-xl" />
        </div>
      </div>

      <section className="rounded-2xl border border-gray-800 bg-black p-5">
        <SkeletonLine className="mb-4 h-6 w-40" />
        <div className="space-y-3">
          <SkeletonLine className="h-4 w-full" />
          <SkeletonLine className="h-4 w-11/12" />
          <SkeletonLine className="h-4 w-8/12" />
        </div>
      </section>
    </div>
  );
};

export default ProductDetailsPageSkeleton;