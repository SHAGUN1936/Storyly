// Renders a short MP4 for video-type templates. Web-page templates never come here.

import "server-only";
import { existsSync } from "fs";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

let configured = false;

/** Uses FFMPEG_PATH from .env, else the bundled binary, else ffmpeg on PATH. */
async function configure() {
  if (configured) return;
  configured = true;
  const custom = process.env.FFMPEG_PATH?.trim();
  if (custom) {
    ffmpeg.setFfmpegPath(custom);
    return;
  }
  try {
    const installer = (await import("@ffmpeg-installer/ffmpeg")) as { path?: string; default?: { path?: string } };
    const bundled = installer.path ?? installer.default?.path;
    if (bundled && existsSync(bundled)) ffmpeg.setFfmpegPath(bundled);
  } catch {
    console.warn("[ffmpeg] No bundled binary; using system ffmpeg on PATH.");
  }
}

function run(command: ffmpeg.FfmpegCommand) {
  return new Promise<void>((resolve, reject) => {
    command
      .on("end", () => resolve())
      .on("error", reject)
      .run();
  });
}

/**
 * Makes a 10 second clip from the first uploaded media file,
 * or a 5 second placeholder when the user uploaded nothing.
 * Returns the MP4 bytes.
 */
export async function renderVideo(mediaUrls: string[]): Promise<Buffer> {
  await configure();
  const dir = await mkdtemp(path.join(tmpdir(), "storyly-"));
  const output = path.join(dir, "output.mp4");
  try {
    if (mediaUrls.length === 0) {
      await run(
        ffmpeg()
          .input("color=c=blue:s=1280x720:d=5")
          .inputOptions(["-f lavfi"])
          .outputOptions(["-c:v libx264", "-pix_fmt yuv420p", "-t 5"])
          .output(output),
      );
    } else {
      const source = mediaUrls[0];
      const res = await fetch(source);
      if (!res.ok) throw new Error(`Could not download media (${res.status})`);
      const input = path.join(dir, `input${path.extname(new URL(source).pathname) || ".bin"}`);
      await writeFile(input, Buffer.from(await res.arrayBuffer()));
      await run(
        ffmpeg(input)
          .outputOptions(["-c:v libx264", "-preset fast", "-crf 23", "-pix_fmt yuv420p"])
          .duration(10)
          .output(output),
      );
    }
    return await readFile(output);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
