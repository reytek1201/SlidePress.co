import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { count: campaignsThisMonth, error: countError } = await supabase
      .from("campaigns")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth.toISOString());

    if (countError) {
      return NextResponse.json(
        { success: false, error: "Failed to load usage" },
        { status: 500 }
      );
    }

    const { count: totalCampaigns, error: totalError } = await supabase
      .from("campaigns")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (totalError) {
      return NextResponse.json(
        { success: false, error: "Failed to load usage" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      usage: {
        campaignsThisMonth: campaignsThisMonth ?? 0,
        totalCampaigns: totalCampaigns ?? 0,
        slideRegenerationsThisMonth: null,
        planLabel: "Early access",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
