import PushTestSection from "@/app/components/push-test-section";
import SettingsSubpageShell from "@/app/settings/settings-subpage-shell";
import { appRobots } from "@/utils/site-metadata";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Push test",
  robots: appRobots,
};

export default function DevSettingsPage() {
  if (process.env.NEXT_PUBLIC_ALLOW_PUSH_TEST !== "true") {
    notFound();
  }

  return (
    <SettingsSubpageShell
      title="Push test"
      description="Developer tools for native push notifications."
    >
      <PushTestSection embedded />
    </SettingsSubpageShell>
  );
}
