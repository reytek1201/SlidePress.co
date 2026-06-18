import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");

    _stripe = new Stripe(key, {
      apiVersion: "2023-10-16" as never,
      typescript: true,
    });
  }

  return _stripe;
}

/** Price IDs for each tier (from env). */
export function getStripePriceId(tier: "creator" | "agency"): string {
  const key =
    tier === "creator"
      ? process.env.STRIPE_PRICE_CREATOR
      : process.env.STRIPE_PRICE_AGENCY;

  if (!key) throw new Error(`STRIPE_PRICE_${tier.toUpperCase()} is not set`);
  return key;
}

/** Map a Stripe Price ID back to an app tier. */
export function tierFromPriceId(priceId: string): "creator" | "agency" | null {
  if (priceId === process.env.STRIPE_PRICE_CREATOR) return "creator";
  if (priceId === process.env.STRIPE_PRICE_AGENCY) return "agency";
  return null;
}

/** Stripe webhooks often send price as a string ID, not an expanded object. */
export function resolvePriceId(
  price: string | { id: string } | null | undefined,
): string | null {
  if (!price) return null;
  return typeof price === "string" ? price : (price.id ?? null);
}

/** Read tier from subscription/checkout metadata set during Checkout. */
export function tierFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
): "creator" | "agency" | null {
  const tier = metadata?.tier;
  if (tier === "creator" || tier === "agency") return tier;
  return null;
}

/** Resolve tier from price ID, falling back to metadata. Returns null if unknown. */
export function resolveTier(
  priceId: string | null,
  metadata?: Stripe.Metadata | null,
): "creator" | "agency" | null {
  if (priceId) {
    const fromPrice = tierFromPriceId(priceId);
    if (fromPrice) return fromPrice;
  }
  return tierFromMetadata(metadata);
}

/** App URL — used for Checkout success/cancel redirects. */
export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "https://www.slidepress.co"
  );
}
