import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CONTENT_STYLES,
  NARRATIVE_STRUCTURES,
  slideNarrativeGuidance,
  slideNarrativeStructuresPromptBlock,
} from "./slides.ts";

describe("NARRATIVE_STRUCTURES", () => {
  it("defines a structure for every slide count and content style", () => {
    for (const slideCount of [3, 5, 7] as const) {
      for (const style of CONTENT_STYLES) {
        assert.ok(NARRATIVE_STRUCTURES[slideCount][style]);
      }
    }
  });

  it("only pain_point structures include a problem beat", () => {
    for (const slideCount of [3, 5, 7] as const) {
      for (const style of CONTENT_STYLES) {
        const structure = NARRATIVE_STRUCTURES[slideCount][style].toLowerCase();
        const hasProblemBeat =
          structure.includes("problem") || structure.includes("struggle");

        if (style === "pain_point") {
          assert.equal(hasProblemBeat, true);
        } else {
          assert.equal(hasProblemBeat, false);
        }
      }
    }
  });
});

describe("slideNarrativeGuidance", () => {
  it("returns announcement arc for product-style campaigns", () => {
    const guidance = slideNarrativeGuidance(5, "announcement");
    assert.match(guidance, /what's new/);
    assert.doesNotMatch(guidance, /problem/);
  });

  it("preserves pain_point arc for struggle topics", () => {
    assert.match(slideNarrativeGuidance(5, "pain_point"), /problem/);
    assert.match(slideNarrativeGuidance(7, "pain_point"), /problem/);
  });
});

describe("slideNarrativeStructuresPromptBlock", () => {
  it("lists all content styles for the slide count", () => {
    const block = slideNarrativeStructuresPromptBlock(5);

    for (const style of CONTENT_STYLES) {
      assert.match(block, new RegExp(`${style}:`));
    }
  });
});
