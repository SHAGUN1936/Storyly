"use client";

// The shared login / signup screen: a dark brand panel on the left, the form on the right.
// Each mode only differs in copy and fields (see SCREENS below).

import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { googleSignIn, login, signup, type AuthState } from "@/app/(auth)/actions";
import { motion } from "motion/react";
import { StorylyLogo } from "@/components/brand/logo";
import { MiniPage } from "@/components/site/landing/mini-pages";
import { RevealWords } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Field, Input, PasswordInput } from "@/components/ui/form-controls";
import { GoogleButton } from "./google-button";

type Mode = "login" | "signup";

const SCREENS = {
  login: {
    title: "Sign in to Storyly",
    subtitle: "Welcome back. Pick up where you left off.",
    submit: "Sign in",
    submitting: "Signing in…",
    switchText: "Don't have an account?",
    switchLink: { href: "/signup", label: "Create one" },
  },
  signup: {
    title: "Create your account",
    subtitle: "Free to start. No credit card required.",
    submit: "Create account",
    submitting: "Creating account…",
    switchText: "Already have an account?",
    switchLink: { href: "/login", label: "Sign in" },
  },
} as const;

const EASE = [0.2, 0.7, 0.2, 1] as const;

/** The form's parts come in one after another. */
const STAGGER = { hidden: {}, shown: { transition: { staggerChildren: 0.07, delayChildren: 0.25 } } };
const ITEM = {
  hidden: { opacity: 0, y: 16 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const HIGHLIGHTS = [
  "Professionally designed templates for every occasion",
  "Your own link and QR code for every page",
  "Edit any time. Changes go live instantly",
];

export function AuthScreen({ mode }: { mode: Mode }) {
  const screen = SCREENS[mode];
  const router = useRouter();
  const [state, formAction, pending] = useActionState(mode === "login" ? login : signup, null);
  const [googleState, setGoogleState] = useState<AuthState>(null);
  const [googlePending, setGooglePending] = useState(false);
  const result = googleState ?? state;
  // While signing in (or after success, until the next page opens) nothing can be changed
  const locked = pending || googlePending || !!result?.ok;

  // On success: greet, then go to the studio (or admin panel).
  useEffect(() => {
    if (!result?.ok) return;
    toast.success(result.message);
    router.replace(result.redirectTo);
    router.refresh();
  }, [result, router]);

  // Arriving here after signing out: confirm it, then tidy the URL
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("signed-out")) return;
    toast.success("You have been signed out");
    url.searchParams.delete("signed-out");
    window.history.replaceState(null, "", url.pathname + url.search);
  }, []);

  // Submit manually so React keeps what the user typed when there is an error
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGoogleState(null);
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  async function handleGoogle(credential: string) {
    setGooglePending(true);
    setGoogleState(await googleSignIn(credential));
    setGooglePending(false);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative isolate hidden flex-col overflow-hidden bg-zinc-950 p-12 text-white lg:flex">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_30%_0%,rgba(255,255,255,.14),transparent)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.05)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_top_left,black_20%,transparent_65%)] bg-[size:56px_56px]"
        />
        <Link href="/" aria-label="Storyly home">
          <StorylyLogo inverted />
        </Link>

        <div className="mt-16 max-w-md">
          <h2 className="font-display text-4xl leading-[1.08] font-semibold">
            <RevealWords text="Pages people" /> <RevealWords text="remember." delay={0.2} className="text-zinc-500" />
          </h2>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((item, i) => (
              <motion.li
                key={item}
                className="flex gap-3 text-zinc-300"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.45 + i * 0.1, ease: EASE }}
              >
                <Check size={20} className="mt-0.5 shrink-0 text-white" aria-hidden />
                {item}
              </motion.li>
            ))}
          </ul>
        </div>

        {/* A small fan of page designs rising from the bottom edge */}
        <div className="relative mt-auto -mb-28 h-64">
          {(
            [
              { design: "birthday", x: -70, r: -9 },
              { design: "couple", x: 70, r: 9 },
              { design: "wedding", x: 0, r: 0 },
            ] as const
          ).map(({ design, x, r }, i) => (
            <motion.div
              key={design}
              className="absolute bottom-0 left-1/2 w-40 origin-bottom"
              initial={{ x: "-50%", y: 80, rotate: 0, opacity: 0 }}
              animate={{ x: `${x - 50}%`, y: 0, rotate: r, opacity: 1 }}
              transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <MiniPage design={design} className="rounded-xl shadow-2xl ring-1 shadow-black/60 ring-white/10" />
            </motion.div>
          ))}
        </div>
      </aside>

      <main id="main" className="flex items-center justify-center px-4 py-12 sm:px-8">
        <motion.div className="w-full max-w-sm" initial="hidden" animate="shown" variants={STAGGER}>
          <Link href="/" aria-label="Storyly home" className="mb-10 inline-block lg:hidden">
            <StorylyLogo />
          </Link>

          <h1 className="font-display text-3xl font-semibold text-zinc-900">
            <RevealWords text={screen.title} step={0.06} />
          </h1>
          <motion.p variants={ITEM} className="mt-2 text-sm text-zinc-600">
            {screen.subtitle}
          </motion.p>

          {/* Google works for both: it signs in, or creates the account on first use */}
          {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
            <>
              <motion.div variants={ITEM} className="mt-8">
                <div className={locked ? "pointer-events-none opacity-60" : undefined} aria-disabled={locked}>
                  <GoogleButton onCredential={handleGoogle} />
                </div>
              </motion.div>
              <motion.div variants={ITEM} className="relative my-6 text-center text-xs text-zinc-500">
                <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-200" />
                <span className="relative bg-white px-3">or continue with email</span>
              </motion.div>
            </>
          )}

          {result && !result.ok && (
            <motion.p
              key={result.message}
              role="alert"
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: 1, x: [0, -8, 8, -5, 5, 0] }}
              transition={{ duration: 0.45 }}
              className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
            >
              {result.message}
            </motion.p>
          )}

          <form onSubmit={handleSubmit} className="mt-6">
            <fieldset disabled={locked} className="space-y-4 transition-opacity disabled:[&_input]:opacity-60">
              {mode === "signup" && (
                <motion.div variants={ITEM}>
                  <Field label="Full name">
                    <Input name="name" autoComplete="name" required />
                  </Field>
                </motion.div>
              )}
              <motion.div variants={ITEM}>
                <Field label="Email">
                  <Input type="email" name="email" placeholder="you@example.com" autoComplete="email" required />
                </Field>
              </motion.div>
              <motion.div variants={ITEM}>
                <Field label="Password" hint={mode === "signup" ? "At least 6 characters." : undefined}>
                  <PasswordInput
                    name="password"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    minLength={mode === "signup" ? 6 : undefined}
                    required
                  />
                </Field>
              </motion.div>
              <motion.div variants={ITEM}>
                <Button type="submit" loading={locked} loadingLabel={screen.submitting} className="w-full">
                  {screen.submit}
                </Button>
              </motion.div>
            </fieldset>
          </form>

          <motion.p variants={ITEM} className="mt-8 text-sm text-zinc-600">
            {screen.switchText}{" "}
            <Link href={screen.switchLink.href} className="font-medium text-brand-700 hover:text-brand-800">
              {screen.switchLink.label}
            </Link>
          </motion.p>
          {mode === "signup" && (
            <motion.p variants={ITEM} className="mt-6 text-xs leading-5 text-zinc-500">
              By creating an account you agree to our{" "}
              <Link href="/terms" className="underline hover:text-zinc-700">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline hover:text-zinc-700">
                Privacy Policy
              </Link>
              .
            </motion.p>
          )}
        </motion.div>
      </main>
    </div>
  );
}
