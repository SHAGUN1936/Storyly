// Copy for /help (Help Center) and its tabs.

import Link from "next/link";
import type { InfoPageConfig } from "@/components/site/info-page";

export const helpPage: InfoPageConfig = {
  base: "/help",
  eyebrow: "Help Center",
  metaTitle: "Help Center",
  title: "How can we help?",
  subtitle:
    "Guides for the most common questions. If you cannot find an answer, see the Support section of the Contact page.",
  tabs: [
    {
      path: "",
      label: "Getting started",
      content: (
        <>
          <h2>Create your first page</h2>
          <ol>
            <li>Sign up for a free account.</li>
            <li>Open your Studio and choose a template.</li>
            <li>Select any text, image or media slot to replace it.</li>
            <li>
              Select <strong>Publish</strong>. You receive a share link and a QR code.
            </li>
          </ol>
          <h2>Editing tips</h2>
          <ul>
            <li>
              <strong>Drag mode</strong> in the top toolbar lets you reposition elements freely.
            </li>
            <li>
              <strong>Undo and redo</strong> work with Ctrl+Z and Ctrl+Shift+Z.
            </li>
            <li>Use the Pages panel to add slides to your story.</li>
            <li>Add music from the Music picker; visitors hear it as the page advances.</li>
          </ul>
          <h2>Mobile and desktop</h2>
          <p>
            The editor is designed for touch but works equally well on desktop with a mouse. On mobile, tools sit in a
            bottom dock; on desktop they appear in side panels.
          </p>
        </>
      ),
    },
    {
      path: "account",
      label: "Account",
      content: (
        <>
          <h2>Signing in</h2>
          <ul>
            <li>Use email and password, or sign in with Google.</li>
          </ul>
          <h2>Account settings</h2>
          <ul>
            <li>Change your name or password from Account in the account menu.</li>
            <li>Signed in with Google? You can add a password there to sign in with email too.</li>
          </ul>
          <h2>Need something else?</h2>
          <p>
            For anything you can&apos;t change yourself, such as deleting your account,{" "}
            <Link href="/contact">contact us</Link>.
          </p>
        </>
      ),
    },
    {
      path: "billing",
      label: "Billing",
      content: (
        <>
          <h2>What can I buy?</h2>
          <ul>
            <li>
              <strong>Marketplace templates:</strong> one-time purchase, ₹49–₹999, yours permanently.
            </li>
            <li>
              <strong>Builder Program:</strong> monthly (₹999) or yearly (₹9,999) subscription to sell your own
              templates.
            </li>
          </ul>
          <h2>Payment methods</h2>
          <p>UPI, all major credit and debit cards, NetBanking and international wallets.</p>
          <h2>Receipts and invoices</h2>
          <p>
            Receipts are emailed automatically. Builder subscribers receive tax-compliant invoices in their dashboard.
          </p>
          <h2>Refunds</h2>
          <p>
            See the <Link href="/terms/refunds">refund policy</Link> for full details. In short: templates are
            refundable within 7 days if unused, and Builder subscriptions can be cancelled at any time.
          </p>
        </>
      ),
    },
    {
      path: "sharing",
      label: "Sharing",
      content: (
        <>
          <h2>Sharing your page</h2>
          <p>Every published page can be shared in three ways:</p>
          <ul>
            <li>
              <strong>Link:</strong> a short share URL.
            </li>
            <li>
              <strong>QR code:</strong> a styled QR code you can print on a card or show on a screen.
            </li>
            <li>
              <strong>Embed:</strong> add it to a website or blog.
            </li>
          </ul>
          <h2>Privacy</h2>
          <p>
            Shared pages are public by link: anyone with the URL can view them. We do not list them in any public
            directory.
          </p>
        </>
      ),
    },
  ],
};
