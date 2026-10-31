// Reading the admin template form (multipart).

/** A file field, or null when nothing was chosen. */
function fileField(form: FormData, name: string) {
  const value = form.get(name);
  return value instanceof File && value.size > 0 ? value : null;
}

export function templateFiles(form: FormData) {
  return { thumbnail: fileField(form, "thumbnail"), preview: fileField(form, "preview") };
}

/** Text fields that were actually filled in (an empty field means "leave unchanged"). */
export function filledFields(form: FormData) {
  const values: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string" && value !== "") values[key] = value;
  }
  return values;
}
