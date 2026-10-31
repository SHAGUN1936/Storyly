// The inputs for each kind of website content. Used by both the "Add" form and every edit form,
// so the two always match. Pass the saved item to pre-fill an edit form.

import { Field, Input, Textarea } from "@/components/ui/form-controls";

type Faq = { question: string; answer: string; order: number; published: boolean };
type Testimonial = { name: string; role: string; quote: string; order: number; published: boolean };
type Stat = { label: string; value: number; suffix: string; order: number };

function OrderField({ value }: { value?: number }) {
  return (
    <Field label="Order" hint="Lower shows first">
      <Input name="order" type="number" min={0} max={999} defaultValue={value ?? 0} className="w-24" />
    </Field>
  );
}

function PublishedField({ value }: { value?: boolean }) {
  return (
    <label className="flex items-center gap-2 pt-7 text-sm text-zinc-700">
      <input type="checkbox" name="published" defaultChecked={value ?? true} className="size-4 accent-zinc-900" />
      Show on website
    </label>
  );
}

export function FaqFields({ item }: { item?: Faq }) {
  return (
    <div className="grid gap-4">
      <Field label="Question">
        <Input name="question" defaultValue={item?.question} required maxLength={200} />
      </Field>
      <Field label="Answer">
        <Textarea name="answer" defaultValue={item?.answer} required maxLength={1000} rows={3} />
      </Field>
      <div className="flex flex-wrap gap-6">
        <OrderField value={item?.order} />
        <PublishedField value={item?.published} />
      </div>
    </div>
  );
}

export function TestimonialFields({ item }: { item?: Testimonial }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Who" hint="e.g. Wedding couple. Avoid personal names">
          <Input name="name" defaultValue={item?.name} required maxLength={80} />
        </Field>
        <Field label="Where" hint="e.g. Udaipur">
          <Input name="role" defaultValue={item?.role} maxLength={80} />
        </Field>
      </div>
      <Field label="Quote">
        <Textarea name="quote" defaultValue={item?.quote} required maxLength={500} rows={3} />
      </Field>
      <div className="flex flex-wrap gap-6">
        <OrderField value={item?.order} />
        <PublishedField value={item?.published} />
      </div>
    </div>
  );
}

export function StatFields({ item }: { item?: Stat }) {
  return (
    <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr_auto]">
      <Field label="Label">
        <Input name="label" defaultValue={item?.label} required maxLength={60} placeholder="Pages published" />
      </Field>
      <Field label="Number">
        <Input name="value" type="number" min={0} defaultValue={item?.value} required />
      </Field>
      <Field label="After the number" hint='e.g. "+" or "%"'>
        <Input name="suffix" defaultValue={item?.suffix} maxLength={10} />
      </Field>
      <OrderField value={item?.order} />
    </div>
  );
}
