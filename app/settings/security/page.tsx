import BiometricSettings from "@/app/components/biometric-settings";
import SettingsSubpageShell from "@/app/settings/settings-subpage-shell";
import { appRobots } from "@/utils/site-metadata";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security",
  robots: appRobots,
};

export default function SecuritySettingsPage() {
  return (
    <SettingsSubpageShell
      title="Security"
      description="Control how the app is locked when you leave it."
    >
      <BiometricSettings />
    </SettingsSubpageShell>
  );
}
