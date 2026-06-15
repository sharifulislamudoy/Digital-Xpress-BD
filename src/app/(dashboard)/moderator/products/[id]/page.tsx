import ProductFormPage from "@/components/products/ProductFormPage";

interface ModeratorEditProductPageProps {
  params: {
    id: string;
  };
}

export default function ModeratorEditProductPage({
  params,
}: ModeratorEditProductPageProps) {
  return <ProductFormPage mode="edit" panelType="moderator" productId={params.id} />;
}