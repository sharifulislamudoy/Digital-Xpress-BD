import ProductDetailsPage from "@/components/products/ProductDetailsPage";

interface ProductDetailsRoutePageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function ProductDetailsRoutePage({
  params,
}: ProductDetailsRoutePageProps) {
  const { category, slug } = await params;

  return (
    <main className="min-h-screen bg-black py-8 text-white">
      <ProductDetailsPage
        categoryKey={safeDecode(category)}
        productKey={safeDecode(slug)}
      />
    </main>
  );
}