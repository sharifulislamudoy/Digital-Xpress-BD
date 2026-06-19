import ProductFormPage from "@/components/products/ProductFormPage";

interface AdminEditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminEditProductPage({
  params,
}: AdminEditProductPageProps) {
  const { id } = await params;

  return <ProductFormPage mode="edit" panelType="admin" productId={id} />;
}