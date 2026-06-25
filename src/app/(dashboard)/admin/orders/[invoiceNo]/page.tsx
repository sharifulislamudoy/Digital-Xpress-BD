import OrderEditPage from "@/components/orders/OrderEditPage";

interface PageProps {
  params: Promise<{ invoiceNo: string }>;
}

export default async function AdminOrderEditRoute({ params }: PageProps) {
  const { invoiceNo } = await params;
  return <OrderEditPage panelType="admin" invoiceNo={decodeURIComponent(invoiceNo)} />;
}
