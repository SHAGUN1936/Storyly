// Sections with tabs in the URL: /about, /about/mission, /marketplace/wedding …
// The route folder is [[...tab]], and "" is the section's main tab.
//
//   const tabs = tabRoute(MARKETPLACE_TABS);
//   export const generateStaticParams = tabs.generateStaticParams;
//   const tab = await tabs.find(props);   // null for unknown tabs → notFound()

export type TabProps = { params: Promise<{ tab?: string[] }> };

export function tabRoute<T extends { path: string }>(tabs: readonly T[]) {
  return {
    /** The tab named in the URL, or null when there is no such tab. */
    async find({ params }: TabProps): Promise<T | null> {
      const segments = (await params).tab ?? [];
      if (segments.length > 1) return null;
      return tabs.find((t) => t.path === (segments[0] ?? "")) ?? null;
    },
    /** Pre-renders every tab at build time. */
    generateStaticParams: () => tabs.map((t) => ({ tab: t.path ? [t.path] : [] })),
  };
}
