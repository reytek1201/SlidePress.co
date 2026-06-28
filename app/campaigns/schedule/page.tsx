import ScheduleQueueClient from "@/app/campaigns/schedule/schedule-queue-client";
import BrandSwitcher from "@/app/components/brand-switcher";
import { listUserBrands } from "@/utils/brands-server";
import { listPendingScheduledPostsForBrand } from "@/utils/platform-post-store";
import { getCanSchedulePublish } from "@/utils/usage-limits";
import { createClient } from "@/utils/supabase/server";
import { appRobots } from "@/utils/site-metadata";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Scheduled posts",
  robots: appRobots,
};

interface ScheduleQueuePageProps {
  searchParams: Promise<{ brand?: string }>;
}

export default async function ScheduleQueuePage({
  searchParams,
}: ScheduleQueuePageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const canSchedulePublish = await getCanSchedulePublish(supabase, user.id);

  if (!canSchedulePublish) {
    redirect("/campaigns");
  }

  const { brand: brandParam } = await searchParams;
  const brands = await listUserBrands(supabase, user.id);
  const activeBrand =
    brands.find((brand) => brand.id === brandParam) ??
    brands.find((brand) => brand.is_default) ??
    brands[0] ??
    null;

  if (!activeBrand) {
    redirect("/campaigns");
  }

  const posts = await listPendingScheduledPostsForBrand(user.id, activeBrand.id);
  const hasMultipleBrands = brands.length > 1;

  return (
    <div className="min-h-full bg-background text-foreground">
      <main className="page-main">
        <div className="space-y-3">
          <Link
            href={
              hasMultipleBrands
                ? `/campaigns?brand=${activeBrand.id}`
                : "/campaigns"
            }
            className="inline-flex text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            ← Campaigns
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Scheduled posts
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Upcoming posts for{" "}
            <span className="font-medium text-secondary-foreground">
              {activeBrand.name}
            </span>
            , sorted by time.
          </p>
          {hasMultipleBrands ? (
            <BrandSwitcher className="max-w-md" />
          ) : null}
        </div>

        <ScheduleQueueClient brandId={activeBrand.id} initialPosts={posts} />
      </main>
    </div>
  );
}
