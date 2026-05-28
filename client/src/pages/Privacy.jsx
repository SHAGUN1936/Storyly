import InfoPage from '../components/InfoPage';
import GradientText from '../ui/GradientText';

const CONFIG = {
  base: '/privacy',
  eyebrow: 'Privacy',
  title: (
    <>
      Your data.{' '}
      <GradientText variant="cosmic">Your rules.</GradientText>
    </>
  ),
  subtitle:
    'Plain-language privacy policy. No dark patterns, no third-party selling.',
  tabs: [
    {
      path: '',
      label: 'Overview',
      render: () => (
        <>
          <h2>Quick summary</h2>
          <ul>
            <li>We store only what's needed to render your pages and bill you correctly.</li>
            <li>We <strong>do not</strong> sell personal data or share it with advertisers.</li>
            <li>You can export or delete your account and all its content at any time.</li>
            <li>Share pages are public by default. Anyone with the link can view them.</li>
          </ul>
          <h2>What we collect</h2>
          <ul>
            <li><strong>Account info</strong> — name, email, hashed password (or Google OAuth identifier).</li>
            <li><strong>Page content</strong> — the text, images, video, music, and theme overrides you add.</li>
            <li><strong>Usage signals</strong> — IP, browser, device class, and timestamps for security + analytics.</li>
            <li><strong>Payment metadata</strong> — last 4 digits, plan, billing email. Card numbers are stored only by our payment provider.</li>
          </ul>
          <h2>How we use it</h2>
          <p>
            To render your page, deliver share links, send transactional email
            (password reset, receipts), and detect abuse. That's it.
          </p>
          <p>Last updated: 2026-05-29.</p>
        </>
      ),
    },
    {
      path: 'data',
      label: 'Your data rights',
      render: () => (
        <>
          <h2>Access, export, delete</h2>
          <p>
            From your account settings you can:
          </p>
          <ul>
            <li>Download a JSON export of every page you've made.</li>
            <li>Delete a specific page (share link stops working immediately).</li>
            <li>Delete your entire account and all associated data within 24 hours.</li>
          </ul>
          <h2>Children</h2>
          <p>
            Storyly is not directed at children under 13. We do not knowingly
            collect personal information from anyone under 13.
          </p>
          <h2>International transfers</h2>
          <p>
            We host primary infrastructure in India (Mumbai) and the EU
            (Frankfurt). Uploaded media may be served from a CDN closer to your
            viewers.
          </p>
          <h2>Contact</h2>
          <p>
            Privacy questions go to{' '}
            <a href="mailto:privacy@storyly.app">privacy@storyly.app</a>. We
            respond within 7 business days.
          </p>
        </>
      ),
    },
    {
      path: 'cookies',
      label: 'Cookies',
      render: () => (
        <>
          <h2>What we use</h2>
          <p>
            We use a small number of <em>essential</em> cookies and one
            optional analytics cookie. We never use ad-tracking or
            cross-site cookies.
          </p>
          <h3>Essential</h3>
          <ul>
            <li><strong>storyly-session</strong> — auth token, expires in 30 days. Required to stay logged in.</li>
            <li><strong>storyly-theme</strong> — your light/dark preference. Local-only, never sent to the server.</li>
            <li><strong>storyly-csrf</strong> — short-lived form-protection token.</li>
          </ul>
          <h3>Optional (analytics)</h3>
          <ul>
            <li><strong>storyly-anon</strong> — random ID for de-duplicated page-view counts. You can opt out anytime in Settings.</li>
          </ul>
          <h2>Managing cookies</h2>
          <p>
            You can clear cookies via your browser at any time. Clearing the
            session cookie will log you out.
          </p>
        </>
      ),
    },
  ],
};

export default function Privacy() {
  return <InfoPage config={CONFIG} />;
}
