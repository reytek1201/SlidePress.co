import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const RequestSchema = z.object({
  topic: z.string().trim().min(1, "Topic is required"),
  aspect_ratio: z.enum(["4:5", "9:16"]),
});

const SlideGenerationSchema = z.object({
  slide_index: z.number().int().min(0).max(4),
  text_overlay: z
    .string()
    .min(1)
    .refine(
      (value) => value.trim().split(/\s+/).filter(Boolean).length <= 12,
      "text_overlay must be at most 12 words"
    ),
  voiceover_script: z.string().min(1),
  image_prompt: z.string().min(1),
});

const CampaignGenerationSchema = z.object({
  title: z.string().min(1),
  target_audience: z.string().min(1),
  slides: z.array(SlideGenerationSchema).length(5),
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function aspectRatioContext(aspectRatio: "4:5" | "9:16"): string {
  return aspectRatio === "4:5"
    ? "Instagram/Facebook portrait carousel slide (4:5 aspect ratio, vertical portrait framing)"
    : "TikTok/Reels/Shorts vertical video frame (9:16 aspect ratio, full vertical mobile framing)";
}

export async function POST(request: Request) {
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
    const parsedInput = RequestSchema.safeParse(body);

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

    const { topic, aspect_ratio } = parsedInput.data;

    const completion = await openai.chat.completions.parse({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content: [
            "You are a senior performance marketing copywriter and visual prompt engineer.",
            "Generate a 5-slide social campaign with punchy overlays, natural TTS voiceover lines,",
            "and highly stylized image prompts optimized for Flux or SDXL.",
            "Image prompts must explicitly match the requested aspect ratio framing.",
            "Return slide_index values 0 through 4 exactly once each.",
          ].join(" "),
        },
        {
          role: "user",
          content: [
            `Topic / pain point: ${topic}`,
            `Target format: ${aspectRatioContext(aspect_ratio)}`,
            "Create a compelling campaign title, target audience description,",
            "and exactly 5 slides with text_overlay (max 12 words), voiceover_script, and image_prompt.",
          ].join("\n"),
        },
      ],
      response_format: zodResponseFormat(
        CampaignGenerationSchema,
        "campaign_generation"
      ),
    });

    const generated = completion.choices[0]?.message?.parsed;

    if (!generated) {
      return NextResponse.json(
        { success: false, error: "Failed to parse AI response" },
        { status: 502 }
      );
    }

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert({
        user_id: user.id,
        topic,
        title: generated.title,
        target_audience: generated.target_audience,
        aspect_ratio,
        status: "idle",
      })
      .select("id")
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create campaign",
          details: campaignError?.message,
        },
        { status: 500 }
      );
    }

    const slidesPayload = generated.slides.map((slide) => ({
      campaign_id: campaign.id,
      slide_index: slide.slide_index,
      text_overlay: slide.text_overlay,
      voiceover_script: slide.voiceover_script,
      image_prompt: slide.image_prompt,
    }));

    const { error: slidesError } = await supabase
      .from("slides")
      .insert(slidesPayload);

    if (slidesError) {
      await supabase.from("campaigns").delete().eq("id", campaign.id);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to persist slides",
          details: slidesError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, campaignId: campaign.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.flatten(),
        },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
