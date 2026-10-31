import InfoPage from '../components/InfoPage';
import GradientText from '../ui/GradientText';

const CONFIG = {
  base: '/about',
  eyebrow: 'About Storyly',
  title: (
    <>
      The story behind{' '}
      <GradientText variant="cosmic">the story builder.</GradientText>
    </>
  ),
  subtitle:
    'Storyly is a tiny team building tools so anyone — designer or not — can make moments feel cinematic.',
  tabs: [
    {
      path: '',
      label: 'Our story',
      render: () => (
        <>
          <h2>Where we started</h2>
          <p>
            Storyly began in late 2024 with a simple frustration: every wedding,
            birthday, and event invitation looked exactly the same. PDFs.
            WhatsApp forwards. Stock templates. Nothing that felt like the
            person sending it.
          </p>
          <p>
            We come from product design, motion, and engineering backgrounds —
            and we kept asking why the most special moments in life were
            being shared with the least special design tools.
          </p>
          <h2>What changed</h2>
          <p>
            We built Storyly to give anyone the cinematic, animated, share-worthy
            page they deserve — without needing Figma, code, or a designer.
            Tap to edit. Drop in photos. Pick a song. Share with a QR. Done in
            sixty seconds.
          </p>
          <h2>What we believe</h2>
          <ul>
            <li><strong>Moments deserve motion.</strong> A still image can't capture a wedding morning. Motion can.</li>
            <li><strong>Beauty should be one tap away.</strong> The editor must feel like an Instagram story, not Photoshop.</li>
            <li><strong>Creators should earn.</strong> If you design the templates people love, you should be paid for it.</li>
          </ul>
        </>
      ),
    },
    {
      path: 'mission',
      label: 'Mission',
      render: () => (
        <>
          <h2>Our mission</h2>
          <p>
            To put cinematic storytelling in the hands of one billion people who
            were told design was for somebody else.
          </p>
          <h2>How we measure ourselves</h2>
          <ul>
            <li>Pages created per month</li>
            <li>Time-to-first-share (we want it under 60 seconds)</li>
            <li>Creator earnings paid out</li>
            <li>Net delight from people who scan the QR codes</li>
          </ul>
          <h2>Where we go next</h2>
          <p>
            Beyond invitations, we're building toward birthday recap pages,
            anniversary timelines, memorial sites, baby reveals, RSVP pipelines,
            and creator monetization that genuinely funds independent designers.
          </p>
        </>
      ),
    },
    {
      path: 'team',
      label: 'Team',
      render: () => (
        <>
          <h2>The team</h2>
          <p>
            Storyly is built by a tiny, remote, motion-obsessed team.
            We hire slowly and care more about taste than résumé.
          </p>
          <h3>Founding crew</h3>
          <ul>
            <li><strong>Aarav S.</strong> — Product · ex-design lead at a streaming platform.</li>
            <li><strong>Meera K.</strong> — Engineering · obsessed with editor performance.</li>
            <li><strong>Rohan T.</strong> — Motion · ex-After Effects pro, now writing CSS keyframes.</li>
            <li><strong>Priya N.</strong> — Community + creators · runs the Builder Program.</li>
          </ul>
          <h3>Hiring</h3>
          <p>
            We're occasionally looking for designers, motion engineers, and
            community managers. Drop us a note at{' '}
            <a href="mailto:hello@storyly.app">hello@storyly.app</a>.
          </p>
        </>
      ),
    },
  ],
};

export default function About() {
  return <InfoPage config={CONFIG} />;
}
