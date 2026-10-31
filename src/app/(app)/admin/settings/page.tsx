import type { Metadata } from "next";
import { saveSiteSettings } from "@/app/(app)/admin/_actions/website";
import { AdminHeader } from "@/components/admin/admin-ui";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form-controls";
import { getSiteSettings } from "@/lib/site-content";

export const metadata: Metadata = { title: "Settings" };

const SOCIALS = [
  { name: "instagram", label: "Instagram" },
  { name: "twitter", label: "X (Twitter)" },
  { name: "youtube", label: "YouTube" },
  { name: "linkedin", label: "LinkedIn" },
] as const;

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <AdminHeader title="Settings" description="Business details shown in the website footer." />
      <ActionForm action={saveSiteSettings} className="space-y-6">
        <Card>
          <h2 className="mb-5 font-semibold text-zinc-900">Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Support email" hint="Shown in the footer">
              <Input name="supportEmail" type="email" defaultValue={settings.supportEmail} />
            </Field>
            <Field label="Phone">
              <Input name="phone" type="tel" defaultValue={settings.phone} />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Input name="address" defaultValue={settings.address} />
            </Field>
          </div>
        </Card>
        <Card>
          <h2 className="mb-1 font-semibold text-zinc-900">Social profiles</h2>
          <p className="mb-5 text-sm text-zinc-600">Only the profiles you fill in appear in the footer.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {SOCIALS.map((s) => (
              <Field key={s.name} label={s.label}>
                <Input name={s.name} type="url" placeholder="https://" defaultValue={settings[s.name]} />
              </Field>
            ))}
          </div>
        </Card>
        <SubmitButton size="md">Save settings</SubmitButton>
      </ActionForm>
    </>
  );
}
