// Copy for /contact and its tabs.

import Link from "next/link";
import { ContactDetails } from "@/components/site/contact-details";
import type { InfoPageConfig } from "@/components/site/info-page";
import { siteConfig } from "@/config/site";

export const contactPage: InfoPageConfig = {
  base: "/contact",
  eyebrow: "Contact",
  metaTitle: "Contact",
  title: "Get in touch",
  subtitle: "Choose the channel that fits your question.",
  tabs: [
    {
      path: "",
      label: "General",
      content: (
        <>
          <h2>General enquiries</h2>
          <p>For partnerships, press, feedback on the editor or a story you would like to share.</p>
          <ContactDetails />
        </>
      ),
    },
    {
      path: "support",
      label: "Support",
      content: (
        <>
          <h2>Help with the editor or a page</h2>
          <p>
            Most issues are resolved fastest through the <Link href="/help">Help Center</Link>. If you still need
            assistance:
          </p>
          <ul>
            <li>
              <strong>Email:</strong> <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>
            </li>
            <li>
              <strong>Feedback form:</strong> <Link href="/stories/share">report a problem or send feedback</Link>.
            </li>
          </ul>
          <h3>What to include</h3>
          <ul>
            <li>The share link of the page, if there is one</li>
            <li>What you expected and what happened instead</li>
            <li>Browser and device (for example, Chrome on iPhone or Safari on Mac)</li>
            <li>A screenshot or screen recording, if possible</li>
          </ul>
        </>
      ),
    },
  ],
};
