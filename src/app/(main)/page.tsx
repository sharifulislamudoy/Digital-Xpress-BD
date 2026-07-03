import CategorySection from "@/components/home/CategorySection";
import HeroSlider from "@/components/home/HeroSlider";
import LatestProductsSection from "@/components/home/LatestProductsSection";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <HeroSlider />
      <CategorySection />
      <LatestProductsSection />
    </div>
  );
}