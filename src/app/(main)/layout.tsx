import Navbar from "@/shared/Navbar";
import Footer from "@/shared/Footer";
import DeliveredOrderReviewPrompt from "@/components/reviews/DeliveredOrderReviewPrompt";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1">
      <Navbar />
      <main className="flex-1">{children}</main>
      <DeliveredOrderReviewPrompt />
      <Footer />
    </div>
  );
}