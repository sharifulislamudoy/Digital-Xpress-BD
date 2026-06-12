const ProductCardSkeleton = () => {
  return (
    <div className="relative isolate overflow-hidden rounded-2xl border border-white/10 bg-black/70 shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur-xl before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0.03)_35%,rgba(249,115,22,0.07)_100%)]">
      <div className="aspect-[4/3] animate-pulse rounded-t-2xl bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.12),rgba(17,24,39,0.75)_45%,rgba(0,0,0,1)_100%)]" />

      <div className="space-y-3 bg-black/55 p-4 backdrop-blur-xl">
        <div className="h-4 w-4/5 animate-pulse rounded bg-white/10" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-white/10" />
        <div className="mx-auto h-4 w-28 animate-pulse rounded bg-orange-400/15" />
        <div className="mx-auto h-5 w-24 animate-pulse rounded bg-white/10" />
      </div>
    </div>
  );
};

export default ProductCardSkeleton;