import InfoPage from '../components/InfoPage';
import GradientText from '../ui/GradientText';

const CONFIG = {
  base: '/contact',
  eyebrow: 'Contact',
  title: (
    <>
      We're{' '}
      <GradientText variant="cosmic">human.</GradientText>{' '}
      Reach out.
    </>
  ),
  subtitle:
    'Pick the channel that fits your question — we try to answer within one business day.',
  tabs: [
    {
      path: '',
      label: 'General',
      render: () => (
        <>
          <h2>Say hello</h2>
          <p>
            For everything that doesn't fit another category — partnerships,
            press, feedback on the editor, a wedding story you want to share.
          </p>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:hello@storyly.app">hello@storyly.app</a></li>
            <li><strong>Twitter / X:</strong> <a href="#">@storylyapp</a></li>
            <li><strong>Instagram:</strong> <a href="#">@storyly</a></li>
          </ul>
          <h2>Office hours</h2>
          <p>Monday–Friday, 10am–7pm IST. Async replies on weekends.</p>
          <h2>Where we are</h2>
          <p>
            Storyly Technologies Pvt. Ltd. · Bengaluru, India · Remote-first.
          </p>
        </>
      ),
    },
    {
      path: 'support',
      label: 'Support',
      render: () => (
        <>
          <h2>Need help with the editor or a page?</h2>
          <p>
            Most issues are solved fastest by checking the{' '}
            <a href="/help">Help Center</a> first. If you still need a human:
          </p>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:support@storyly.app">support@storyly.app</a></li>
            <li><strong>In-app:</strong> tap the avatar → "Send feedback".</li>
          </ul>
          <h3>What to include</h3>
          <ul>
            <li>The share link of the page (if there is one)</li>
            <li>What you expected vs what happened</li>
            <li>Browser + device class (Chrome on iPhone, Safari on Mac, etc.)</li>
            <li>A screenshot or screen recording, if possible</li>
          </ul>
          <h2>Outages</h2>
          <p>
            Status updates go to <a href="#">status.storyly.app</a>.
            Subscribe there for SMS / RSS / email alerts.
          </p>
        </>
      ),
    },
    {
      path: 'sales',
      label: 'Sales',
      render: () => (
        <>
          <h2>For agencies, studios, and enterprise</h2>
          <p>
            If you want to use Storyly across a team, with white-label share
            pages or a custom domain, our Studio plan and Builder Program have
            you covered. Talk to us for volume pricing.
          </p>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:sales@storyly.app">sales@storyly.app</a></li>
            <li><strong>Book a call:</strong> we typically reply within 6 working hours with available slots.</li>
          </ul>
          <h2>What we'll ask</h2>
          <ul>
            <li>How many people will create pages?</li>
            <li>Do you need a custom domain / white-label?</li>
            <li>Do you want a Builder Program agreement to sell your own templates?</li>
            <li>Any compliance needs (GST invoices, DPA, etc.)?</li>
          </ul>
        </>
      ),
    },
  ],
};

export default function Contact() {
  return <InfoPage config={CONFIG} />;
}
