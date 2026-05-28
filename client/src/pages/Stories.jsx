import { useState } from 'react';
import { motion } from 'framer-motion';
import InfoPage from '../components/InfoPage';
import GradientText from '../ui/GradientText';
import FeedbackModal, { FeedbackForm } from '../components/FeedbackModal';

const STORIES = [
  {
    name: 'Ananya & Rohan',
    title: 'A wedding that felt like a film',
    quote:
      '"We sent the link to 300 guests. Everyone asked who designed it. Storyly did, in 20 minutes."',
    location: 'Udaipur, India',
  },
  {
    name: 'Krish T.',
    title: 'My birthday went viral on stories',
    quote:
      '"Friends literally screenshotted the animations. I felt like a main character on my own page."',
    location: 'Mumbai, India',
  },
  {
    name: 'Meera R.',
    title: 'Cinematic invitation, zero stress',
    quote:
      '"It looked like a Bollywood teaser. Drag, drop, share. Done in an evening."',
    location: 'Bengaluru, India',
  },
  {
    name: 'Studio Kala',
    title: 'A creator studio earning ₹40k/mo',
    quote:
      '"Builder Program changed how we monetize. Our wedding template alone has 600+ buyers."',
    location: 'Delhi NCR, India',
  },
];

function StoryGrid() {
  return (
    <div className="grid sm:grid-cols-2 gap-5">
      {STORIES.map((s) => (
        <div
          key={s.name}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
        >
          <div className="story-ring p-[2px] w-fit mb-4">
            <div className="bg-ink-900 w-10 h-10 rounded-full flex items-center justify-center font-display font-extrabold text-sm text-white">
              {s.name[0]}
            </div>
          </div>
          <p className="font-display text-lg font-bold text-white">{s.title}</p>
          <p className="mt-3 text-sm text-slate-300 leading-7">{s.quote}</p>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
            {s.name} · {s.location}
          </p>
        </div>
      ))}
    </div>
  );
}

const CONFIG = {
  base: '/stories',
  eyebrow: 'Customer stories',
  title: (
    <>
      People are{' '}
      <GradientText variant="warm">obsessed.</GradientText>
    </>
  ),
  subtitle:
    'Real pages, real share links, real builders. Read how people use Storyly to mark the moments that matter — and share your own.',
  tabs: [
    {
      path: '',
      label: 'Featured',
      render: () => (
        <>
          <h2>Featured stories</h2>
          <p>Hand-picked stories from our community.</p>
          <div className="not-prose -mx-2 sm:-mx-4 mt-6">
            <StoryGrid />
          </div>
        </>
      ),
    },
    {
      path: 'weddings',
      label: 'Weddings',
      render: () => (
        <>
          <h2>Wedding stories</h2>
          <p>
            Save-the-dates, invitations, RSVP pages, and post-wedding recaps.
          </p>
          <ul>
            <li><strong>Ananya &amp; Rohan</strong> — Udaipur · 300 guests scanned the QR within 2 hours.</li>
            <li><strong>Priya &amp; Karan</strong> — Goa beach wedding · multi-page itinerary with live timeline.</li>
            <li><strong>Tanvi &amp; Aarav</strong> — destination wedding · countdown-reveal page for the date drop.</li>
          </ul>
        </>
      ),
    },
    {
      path: 'birthdays',
      label: 'Birthdays',
      render: () => (
        <>
          <h2>Birthday + milestone stories</h2>
          <ul>
            <li><strong>Krish T.</strong> — 21st birthday recap reel, friends still talk about it.</li>
            <li><strong>Maya N.</strong> — first-birthday page for her daughter, shared with extended family.</li>
            <li><strong>Riya P.</strong> — milestone graduation page with embedded photo timeline.</li>
          </ul>
          <p>
            Pages for birthdays are the most-shared category on Storyly,
            with an average of 47 views per share link.
          </p>
        </>
      ),
    },
    {
      path: 'creators',
      label: 'Creators',
      render: () => (
        <>
          <h2>Creators earning with Storyly</h2>
          <p>
            Designers and studios using the Builder Program to sell their work.
          </p>
          <ul>
            <li><strong>Studio Kala</strong> — ₹40,000+/month from one wedding template line.</li>
            <li><strong>The Confetti Co.</strong> — niche birthday templates with 600+ buyers.</li>
            <li><strong>Indigo Studio</strong> — minimalist invitation suite, ₹25k/month and growing.</li>
          </ul>
          <p>
            Want to join them?{' '}
            <a href="/builder">Apply to the Builder Program →</a>
          </p>
        </>
      ),
    },
    {
      path: 'share',
      label: 'Share yours',
      render: () => (
        <>
          <h2>Share your story</h2>
          <p>
            Tell us how you used Storyly. The best stories get featured in the
            Customer Stories carousel and on the Landing page — and we'll reach
            out if we want to spotlight you.
          </p>
          <div className="not-prose mt-6">
            <FeedbackForm
              defaultKind="story"
              context="From the Customer Stories page"
              inline
            />
          </div>
        </>
      ),
    },
  ],
};

export default function Stories() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <>
      <InfoPage config={CONFIG} />

      {/* Floating "Share your story" CTA — always available no matter which sub-tab */}
      <motion.button
        type="button"
        onClick={() => setFeedbackOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full pl-4 pr-5 py-3 text-sm font-bold text-white border border-white/15 shadow-[0_18px_50px_-16px_rgba(168,85,247,0.7),inset_0_1px_0_rgba(255,255,255,0.25)]"
        style={{
          backgroundImage: 'linear-gradient(120deg, #22D3EE 0%, #A855F7 50%, #F472B6 100%)',
        }}
      >
        <span className="text-base">✨</span>
        <span>Share your story</span>
      </motion.button>

      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        defaultKind="story"
        context="From the Customer Stories page"
      />
    </>
  );
}
