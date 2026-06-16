import SettingsAboutContent from "@/app/components/settings-about";
import SettingsSubpageShell from "@/app/settings/settings-subpage-shell";
import { appRobots } from "@/utils/site-metadata";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  robots: appRobots,
};

export default function AboutSettingsPage() {
  return (
    <SettingsSubpageShell
      title="About"
      description="App version, beta information, and legal policies."
    >
      <SettingsAboutContent variant="plain" />
    </SettingsSubpageShell>
  );
}
