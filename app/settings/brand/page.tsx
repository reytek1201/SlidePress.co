import BrandLibraryEditor from "@/app/components/brand-library-editor";
import SettingsSubpageShell from "@/app/settings/settings-subpage-shell";
import { createClient } from "@/utils/supabase/server";
import { appRobots } from "@/utils/site-metadata";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brand library",
  robots: appRobots,
};

export default async function BrandSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <SettingsSubpageShell
      title="Brand library"
      description="Reference images used across your campaigns."
    >
      <BrandLibraryEditor user={user} />
    </SettingsSubpageShell>
  );
}
