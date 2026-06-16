import BrandLibraryEditor from "@/app/components/brand-library-editor";
import { AddBrandBanner, AddBrandFooter } from "@/app/components/add-brand-link";
import SettingsSubpageShell from "@/app/settings/settings-subpage-shell";
import { listUserBrands } from "@/utils/brands-server";
import { createClient } from "@/utils/supabase/server";
import { appRobots } from "@/utils/site-metadata";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brand",
  robots: appRobots,
};

interface BrandDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BrandDetailPage({ params }: BrandDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const brands = await listUserBrands(supabase, user.id);
  const brand = brands.find((entry) => entry.id === id);

  if (!brand) {
    notFound();
  }

  return (
    <SettingsSubpageShell
      title={brand.name}
      description="Reference images and products for this brand."
      backHref={brands.length > 1 ? "/settings/brands" : "/settings"}
      backLabel={brands.length > 1 ? "Brands" : "Settings"}
    >
      <AddBrandBanner />
      <BrandLibraryEditor user={user} brandId={brand.id} hideBrandName />
      <AddBrandFooter />
    </SettingsSubpageShell>
  );
}
