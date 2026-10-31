import { AppHeader } from "@/components/app/app-header";
import { requireUser } from "@/lib/auth";

// Every signed-in page (studio, my pages, account…): app header + content on a light grey canvas.
export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-zinc-50">
      <AppHeader user={user} />
      <main id="main">{children}</main>
    </div>
  );
}
