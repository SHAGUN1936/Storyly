import InfoPage from '../components/InfoPage';
import GradientText from '../ui/GradientText';

const CONFIG = {
  base: '/help',
  eyebrow: 'Help Center',
  title: (
    <>
      Find the answer in{' '}
      <GradientText variant="cosmic">under a minute.</GradientText>
    </>
  ),
  subtitle:
    'Quick guides for the most common questions. Still stuck? Try the support tab inside Contact.',
  tabs: [
    {
      path: '',
      label: 'Getting started',
      render: () => (
        <>
          <h2>Make your first page in 60 seconds</h2>
          <ol>
            <li>Sign up for a free account.</li>
            <li>Open the Feed and pick a template.</li>
            <li>Tap any text, image, or media slot to replace it.</li>
            <li>Hit <strong>Publish</strong>. You get a share link + QR.</li>
          </ol>
          <h2>Editing tips</h2>
          <ul>
            <li><strong>Drag mode</strong> in the top toolbar lets you re-position elements freely.</li>
            <li><strong>Undo / redo</strong> works with Ctrl+Z and Ctrl+Shift+Z.</li>
            <li>Use the Pages panel to add new slides to your story.</li>
            <li>Add music from the Music picker — your visitors hear it as the page auto-advances.</li>
          </ul>
          <h2>Mobile vs desktop</h2>
          <p>
            The editor is touch-first but works great on desktop with a mouse.
            Mobile uses a bottom dock; desktop shows side panels.
          </p>
        </>
      ),
    },
    {
      path: 'account',
      label: 'Account',
      render: () => (
        <>
          <h2>Logging in</h2>
          <ul>
            <li>Email + password, or Google sign-in.</li>
            <li>Forgot your password? Reset it from the login screen.</li>
          </ul>
          <h2>Account settings</h2>
          <ul>
            <li>Change your display name and avatar from the avatar menu.</li>
            <li>Export all your pages as JSON at any time.</li>
            <li>Delete your account permanently — all pages and share links are wiped within 24 hours.</li>
          </ul>
          <h2>Two-factor auth</h2>
          <p>
            Builder Program accounts get optional 2FA (TOTP). Enable from
            Settings → Security.
          </p>
        </>
      ),
    },
    {
      path: 'billing',
      label: 'Billing',
      render: () => (
        <>
          <h2>What can I buy?</h2>
          <ul>
            <li><strong>Marketplace templates</strong> — one-time purchase, ₹49–₹999. Yours forever.</li>
            <li><strong>Builder Program</strong> — monthly (₹999) or yearly (₹9,999) subscription to sell your own templates.</li>
          </ul>
          <h2>Payment methods</h2>
          <p>UPI, all major credit + debit cards, NetBanking, international wallets.</p>
          <h2>Receipts &amp; invoices</h2>
          <p>
            Receipts are auto-emailed. Builder subscribers get tax-compliant
            invoices in their dashboard.
          </p>
          <h2>Refunds</h2>
          <p>
            See <a href="/terms/refunds">refund policy</a> for the full details.
            TL;DR: templates refundable within 7 days if unused; Builder
            subscriptions cancellable anytime.
          </p>
        </>
      ),
    },
    {
      path: 'sharing',
      label: 'Sharing',
      render: () => (
        <>
          <h2>Sharing your page</h2>
          <p>Every published page gets three ways to share:</p>
          <ul>
            <li><strong>Link</strong> — a short share URL.</li>
            <li><strong>QR code</strong> — a designer QR you can drop on a card or screen.</li>
            <li><strong>Embed</strong> — paste it into a website or blog.</li>
          </ul>
          <h2>Privacy</h2>
          <p>
            All share pages are public-by-link — anyone who has the URL can
            view them. We don't list them in any public directory.
          </p>
          <h2>Analytics</h2>
          <p>
            Pro and Studio plans see how many unique views the page got, when,
            and from which countries. No personally identifying info is shown.
          </p>
        </>
      ),
    },
  ],
};

export default function Help() {
  return <InfoPage config={CONFIG} />;
}
