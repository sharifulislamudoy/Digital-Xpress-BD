const ProductCardSkeleton = () => {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-950">
      <div className="aspect-[4/3] animate-pulse bg-gray-900" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-4/5 animate-pulse rounded bg-gray-800" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-gray-800" />
        <div className="mx-auto h-4 w-28 animate-pulse rounded bg-gray-800" />
        <div className="mx-auto h-5 w-24 animate-pulse rounded bg-gray-800" />
      </div>
    </div>
  );
};

export default ProductCardSkeleton;