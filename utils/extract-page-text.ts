const MAX_PAGE_TEXT_CHARS = 24_000;

export type PageContentKind = "blog" | "recipe" | "listing" | "business";

export interface ExtractedPageContent {
  pageText: string;
  contentKind: PageContentKind;
  schemaImageUrl: string | null;
}

export function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ");
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function htmlFragmentToText(html: string): string {
  return collapseWhitespace(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

function extractNoscriptText(html: string): string {
  const parts: string[] = [];

  for (const match of html.matchAll(/<noscript[^>]*>([\s\S]*?)<\/noscript>/gi)) {
    const text = htmlFragmentToText(match[1] ?? "");

    if (text) {
      parts.push(text);
    }
  }

  return collapseWhitespace(parts.join("\n\n"));
}

function extractBodyText(html: string): string {
  const withoutHead = html.replace(/<head[\s\S]*?<\/head>/gi, " ");
  const withoutScripts = withoutHead
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

  return htmlFragmentToText(withoutScripts);
}

function parseJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];

  for (const match of html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    const raw = match[1]?.trim();

    if (!raw) {
      continue;
    }

    try {
      blocks.push(JSON.parse(raw));
    } catch {
      continue;
    }
  }

  return blocks;
}

function flattenJsonLdNodes(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => flattenJsonLdNodes(entry));
  }

  if (typeof value !== "object" || value === null) {
    return [];
  }

  const record = value as Record<string, unknown>;
  const nodes = [record];

  if (Array.isArray(record["@graph"])) {
    nodes.push(...flattenJsonLdNodes(record["@graph"]));
  }

  return nodes;
}

function schemaTypes(record: Record<string, unknown>): string[] {
  const rawType = record["@type"];

  if (typeof rawType === "string") {
    return [rawType];
  }

  if (Array.isArray(rawType)) {
    return rawType.filter((entry): entry is string => typeof entry === "string");
  }

  return [];
}

function hasSchemaType(record: Record<string, unknown>, type: string): boolean {
  return schemaTypes(record).includes(type);
}

function textFromInstructionStep(step: unknown): string | null {
  if (typeof step === "string") {
    return collapseWhitespace(step);
  }

  if (typeof step !== "object" || step === null) {
    return null;
  }

  const record = step as Record<string, unknown>;

  if (typeof record.text === "string" && record.text.trim()) {
    return collapseWhitespace(record.text);
  }

  if (typeof record.name === "string" && record.name.trim()) {
    return collapseWhitespace(record.name);
  }

  return null;
}

function textFromRecipe(record: Record<string, unknown>): string {
  const lines: string[] = [];

  if (typeof record.name === "string" && record.name.trim()) {
    lines.push(record.name.trim());
  }

  if (typeof record.description === "string" && record.description.trim()) {
    lines.push(record.description.trim());
  }

  if (typeof record.recipeYield === "string" && record.recipeYield.trim()) {
    lines.push(`Yield: ${record.recipeYield.trim()}`);
  }

  if (typeof record.totalTime === "string" && record.totalTime.trim()) {
    lines.push(`Time: ${record.totalTime.trim()}`);
  }

  if (Array.isArray(record.recipeIngredient)) {
    const ingredients = record.recipeIngredient
      .filter((entry): entry is string => typeof entry === "string")
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (ingredients.length > 0) {
      lines.push(`Ingredients: ${ingredients.join("; ")}`);
    }
  }

  if (Array.isArray(record.recipeInstructions)) {
    const steps = record.recipeInstructions
      .map((step) => textFromInstructionStep(step))
      .filter((step): step is string => Boolean(step));

    if (steps.length > 0) {
      lines.push(`Instructions: ${steps.join(" ")}`);
    }
  }

  return lines.join("\n\n");
}

function textFromBlogPosting(record: Record<string, unknown>): string {
  const lines: string[] = [];

  const headline =
    (typeof record.headline === "string" && record.headline.trim()) ||
    (typeof record.name === "string" && record.name.trim()) ||
    null;

  if (headline) {
    lines.push(headline);
  }

  if (typeof record.description === "string" && record.description.trim()) {
    lines.push(record.description.trim());
  }

  if (typeof record.articleBody === "string" && record.articleBody.trim()) {
    lines.push(record.articleBody.trim());
  }

  return lines.join("\n\n");
}

function textFromItemList(record: Record<string, unknown>): string {
  const lines: string[] = [];

  if (typeof record.name === "string" && record.name.trim()) {
    lines.push(record.name.trim());
  }

  if (typeof record.description === "string" && record.description.trim()) {
    lines.push(record.description.trim());
  }

  if (Array.isArray(record.itemListElement)) {
    const items = record.itemListElement
      .map((entry) => {
        if (typeof entry === "string") {
          return entry.trim();
        }

        if (typeof entry !== "object" || entry === null) {
          return null;
        }

        const item = entry as Record<string, unknown>;
        return typeof item.name === "string" ? item.name.trim() : null;
      })
      .filter((entry): entry is string => Boolean(entry));

    if (items.length > 0) {
      lines.push(`Items: ${items.join("; ")}`);
    }
  }

  return lines.join("\n\n");
}

