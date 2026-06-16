import SettingsDesktop from "@/app/settings/settings-desktop";
import SettingsHub from "@/app/settings/settings-hub";
import { createClient } from "@/utils/supabase/server";
import { appRobots } from "@/utils/site-metadata";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  robots: appRobots,
};

interface SettingsPageProps {
  searchParams: Promise<{ reset?: string }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;

  if (params.reset === "1") {
    redirect("/settings/account?reset=1");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <div className="md:hidden">
        <SettingsHub user={user} />
      </div>
      <div className="hidden md:block">
        <SettingsDesktop user={user} />
      </div>
    </>
  );
}
