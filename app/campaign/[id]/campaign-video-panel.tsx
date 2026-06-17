"use client";

import {
  TTS_VIDEO_EXPORT_DISCLOSURE,
  TTS_VIDEO_EXPORT_SUCCESS_DISCLOSURE,
} from "@/utils/tts/disclosure-copy";

interface CampaignVideoPanelProps {
  canExportVideo: boolean;
  disabled?: boolean;
  isExportingVideo?: boolean;
  videoExportMessage?: string | null;
  onExportVideo: () => void;
}

export default function CampaignVideoPanel({
  canExportVideo,
  disabled = false,
  isExportingVideo = false,
  videoExportMessage = null,
  onExportVideo,
}: CampaignVideoPanelProps) {
  if (!canExportVideo) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-background/40 p-4 sm:rounded-xl sm:p-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-foreground">Video</h3>
        <p className="text-xs leading-5 text-muted-foreground">
          Export a 9:16 MP4 with your slides and AI narration — ready for Reels,
          Shorts, and TikTok.
        </p>
      </div>

      <button
        type="button"
        disabled={disabled || isExportingVideo}
        onClick={onExportVideo}
        className="btn-primary mt-4 w-full py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isExportingVideo ? "Rendering video…" : "Download video"}
      </button>

      {videoExportMessage && (
        <div className="mt-3 rounded-xl border border-emerald-900/50 bg-emerald-950/20 px-3 py-2.5 text-xs text-emerald-200">
          {videoExportMessage}
        </div>
      )}

      <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
        {TTS_VIDEO_EXPORT_DISCLOSURE} {TTS_VIDEO_EXPORT_SUCCESS_DISCLOSURE}
      </p>
    </div>
  );
}
