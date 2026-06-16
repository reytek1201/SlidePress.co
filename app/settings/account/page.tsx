import AccountSettings from "@/app/settings/account-settings";
import SettingsSubpageShell from "@/app/settings/settings-subpage-shell";
import { createClient } from "@/utils/supabase/server";
import { appRobots } from "@/utils/site-metadata";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account",
  robots: appRobots,
};

interface AccountSettingsPageProps {
  searchParams: Promise<{ reset?: string }>;
}

export default async function AccountSettingsPage({
  searchParams,
}: AccountSettingsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <SettingsSubpageShell
      title="Account"
      description="Manage your sign-in, password, and account."
    >
      <AccountSettings
        user={user}
        showPasswordReset={params.reset === "1"}
        showSignOut={false}
        variant="plain"
      />
    </SettingsSubpageShell>
  );
}
