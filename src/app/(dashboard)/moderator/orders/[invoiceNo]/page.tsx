import OrderEditPage from "@/components/orders/OrderEditPage";

interface PageProps {
  params: Promise<{ invoiceNo: string }>;
}

export default async function ModeratorOrderEditRoute({ params }: PageProps) {
  const { invoiceNo } = await params;
  return <OrderEditPage panelType="moderator" invoiceNo={decodeURIComponent(invoiceNo)} />;
}
