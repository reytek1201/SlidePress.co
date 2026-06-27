import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { captionOffsetForVideoCompose } from "./caption-video-sync.ts";

describe("captionOffsetForVideoCompose", () => {
  it("returns the audio offset unchanged (captions align to audio clock)", () => {
    assert.equal(captionOffsetForVideoCompose(0), 0);
    assert.equal(captionOffsetForVideoCompose(4.2), 4.2);
    assert.equal(captionOffsetForVideoCompose(9.3), 9.3);
  });

  it("works for any accumulated audio offset", () => {
    // For a 5-slide video, the offset for slide 4 should be the sum of the
    // prior slides' durations — no crossfade subtraction involved.
    const priorDurationsSum = 3.1 + 2.8 + 4.5 + 3.9; // 14.3
    assert.equal(captionOffsetForVideoCompose(priorDurationsSum), priorDurationsSum);
  });
});
