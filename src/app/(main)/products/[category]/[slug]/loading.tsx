import ProductDetailsPageSkeleton from "@/components/products/ProductDetailsPageSkeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-black py-8 text-white">
      <ProductDetailsPageSkeleton />
    </main>
  );
}