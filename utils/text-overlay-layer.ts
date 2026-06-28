/**
 * Phase 1 gate: when enabled, Fal generates scene-only images (no baked-in headline).
 * Phase 2 overlay renderer must ship before enabling in production.
 *
 * Set TEXT_OVERLAY_LAYER or NEXT_PUBLIC_TEXT_OVERLAY_LAYER to "true" / "false".
 * When unset: enabled in non-production, disabled in production.
 */
export function isTextOverlayLayerEnabled(): boolean {
  const explicit = (
    process.env.TEXT_OVERLAY_LAYER ?? process.env.NEXT_PUBLIC_TEXT_OVERLAY_LAYER
  )?.trim();

  if (explicit === "true") {
    return true;
  }

  if (explicit === "false") {
    return false;
  }

  return process.env.NODE_ENV !== "production";
}
