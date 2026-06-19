import ConnectedAccountsSettings from "@/app/components/connected-accounts-settings";
import SettingsSubpageShell from "@/app/settings/settings-subpage-shell";
import { appRobots } from "@/utils/site-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Connected accounts",
  robots: appRobots,
};

export default function ConnectedAccountsSettingsPage() {
  return (
    <SettingsSubpageShell
      title="Connected accounts"
      description="Link social platforms to publish directly from SlidePress."
    >
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <ConnectedAccountsSettings />
      </Suspense>
    </SettingsSubpageShell>
  );
}
