import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Features } from "@/components/marketing/features";
import { MathSection } from "@/components/marketing/math-section";
import { FAQ } from "@/components/marketing/faq";
import { FinalCTA } from "@/components/marketing/final-cta";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <MathSection />
      <section id="como-funciona">
        <HowItWorks />
      </section>
      <Features />
      <section id="faq">
        <FAQ />
      </section>
      <FinalCTA />
    </>
  );
}
