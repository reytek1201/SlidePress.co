import { execFile } from "node:child_process";
import { copyFile, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import {
  buildBurnCaptionScrimFilters,
  getBurnCaptionLayout,
  parseAssPlayResolution,
} from "@/utils/captions/build-ass-track";
import type { VideoDimensions } from "@/utils/video-dimensions";
import { requireFfmpegPath } from "@/utils/ffmpeg";

const execFileAsync = promisify(execFile);

function resolveBurnCaptionFontPath(): string {
  return join(process.cwd(), "app/fonts/inter-700.ttf");
}

function escapeFfmpegFilterPath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "'\\''");
}

export async function burnCaptionsIntoVideo(
  videoBuffer: Buffer,
  assContent: string,
): Promise<Buffer> {
  const { width, height } = parseAssPlayResolution(assContent);
  const layout = getBurnCaptionLayout(width, height);
  const dir = await mkdtemp(join(tmpdir(), "slidepress-burn-captions-"));

  try {
    const inputPath = join(dir, "input.mp4");
    const assPath = join(dir, "captions.ass");
    const fontsDir = join(dir, "fonts");
    const outputPath = join(dir, "output.mp4");

    await mkdir(fontsDir, { recursive: true });
    await copyFile(resolveBurnCaptionFontPath(), join(fontsDir, "Inter-Bold.ttf"));
    await writeFile(inputPath, videoBuffer);
    await writeFile(assPath, assContent, "utf8");

    const escapedAssPath = escapeFfmpegFilterPath(assPath);
    const escapedFontsDir = escapeFfmpegFilterPath(fontsDir);
    const scrimFilters = buildBurnCaptionScrimFilters(layout);
    const assFilter = `ass='${escapedAssPath}':fontsdir='${escapedFontsDir}'`;
    const videoFilter = `${scrimFilters},${assFilter}`;

    await execFileAsync(requireFfmpegPath(), [
      "-y",
      "-i",
      inputPath,
      "-vf",
      videoFilter,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "copy",
      outputPath,
    ]);

    return await readFile(outputPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export function logBurnCaptionsStage(
  exportId: string,
  stage: "alignment" | "ass_generation" | "ffmpeg_burn",
  details: Record<string, unknown>,
): void {
  console.info("[video-export] burn_captions", {
    exportId,
    stage,
    ...details,
  });
}

export type { VideoDimensions };
