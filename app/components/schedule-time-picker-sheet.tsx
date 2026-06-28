"use client";

import BottomSheet from "@/app/components/bottom-sheet";
import {
  formatScheduleWhen,
  fromDateAndTime,
  getLocalTimezoneLabel,
  getSchedulePresets,
  isScheduleDateValid,
  SCHEDULE_MINUTE_OPTIONS,
  toDateInputValue,
  type SchedulePreset,
  type SuggestedPostTimePlatform,
} from "@/utils/platforms/suggested-post-times";
import { useEffect, useRef, useState } from "react";

function platformSheetTitle(platformKey: SuggestedPostTimePlatform): string {
  switch (platformKey) {
    case "youtube":
      return "Schedule YouTube post";
    case "tiktok":
      return "Schedule TikTok post";
    case "instagram_reel":
      return "Schedule Instagram Reel";
    case "instagram_carousel":
      return "Schedule Instagram carousel";
    default:
      return "Schedule post";
  }
}

function initialPickerState(
  platformKey: SuggestedPostTimePlatform,
  initialScheduledFor: string | null | undefined,
) {
  const presets = getSchedulePresets(platformKey);
  const defaultPreset = presets[0]!;

  if (initialScheduledFor) {
    const date = new Date(initialScheduledFor);

    if (!Number.isNaN(date.getTime())) {
      return {
        presets,
        selectedPresetId: "custom" as const,
        customDateValue: toDateInputValue(date),
        customHour: date.getHours(),
        customMinute: date.getMinutes(),
      };
    }
  }

  return {
    presets,
    selectedPresetId: defaultPreset.id as string | "custom",
    customDateValue: toDateInputValue(defaultPreset.date),
    customHour: defaultPreset.date.getHours(),
    customMinute: defaultPreset.date.getMinutes(),
  };
}

interface ScheduleTimePickerSheetProps {
  open: boolean;
  onClose: () => void;
  platformKey: SuggestedPostTimePlatform;
  initialScheduledFor?: string | null;
  confirmLabel?: string;
  confirmingLabel?: string;
  disabled?: boolean;
  onConfirm: (scheduledFor: string) => Promise<void>;
}

