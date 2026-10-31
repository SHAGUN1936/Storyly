import { redirect } from "next/navigation";

// Templates are edited in the full-screen editor.
export default async function EditTemplateRedirect({ params }: { params: Promise<{ id: string }> }) {
  redirect(`/editor/${(await params).id}`);
}
