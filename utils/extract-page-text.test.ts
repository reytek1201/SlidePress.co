import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  detectPageContentKind,
  extractPageContent,
  extractSchemaImageUrl,
} from "./extract-page-text.ts";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "extract-page-text",
);

function loadFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), "utf8");
}

describe("extractPageContent", () => {
  it("extracts blog post text from noscript and JSON-LD prerender shells", () => {
    const html = loadFixture("blog-macros-101.html");
    const result = extractPageContent(
      html,
      "https://keymacro.fit/blog/macros-101",
    );

    assert.ok(result.pageText.length >= 120);
    assert.match(result.pageText, /Macros 101/i);
    assert.match(result.pageText, /macronutrients/i);
    assert.equal(result.contentKind, "blog");
  });

  it("extracts recipe text with ingredients and instructions", () => {
    const html = loadFixture("recipe-chicken-parmesan.html");
    const result = extractPageContent(
      html,
      "https://keymacro.fit/recipes/high-protein-dinners/high-protein-baked-chicken-parmesan",
    );

    assert.ok(result.pageText.length >= 120);
    assert.match(result.pageText, /High Protein Baked Chicken Parmesan/i);
    assert.match(result.pageText, /almond flour/i);
    assert.match(result.pageText, /Preheat your oven to 400/i);
    assert.equal(result.contentKind, "recipe");
  });

  it("extracts recipe collection listings", () => {
    const html = loadFixture("recipe-collection.html");
    const result = extractPageContent(
      html,
      "https://keymacro.fit/recipes/high-protein-dinners",
    );

    assert.ok(result.pageText.length >= 120);
    assert.match(result.pageText, /High-Protein Dinners Under 500 Calories/i);
    assert.match(result.pageText, /Mexican Chicken Fajita Skillet/i);
    assert.equal(result.contentKind, "listing");
  });
});

describe("extractSchemaImageUrl", () => {
  it("reads hero images from Recipe schema", () => {
    const html = loadFixture("recipe-chicken-parmesan.html");
    const imageUrl = extractSchemaImageUrl(html);

    assert.match(
      imageUrl ?? "",
      /high-protein-baked-chicken-parmesan-blog-1500x1125/i,
    );
  });
});

describe("detectPageContentKind", () => {
  it("falls back to URL path when schema is generic", () => {
    const html = "<html><body><title>Blog</title></body></html>";

    assert.equal(
      detectPageContentKind("/blog/my-post", html),
      "blog",
    );
    assert.equal(
      detectPageContentKind("/recipes/my-dish", html),
      "recipe",
    );
  });
});
