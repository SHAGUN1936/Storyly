import { apiUser, json, route } from "@/lib/http";
import { getShareInfo } from "@/server/pages";

/** Share link and QR code for one of the user's pages. */
export const GET = route(async (req, { params }) => {
  const user = await apiUser();
  return json(await getShareInfo((await params).id, user.id, req.nextUrl.origin));
});
