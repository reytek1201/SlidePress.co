"use client";

import ScheduleTimePickerSheet from "@/app/components/schedule-time-picker-sheet";
import type { ScheduledPostQueueItem } from "@/utils/platform-post-store";
import {
  buildScheduleInputFromPost,
  cancelScheduledPlatformPostClient,
  platformKeyForScheduledPost,
  reschedulePendingPlatformPostClient,
  scheduledPostPlatformLabel,
} from "@/utils/platform-schedule-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function formatScheduledTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function PlatformIcon({
  platform,
  exportId,
}: {
  platform: ScheduledPostQueueItem["platform"];
  exportId: string | null;
}) {
  if (platform === "youtube") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background/70">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-4 w-4 text-red-500"
          aria-hidden
        >
          <path d="M21.8 8.001a2.5 2.5 0 0 0-1.76-1.77C18.36 6 12 6 12 6s-6.36 0-8.04.231A2.5 2.5 0 0 0 2.2 8.001 26.3 26.3 0 0 0 2 12a26.3 26.3 0 0 0 .2 3.999 2.5 2.5 0 0 0 1.76 1.77C5.64 18 12 18 12 18s6.36 0 8.04-.231a2.5 2.5 0 0 0 1.76-1.77A26.3 26.3 0 0 0 22 12a26.3 26.3 0 0 0-.2-3.999Z" />
          <path fill="#fff" d="m10 15 5-3-5-3v6Z" />
        </svg>
      </span>
    );
  }

  if (platform === "tiktok") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background/70 text-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden
        >
          <path d="M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-1.05-.14z" />
        </svg>
      </span>
    );
  }

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background/70">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        className="h-4 w-4 text-pink-400"
        aria-hidden
      >
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4.5" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
      <span className="sr-only">
        {exportId ? "Instagram Reel" : "Instagram carousel"}
      </span>
    </span>
  );
}

interface ScheduleQueueClientProps {
  brandId: string;
  initialPosts: ScheduledPostQueueItem[];
}

export default function ScheduleQueueClient({
  brandId,
  initialPosts,
}: ScheduleQueueClientProps) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [busyPostId, setBusyPostId] = useState<string | null>(null);
  const [reschedulePost, setReschedulePost] =
    useState<ScheduledPostQueueItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPosts(initialPosts);
    setBusyPostId(null);
    setReschedulePost(null);
    setError(null);
  }, [brandId, initialPosts]);

  const refreshPosts = useCallback(async () => {
    const response = await fetch(
      `/api/platforms/scheduled-posts?brandId=${encodeURIComponent(brandId)}`,
      { cache: "no-store" },
    );
    const data = (await response.json()) as {
      success: boolean;
      posts?: ScheduledPostQueueItem[];
      error?: string;
    };

    if (!response.ok || !data.success || !data.posts) {
      throw new Error(data.error ?? "Failed to refresh scheduled posts");
    }

    setPosts(data.posts);
  }, [brandId]);

  async function handleCancel(postId: string) {
    setError(null);
    setBusyPostId(postId);

    try {
      await cancelScheduledPlatformPostClient(postId);
      setPosts((current) => current.filter((post) => post.id !== postId));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel post");
    } finally {
      setBusyPostId(null);
    }
  }

  async function handleRescheduleConfirm(scheduledFor: string) {
    if (!reschedulePost) {
      return;
    }

    setError(null);

    await reschedulePendingPlatformPostClient(
      reschedulePost.id,
      buildScheduleInputFromPost(reschedulePost, scheduledFor),
    );

    await refreshPosts();
    router.refresh();
    setReschedulePost(null);
  }

  if (posts.length === 0) {
    return (
      <section className="mt-10 rounded-2xl border border-border bg-card/50 p-10 text-center">
        <h2 className="text-lg font-semibold text-foreground">
          Nothing scheduled right now
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          When you schedule posts from a campaign&apos;s Publish tab, they&apos;ll
          show up here.
        </p>
        <Link href="/campaigns" className="btn-primary mt-6 inline-flex">
          Back to campaigns
        </Link>
      </section>
    );
  }

  return (
    <>
      <ul className="mt-8 space-y-3">
        {posts.map((post) => {
          const isBusy = busyPostId === post.id;
          const scheduledFor = post.scheduledFor;

          return (
            <li
              key={post.id}
              className="rounded-xl border border-border bg-card/50 p-4 sm:p-5"
            >
              <div className="flex items-start gap-3">
                <PlatformIcon
                  platform={post.platform}
                  exportId={post.exportId}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Link
                      href={`/campaign/${post.campaignId}?tab=publish`}
                      className="text-sm font-semibold text-foreground underline-offset-2 hover:underline"
                    >
                      {post.campaignTitle}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {scheduledPostPlatformLabel(post)}
                    </span>
                  </div>
                  {scheduledFor ? (
                    <p className="mt-1 text-sm text-secondary-foreground">
                      {formatScheduledTime(scheduledFor)}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleCancel(post.id)}
                      className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-2 text-xs font-semibold text-secondary-foreground transition hover:border-ring/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isBusy ? "Cancelling…" : "Cancel"}
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        setError(null);
                        setReschedulePost(post);
                      }}
                      className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-2 text-xs font-semibold text-secondary-foreground transition hover:border-ring/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </div>
      ) : null}

      {reschedulePost ? (
        <ScheduleTimePickerSheet
          open
          onClose={() => setReschedulePost(null)}
          platformKey={platformKeyForScheduledPost(reschedulePost)}
          initialScheduledFor={reschedulePost.scheduledFor}
          confirmLabel="Save new time"
          confirmingLabel="Saving…"
          onConfirm={handleRescheduleConfirm}
        />
      ) : null}
    </>
  );
}
