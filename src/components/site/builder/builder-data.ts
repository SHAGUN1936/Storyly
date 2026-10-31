// Copy for the Builder Program page (/builder and its tabs).

export type BuilderTab = "" | "how-it-works" | "pricing" | "faq";

export const BUILDER_TABS: { path: BuilderTab; label: string }[] = [
  { path: "", label: "Overview" },
  { path: "how-it-works", label: "How it works" },
  { path: "pricing", label: "Pricing" },
  { path: "faq", label: "FAQ" },
];

export type BuilderPlan = {
  id: string;
  name: string;
  price: number;
  period: string;
  blurb: string;
  features: string[];
  cta: string;
  highlight: boolean;
};

export const BUILDER_PLANS: BuilderPlan[] = [
  {
    id: "monthly",
    name: "Builder · Monthly",
    price: 999,
    period: "/ month",
    blurb: "For creators testing the waters. Cancel anytime.",
    features: [
      "Submit unlimited templates",
      "Earn commission per like + per use",
      "Seller dashboard with real-time earnings",
      "Monthly payout (UPI / bank / PayPal)",
      "Featured-creator opportunity",
    ],
    cta: "Start monthly",
    highlight: false,
  },
  {
    id: "yearly",
    name: "Builder · Yearly",
    price: 9999,
    period: "/ year",
    blurb: "Best value — save 17% and unlock priority review.",
    features: [
      "Everything in Monthly",
      "Priority template review (48h SLA)",
      "Higher commission tier on use",
      "Custom seller storefront page",
      "Founding-creator badge",
      "Direct access to the curation team",
    ],
    cta: "Go yearly · save 17%",
    highlight: true,
  },
];

export const BUILDER_STEPS = [
  {
    step: "01",
    title: "Subscribe",
    body: "Pick monthly or yearly. Subscription gives you access to the seller dashboard and unlimited template submissions.",
  },
  {
    step: "02",
    title: "Build",
    body: "Design your template in the same Storyly editor every user already knows. Test it on real share links before submitting.",
  },
  {
    step: "03",
    title: "Submit for review",
    body: "Our curation team checks design, originality, and accessibility. Monthly: 7-day SLA. Yearly: 48-hour SLA.",
  },
  {
    step: "04",
    title: "Earn commission",
    body: "Approved templates appear in the Marketplace. You earn for every like AND every time someone uses your template to publish a page.",
  },
];

export const BUILDER_FAQ = [
  {
    q: "Why is there a subscription to sell?",
    a: "It funds template curation, anti-abuse review, payout infrastructure, and a higher creator-cut on every use. Without it we couldn't guarantee fast review SLAs or commission floors.",
  },
  {
    q: "How much do creators actually earn?",
    a: "It depends on design quality, category demand, and how many pages your template is used to publish. Your dashboard shows every like, use and payout.",
  },
  {
    q: "How is commission calculated?",
    a: 'You earn for two events: every "like" a user gives your template (a small fixed payout) and every time someone uses your template to publish a real page (a larger payout, scaled by your plan tier).',
  },
  {
    q: "When do payouts happen?",
    a: "On the 5th of each month for the previous month's earnings. Minimum payout threshold is ₹500. Below that, balance rolls over.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Monthly cancels at end of cycle. Yearly is pro-rated refundable within the first 14 days. After cancellation, your published templates stay live but stop earning new commission unless you re-subscribe.",
  },
  {
    q: "What if my template is rejected?",
    a: "You can resubmit after addressing the curation notes. There's no cap on resubmissions, and we never charge per submission.",
  },
];
