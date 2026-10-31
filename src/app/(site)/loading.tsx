import { Container } from "@/components/ui/section";
import { Skeleton } from "@/components/ui/skeleton";

// Shown while a website page loads its data: the dark title band and shimmer blocks,
// in the shape of the page that is coming (so nothing flashes white).
export default function Loading() {
  return (
    <div role="status">
      <span className="sr-only">Loading</span>
      <div data-dark-hero className="bg-zinc-950">
        <Container className="space-y-5 py-20 sm:py-28">
          <div className="h-4 w-28 animate-pulse rounded-md bg-white/10" />
          <div className="h-14 w-full max-w-xl animate-pulse rounded-xl bg-white/10" />
          <div className="h-5 w-full max-w-2xl animate-pulse rounded-md bg-white/5" />
        </Container>
      </div>
      <Container className="grid gap-6 py-16 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-56 rounded-3xl" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </Container>
    </div>
  );
}
