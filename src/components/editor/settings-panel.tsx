"use client";

// Template details (name, category, thumbnail), the list of parts users can edit, and delete.

import { PenLine } from "lucide-react";
import { removeTemplate, saveTemplateDetails } from "@/app/(app)/admin/_actions/templates";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { TEMPLATE_CATEGORIES } from "@/lib/constants";
import { elementName } from "@/lib/editor/dom";
import { LABEL_ATTR, SLOT_ATTR } from "@/lib/site-template";
import { PanelSection } from "./controls";
import { useEditor } from "./editor-context";

export type TemplateDetails = {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnailUrl: string;
};

export function SettingsPanel({ template }: { template: TemplateDetails }) {
  const { doc, select } = useEditor();
  const slots = doc ? Array.from(doc.querySelectorAll<HTMLElement>(`[${SLOT_ATTR}]`)) : [];

  return (
    <div>
      <PanelSection title="Details">
        <ActionForm action={saveTemplateDetails.bind(null, template.id)} className="space-y-3">
          <Field label="Name">
            <Input name="name" defaultValue={template.name} required maxLength={60} />
          </Field>
          <Field label="Category">
            <Select name="category" defaultValue={template.category}>
              {TEMPLATE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Description">
            <Textarea name="description" defaultValue={template.description} rows={3} maxLength={300} />
          </Field>
          <Field
            label="Thumbnail"
            hint={template.thumbnailUrl ? "Choose a file to replace it." : "Shown on the template card."}
          >
            {template.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={template.thumbnailUrl} alt="" className="mb-2 aspect-video w-full rounded-lg object-cover" />
            )}
            <input
              name="thumbnail"
              type="file"
              accept="image/*"
              className="block w-full text-xs text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-xs file:font-medium"
            />
          </Field>
          <SubmitButton className="w-full">Save details</SubmitButton>
        </ActionForm>
      </PanelSection>

      <PanelSection title={`Editable by users (${slots.length})`}>
        {slots.length ? (
          <ul className="space-y-1">
            {slots.map((el, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => select(el, { scroll: true })}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-100"
                >
                  <PenLine size={12} className="shrink-0 text-zinc-400" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{el.getAttribute(LABEL_ATTR) || elementName(el)}</span>
                  <span className="text-[10px] text-zinc-400 uppercase">{el.tagName === "IMG" ? "Photo" : "Text"}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs leading-5 text-zinc-500">
            Nothing yet. Select a text or photo and turn on “Users can edit this” in the right panel.
          </p>
        )}
      </PanelSection>

      <PanelSection title="Danger zone" defaultOpen={false}>
        <form action={removeTemplate.bind(null, template.id)}>
          <SubmitButton
            variant="danger"
            className="w-full"
            confirm="This template will be removed for everyone. Pages already made from it keep working."
          >
            Delete template
          </SubmitButton>
        </form>
      </PanelSection>
    </div>
  );
}
