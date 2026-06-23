import ProductCategoryPage from "@/components/products/ProductCategoryPage";

interface CategoryRoutePageProps {
  params: Promise<{
    category: string;
  }>;
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function CategoryRoutePage({
  params,
}: CategoryRoutePageProps) {
  const { category } = await params;

  return <ProductCategoryPage categoryKey={safeDecode(category)} />;
}