import { uploadToCloudinary } from "@/lib/cloudinary";
import { UPLOAD_EXTENSIONS, UPLOAD_MAX_BYTES } from "@/lib/constants";
import { apiUser, HttpError, json, route } from "@/lib/http";

export const runtime = "nodejs";

/** Uploads one photo or video (form field "media") and returns its URL. */
export const POST = route(async (req) => {
  await apiUser();
  const file = (await req.formData()).get("media");
  if (!(file instanceof File) || file.size === 0) throw new HttpError(400, "No file uploaded");
  if (!UPLOAD_EXTENSIONS.test(file.name)) throw new HttpError(400, "Only images and videos allowed");
  if (file.size > UPLOAD_MAX_BYTES) throw new HttpError(400, "File is too large (max 100 MB)");
  const { secure_url } = await uploadToCloudinary(file, "user-media");
  return json({ url: secure_url });
});
