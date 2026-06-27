"use client";

import CreateCampaignForm from "@/app/components/create-campaign-form";
import { useActiveBrandOptional } from "@/app/components/active-brand-provider";
import { brandDetailHref } from "@/utils/brands-back-target";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { User } from "@supabase/supabase-js";

interface NewCampaignContentProps {
  user: User;
}

export default function NewCampaignContent({ user }: NewCampaignContentProps) {
  const router = useRouter();
  const activeBrandContext = useActiveBrandOptional();
  const activeBrand = activeBrandContext?.activeBrand ?? null;

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (isMobile) {
      router.replace("/campaigns");
    }
  }, [router]);

  return (
    <div className="hidden min-h-full bg-background text-foreground md:block">
      <main className="page-main flex min-h-full flex-col">
        <div className="page-content">
          <header className="mb-10">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <p className="brand-kicker">SlidePress</p>
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
              Generate your next campaign
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Slide scripts, on-slide headlines, voiceover, and image prompts —
              ready to generate into a full draft.
            </p>
            {activeBrand ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Brand{" "}
                <span className="font-medium text-foreground">
                  {activeBrand.name}
                </span>
                {(activeBrandContext?.brands.length ?? 0) > 1 ? (
                  <>
                    {" "}
                    ·{" "}
                    <Link
                      href={brandDetailHref(
                        activeBrand.id,
                        "campaigns",
                        activeBrand.id,
                      )}
                      className="font-medium text-primary underline-offset-2 hover:underline"
                    >
                      Manage brand kit
                    </Link>
                  </>
                ) : null}
              </p>
            ) : null}
          </header>

          <CreateCampaignForm
            user={user}
            idPrefix="page-"
            hideBrandHeader
          />
        </div>
      </main>
    </div>
  );
}
