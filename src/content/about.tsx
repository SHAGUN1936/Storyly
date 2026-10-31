// Copy for /about and its tabs.

import type { InfoPageConfig } from "@/components/site/info-page";

export const aboutPage: InfoPageConfig = {
  base: "/about",
  eyebrow: "About Storyly",
  metaTitle: "About",
  title: "About Storyly",
  subtitle: "Storyly lets anyone, designer or not, create polished, animated pages for the moments that matter.",
  tabs: [
    {
      path: "",
      label: "Our story",
      content: (
        <>
          <h2>Where we started</h2>
          <p>
            Storyly started from a simple observation: most wedding, birthday and event invitations looked the same.
            PDFs, forwarded messages and stock templates, with little that reflected the person sending them.
          </p>
          <p>
            We saw an opportunity: the most important moments in people&apos;s lives were being shared with the most
            basic design tools.
          </p>
          <h2>What we built</h2>
          <p>
            Storyly gives anyone an animated, shareable page without needing Figma, code or a designer. Edit text in
            place, add photos, choose a song and share with a QR code, in about a minute.
          </p>
          <h2>What we believe</h2>
          <ul>
            <li>
              <strong>Moments deserve motion.</strong> A still image cannot fully capture an occasion; motion can.
            </li>
            <li>
              <strong>Good design should be easy.</strong> The editor should feel as simple as posting a story, not like
              professional design software.
            </li>
            <li>
              <strong>Creators should be paid.</strong> If you design templates people use, you should earn from them.
            </li>
          </ul>
        </>
      ),
    },
    {
      path: "mission",
      label: "Mission",
      content: (
        <>
          <h2>Our mission</h2>
          <p>
            To put high-quality visual storytelling in the hands of one billion people who were told design was for
            somebody else.
          </p>
          <h2>How we measure progress</h2>
          <ul>
            <li>Pages created per month</li>
            <li>Time to first share (our target is under 60 seconds)</li>
            <li>Creator earnings paid out</li>
            <li>Satisfaction of the people who view shared pages</li>
          </ul>
          <h2>What comes next</h2>
          <p>
            Beyond invitations, we are working on birthday recap pages, anniversary timelines, memorial sites, baby
            announcements, RSVP management and creator monetisation that meaningfully supports independent designers.
          </p>
        </>
      ),
    },
  ],
};
