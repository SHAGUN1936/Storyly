import { apiAdmin, HttpError, json, route } from "@/lib/http";
import { importHtml, importSite, importStarter } from "@/server/site-import";
import { createSiteTemplate } from "@/server/templates";

// Bundling and AI conversion run on Node.js and can take a few minutes.
export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Builds the template from whichever source the form sent:
 *   starter  the id of a built-in starter design
 *   html     a pasted HTML page
 *   files    one .zip, or every file of a folder
 */
function importFrom(form: FormData) {
  const starter = form.get("starter");
  if (typeof starter === "string" && starter) return importStarter(starter);

  const html = form.get("html");
  if (typeof html === "string" && html.trim()) return importHtml(html);

  const uploads = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (uploads.length) return importSite(uploads);

  throw new HttpError(400, "Choose a starter design, paste HTML, or upload a website.");
}

/** Creates a draft template. The admin reviews it before publishing. */
export const POST = route(async (req) => {
  const admin = await apiAdmin();
  const result = await importFrom(await req.formData());
  const template = await createSiteTemplate(
    {
      name: result.name,
      category: result.category,
      description: result.description,
      structure: { type: "site", document: result.document, slots: result.slots },
    },
    admin.id,
  );
  return json({ id: template.id, slots: result.slots.length, warnings: result.warnings, usedAi: result.usedAi }, 201);
});
