// A list of editable items with an "Add" form on top. Each item is its own small form
// with Save and Delete. Used by the FAQs, Testimonials and Numbers admin pages.

import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Card } from "@/components/ui/card";
import type { ActionState } from "@/lib/action";

type SaveAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

export function AddItemCard({
  title,
  action,
  children,
}: {
  title: string;
  action: SaveAction;
  children: React.ReactNode;
}) {
  return (
    <Card className="mb-8">
      <h2 className="mb-5 font-semibold text-zinc-900">{title}</h2>
      <ActionForm action={action} resetOnSuccess>
        {children}
        <div className="mt-5">
          <SubmitButton>Add</SubmitButton>
        </div>
      </ActionForm>
    </Card>
  );
}

export function EditItemCard({
  saveAction,
  deleteAction,
  hidden = false,
  children,
}: {
  saveAction: SaveAction;
  deleteAction: () => Promise<void>;
  /** Not shown on the website right now. */
  hidden?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card padding="sm" className={hidden ? "border-dashed bg-zinc-50" : undefined}>
      {hidden && <p className="mb-3 text-xs font-medium text-zinc-500">Hidden from the website</p>}
      <ActionForm action={saveAction}>
        {children}
        <div className="mt-5 flex gap-2">
          <SubmitButton variant="secondary">Save</SubmitButton>
          <SubmitButton variant="ghost" formAction={deleteAction} confirm="Delete this item? This can't be undone.">
            Delete
          </SubmitButton>
        </div>
      </ActionForm>
    </Card>
  );
}
