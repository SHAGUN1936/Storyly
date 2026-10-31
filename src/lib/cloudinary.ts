// Photo and video uploads to Cloudinary.

import "server-only";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { HttpError } from "./http";

let configured = false;

function client() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME?.trim() || !CLOUDINARY_API_KEY?.trim() || !CLOUDINARY_API_SECRET?.trim()) {
    throw new HttpError(503, "Uploads are not set up yet. Add the CLOUDINARY_* values to .env.");
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
    });
    configured = true;
  }
  return cloudinary;
}

/** Uploads a file (from a form) or raw bytes. Cloudinary detects image vs video. */
export async function uploadToCloudinary(file: Blob | Buffer, folder: string): Promise<UploadApiResponse> {
  const bytes = Buffer.isBuffer(file) ? file : Buffer.from(await file.arrayBuffer());
  return new Promise((resolve, reject) => {
    client()
      .uploader.upload_stream({ folder, resource_type: "auto" }, (err, result) =>
        err || !result ? reject(err ?? new Error("Upload failed")) : resolve(result),
      )
      .end(bytes);
  });
}

/** Cloudinary URL with a transform applied, e.g. thumbnailOf(url) -> 400x300 crop. */
export function transformUrl(url: string, transform: string) {
  return url.replace("/upload/", `/upload/${transform}/`);
}

export const thumbnailOf = (url: string) => transformUrl(url, "w_400,h_300,c_fill");

/** First frame of a video as a 400x300 thumbnail. */
export const videoThumbnailOf = (url: string) => transformUrl(url, "so_0,w_400,h_300,c_fill");
