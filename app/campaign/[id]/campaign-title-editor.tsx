"use client";

import { useEffect, useState } from "react";

interface CampaignTitleEditorProps {
  campaignId: string;
  value: string;
  onSaved: (title: string) => void;
  onError: (message: string) => void;
}

export default function CampaignTitleEditor({
  campaignId,
  value,
  onSaved,
  onError,
}: CampaignTitleEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setDraft(value);
    }
  }, [value, isEditing]);

  const trimmedDraft = draft.trim();
  const isValid = trimmedDraft.length > 0 && trimmedDraft.length <= 120;
  const hasChanges = trimmedDraft !== value.trim();

  async function handleSave() {
    if (!isValid) {
      onError("Title must be 1–120 characters");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmedDraft }),
      });

      const data = (await response.json()) as {
        success: boolean;
        error?: string;
        campaign?: { title: string | null };
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to save title");
      }

      onSaved(data.campaign?.title?.trim() ?? trimmedDraft);
      setIsEditing(false);
    } catch (saveError) {
      onError(
        saveError instanceof Error ? saveError.message : "Failed to save title"
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isEditing) {
    return (
      <div className="mt-3">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={isSaving}
          autoFocus
          maxLength={120}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-2xl font-semibold tracking-tight text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60 sm:text-3xl"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p
            className={`text-xs ${
              trimmedDraft.length > 120 || trimmedDraft.length === 0
                ? "text-red-300"
                : "text-muted-foreground"
            }`}
          >
            {trimmedDraft.length}/120 characters
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                setDraft(value);
                setIsEditing(false);
              }}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-secondary-foreground transition hover:border-ring/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving || !isValid || !hasChanges}
              onClick={handleSave}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-secondary-foreground transition hover:border-ring/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving…" : "Save title"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-start gap-3">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {value || "Untitled campaign"}
      </h1>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="mt-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:border-ring/60 hover:text-foreground"
      >
        Rename
      </button>
    </div>
  );
}
