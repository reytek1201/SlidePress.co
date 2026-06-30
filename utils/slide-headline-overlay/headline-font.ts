import { join } from "node:path";

export const HEADLINE_FONT_FAMILY = "Montserrat" as const;
export const HEADLINE_FONT_WEIGHT = 800;
export const HEADLINE_FONT_FILE = "montserrat-800.ttf";
export const HEADLINE_FONT_PUBLIC_PATH = `/fonts/${HEADLINE_FONT_FILE}`;

export function getHeadlineFontFilePath(): string {
  return join(process.cwd(), "public", "fonts", HEADLINE_FONT_FILE);
}
