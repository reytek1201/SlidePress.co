import SettingsSubpageShell from "@/app/settings/settings-subpage-shell";
import UsageSettings from "@/app/settings/usage-settings";
import { appRobots } from "@/utils/site-metadata";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Usage",
  robots: appRobots,
};

export default function UsageSettingsPage() {
  return (
    <SettingsSubpageShell
      title="Usage"
      description="Campaign activity and plan limits for your account."
    >
      <UsageSettings variant="plain" />
    </SettingsSubpageShell>
  );
}
