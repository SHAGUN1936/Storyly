// How it works (anchor: #how-it-works): a dark band where the four steps stack up as you scroll (see ./step-stack).

import QRCode from "qrcode";
import { Section, SectionHeader } from "@/components/ui/section";
import { siteUrl } from "@/config/site";
import { StepStack } from "./step-stack";

export async function HowItWorks() {
  const qrSvg = await QRCode.toString(siteUrl(), {
    type: "svg",
    margin: 0,
    color: { dark: "#18181b", light: "#ffffff" },
  });

  return (
    <Section id="how-it-works" tone="dark" className="pb-10 sm:pb-16">
      <SectionHeader
        tone="dark"
        eyebrow="How it works"
        title="From template to shared link in minutes"
        description="Four simple steps. Scroll to see each one."
      />
      <StepStack qrSvg={qrSvg} />
    </Section>
  );
}
