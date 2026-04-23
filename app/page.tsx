import { Header } from "@/components/landing/header";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesGrid } from "@/components/landing/features-grid";
import { TemplatesShowcase } from "@/components/landing/templates-showcase";
import { PricingSection } from "@/components/landing/pricing-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturesGrid />
        <TemplatesShowcase />
        <PricingSection />
        <TestimonialsSection />
      </main>
      <Footer />
    </>
  );
}
