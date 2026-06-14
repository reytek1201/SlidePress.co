import type { BrandLibrary } from "@/types/brand-library";
import { BrandLibraryPutSchema } from "@/utils/campaign-generation";
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

    const { data: library, error } = await supabase
      .from("brand_library")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: "Failed to load brand library" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      library: (library as BrandLibrary | null) ?? null,
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

export async function PUT(request: Request) {
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

    const body = await request.json();
    const parsedInput = BrandLibraryPutSchema.safeParse(body);

    if (!parsedInput.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request payload",
          details: parsedInput.error.flatten(),
        },
        { status: 400 }
      );
    }

    const payload = {
      user_id: user.id,
      product_reference_url: parsedInput.data.product ?? null,
      style_reference_url: parsedInput.data.style ?? null,
      logo_reference_url: parsedInput.data.logo ?? null,
    };

    if (
      !payload.product_reference_url &&
      !payload.style_reference_url &&
      !payload.logo_reference_url
    ) {
      return NextResponse.json(
        { success: false, error: "At least one reference URL is required" },
        { status: 400 }
      );
    }

    const { data: library, error } = await supabase
      .from("brand_library")
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .single();

    if (error || !library) {
      return NextResponse.json(
        { success: false, error: "Failed to save brand library" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      library: library as BrandLibrary,
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

export async function DELETE() {
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

    const { error } = await supabase
      .from("brand_library")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json(
        { success: false, error: "Failed to clear brand library" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
