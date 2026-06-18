import ffmpegPath from "ffmpeg-static";

export function requireFfmpegPath(): string {
  if (!ffmpegPath) {
    throw new Error("FFmpeg is not available");
  }

  return ffmpegPath;
}
