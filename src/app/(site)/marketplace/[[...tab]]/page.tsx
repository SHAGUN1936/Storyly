// /marketplace (all templates) and /marketplace/<category>.

import { notFound } from "next/navigation";
import { HowBuyingWorks, SellerCta, TemplateGrid } from "@/components/site/marketplace/marketplace-sections";
import { MARKETPLACE_TABS } from "@/components/site/marketplace/templates";
import { SubNav } from "@/components/site/sub-nav";
import { Container, PageHeader } from "@/components/ui/section";
import { tabRoute, type TabProps } from "@/lib/tabs";

const tabs = tabRoute(MARKETPLACE_TABS);

export const generateStaticParams = tabs.generateStaticParams;

export async function generateMetadata(props: TabProps) {
  const tab = await tabs.find(props);
  return { title: tab?.path ? `${tab.label} templates · Marketplace` : "Marketplace" };
}

export default async function MarketplacePage(props: TabProps) {
  const tab = await tabs.find(props);
  if (!tab) notFound();

  return (
    <>
      <PageHeader
        eyebrow="Template marketplace"
        title="Premium templates, one-time purchase"
        description="Buy a premium template once and it stays in your library permanently. Use it on every page you create, with no subscription and no watermark."
      />
      <Container className="py-12 sm:py-16">
        <SubNav base="/marketplace" items={MARKETPLACE_TABS} />
        <div className="mt-8">
          <TemplateGrid category={tab.path || null} />
        </div>
      </Container>
      <HowBuyingWorks />
      <SellerCta />
    </>
  );
}
