import assert from "node:assert/strict";
import { test } from "node:test";
import {
  countWords,
  validateVoiceoverScript,
  VOICEOVER_MAX_WORDS,
} from "./voiceover-script-validation.ts";

test("countWords ignores extra whitespace", () => {
  assert.equal(countWords("  one   two three  "), 3);
});

test("validateVoiceoverScript accepts short scripts", () => {
  assert.equal(validateVoiceoverScript("This is a natural spoken line."), null);
});

test("validateVoiceoverScript rejects empty scripts", () => {
  assert.equal(validateVoiceoverScript("   "), "Voiceover script cannot be empty");
});

test("validateVoiceoverScript enforces max words", () => {
  const words = Array.from({ length: VOICEOVER_MAX_WORDS + 1 }, (_, i) => `w${i}`);
  assert.match(
    validateVoiceoverScript(words.join(" ")) ?? "",
    /at most 25 words/,
  );
});
