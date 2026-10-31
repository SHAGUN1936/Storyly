import { EditorShowcase } from "@/components/site/landing/editor-showcase";
import { Faq } from "@/components/site/landing/faq";
import { Features } from "@/components/site/landing/features";
import { Hero } from "@/components/site/landing/hero";
import { HowItWorks } from "@/components/site/landing/how-it-works";
import { Occasions } from "@/components/site/landing/occasions";
import { StatsStrip } from "@/components/site/landing/stats-strip";
import { Testimonials } from "@/components/site/landing/testimonials";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  // Signed-in visitors go straight to their studio
  const user = await getCurrentUser();
  const cta = user ? { href: "/studio", label: "Open your studio" } : { href: "/signup", label: "Start for free" };

  return (
    <>
      <Hero cta={cta} />
      <StatsStrip />
      <EditorShowcase />
      <Features />
      <HowItWorks />
      <Occasions />
      <Testimonials />
      <Faq />
    </>
  );
}
