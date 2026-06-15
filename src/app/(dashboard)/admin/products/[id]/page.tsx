import ProductFormPage from "@/components/products/ProductFormPage";

interface AdminEditProductPageProps {
  params: {
    id: string;
  };
}

export default function AdminEditProductPage({ params }: AdminEditProductPageProps) {
  return <ProductFormPage mode="edit" panelType="admin" productId={params.id} />;
}