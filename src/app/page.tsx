import { CallToActionSection } from '@/components/home/CallToActionSection';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { FeaturedEquipmentSection } from '@/components/home/FeaturedEquipmentSection';
import { HeroSection } from '@/components/home/HeroSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { ReviewsSection } from '@/components/home/ReviewsSection';

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturedEquipmentSection />
      <CategoriesSection />
      <HowItWorksSection />
      <ReviewsSection />
      <CallToActionSection />
    </>
  );
}
