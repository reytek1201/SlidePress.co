"use client";

interface CampaignExportPanelProps {
  imagesComplete: boolean;
  isNativeApp: boolean;
  disabled?: boolean;
  isExporting?: boolean;
  isSavingAllPhotos?: boolean;
  saveAllPhotosProgress?: { saved: number; total: number } | null;
  savedAllPhotos?: boolean;
  exportMessage?: string | null;
  onDownloadZip: () => void;
  onSaveAllToPhotos: () => void;
}

export default function CampaignExportPanel({
  imagesComplete,
  isNativeApp,
  disabled = false,
  isExporting = false,
  isSavingAllPhotos = false,
  saveAllPhotosProgress = null,
  savedAllPhotos = false,
  exportMessage = null,
  onDownloadZip,
  onSaveAllToPhotos,
}: CampaignExportPanelProps) {
  if (!imagesComplete) {
    return null;
  }

  const saveAllLabel = isSavingAllPhotos
    ? saveAllPhotosProgress
      ? `Saving… (${saveAllPhotosProgress.saved}/${saveAllPhotosProgress.total})`
      : "Saving to Photos…"
    : savedAllPhotos
      ? "Saved to Photos"
      : "Save all to Photos";

  return (
    <div className="rounded-lg border border-border bg-background/40 p-4 sm:rounded-xl sm:p-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-foreground">Slide images</h3>
        <p className="text-xs leading-5 text-muted-foreground">
          Download or save your slide images for posting.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          disabled={disabled || isExporting}
          onClick={onDownloadZip}
          className="btn-primary w-full py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExporting
            ? "Preparing zip…"
            : isNativeApp
              ? "Share slide zip"
              : "Download slide zip"}
        </button>

        {isNativeApp && (
          <button
            type="button"
            disabled={disabled || isSavingAllPhotos}
            onClick={onSaveAllToPhotos}
            className="btn-primary w-full py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saveAllLabel}
          </button>
        )}
      </div>

      {exportMessage && (
        <div className="mt-3 rounded-xl border border-emerald-900/50 bg-emerald-950/20 px-3 py-2.5 text-xs text-emerald-200">
          {exportMessage}
        </div>
      )}
    </div>
  );
}
