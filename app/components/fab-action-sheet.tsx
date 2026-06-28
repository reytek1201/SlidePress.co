"use client";

import BottomSheet from "@/app/components/bottom-sheet";
import { useRouter } from "next/navigation";

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

interface FabActionSheetProps {
  open: boolean;
  onClose: () => void;
  onNewCampaign: () => void;
  activeBrandId: string | null;
}

export default function FabActionSheet({
  open,
  onClose,
  onNewCampaign,
  activeBrandId,
}: FabActionSheetProps) {
  const router = useRouter();

  function handleSchedule() {
    onClose();
    const href = activeBrandId
      ? `/campaigns/schedule?brand=${encodeURIComponent(activeBrandId)}`
      : "/campaigns/schedule";
    router.push(href);
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Create"
      titleId="fab-action-sheet-title"
      mobileOnly
      zIndexClass="z-[65]"
      maxHeightClass="max-h-[min(50dvh,320px)]"
    >
      <div className="grid gap-2">
        <button
          type="button"
          onClick={() => {
            onClose();
            onNewCampaign();
          }}
          className="flex items-center gap-3 rounded-xl border border-border bg-background/40 px-4 py-3 text-left transition hover:border-ring/60 active:scale-[0.99]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <PlusIcon className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold text-foreground">
            New Campaign
          </span>
        </button>
        <button
          type="button"
          onClick={handleSchedule}
          className="flex items-center gap-3 rounded-xl border border-border bg-background/40 px-4 py-3 text-left transition hover:border-ring/60 active:scale-[0.99]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/15 text-sky-300">
            <CalendarIcon className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold text-foreground">Schedule</span>
        </button>
      </div>
    </BottomSheet>
  );
}