export default function ScheduleTimePickerSheet({
  open,
  onClose,
  platformKey,
  initialScheduledFor,
  confirmLabel = "Confirm schedule",
  confirmingLabel = "Scheduling…",
  disabled = false,
  onConfirm,
}: ScheduleTimePickerSheetProps) {
  const inFlightRef = useRef(false);
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerState, setPickerState] = useState(() =>
    initialPickerState(platformKey, initialScheduledFor),
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setPickerState(initialPickerState(platformKey, initialScheduledFor));
    setError(null);
  }, [open, platformKey, initialScheduledFor]);

  const selectedDate =
    pickerState.selectedPresetId === "custom"
      ? fromDateAndTime(
          pickerState.customDateValue,
          pickerState.customHour,
          pickerState.customMinute,
        )
      : (pickerState.presets.find(
          (preset) => preset.id === pickerState.selectedPresetId,
        )?.date ?? pickerState.presets[0]!.date);

  const selectedLabel = formatScheduleWhen(selectedDate);
  const scheduleValid = isScheduleDateValid(selectedDate);
  const minDateValue = toDateInputValue(new Date());
  const hourOptions = Array.from({ length: 24 }, (_, hour) => hour);

  function selectPreset(preset: SchedulePreset) {
    setPickerState((current) => ({
      ...current,
      selectedPresetId: preset.id,
      customDateValue: toDateInputValue(preset.date),
      customHour: preset.date.getHours(),
      customMinute: preset.date.getMinutes(),
    }));
    setError(null);
  }

  function selectCustom() {
    setPickerState((current) => ({
      ...current,
      selectedPresetId: "custom",
    }));
    setError(null);
  }

  async function handleConfirm() {
    if (inFlightRef.current || scheduling || disabled) {
      return;
    }

    if (!isScheduleDateValid(selectedDate)) {
      setError("Pick a time at least 1 minute in the future.");
      return;
    }

    inFlightRef.current = true;
    setScheduling(true);
    setError(null);

    try {
      await onConfirm(selectedDate.toISOString());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule post");
    } finally {
      inFlightRef.current = false;
      setScheduling(false);
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={platformSheetTitle(platformKey)}
      titleId="schedule-time-picker-title"
      description="Pick when this post should go live."
      dismissDisabled={scheduling}
      zIndexClass="z-[70]"
      maxHeightClass="max-h-[min(92dvh,640px)]"
      desktopModal
      footer={
        <div className="flex flex-col gap-2 md:flex-row md:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={scheduling}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition hover:border-ring/60 hover:text-foreground active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!scheduleValid || scheduling || disabled}
            onClick={() => void handleConfirm()}
            className="btn-primary py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {scheduling ? confirmingLabel : confirmLabel}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-foreground">Quick picks</p>
          <div className="mt-2 flex flex-col gap-2">
            {pickerState.presets.map((preset) => {
              const selected = pickerState.selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => selectPreset(preset)}
                  className={`rounded-xl border px-3 py-2.5 text-left transition ${
                    selected
                      ? "border-primary/60 bg-primary/10"
                      : "border-border bg-background/40 hover:border-ring/60"
                  }`}
                >
                  <span className="block text-sm font-semibold text-foreground">
                    {preset.label}
                  </span>
                  {preset.hint ? (
                    <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                      {preset.hint}
                    </span>
                  ) : null}
                </button>
              );
            })}
            <button
              type="button"
              onClick={selectCustom}
              className={`rounded-xl border px-3 py-2.5 text-left transition ${
                pickerState.selectedPresetId === "custom"
                  ? "border-primary/60 bg-primary/10"
                  : "border-border bg-background/40 hover:border-ring/60"
              }`}
            >
              <span className="block text-sm font-semibold text-foreground">
                Pick date &amp; time…
              </span>
              <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                Choose a specific day and time
              </span>
            </button>
          </div>
        </div>

        {pickerState.selectedPresetId === "custom" ? (
          <div className="rounded-xl border border-border bg-background/40 p-3">
            <p className="text-sm font-medium text-foreground">Custom time</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="block sm:col-span-3">
                <span className="text-xs font-medium text-muted-foreground">
                  Date
                </span>
                <input
                  type="date"
                  value={pickerState.customDateValue}
                  min={minDateValue}
                  onChange={(event) => {
                    setPickerState((current) => ({
                      ...current,
                      customDateValue: event.target.value,
                    }));
                  }}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">
                  Hour
                </span>
                <select
                  value={pickerState.customHour}
                  onChange={(event) => {
                    setPickerState((current) => ({
                      ...current,
                      customHour: Number(event.target.value),
                    }));
                  }}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {hourOptions.map((hour) => (
                    <option key={hour} value={hour}>
                      {new Date(2000, 0, 1, hour, 0).toLocaleTimeString(
                        undefined,
                        { hour: "numeric" },
                      )}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">
                  Minute
                </span>
                <select
                  value={pickerState.customMinute}
                  onChange={(event) => {
                    setPickerState((current) => ({
                      ...current,
                      customMinute: Number(event.target.value),
                    }));
                  }}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {SCHEDULE_MINUTE_OPTIONS.map((minute) => (
                    <option key={minute} value={minute}>
                      {String(minute).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-border bg-background/40 px-3 py-2.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Selected
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {selectedLabel}
          </p>
        </div>

        <p className="text-xs leading-5 text-muted-foreground">
          Times are in your local timezone ({getLocalTimezoneLabel()}). Posts
          usually go live within 5 minutes of the time you pick.
        </p>

        {error ? (
          <p className="text-sm text-red-300">{error}</p>
        ) : !scheduleValid ? (
          <p className="text-sm text-red-300">
            Pick a time at least 1 minute in the future.
          </p>
        ) : null}
      </div>
    </BottomSheet>
  );
}
