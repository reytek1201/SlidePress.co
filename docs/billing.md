# SlidePress — Billing & Usage Tiers

Paid subscription tiers with credit-based usage enforcement, dual payment rails (Stripe web + RevenueCat mobile), and tier-gated features.

**GitHub epic:** [#14 — Billing & Usage Tiers](https://github.com/reytek1201/SlidePress.co/issues/14)

**Related:** [#1 — ElevenLabs narration & video export](https://github.com/reytek1201/SlidePress.co/issues/1) (video credit enforcement depends on Epic #1)

**Deferred:** Studio / Enterprise tier with higher video caps — reassess H2 2026 after usage data.

---

## Tier matrix (v1)

| Entitlement | Free | Creator ($19/mo) | Agency Pro ($49/mo) |
|-------------|------|------------------|---------------------|
| Campaigns | 3 lifetime | 15 / month | 50 / month |
| Slide regenerations | 10 lifetime | 30 / month | 100 / month |
| Video exports | 0 (blocked) | 5 / month | 15 / month |
| Brand workspaces | 1 | 3 | 15 |
| Reset cadence | Never | Monthly | Monthly |

**No unlimited entitlements.** Higher video usage is reserved for a future Studio tier.

---

## Architecture

```
Web browser  → Stripe Checkout  → Stripe webhook  ─┐
                                                    ├→ usage_balances (source of truth)
Capacitor app → RevenueCat IAP → RC webhook      ─┘
                                                    ↓
API route guards (generate-text, duplicate, regenerate, video, brands)
                                                    ↓
usage_events (audit log, append-only)
```

| Layer | Responsibility |
|-------|----------------|
| `usage_balances` | Per-user credits, tier, billing metadata |
| `usage_events` | Audit trail (existing table) |
| `utils/plan-limits.ts` | Tier cap constants |
| `utils/usage-limits.ts` | Read balances, assert limits, consume credits |
| Stripe webhooks | Web checkout fulfillment |
| RevenueCat webhooks | Mobile IAP fulfillment |
| `applyTierEntitlement()` | Shared helper — both webhooks call this |

**Enforcement is server-side only** on every costly API route. Never trust client-side credit checks.

---

## Database: `usage_balances`

Provisioned automatically on signup via trigger on `auth.users`.

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | UUID PK | FK → `auth.users` |
| `tier` | enum | `free`, `creator`, `agency` |
| `campaign_credits_remaining` | int | Decremented on create / duplicate |
| `regeneration_credits_remaining` | int | Decremented on slide regenerate |
| `video_credits_remaining` | int | Decremented on video export |
| `stripe_customer_id` | text | Nullable |
| `stripe_subscription_id` | text | Nullable |
| `revenuecat_app_user_id` | text | Nullable; usually = `user_id` |
| `current_period_start` | timestamptz | Paid tiers only |
| `current_period_end` | timestamptz | Paid tiers only |

**RLS:** users can `SELECT` their own row. No client `UPDATE` — only service role (webhooks + admin client).

**Atomic decrement:** Postgres function `consume_credit(user_id, credit_type)` with `SELECT … FOR UPDATE`.

### Free-tier defaults (on signup)

| Credit | Value |
|--------|-------|
| Campaigns | 3 |
| Regenerations | 10 |
| Video | 0 |

### Monthly refill (paid tiers, on renewal)

| Tier | Campaigns | Regens | Videos |
|------|-----------|--------|--------|
| creator | 15 | 30 | 5 |
| agency | 50 | 100 | 15 |

Free tier never refills. Paid tiers **hard reset** to caps (not additive).

---

## Platform routing

```typescript
isNativeAppRuntime()
  ? RevenueCat paywall (iOS / Android IAP)
  : Stripe Checkout Session
```

- **Web:** `POST /api/billing/create-checkout` → Stripe Checkout → `POST /api/webhooks/stripe`
- **Mobile:** RevenueCat Capacitor plugin → `POST /api/webhooks/revenuecat`
- **No Stripe links in the native app** (App Store / Play policy)
- **Restore purchases** button required on mobile

---

## API guards

| Action | Route | Credit |
|--------|-------|--------|
| Create campaign | `POST /api/generate-text` | campaign |
| Duplicate campaign | `POST /api/duplicate-campaign` | campaign |
| Regenerate slide | `POST /api/regenerate-slide` | regeneration |
| Video export | `POST /api/export-video` *(Epic #1)* | video |
| Add brand | brand create path | tier brand cap |

**Error contract:**

```json
{
  "success": false,
  "code": "LIMIT_EXCEEDED",
  "error": "…",
  "tier": "free",
  "upgradeUrl": "/settings/usage"
}
```

---

## Stripe (web)

### Dashboard setup

1. Products: `SlidePress Creator`, `SlidePress Agency Pro`
2. Prices: $19/mo, $49/mo (recurring)
3. Enable Customer Portal (manage / cancel)

### Environment variables

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_CREATOR=
STRIPE_PRICE_AGENCY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### Webhook events

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Link customer, set tier, refill credits |
| `invoice.paid` | Monthly refill on renewal |
| `customer.subscription.updated` | Tier change (upgrade / downgrade) |
| `customer.subscription.deleted` | Downgrade to free |

**Idempotency:** track processed event IDs; webhook replay must not double-refill.

---

## RevenueCat (mobile)

Defer until Stripe web is stable.

```bash
REVENUECAT_WEBHOOK_SECRET=
NEXT_PUBLIC_REVENUECAT_IOS_KEY=
NEXT_PUBLIC_REVENUECAT_ANDROID_KEY=
```

- `appUserID` = Supabase `user.id`
- Entitlements: `creator`, `agency`
- Products mirror Stripe pricing

---

## Implementation phases

| Sprint | Scope | Exit criteria |
|--------|-------|---------------|
| **A** | Schema + limits refactor | Free tier enforces 3 lifetime campaigns |
| **B** | Stripe web | Test card upgrades to Creator |
| **C** | Brand gating | Brand cap enforced per tier |
| **D** | Video credits | Blocked on Epic #1 MVP |
| **E** | RevenueCat mobile | Sandbox IAP on TestFlight |
| **F** | QA + launch docs | Full test matrix passes |

### Sub-issues (Epic #14)

| # | Issue | Sprint |
|---|-------|--------|
| 15 | usage_balances schema + signup trigger | A |
| 16 | tier config + refactor usage-limits.ts | A |
| 24 | monthly credit refill job | A |
| 18 | Stripe Checkout + webhooks | B |
| 19 | Settings upgrade UI (web) | B |
| 17 | brand count tier gating | C |
| 20 | block video features on free tier | C |
| 21 | video export credit decrement | D *(Epic #1)* |
| 22 | RevenueCat SDK + mobile paywall | E |
| 23 | App Store + Play subscription setup | E |
| 25 | QA checklist + launch docs | F |

[Epic #14 — Billing & Usage Tiers](https://github.com/reytek1201/SlidePress.co/issues/14)

---

## Unit economics

Approximate variable costs (from `docs/client-features.md`):

- ~$0.45–0.65 per 5-slide campaign (text + images)
- ~$0.10–0.30 per video export (TTS + render)
- ~$0.08–0.15 per slide regeneration

### Worst case (100% utilization)

| Tier | Max COGS | Revenue | Web gross margin |
|------|----------|---------|------------------|
| Free | ~$2.50 | $0 | −$2.50 (CAC) |
| Creator | ~$13.25 | $19 | ~30% |
| Agency | ~$47.00 | $49 | ~4% |

### Typical (~35% utilization)

| Tier | Est. COGS | Web margin |
|------|-----------|------------|
| Creator | ~$5 | ~74% |
| Agency | ~$16 | ~67% |

Agency is intentionally tight at max utilization. Monitor early subscribers; bump price or lower caps if needed before launching Studio tier.

---

## Testing checklist

- [ ] New signup → free defaults (3 / 10 / 0 credits)
- [ ] 4th campaign blocked with upsell
- [ ] Stripe upgrade Creator → 15 / 30 / 5 credits
- [ ] Stripe upgrade Agency → 50 / 100 / 15 credits
- [ ] Cancel subscription → free tier (no clawback of consumed credits)
- [ ] Brand limits: 1 / 3 / 15 per tier
- [ ] Period reset refills paid credits
- [ ] Native IAP sandbox (TestFlight)
- [ ] Restore purchases
- [ ] Webhook idempotency (replay same event)
- [ ] Cross-platform: web subscription visible in native app

---

## Future: Studio tier (H2 2026)

Revisit after ~3 months of `usage_events` + conversion data. Candidates:

| Studio (~$99/mo) | Possible entitlements |
|------------------|----------------------|
| Campaigns | 100 / month |
| Videos | 40–50 / month |
| Brands | 30 |
| Extras | custom voice, priority render, team seats |

---

*Last updated: June 2026*
