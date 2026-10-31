import InfoPage from '../components/InfoPage';
import GradientText from '../ui/GradientText';

const CONFIG = {
  base: '/tutorials',
  eyebrow: 'Tutorials',
  title: (
    <>
      Learn the editor.{' '}
      <GradientText variant="cosmic">Ship faster.</GradientText>
    </>
  ),
  subtitle:
    'Short walkthroughs that get you from zero to publishing in minutes.',
  tabs: [
    {
      path: '',
      label: 'Basics',
      render: () => (
        <>
          <h2>Editor tour</h2>
          <p>
            Sixty seconds. Covers the top toolbar, the canvas, page list, and
            properties panel.
          </p>
          <ul>
            <li>How the canvas selection works</li>
            <li>Drag mode vs select mode</li>
            <li>Resize and rotate handles</li>
            <li>Undo / redo + history</li>
          </ul>
          <h2>Replacing text and photos</h2>
          <p>
            Tap text directly on the canvas to edit. Tap any photo slot to
            replace it from your library. Drag-and-drop on desktop also works.
          </p>
          <h2>Publishing your first page</h2>
          <p>
            Hit the <strong>Publish</strong> button. We render the page,
            generate a QR code, and give you a share link instantly.
          </p>
        </>
      ),
    },
    {
      path: 'advanced',
      label: 'Advanced',
      render: () => (
        <>
          <h2>Multi-page stories</h2>
          <p>
            Add pages from the Pages panel. Pages auto-advance as a slideshow
            for viewers, with per-page timing.
          </p>
          <h2>Scheduled reveals</h2>
          <p>
            Hide the story until a specific date/time — perfect for surprise
            invitations. Visitors see a countdown until the reveal.
          </p>
          <h2>Custom theme overrides</h2>
          <p>
            Override fonts, colors, background gradients, and filters per page.
            Use the Theme panel from the bottom dock.
          </p>
          <h2>Animations and transitions</h2>
          <p>
            Each block has its own entrance animation. Layer them with delays
            to choreograph cinematic reveals.
          </p>
        </>
      ),
    },
    {
      path: 'marketplace',
      label: 'Marketplace',
      render: () => (
        <>
          <h2>Buying a template</h2>
          <p>
            Browse <a href="/marketplace">the Marketplace</a> and pay once for
            any template you love. It's added to your private feed permanently.
          </p>
          <h2>Using purchased templates</h2>
          <ul>
            <li>Open your <a href="/my-videos">My pages</a> studio.</li>
            <li>Tap "New page" and pick any of your purchased templates.</li>
            <li>Customize and publish — no extra fees.</li>
          </ul>
          <h2>Submitting your own templates (Builder Program)</h2>
          <p>
            Want to sell your designs? Join the{' '}
            <a href="/builder">Builder Program</a>. We accept submissions
            weekly, and approved templates start earning commission
            immediately.
          </p>
        </>
      ),
    },
  ],
};

export default function Tutorials() {
  return <InfoPage config={CONFIG} />;
}
