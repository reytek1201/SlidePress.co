import type { ContentStyle } from "@/types/slides";

export type AspectRatio = "4:5" | "9:16";

export type TextRegionPosition =
  | "upper_left"
  | "upper_center"
  | "upper_right"
  | "center_left"
  | "center"
  | "center_right"
  | "lower_left"
  | "lower_center"
  | "lower_right";

export type TextRegionBackgroundTone = "light" | "dark" | "mixed";

export interface TextRegion {
  position: TextRegionPosition;
  background_tone: TextRegionBackgroundTone;
}

export type CampaignStatus =
  | "idle"
  | "generating_text"
  | "generating_images"
  | "completed"
  | "failed";

export interface Campaign {
  id: string;
  user_id: string;
  brand_id: string | null;
  brand_product_id: string | null;
  topic: string;
  title: string | null;
  target_audience: string | null;
  content_style: ContentStyle | null;
  aspect_ratio: AspectRatio;
  secondary_aspect_ratio: AspectRatio | null;
  image_generation_aspect: AspectRatio | null;
  slide_count: number;
  status: CampaignStatus;
  error_message: string | null;
  creation_credit_refunded?: boolean;
  product_reference_url: string | null;
  style_reference_url: string | null;
  logo_reference_url: string | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Slide {
  id: string;
  campaign_id: string;
  slide_index: number;
  text_overlay: string | null;
  voiceover_script: string | null;
  image_prompt: string | null;
  /** Best-effort placement hint for Phase 2 overlay; not a legibility guarantee. */
  text_region: TextRegion | null;
  image_url: string | null;
  fal_request_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SlideImage {
  id: string;
  slide_id: string;
  aspect_ratio: AspectRatio;
  image_url: string | null;
  fal_request_id: string | null;
  created_at: string;
  updated_at: string;
}
