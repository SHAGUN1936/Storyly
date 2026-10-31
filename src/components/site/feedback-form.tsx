"use client";

// "Share with us" form: pick a kind (story, bug, feature, general), write a message, rate Storyly.
// Shown on the /stories/share page.
// Submissions are saved on the server (see app/(site)/_actions/feedback.ts) and read in Admin → Feedback.

import { Bug, CircleCheck, Lightbulb, MessageSquare, PenLine, Star, type LucideIcon } from "lucide-react";
import { useId, useState } from "react";
import { submitFeedback } from "@/app/(site)/_actions/feedback";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";

export type FeedbackKind = "story" | "bug" | "feature" | "general";

const KINDS: { id: FeedbackKind; label: string; icon: LucideIcon; desc: string }[] = [
  { id: "story", label: "Share my story", icon: PenLine, desc: "How you used Storyly for an occasion." },
  { id: "bug", label: "Report a bug", icon: Bug, desc: "Something broken in the editor or a share page." },
  { id: "feature", label: "Feature request", icon: Lightbulb, desc: "Something you would like Storyly to do." },
  { id: "general", label: "General feedback", icon: MessageSquare, desc: "Anything else you would like to tell us." },
];

const BODY_LABEL: Record<FeedbackKind, string> = {
  story: "Your story",
  bug: "What happened?",
  feature: "What should we build?",
  general: "Your message",
};

const BODY_PLACEHOLDER: Record<FeedbackKind, string> = {
  story: "Tell us about the occasion, the page you made and how people responded.",
  bug: "What went wrong, and what did you expect to happen?",
  feature: "Describe the feature and how it would help.",
  general: "Your message",
};

export type FeedbackFormProps = {
  defaultKind?: FeedbackKind;
  /** Saved with the message so admins know where it came from, e.g. "From the Customer Stories page". */
  context?: string;
};

export function FeedbackForm({ defaultKind = "story", context }: FeedbackFormProps) {
  const id = useId();
  const [kind, setKind] = useState<FeedbackKind>(defaultKind);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!body.trim()) return setError("Please write a few words.");
    if (kind === "story" && !title.trim()) return setError("Please give your story a title.");

    setSending(true);
    const result = await submitFeedback({ kind, name, email, title, message: body, rating, context: context ?? "" });
    setSending(false);
    if (result.ok) setSubmitted(true);
    else setError(result.message);
  }

  if (submitted) {
    const resetForAnother = () => {
      setSubmitted(false);
      setBody("");
      setTitle("");
      setRating(0);
    };
    return (
      <div className="py-6 text-center" role="status">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-900">
          <CircleCheck className="size-6" aria-hidden />
        </div>
        <h3 className="mt-5 font-display text-xl font-semibold text-zinc-900">Thank you</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
          Your {kind === "story" ? "story" : "feedback"} has been received. If you left your email, we may contact you
          about it.
        </p>
        <Button variant="secondary" onClick={resetForAnother} className="mt-6">
          Submit another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="space-y-5">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-zinc-800">Type of feedback</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {KINDS.map((k) => {
              const active = kind === k.id;
              const Icon = k.icon;
              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setKind(k.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors",
                    active
                      ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600"
                      : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50",
                  )}
                >
                  <Icon
                    className={cn("mt-0.5 size-4 shrink-0", active ? "text-brand-700" : "text-zinc-500")}
                    aria-hidden
                  />
                  <span>
                    <span className="block text-sm font-medium text-zinc-900">{k.label}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-zinc-500">{k.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name (optional)">
            <Input
              id={`${id}-name`}
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </Field>
          <Field label="Email (optional)">
            <Input
              id={`${id}-email`}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>
        </div>

        {kind === "story" && (
          <Field label="Story title">
            <Input
              id={`${id}-title`}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Our wedding invitation"
            />
          </Field>
        )}

        <Field label={BODY_LABEL[kind]}>
          <Textarea
            id={`${id}-body`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={BODY_PLACEHOLDER[kind]}
            rows={kind === "story" ? 5 : 4}
          />
        </Field>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-zinc-800">How would you rate Storyly?</legend>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => {
              const filled = (hoverRating || rating) >= n;
              return (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(n)}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  aria-pressed={rating === n}
                  className="rounded-md p-1 transition-colors hover:bg-zinc-100"
                >
                  <Star
                    className={cn("size-5", filled ? "fill-zinc-900 text-zinc-900" : "text-zinc-300")}
                    aria-hidden
                  />
                </button>
              );
            })}
            {rating > 0 && <span className="ml-2 text-sm text-zinc-500">{rating} of 5</span>}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="submit" loading={sending} loadingLabel="Sending…">
          {kind === "story" ? "Send story" : "Send feedback"}
        </Button>
      </div>
    </form>
  );
}
