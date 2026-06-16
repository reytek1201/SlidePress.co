import BrandsManager from "@/app/components/brands-manager";
import SettingsSubpageShell from "@/app/settings/settings-subpage-shell";
import { listUserBrands } from "@/utils/brands-server";
import { createClient } from "@/utils/supabase/server";
import { appRobots } from "@/utils/site-metadata";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brands",
  robots: appRobots,
};

interface BrandsSettingsPageProps {
  searchParams: Promise<{ list?: string }>;
}

export default async function BrandsSettingsPage({
  searchParams,
}: BrandsSettingsPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { list } = await searchParams;
  const brands = await listUserBrands(supabase, user.id);

  if (brands.length === 1 && list !== "1") {
    redirect(`/settings/brands/${brands[0].id}`);
  }

  return (
    <SettingsSubpageShell
      title="Brands"
      description="Each brand has its own reference images, products, and campaigns."
    >
      <BrandsManager />
    </SettingsSubpageShell>
  );
}
