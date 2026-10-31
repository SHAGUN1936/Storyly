// Shows an imported page inside a sandboxed iframe.
// The sandbox has no "allow-same-origin", so the page's scripts run but can't read
// this site's cookies, storage or pages.

import { cn } from "@/lib/utils";

export function SiteFrame({ html, title, className }: { html: string; title: string; className?: string }) {
  return (
    <iframe
      srcDoc={html}
      title={title}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms"
      referrerPolicy="no-referrer"
      loading="lazy"
      className={cn("block size-full border-0 bg-white", className)}
    />
  );
}
