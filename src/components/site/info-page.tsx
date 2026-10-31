// Layout for the tabbed info pages (About, Privacy, Terms, Contact, Help, Tutorials, Stories).
// A page file only defines its copy:
//
//   const about: InfoPageConfig = {
//     base: "/about",
//     eyebrow: "About",
//     title: "Built for every story",
//     tabs: [{ path: "", label: "Our story", content: <p>…</p> }, { path: "mission", label: "Mission", content: … }],
//   };
//
// and its route is app/(site)/about/[[...tab]]/page.tsx, which uses infoPageRoute(about).
// Tab content is plain HTML (h2, p, ul…); the `prose` styles format it.

import { notFound } from "next/navigation";
import { Reveal } from "@/components/ui/motion";
import { Container, PageHeader } from "@/components/ui/section";
import { tabRoute, type TabProps } from "@/lib/tabs";
import { cn } from "@/lib/utils";
import { SubNav } from "./sub-nav";

export type InfoTab = {
  path: string;
  label: string;
  content: React.ReactNode;
  /** "text" (default): reading column · "centered": narrow column in the middle, e.g. a form · "wide": full width, e.g. a grid of cards */
  layout?: "text" | "centered" | "wide";
};

const ARTICLE_WIDTH = { text: "max-w-3xl", centered: "mx-auto max-w-2xl", wide: "max-w-none" };

export type InfoPageConfig = {
  base: string;
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  /** Used for the browser tab title. */
  metaTitle: string;
  tabs: InfoTab[];
  /** Optional extra block under the tab content (e.g. a feedback button). */
  footer?: React.ReactNode;
};

export function InfoPage({ config, tab }: { config: InfoPageConfig; tab: InfoTab }) {
  return (
    <>
      <PageHeader eyebrow={config.eyebrow} title={config.title} description={config.subtitle} />
      <Container className="py-12 sm:py-16">
        {config.tabs.length > 1 && (
          <SubNav base={config.base} items={config.tabs.map(({ path, label }) => ({ path, label }))} />
        )}
        <Reveal key={tab.path} onLoad delay={0.1}>
          <article
            className={cn(
              "prose mt-10 prose-zinc prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-brand-700",
              ARTICLE_WIDTH[tab.layout ?? "text"],
            )}
          >
            {tab.content}
          </article>
        </Reveal>
        {config.footer}
      </Container>
    </>
  );
}

/**
 * Everything an info page route needs: static paths, metadata and the page itself.
 *   const route = infoPageRoute(about);
 *   export const generateStaticParams = route.generateStaticParams; …
 */
export function infoPageRoute(config: InfoPageConfig) {
  const tabs = tabRoute(config.tabs);

  return {
    generateStaticParams: tabs.generateStaticParams,
    generateMetadata: async (props: TabProps) => {
      const tab = await tabs.find(props);
      return { title: tab?.path ? `${tab.label} · ${config.metaTitle}` : config.metaTitle };
    },
    Page: async (props: TabProps) => {
      const tab = await tabs.find(props);
      if (!tab) notFound();
      return <InfoPage config={config} tab={tab} />;
    },
  };
}