function textFromJsonLdNode(record: Record<string, unknown>): string | null {
  if (hasSchemaType(record, "Recipe")) {
    return textFromRecipe(record);
  }

  if (hasSchemaType(record, "BlogPosting") || hasSchemaType(record, "Article")) {
    return textFromBlogPosting(record);
  }

  if (hasSchemaType(record, "ItemList")) {
    return textFromItemList(record);
  }

  if (hasSchemaType(record, "WebPage")) {
    const lines: string[] = [];

    if (typeof record.name === "string" && record.name.trim()) {
      lines.push(record.name.trim());
    }

    if (typeof record.description === "string" && record.description.trim()) {
      lines.push(record.description.trim());
    }

    return lines.length > 0 ? lines.join("\n\n") : null;
  }

  return null;
}

function extractJsonLdText(html: string): string {
  const nodes = parseJsonLdBlocks(html).flatMap((block) => flattenJsonLdNodes(block));
  const parts: string[] = [];

  for (const node of nodes) {
    const text = textFromJsonLdNode(node);

    if (text) {
      parts.push(text);
    }
  }

  return collapseWhitespace(parts.join("\n\n"));
}

export function extractSchemaImageUrl(
  html: string,
): string | null {
  const nodes = parseJsonLdBlocks(html).flatMap((block) => flattenJsonLdNodes(block));

  for (const node of nodes) {
    if (
      !hasSchemaType(node, "Recipe") &&
      !hasSchemaType(node, "BlogPosting") &&
      !hasSchemaType(node, "Article")
    ) {
      continue;
    }

    const image = node.image;

    if (typeof image === "string" && image.trim()) {
      return image.trim();
    }

    if (Array.isArray(image)) {
      for (const entry of image) {
        if (typeof entry === "string" && entry.trim()) {
          return entry.trim();
        }

        if (
          typeof entry === "object" &&
          entry !== null &&
          typeof (entry as Record<string, unknown>).url === "string"
        ) {
          const url = (entry as Record<string, unknown>).url as string;

          if (url.trim()) {
            return url.trim();
          }
        }
      }
    }

    if (
      typeof image === "object" &&
      image !== null &&
      typeof (image as Record<string, unknown>).url === "string"
    ) {
      const url = (image as Record<string, unknown>).url as string;

      if (url.trim()) {
        return url.trim();
      }
    }
  }

  return null;
}

export function detectPageContentKind(
  pathname: string,
  html: string,
): PageContentKind {
  const nodes = parseJsonLdBlocks(html).flatMap((block) => flattenJsonLdNodes(block));

  for (const node of nodes) {
    if (hasSchemaType(node, "Recipe")) {
      return "recipe";
    }

    if (hasSchemaType(node, "BlogPosting") || hasSchemaType(node, "Article")) {
      return "blog";
    }

    if (hasSchemaType(node, "ItemList")) {
      return "listing";
    }
  }

  const path = pathname.toLowerCase();

  if (path.includes("/recipe")) {
    return "recipe";
  }

  if (path.includes("/blog")) {
    return "blog";
  }

  return "business";
}

function uniqueParts(parts: string[]): string {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const part of parts) {
    const trimmed = collapseWhitespace(part);

    if (!trimmed) {
      continue;
    }

    const key = trimmed.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push(trimmed);
  }

  return normalized.join("\n\n");
}

export function extractMetaContent(html: string, property: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);

    if (match?.[1]) {
      return decodeHtmlEntities(match[1].trim());
    }
  }

  return null;
}

export function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : null;
}

export function extractPageContent(
  html: string,
  pageUrl: string,
): ExtractedPageContent {
  let pathname = "/";

  try {
    pathname = new URL(pageUrl).pathname;
  } catch {
    // Keep default pathname when URL parsing fails.
  }

  const title = extractTitle(html);
  const metaDescription =
    extractMetaContent(html, "description") ??
    extractMetaContent(html, "og:description");

  const parts = [
    extractNoscriptText(html),
    extractJsonLdText(html),
    extractBodyText(html),
    title,
    metaDescription,
  ].filter((part): part is string => Boolean(part && part.trim()));

  const pageText = uniqueParts(parts).slice(0, MAX_PAGE_TEXT_CHARS);

  return {
    pageText,
    contentKind: detectPageContentKind(pathname, html),
    schemaImageUrl: extractSchemaImageUrl(html),
  };
}
