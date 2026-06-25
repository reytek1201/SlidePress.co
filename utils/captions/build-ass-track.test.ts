import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BURN_CAPTION_STYLE_V1,
  buildAssTrack,
  buildBurnCaptionScrimFilters,
  getBurnCaptionLayout,
  parseAssPlayResolution,
} from "./build-ass-track.ts";

describe("getBurnCaptionLayout", () => {
  it("anchors scrim to the same bottom margin as ASS style", () => {
    const layout916 = getBurnCaptionLayout(1080, 1920);
    const layout45 = getBurnCaptionLayout(1080, 1350);

    assert.equal(layout916.scrimTop + layout916.scrimHeight, 1920);
    assert.equal(layout45.scrimTop + layout45.scrimHeight, 1350);
    assert.ok(layout916.scrimHeight >= layout916.marginV);
    assert.ok(layout45.scrimHeight >= layout45.marginV);
  });
});

describe("buildAssTrack", () => {
  it("includes thick outline and shadow in the style line", () => {
    const ass = buildAssTrack({
      width: 1080,
      height: 1920,
      words: [{ word: "Hello", startSeconds: 0, endSeconds: 0.5 }],
    });

    assert.match(
      ass,
      new RegExp(
        `,${BURN_CAPTION_STYLE_V1.outline},${BURN_CAPTION_STYLE_V1.shadow},`,
      ),
    );
    assert.ok(ass.includes("Dialogue:"));
  });
});

describe("buildBurnCaptionScrimFilters", () => {
  it("returns two drawbox filters for a gradient-like scrim band", () => {
    const layout = getBurnCaptionLayout(1080, 1920);
    const filters = buildBurnCaptionScrimFilters(layout);

    assert.equal(filters.split("drawbox=").length - 1, 2);
    assert.ok(filters.includes(`@${BURN_CAPTION_STYLE_V1.scrimOpacitySoft}`));
    assert.ok(filters.includes(`@${BURN_CAPTION_STYLE_V1.scrimOpacityStrong}`));
  });
});

describe("parseAssPlayResolution", () => {
  it("reads PlayRes from generated ASS", () => {
    const ass = buildAssTrack({
      width: 1080,
      height: 1350,
      words: [{ word: "Test", startSeconds: 0, endSeconds: 0.4 }],
    });

    assert.deepEqual(parseAssPlayResolution(ass), {
      width: 1080,
      height: 1350,
    });
  });
});
