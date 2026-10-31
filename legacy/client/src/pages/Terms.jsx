import InfoPage from '../components/InfoPage';
import GradientText from '../ui/GradientText';

const CONFIG = {
  base: '/terms',
  eyebrow: 'Terms of Service',
  title: (
    <>
      The rules,{' '}
      <GradientText variant="cosmic">in human language.</GradientText>
    </>
  ),
  subtitle:
    'A short, plain-text explanation of what you can do with Storyly and what we can do with your content.',
  tabs: [
    {
      path: '',
      label: 'Usage',
      render: () => (
        <>
          <h2>The deal</h2>
          <p>
            You get a license to use the Storyly editor, templates, and share
            links. In return, you agree not to use the service for anything
            illegal, abusive, or that breaks someone else's rights.
          </p>
          <h2>What you own</h2>
          <ul>
            <li>You own every photo, video, song, and word you upload.</li>
            <li>You own the final page you publish.</li>
            <li>You grant Storyly a license to host, render, and deliver it to viewers you share it with.</li>
          </ul>
          <h2>What we own</h2>
          <ul>
            <li>The Storyly platform, editor, branding, and the codebase that powers it.</li>
            <li>Templates created by Storyly's in-house team.</li>
            <li>Templates submitted via the Builder Program follow their own license — see <a href="/builder/pricing">builder pricing</a>.</li>
          </ul>
          <h2>Account suspension</h2>
          <p>
            We may suspend accounts publishing content that's illegal,
            CSAM, hateful, or impersonates other people. We err on the side
            of giving warning and a chance to fix it first.
          </p>
        </>
      ),
    },
    {
      path: 'payments',
      label: 'Payments',
      render: () => (
        <>
          <h2>Pricing</h2>
          <p>
            Storyly has two paid surfaces — neither is required to use the editor:
          </p>
          <ul>
            <li><strong>Marketplace</strong> — one-time purchase of a premium template. No subscription. Lifetime use on your account.</li>
            <li><strong>Builder Program</strong> — monthly or yearly subscription to <em>sell</em> templates and earn commission.</li>
          </ul>
          <h2>Payment methods</h2>
          <p>
            We accept UPI, all major credit and debit cards, NetBanking, and
            international wallets via our payment provider. You'll see the
            exact processor at checkout.
          </p>
          <h2>Receipts &amp; invoices</h2>
          <p>
            Every payment generates a downloadable PDF receipt. Builder
            Program subscribers get tax-compliant invoices in their dashboard.
          </p>
          <h2>Taxes</h2>
          <p>
            Indian customers see GST included; international customers may
            see VAT/sales tax added at checkout depending on jurisdiction.
          </p>
        </>
      ),
    },
    {
      path: 'refunds',
      label: 'Refunds',
      render: () => (
        <>
          <h2>Marketplace templates</h2>
          <p>
            One-time template purchases are <strong>refundable within 7 days</strong>
            {' '}if you haven't actually used the template to publish a page.
            Once a page has been published using a purchased template, the
            license is considered consumed.
          </p>
          <h2>Builder Program subscriptions</h2>
          <p>
            Monthly subscriptions can be cancelled anytime; access continues
            until the end of the billing period. Yearly subscriptions are
            refundable on a pro-rated basis within the first 14 days.
          </p>
          <h2>How to request a refund</h2>
          <p>
            Email <a href="mailto:billing@storyly.app">billing@storyly.app</a>
            {' '}with your receipt number. Refunds are processed back to the
            original payment method within 5–7 business days.
          </p>
          <h2>Chargebacks</h2>
          <p>
            Please contact us before filing a chargeback. Almost all disputes
            are resolved faster directly with our billing team.
          </p>
        </>
      ),
    },
  ],
};

export default function Terms() {
  return <InfoPage config={CONFIG} />;
}
