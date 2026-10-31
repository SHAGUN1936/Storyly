import { apiUser, json, readJson, route } from "@/lib/http";
import { saveDraftSchema } from "@/lib/validators";
import { saveDraft } from "@/server/pages";

/** Creates a draft (no id) or saves changes into an existing one (with id). Never publishes. */
export const POST = route(async (req) => {
  const user = await apiUser();
  const input = await readJson(req, saveDraftSchema);
  const page = await saveDraft(user.id, input);
  return json(page, input.id ? 200 : 201);
});
