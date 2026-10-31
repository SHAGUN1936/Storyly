import { ScrollToHash } from "@/components/scroll-to-hash";
import { SmoothScroll } from "@/components/smooth-scroll";
import { CtaBand } from "@/components/site/landing/cta-band";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getCurrentUser } from "@/lib/auth";

// Every public page: header on top, then the page, a closing call to action and the footer.
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Signed-in visitors are sent to their studio instead of sign-up
  const user = await getCurrentUser();
  const cta = user ? { href: "/studio", label: "Open your studio" } : { href: "/signup", label: "Start for free" };

  return (
    <div className="flex min-h-screen flex-col">
      <SmoothScroll />
      <ScrollToHash />
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <CtaBand cta={cta} />
      <SiteFooter />
    </div>
  );
}
