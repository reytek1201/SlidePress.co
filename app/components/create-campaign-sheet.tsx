"use client";

import CreateCampaignForm from "@/app/components/create-campaign-form";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { User } from "@supabase/supabase-js";

interface CreateCampaignSheetProps {
  open: boolean;
  onClose: () => void;
  user: User;
  formKey: number;
}

export default function CreateCampaignSheet({
  open,
  onClose,
  user,
  formKey,
}: CreateCampaignSheetProps) {
  const router = useRouter();

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  function handleSuccess(campaignId: string) {
    onClose();
    router.push(`/campaign/${campaignId}`);
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] md:hidden" aria-hidden={false}>
      <button
        type="button"
        aria-label="Close create campaign sheet"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 opacity-100 transition-opacity duration-300"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-campaign-sheet-title"
        className="absolute inset-x-0 bottom-0 flex max-h-[92vh] translate-y-0 flex-col rounded-t-2xl border-t border-border bg-card shadow-2xl transition-transform duration-300 ease-out"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex shrink-0 flex-col items-center border-b border-border px-4 pb-3 pt-3">
          <div className="mb-3 h-1 w-10 rounded-full bg-border" aria-hidden />
          <div className="flex w-full items-center justify-between gap-3">
            <div>
              <h2
                id="create-campaign-sheet-title"
                className="text-lg font-semibold text-foreground"
              >
                New campaign
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Draft slides from a topic or pain point.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition active:bg-secondary/60"
            >
              Close
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5">
          <CreateCampaignForm
            key={formKey}
            user={user}
            idPrefix="sheet-"
            compact
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  );
}
