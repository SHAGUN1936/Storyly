// Copy for /tutorials and its tabs.

import Link from "next/link";
import type { InfoPageConfig } from "@/components/site/info-page";

export const tutorialsPage: InfoPageConfig = {
  base: "/tutorials",
  eyebrow: "Tutorials",
  metaTitle: "Tutorials",
  title: "Learn the editor",
  subtitle: "Short walkthroughs that take you from a blank account to a published page in minutes.",
  tabs: [
    {
      path: "",
      label: "Basics",
      content: (
        <>
          <h2>Editor overview</h2>
          <p>A one-minute tour of the top toolbar, the canvas, the page list and the properties panel.</p>
          <ul>
            <li>How selection works on the canvas</li>
            <li>Drag mode and select mode</li>
            <li>Resize and rotate handles</li>
            <li>Undo, redo and history</li>
          </ul>
          <h2>Replacing text and photos</h2>
          <p>
            Select text on the canvas to edit it. Select any photo slot to replace it from your library. Drag and drop
            also works on desktop.
          </p>
          <h2>Publishing your first page</h2>
          <p>
            Select <strong>Publish</strong>. We render the page, generate a QR code and give you a share link
            immediately.
          </p>
        </>
      ),
    },
    {
      path: "advanced",
      label: "Advanced",
      content: (
        <>
          <h2>Multi-page stories</h2>
          <p>Add pages from the Pages panel. Pages advance as a slideshow for viewers, with timing set per page.</p>
          <h2>Scheduled reveals</h2>
          <p>
            Hide a story until a specific date and time, which works well for surprise invitations. Visitors see a
            countdown until the reveal.
          </p>
          <h2>Custom theme overrides</h2>
          <p>
            Override fonts, colours, background gradients and filters per page using the Theme panel in the bottom dock.
          </p>
          <h2>Animations and transitions</h2>
          <p>Each block has its own entrance animation. Combine them with delays to sequence a reveal.</p>
        </>
      ),
    },
    {
      path: "marketplace",
      label: "Marketplace",
      content: (
        <>
          <h2>Buying a template</h2>
          <p>
            Browse <Link href="/marketplace">the Marketplace</Link> and pay once for any template. It is added to your
            private feed permanently.
          </p>
          <h2>Using purchased templates</h2>
          <ul>
            <li>
              Open <strong>My pages</strong> in your studio.
            </li>
            <li>Select &quot;New page&quot; and choose one of your purchased templates.</li>
            <li>Customise and publish, with no additional fees.</li>
          </ul>
          <h2>Submitting your own templates (Builder Program)</h2>
          <p>
            To sell your designs, join the <Link href="/builder">Builder Program</Link>. We review submissions weekly,
            and approved templates start earning commission immediately.
          </p>
        </>
      ),
    },
  ],
};
