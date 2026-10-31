// Copy for /stories (Customer stories) and its tabs.
// Featured stories are the real testimonials an admin adds in Admin → Website → Testimonials.
// The Featured tab ends with a link to the Share yours tab, which holds the form.

import { MessageSquareQuote, Quote, UserRound } from "lucide-react";
import { EmptyState } from "@/components/app/empty-state";
import { FeedbackForm } from "@/components/site/feedback-form";
import type { InfoPageConfig } from "@/components/site/info-page";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/ui/motion";
import { getTestimonials } from "@/lib/site-content";
import { stagger } from "@/lib/utils";

export const STORIES_FEEDBACK_CONTEXT = "From the Customer Stories page";

async function StoryGrid() {
  const stories = await getTestimonials();

  // No stories yet: one message with the way to add the first one
  if (!stories.length) {
    return (
      <EmptyState
        icon={<MessageSquareQuote />}
        title="Stories are on their way"
        text="We are collecting stories from our first customers. Made something with Storyly? We would love to hear about it."
        action={
          <ButtonLink href="/stories/share" scroll={false}>
            Share your story
          </ButtonLink>
        }
      />
    );
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stories.map((s, i) => (
          <Reveal key={`${s.name}-${i}`} delay={stagger(i % 2, 0.1)} className="h-full">
            <Card className="flex h-full flex-col">
              <Quote className="size-6 text-zinc-900" aria-hidden />
              <blockquote className="mt-4 flex-1 leading-7 text-zinc-700">&ldquo;{s.quote}&rdquo;</blockquote>
              <div className="mt-6 flex items-center gap-3 border-t border-zinc-100 pt-5">
                <div
                  className="flex size-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-600"
                  aria-hidden
                >
                  <UserRound size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">{s.name}</p>
                  {s.role && <p className="text-xs text-zinc-500">{s.role}</p>}
                </div>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>
      <ShareCallout />
    </>
  );
}

function ShareCallout() {
  return (
    <Card className="mt-16 flex flex-col items-start justify-between gap-6 bg-zinc-50 sm:flex-row sm:items-center">
      <div>
        <h2 className="font-display text-xl font-semibold text-zinc-900">Have a Storyly story?</h2>
        <p className="mt-1.5 text-sm text-zinc-600">
          Tell us how you used Storyly. We may feature it here and on our home page.
        </p>
      </div>
      <ButtonLink href="/stories/share" scroll={false}>
        Share your story
      </ButtonLink>
    </Card>
  );
}

export const storiesPage: InfoPageConfig = {
  base: "/stories",
  eyebrow: "Customer stories",
  metaTitle: "Customer stories",
  title: "Stories from our customers",
  subtitle: "How people use Storyly to mark the moments that matter. Made a page you love? Share your story.",
  tabs: [
    {
      path: "",
      label: "Featured",
      layout: "wide",
      content: (
        <div className="not-prose">
          <StoryGrid />
        </div>
      ),
    },
    {
      path: "share",
      label: "Share yours",
      layout: "centered",
      content: (
        <>
          <div className="text-center">
            <h2>Share your story</h2>
            <p>
              Tell us how you used Storyly. Selected stories are featured on this page and on our home page, and we will
              contact you before featuring yours.
            </p>
          </div>
          <Card className="not-prose mt-8">
            <FeedbackForm defaultKind="story" context={STORIES_FEEDBACK_CONTEXT} />
          </Card>
        </>
      ),
    },
  ],
};
