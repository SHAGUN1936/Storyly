"use client";

// Personalise an imported template: one field per editable part, with a live preview beside it.
// Photos upload straight away; "Create my page" publishes the page and opens My pages.

import { ImagePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";
import { toast } from "sonner";
import { createSitePage } from "@/app/(app)/(user)/_actions/pages";
import { SiteFrame } from "@/components/site-frame";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form-controls";
import { Spinner } from "@/components/ui/loader";
import { applySlotValues, type SiteStructure } from "@/lib/site-template";

export function SitePageForm({
  templateId,
  templateName,
  structure,
}: {
  templateId: string;
  templateName: string;
  structure: SiteStructure;
}) {
  const router = useRouter();
  const [recipientName, setRecipientName] = useState("");
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(structure.slots.map((s) => [s.id, s.default])),
  );
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Rebuilding the preview on every keystroke is wasteful; let React catch up when idle
  const deferredValues = useDeferredValue(values);
  const preview = useMemo(() => applySlotValues(structure, deferredValues), [structure, deferredValues]);

  const set = (id: string, value: string) => setValues((v) => ({ ...v, [id]: value }));

  async function uploadImage(id: string, file: File | undefined) {
    if (!file) return;
    setUploading(id);
    try {
      const form = new FormData();
      form.append("media", file);
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const data = (await res.json()) as { url?: string; message?: string };
      if (!res.ok || !data.url) throw new Error(data.message || "Upload failed");
      set(id, data.url);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(null);
    }
  }

  async function create() {
    setSaving(true);
    setError("");
    const result = await createSitePage(templateId, { recipientName, values });
    setSaving(false);
    if (!result.ok) return setError(result.message);
    toast.success("Your page is live");
    router.push("/my-videos?filter=published");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="space-y-6">
        <Card>
          <h2 className="font-semibold text-zinc-900">Who is it for?</h2>
          <Field label="Name" hint="Shown when you share the page, e.g. “For Riya”." className="mt-4">
            <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} maxLength={80} />
          </Field>
        </Card>

        {structure.slots.length > 0 && (
          <Card>
            <h2 className="font-semibold text-zinc-900">Personalise</h2>
            <div className="mt-4 space-y-5">
              {structure.slots.map((slot) =>
                slot.type === "image" ? (
                  <div key={slot.id}>
                    <p className="mb-1.5 text-sm font-medium text-zinc-800">{slot.label}</p>
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={values[slot.id]}
                        alt=""
                        className="size-16 rounded-lg border border-zinc-200 object-cover"
                      />
                      <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50">
                        {uploading === slot.id ? <Spinner className="size-3.5" /> : <ImagePlus size={15} aria-hidden />}
                        Replace photo
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          disabled={uploading !== null}
                          onChange={(e) => uploadImage(slot.id, e.target.files?.[0])}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <Field key={slot.id} label={slot.label}>
                    {slot.default.length > 80 ? (
                      <Textarea value={values[slot.id]} onChange={(e) => set(slot.id, e.target.value)} rows={3} />
                    ) : (
                      <Input value={values[slot.id]} onChange={(e) => set(slot.id, e.target.value)} />
                    )}
                  </Field>
                ),
              )}
            </div>
          </Card>
        )}

        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <Button size="lg" className="w-full" loading={saving} loadingLabel="Publishing…" onClick={create}>
          Create my page
        </Button>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-2 text-sm font-medium text-zinc-700">Live preview</p>
        <div className="h-[75vh] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs">
          <SiteFrame html={preview} title={`Preview of ${templateName}`} />
        </div>
      </div>
    </div>
  );
}
