import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PublicShell from '../components/PublicShell';
import SubNav from '../components/SubNav';
import GlassCard from '../ui/GlassCard';
import GradientText from '../ui/GradientText';
import NeonOrb from '../ui/NeonOrb';
import MagneticButton from '../ui/MagneticButton';
import AnimatedCount from '../ui/AnimatedCount';
import { fadeUp, fadeUpSmall, blurUp, stagger } from '../motion/variants';

const TABS = [
  { path: '',             label: 'Overview' },
  { path: 'how-it-works', label: 'How it works' },
  { path: 'pricing',      label: 'Pricing' },
  { path: 'faq',          label: 'FAQ' },
];

const PRICING = [
  {
    id: 'monthly',
    name: 'Builder · Monthly',
    price: 999,
    period: '/ month',
    blurb: 'For creators testing the waters. Cancel anytime.',
    features: [
      'Submit unlimited templates',
      'Earn commission per like + per use',
      'Seller dashboard with real-time earnings',
      'Monthly payout (UPI / bank / PayPal)',
      'Featured-creator opportunity',
    ],
    cta: 'Start monthly',
    highlight: false,
  },
  {
    id: 'yearly',
    name: 'Builder · Yearly',
    price: 9999,
    period: '/ year',
    blurb: 'Best value — save 17% and unlock priority review.',
    features: [
      'Everything in Monthly',
      'Priority template review (48h SLA)',
      'Higher commission tier on use',
      'Custom seller storefront page',
      'Founding-creator badge',
      'Direct access to the curation team',
    ],
    cta: 'Go yearly · save 17%',
    highlight: true,
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Subscribe',
    body:
      'Pick monthly or yearly. Subscription gives you access to the seller dashboard and unlimited template submissions.',
  },
  {
    step: '02',
    title: 'Build',
    body:
      'Design your template in the same Storyly editor every user already knows. Test it on real share links before submitting.',
  },
  {
    step: '03',
    title: 'Submit for review',
    body:
      'Our curation team checks design, originality, and accessibility. Monthly: 7-day SLA. Yearly: 48-hour SLA.',
  },
  {
    step: '04',
    title: 'Earn commission',
    body:
      'Approved templates appear in the Marketplace. You earn for every like AND every time someone uses your template to publish a page.',
  },
];

const FAQ = [
  {
    q: 'Why is there a subscription to sell?',
    a: 'It funds template curation, anti-abuse review, payout infrastructure, and a higher creator-cut on every use. Without it we couldn\'t guarantee fast review SLAs or commission floors.',
  },
  {
    q: 'How much do creators actually earn?',
    a: 'Top creators on yearly plans earn ₹40,000–₹60,000/month from a single popular template line. Earnings depend on design quality, category demand, and how many pages your template is used to publish.',
  },
  {
    q: 'How is commission calculated?',
    a: 'You earn for two events: every "like" a user gives your template (a small fixed payout) and every time someone uses your template to publish a real page (a larger payout, scaled by your plan tier).',
  },
  {
    q: 'When do payouts happen?',
    a: 'On the 5th of each month for the previous month\'s earnings. Minimum payout threshold is ₹500. Below that, balance rolls over.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Monthly cancels at end of cycle. Yearly is pro-rated refundable within the first 14 days. After cancellation, your published templates stay live but stop earning new commission unless you re-subscribe.',
  },
  {
    q: 'What if my template is rejected?',
    a: 'You can resubmit after addressing the curation notes. There\'s no cap on resubmissions, and we never charge per submission.',
  },
];

