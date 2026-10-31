// /builder (Builder Program) and its tabs: /builder/how-it-works, /builder/pricing, /builder/faq.

import { notFound } from "next/navigation";
import { BUILDER_TABS } from "@/components/site/builder/builder-data";
import { BuilderTabBody } from "@/components/site/builder/builder-sections";
import { SubNav } from "@/components/site/sub-nav";
import { ButtonLink } from "@/components/ui/button";
import { Container, PageHeader } from "@/components/ui/section";
import { tabRoute, type TabProps } from "@/lib/tabs";

const tabs = tabRoute(BUILDER_TABS);

export const generateStaticParams = tabs.generateStaticParams;

export async function generateMetadata(props: TabProps) {
  const tab = await tabs.find(props);
  return { title: tab?.path ? `${tab.label} · Builder Program` : "Builder Program" };
}

export default async function BuilderPage(props: TabProps) {
  const tab = await tabs.find(props);
  if (!tab) notFound();

  return (
    <>
      <PageHeader
        eyebrow="Builder Program"
        title="Sell your templates on Storyly"
        description="Subscribe to become a Storyly Builder, submit templates and earn commission each time someone likes or uses your work. Payouts are made monthly to UPI, bank or PayPal."
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/builder/pricing" scroll={false} variant="inverted">
            View plans
          </ButtonLink>
          <ButtonLink
            href="/builder/how-it-works"
            scroll={false}
            variant="ghost"
            className="border border-white/20 text-white hover:bg-white/10 hover:text-white"
          >
            How it works
          </ButtonLink>
        </div>
      </PageHeader>
      <Container className="py-12 sm:py-16">
        <SubNav base="/builder" items={BUILDER_TABS} />
        <div className="mt-10">
          <BuilderTabBody tab={tab.path} />
        </div>
      </Container>
    </>
  );
}
