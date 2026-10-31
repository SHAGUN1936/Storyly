// Copy for /terms and its tabs.

import Link from "next/link";
import type { InfoPageConfig } from "@/components/site/info-page";
import { siteConfig } from "@/config/site";

export const termsPage: InfoPageConfig = {
  base: "/terms",
  eyebrow: "Legal",
  metaTitle: "Terms of Service",
  title: "Terms of Service",
  subtitle: "A plain-language summary of what you can do with Storyly and what we can do with your content.",
  tabs: [
    {
      path: "",
      label: "Usage",
      content: (
        <>
          <h2>The agreement</h2>
          <p>
            You receive a license to use the Storyly editor, templates and share links. In return, you agree not to use
            the service for anything illegal, abusive or that infringes on someone else&apos;s rights.
          </p>
          <h2>What you own</h2>
          <ul>
            <li>You own every photo, video, song and word you upload.</li>
            <li>You own the final page you publish.</li>
            <li>You grant Storyly a license to host, render and deliver it to the viewers you share it with.</li>
          </ul>
          <h2>What we own</h2>
          <ul>
            <li>The Storyly platform, editor, branding and the codebase that powers it.</li>
            <li>Templates created by Storyly&apos;s in-house team.</li>
            <li>
              Templates submitted through the Builder Program follow their own license. See{" "}
              <Link href="/builder/pricing">Builder pricing</Link>.
            </li>
          </ul>
          <h2>Account suspension</h2>
          <p>
            We may suspend accounts that publish content that is illegal, CSAM, hateful or that impersonates other
            people. Where appropriate, we give a warning and an opportunity to correct the issue first.
          </p>
        </>
      ),
    },
    {
      path: "payments",
      label: "Payments",
      content: (
        <>
          <h2>Pricing</h2>
          <p>Storyly has two paid products. Neither is required to use the editor:</p>
          <ul>
            <li>
              <strong>Marketplace:</strong> one-time purchase of a premium template. No subscription. Lifetime use on
              your account.
            </li>
            <li>
              <strong>Builder Program:</strong> monthly or yearly subscription to <em>sell</em> templates and earn
              commission.
            </li>
          </ul>
          <h2>Payment methods</h2>
          <p>
            We accept UPI, all major credit and debit cards, NetBanking and international wallets through our payment
            provider. The processor is shown at checkout.
          </p>
          <h2>Receipts and invoices</h2>
          <p>
            Every payment generates a downloadable PDF receipt. Builder Program subscribers receive tax-compliant
            invoices in their dashboard.
          </p>
          <h2>Taxes</h2>
          <p>
            Prices for Indian customers include GST. International customers may see VAT or sales tax added at checkout,
            depending on jurisdiction.
          </p>
        </>
      ),
    },
    {
      path: "refunds",
      label: "Refunds",
      content: (
        <>
          <h2>Marketplace templates</h2>
          <p>
            One-time template purchases are <strong>refundable within 7 days</strong> if the template has not been used
            to publish a page. Once a page has been published with a purchased template, the license is considered used.
          </p>
          <h2>Builder Program subscriptions</h2>
          <p>
            Monthly subscriptions can be cancelled at any time; access continues until the end of the billing period.
            Yearly subscriptions are refundable on a pro-rated basis within the first 14 days.
          </p>
          <h2>How to request a refund</h2>
          <p>
            Email <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a> with your receipt number.
            Refunds are returned to the original payment method within 5–7 business days.
          </p>
          <h2>Chargebacks</h2>
          <p>
            Please contact us before filing a chargeback. Almost all disputes are resolved faster directly with our
            billing team.
          </p>
        </>
      ),
    },
  ],
};
