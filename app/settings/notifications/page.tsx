import PushSettings from "@/app/components/push-settings";
import SettingsSubpageShell from "@/app/settings/settings-subpage-shell";
import { appRobots } from "@/utils/site-metadata";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications",
  robots: appRobots,
};

export default function NotificationsSettingsPage() {
  return (
    <SettingsSubpageShell
      title="Notifications"
      description="Choose when SlidePress can alert you on this device."
    >
      <PushSettings />
    </SettingsSubpageShell>
  );
}
