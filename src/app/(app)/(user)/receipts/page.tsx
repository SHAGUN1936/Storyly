import { Receipt } from "lucide-react";
import type { Metadata } from "next";
import { AppPage } from "@/components/app/app-page";
import { EmptyState } from "@/components/app/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Receipts" };

// Payments are not connected yet, so there are no purchases to list.
// When checkout is added, load the user's purchases here.
export default async function ReceiptsPage() {
  await requireUser();

  return (
    <AppPage title="Receipts" description="Template purchases and subscriptions will be listed here.">
      <EmptyState
        icon={<Receipt />}
        title="No purchases yet"
        text="When you buy a premium template or join the Builder Program, your receipts will appear here."
        action={
          <ButtonLink href="/marketplace" variant="secondary">
            Browse templates
          </ButtonLink>
        }
      />
    </AppPage>
  );
}
