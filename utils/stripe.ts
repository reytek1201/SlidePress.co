import Stripe from "stripe";
import { getPlanLabel } from "@/utils/plan-limits";
import type { Tier } from "@/utils/plan-limits";

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

/** SlidePress brand tokens — matches app/globals.css */
const SLIDEPRESS_PRIMARY = "#f97316";
const SLIDEPRESS_BACKGROUND = "#09090b";

/** Per-session Checkout branding (does not change account-wide Stripe defaults). */
export function getCheckoutSessionBranding(
  appUrl: string,
  tier: Extract<Tier, "creator" | "agency">,
): Pick<Stripe.Checkout.SessionCreateParams, "branding_settings" | "custom_text"> {
  const logoUrl = `${appUrl}/brand/logo.png`;
  const planLabel = getPlanLabel(tier);

  return {
    branding_settings: {
      display_name: "SlidePress",
      background_color: SLIDEPRESS_BACKGROUND,
      button_color: SLIDEPRESS_PRIMARY,
      border_style: "rounded",
      logo: { type: "url", url: logoUrl },
      icon: { type: "url", url: logoUrl },
    },
    custom_text: {
      submit: {
        message: `Subscribe to SlidePress ${planLabel}. Manage or cancel anytime from Settings.`,
      },
    },
  };
}

const PORTAL_CONFIG_METADATA_KEY = "app";
const PORTAL_CONFIG_METADATA_VALUE = "slidepress";

function resolveStripeProductId(
  product: string | Stripe.Product | Stripe.DeletedProduct,
): string {
  return typeof product === "string" ? product : product.id;
}

/**
 * Returns a SlidePress-specific Customer Portal configuration ID.
 * Uses STRIPE_PORTAL_CONFIGURATION_ID if set; otherwise finds or creates
 * a dedicated configuration (separate from the account default / other apps).
 */
export async function getSlidePressPortalConfigurationId(
  stripe: Stripe,
): Promise<string> {
  const configured = process.env.STRIPE_PORTAL_CONFIGURATION_ID;
  if (configured) return configured;

  const existing = await stripe.billingPortal.configurations.list({ limit: 100 });
  const match = existing.data.find(
    (config) => config.metadata?.[PORTAL_CONFIG_METADATA_KEY] === PORTAL_CONFIG_METADATA_VALUE,
  );
  if (match) return match.id;

  const appUrl = getAppUrl();
  const creatorPriceId = getStripePriceId("creator");
  const agencyPriceId = getStripePriceId("agency");

  const [creatorPrice, agencyPrice] = await Promise.all([
    stripe.prices.retrieve(creatorPriceId),
    stripe.prices.retrieve(agencyPriceId),
  ]);

  const created = await stripe.billingPortal.configurations.create({
    name: "SlidePress",
    metadata: { [PORTAL_CONFIG_METADATA_KEY]: PORTAL_CONFIG_METADATA_VALUE },
    default_return_url: `${appUrl}/settings/usage`,
    business_profile: {
      headline: "Manage your SlidePress subscription",
      privacy_policy_url: `${appUrl}/privacy`,
      terms_of_service_url: `${appUrl}/terms`,
    },
    features: {
      customer_update: {
        enabled: true,
        allowed_updates: ["email", "name"],
      },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: {
        enabled: true,
        mode: "at_period_end",
      },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["price"],
        products: [
          {
            product: resolveStripeProductId(creatorPrice.product),
            prices: [creatorPriceId],
          },
          {
            product: resolveStripeProductId(agencyPrice.product),
            prices: [agencyPriceId],
          },
        ],
      },
    },
  });

  return created.id;
}
