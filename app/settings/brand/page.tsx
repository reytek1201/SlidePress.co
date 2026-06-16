import { listUserBrands } from "@/utils/brands-server";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

interface LegacyBrandPageProps {
  searchParams: Promise<{ brand?: string }>;
}

export default async function LegacyBrandSettingsPage({
  searchParams,
}: LegacyBrandPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { brand: brandParam } = await searchParams;
  const brands = await listUserBrands(supabase, user.id);
  const brandId =
    brandParam ??
    brands.find((brand) => brand.is_default)?.id ??
    brands[0]?.id;

  if (brandId) {
    redirect(`/settings/brands/${brandId}`);
  }

  redirect("/settings/brands");
}
