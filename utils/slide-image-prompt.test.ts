import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { Campaign, Slide } from "@/types/campaign";
import { buildSlideImagePrompt } from "./slide-image-prompt.ts";

const UNIQUE_SCENE_MARKER = "UNIQUE_SCENE_DESCRIPTION_FOR_TEST_12345";
const HEADLINE = "Grow faster in 3 steps";

function makeFixtures(): { slide: Slide; campaign: Campaign } {
  const campaign = {
    aspect_ratio: "9:16",
    product_reference_url: null,
    style_reference_url: null,
    logo_reference_url: null,
  } as Campaign;

  const slide = {
    text_overlay: HEADLINE,
    image_prompt: UNIQUE_SCENE_MARKER,
  } as Slide;

  return { slide, campaign };
}

function withOverlayLayerFlag(
  enabled: boolean,
  run: () => void,
): void {
  const previous = process.env.TEXT_OVERLAY_LAYER;
  process.env.TEXT_OVERLAY_LAYER = enabled ? "true" : "false";

  try {
    run();
  } finally {
    if (previous === undefined) {
      delete process.env.TEXT_OVERLAY_LAYER;
    } else {
      process.env.TEXT_OVERLAY_LAYER = previous;
    }
  }
}

describe("buildSlideImagePrompt regeneration (TEXT_OVERLAY_LAYER=true)", () => {
  beforeEach(() => {
    process.env.TEXT_OVERLAY_LAYER = "true";
  });

  afterEach(() => {
    delete process.env.TEXT_OVERLAY_LAYER;
  });

  it("omits full scene description on small-edit path (resetScene false)", () => {
    const { slide, campaign } = makeFixtures();

    const prompt = buildSlideImagePrompt(slide, campaign, ["brighter"], undefined, {
      isRegeneration: true,
    });

    assert.ok(prompt?.includes("Edit the first reference image"));
    assert.ok(prompt?.includes("brighter, more airy palette"));
    assert.ok(
      prompt?.includes(
        "Apply the requested changes above as the dominant edit to this image",
      ),
    );
    assert.ok(!prompt?.includes(UNIQUE_SCENE_MARKER));
    assert.ok(!prompt?.includes("Render this exact headline"));
    assert.ok(!prompt?.includes("MUST re-render the headline"));
    assert.ok(
      !prompt?.includes(
        "The PRIORITY instructions above override the scene description",
      ),
    );
  });

  it("includes scene prompt from image_prompt on resetScene true path", () => {
    const { slide, campaign } = makeFixtures();

    const prompt = buildSlideImagePrompt(
      slide,
      campaign,
      ["different_layout"],
      undefined,
      { isRegeneration: true },
    );

    assert.ok(
      prompt?.includes("Use the first reference image only for brand context"),
    );
    assert.ok(prompt?.includes(UNIQUE_SCENE_MARKER));
    assert.ok(!prompt?.includes("Render this exact headline"));
    assert.ok(
      prompt?.includes(
        "The PRIORITY instructions above override the scene description",
      ),
    );
  });

  it("includes custom notes on small-edit path without scene restatement", () => {
    const { slide, campaign } = makeFixtures();

    const prompt = buildSlideImagePrompt(slide, campaign, [], "Make the sky purple", {
      isRegeneration: true,
    });

    assert.ok(prompt?.includes("Make the sky purple"));
    assert.ok(!prompt?.includes(UNIQUE_SCENE_MARKER));
  });

  it("initial generation uses scene-only prompt without headline rendering", () => {
    const { slide, campaign } = makeFixtures();

    const prompt = buildSlideImagePrompt(slide, campaign);

    assert.ok(prompt?.includes(UNIQUE_SCENE_MARKER));
    assert.ok(prompt?.includes("no text, typography, or words"));
    assert.ok(!prompt?.includes("Render this exact headline"));
  });
});

describe("buildSlideImagePrompt regeneration (TEXT_OVERLAY_LAYER=false legacy)", () => {
  it("includes headline on resetScene true path", () => {
    withOverlayLayerFlag(false, () => {
      const { slide, campaign } = makeFixtures();

      const prompt = buildSlideImagePrompt(
        slide,
        campaign,
        ["different_layout"],
        undefined,
        { isRegeneration: true },
      );

      assert.ok(prompt?.includes(HEADLINE));
      assert.ok(prompt?.includes("Render this exact headline"));
      assert.ok(!prompt?.includes(UNIQUE_SCENE_MARKER));
    });
  });
});
