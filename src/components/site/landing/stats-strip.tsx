// Headline numbers in a quiet band; they count up when scrolled into view. Edited in Admin → Website.

import { Counter } from "@/components/ui/motion";
import { Container } from "@/components/ui/section";
import { getStats } from "@/lib/site-content";

export async function StatsStrip() {
  const stats = await getStats();
  if (!stats.length) return null;
  return (
    <div className="border-y border-zinc-200 bg-zinc-50">
      <Container>
        <dl className="grid grid-cols-2 divide-zinc-200 py-10 md:grid-cols-4 md:divide-x">
          {stats.map((stat) => (
            <div key={stat.label} className="px-4 py-3 text-center">
              <dt className="text-sm text-zinc-500">{stat.label}</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">
                <Counter to={stat.value} suffix={stat.suffix} />
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </div>
  );
}