export default function Builder() {
  const location = useLocation();
  const tab = location.pathname.split('/builder/')[1] || '';

  return (
    <PublicShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
        {/* Hero */}
        <motion.div
          variants={stagger()}
          initial="hidden"
          animate="visible"
          className="text-center mb-12"
        >
          <motion.span variants={fadeUpSmall} className="eyebrow">
            <span>Builder Program</span>
          </motion.span>
          <motion.h1
            variants={blurUp}
            className="mt-5 font-display font-extrabold tracking-tight leading-[1.02]"
            style={{ fontSize: 'clamp(2.25rem, 6vw, 4.5rem)' }}
          >
            Sell your templates.{' '}
            <GradientText variant="warm">Earn per like.</GradientText>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 max-w-2xl mx-auto text-lg text-slate-300 leading-7">
            Subscribe to become a Storyly Builder. Submit templates. Earn commission every time someone likes or uses your work — paid monthly to UPI, bank, or PayPal.
          </motion.p>
        </motion.div>

        <SubNav base="/builder" items={TABS} />

        {/* OVERVIEW */}
        {tab === '' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="grid lg:grid-cols-2 gap-6">
              <GlassCard tone="strong" className="!rounded-[2rem] p-8 relative overflow-hidden">
                <NeonOrb color="#FBBF24" size="18rem" style={{ top: '-4rem', right: '-4rem' }} />
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">For sellers</p>
                <h3 className="mt-3 font-display text-3xl font-extrabold">
                  <GradientText variant="warm">Two paid signals.</GradientText>
                </h3>
                <p className="mt-3 text-slate-300 leading-7">
                  We pay you for two things our community does:
                </p>
                <ul className="mt-4 space-y-3">
                  <li className="flex items-start gap-3 text-slate-200">
                    <span className="shrink-0 mt-1 w-6 h-6 rounded-full bg-gradient-to-br from-rose-400 to-fuchsia-500 flex items-center justify-center text-[10px] font-extrabold text-white">♥</span>
                    <span><strong>Likes</strong> — every user that saves your template to their feed earns you a small fixed payout.</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-200">
                    <span className="shrink-0 mt-1 w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center text-[10px] font-extrabold text-white">✓</span>
                    <span><strong>Uses</strong> — every time someone publishes a real page using your template, you earn a larger payout scaled by your plan tier.</span>
                  </li>
                </ul>
                <Link to="/builder/pricing" className="btn-glow mt-7 inline-flex !text-sm">See plans →</Link>
              </GlassCard>

              <GlassCard tone="strong" className="!rounded-[2rem] p-8 relative overflow-hidden">
                <NeonOrb color="#22D3EE" size="18rem" style={{ top: '-4rem', left: '-4rem' }} />
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Why subscribe</p>
                <h3 className="mt-3 font-display text-3xl font-extrabold">
                  <GradientText variant="cosmic">It funds your earnings.</GradientText>
                </h3>
                <p className="mt-3 text-slate-300 leading-7">
                  The subscription pays for the seller dashboard, curated review SLAs, payout rails, and a higher creator-cut so top builders can earn ₹40k+/month sustainably.
                </p>
                <ul className="mt-5 space-y-2.5 text-sm text-slate-200">
                  <li>· Real-time earnings dashboard</li>
                  <li>· Monthly payouts to UPI / bank / PayPal</li>
                  <li>· Featured-creator placements</li>
                  <li>· Direct access to the curation team</li>
                </ul>
                <Link to="/builder/how-it-works" className="btn-ghost mt-7 inline-flex !text-sm">How it works →</Link>
              </GlassCard>
            </div>

            {/* Earnings strip */}
            <GlassCard tone="strong" className="!rounded-[1.75rem] mt-6 p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                { label: 'Active builders', value: 240,   suffix: '+' },
                { label: 'Top monthly earnings', value: 60000, prefix: '₹' },
                { label: 'Avg payout cycle', value: 30,    suffix: ' days' },
                { label: 'Approval SLA (yearly)', value: 48, suffix: 'h' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-display font-extrabold text-2xl sm:text-3xl">
                    <GradientText variant="warm">
                      <AnimatedCount to={s.value} prefix={s.prefix || ''} suffix={s.suffix || ''} />
                    </GradientText>
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.22em] font-bold text-slate-400">{s.label}</p>
                </div>
              ))}
            </GlassCard>
          </motion.div>
        )}

        {/* HOW IT WORKS */}
        {tab === 'how-it-works' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {STEPS.map((s, i) => (
                <GlassCard key={s.step} withSpotlight withBorder={i === 0} className="p-6 h-full">
                  <p className="font-display text-3xl font-extrabold gradient-text">{s.step}</p>
                  <p className="mt-3 font-display text-lg font-bold text-white">{s.title}</p>
                  <p className="mt-2 text-sm text-slate-300 leading-6">{s.body}</p>
                </GlassCard>
              ))}
            </div>
            <GlassCard tone="strong" className="!rounded-[2rem] p-8 sm:p-10">
              <div className="prose-card">
                <h2>What counts as "use"?</h2>
                <p>
                  A "use" is when a Storyly user picks your template AND publishes
                  a real page from it (the page goes live with a share link).
                  Previews, edits, and discarded drafts don't count.
                </p>
                <h2>What if my template is in someone's feed but never used?</h2>
                <p>
                  You still earn the "like" payout when they saved it. The "use"
                  payout only fires on publish.
                </p>
                <h2>Can I update an existing template?</h2>
                <p>
                  Yes. Updates go through a faster review queue and existing
                  buyers get the new version automatically.
                </p>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* PRICING */}
        {tab === 'pricing' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
              {PRICING.map((p) => (
                <GlassCard
                  key={p.id}
                  tone="strong"
                  withBorder={p.highlight}
                  withSpotlight
                  className={`!rounded-[2rem] p-8 relative overflow-hidden ${p.highlight ? 'ring-1 ring-brand-400/40' : ''}`}
                >
                  {p.highlight && (
                    <span className="absolute top-4 right-4 badge-pill badge-brand">Best value</span>
                  )}
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">{p.name}</p>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-display font-extrabold text-4xl text-white">₹{p.price.toLocaleString()}</span>
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-[0.16em]">{p.period}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-300 leading-6">{p.blurb}</p>
                  <ul className="mt-6 space-y-2.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-slate-200">
                        <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center text-[9px] font-extrabold text-white">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-7">
                    <MagneticButton as="a" href="/signup" variant={p.highlight ? 'glow' : 'ghost'} className="w-full">
                      {p.cta}
                    </MagneticButton>
                  </div>
                </GlassCard>
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-slate-500">
              GST is added at checkout for Indian customers.
            </p>
          </motion.div>
        )}

        {/* FAQ */}
        {tab === 'faq' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="space-y-3 max-w-3xl mx-auto">
              {FAQ.map((f, i) => (
                <GlassCard key={i} className="!rounded-2xl p-6" hover="none">
                  <p className="font-display text-base font-bold text-white">{f.q}</p>
                  <p className="mt-2 text-sm text-slate-300 leading-7">{f.a}</p>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </PublicShell>
  );
}
