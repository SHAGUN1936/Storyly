// Copy for /privacy and its tabs.

import type { InfoPageConfig } from "@/components/site/info-page";
import { siteConfig } from "@/config/site";

export const privacyPage: InfoPageConfig = {
  base: "/privacy",
  eyebrow: "Privacy",
  metaTitle: "Privacy",
  title: "Privacy policy",
  subtitle: "A plain-language explanation of what we collect and why. We do not sell your data to third parties.",
  tabs: [
    {
      path: "",
      label: "Overview",
      content: (
        <>
          <h2>Summary</h2>
          <ul>
            <li>We store only what is needed to render your pages and bill you correctly.</li>
            <li>
              We <strong>do not</strong> sell personal data or share it with advertisers.
            </li>
            <li>You can export or delete your account and all its content at any time.</li>
            <li>Shared pages are public by default. Anyone with the link can view them.</li>
          </ul>
          <h2>What we collect</h2>
          <ul>
            <li>
              <strong>Account information:</strong> name, email, hashed password (or Google OAuth identifier).
            </li>
            <li>
              <strong>Page content:</strong> the text, images, video, music and theme settings you add.
            </li>
            <li>
              <strong>Usage data:</strong> IP address, browser, device class and timestamps, for security and analytics.
            </li>
            <li>
              <strong>Payment metadata:</strong> last 4 digits, plan and billing email. Card numbers are stored only by
              our payment provider.
            </li>
          </ul>
          <h2>How we use it</h2>
          <p>
            To render your pages, deliver share links, send transactional email (password resets, receipts) and detect
            abuse. Nothing else.
          </p>
          <p>Last updated: 2026-05-29.</p>
        </>
      ),
    },
    {
      path: "data",
      label: "Your data rights",
      content: (
        <>
          <h2>Access, export and deletion</h2>
          <p>From your account settings you can:</p>
          <ul>
            <li>Download a JSON export of every page you have created.</li>
            <li>Delete a specific page (its share link stops working immediately).</li>
            <li>Delete your entire account and all associated data within 24 hours.</li>
          </ul>
          <h2>Children</h2>
          <p>
            Storyly is not directed at children under 13. We do not knowingly collect personal information from anyone
            under 13.
          </p>
          <h2>International transfers</h2>
          <p>
            Our primary infrastructure is hosted in India (Mumbai) and the EU (Frankfurt). Uploaded media may be served
            from a CDN location closer to your viewers.
          </p>
          <h2>Contact</h2>
          <p>
            Send privacy questions to <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>. We
            respond within 7 business days.
          </p>
        </>
      ),
    },
    {
      path: "cookies",
      label: "Cookies",
      content: (
        <>
          <h2>What we use</h2>
          <p>
            We use a small number of <em>essential</em> cookies and one optional analytics cookie. We never use
            advertising or cross-site tracking cookies.
          </p>
          <h3>Essential</h3>
          <ul>
            <li>
              <strong>storyly-session</strong>: authentication token, expires after 30 days. Required to stay signed in.
            </li>
            <li>
              <strong>storyly-csrf</strong>: short-lived form-protection token.
            </li>
          </ul>
          <h3>Optional (analytics)</h3>
          <ul>
            <li>
              <strong>storyly-anon</strong>: random ID used to de-duplicate page-view counts. You can opt out at any
              time in Settings.
            </li>
          </ul>
          <h2>Managing cookies</h2>
          <p>You can clear cookies in your browser at any time. Clearing the session cookie will sign you out.</p>
        </>
      ),
    },
  ],
};
