import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import {
  type CaptionSegment,
  wrapCaptionText,
} from "@/utils/build-caption-srt";
import { requireFfmpegPath } from "@/utils/ffmpeg";

const execFileAsync = promisify(execFile);

function escapeDrawtext(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/,/g, "\\,")
    .replace(/%/g, "\\%");
}

function buildDrawtextFilter(segments: CaptionSegment[]): string {
  const filters = segments
    .map((segment) => {
      const wrapped = wrapCaptionText(segment.text, 36);
      if (!wrapped) {
        return null;
      }

      const text = escapeDrawtext(wrapped.replace(/\n/g, "|"));
      const start = segment.startSeconds.toFixed(3);
      const end = segment.endSeconds.toFixed(3);

      return [
        `drawtext=text='${text}'`,
        `enable='between(t\\,${start}\\,${end})'`,
        "fontsize=34",
        "fontcolor=white",
        "borderw=3",
        "bordercolor=black@0.85",
        "x=(w-text_w)/2",
        "y=h*0.78",
        "line_spacing=10",
      ].join(":");
    })
    .filter((entry): entry is string => Boolean(entry));

  if (filters.length === 0) {
    return "";
  }

  return filters.join(",");
}

export async function burnCaptionsOnVideo(
  videoBuffer: Buffer,
  segments: CaptionSegment[],
): Promise<Buffer> {
  const drawtextFilter = buildDrawtextFilter(segments);
  if (!drawtextFilter) {
    throw new Error("No caption text available to burn into video");
  }

  const dir = await mkdtemp(join(tmpdir(), "slidepress-captions-"));

  try {
    const inputPath = join(dir, "input.mp4");
    const outputPath = join(dir, "output.mp4");

    await writeFile(inputPath, videoBuffer);

    await execFileAsync(requireFfmpegPath(), [
      "-y",
      "-i",
      inputPath,
      "-vf",
      drawtextFilter,
      "-c:a",
      "copy",
      outputPath,
    ]);

    return await readFile(outputPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function fetchVideoBuffer(videoUrl: string): Promise<Buffer> {
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error("Failed to download video for caption burn-in");
  }

  return Buffer.from(await response.arrayBuffer());
}
