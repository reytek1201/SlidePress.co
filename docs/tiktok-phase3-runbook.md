# TikTok — Phase 3 runbook (audit & launch)

**Claude / AI context:** [`claude-project.md`](claude-project.md) · [`platform-posting.md`](platform-posting.md)

**Epic:** [#27 Direct Platform Posting](https://github.com/reytek1201/SlidePress.co/issues/27) · **Issue:** [#32 TikTok](https://github.com/reytek1201/SlidePress.co/issues/32)

**Status (June 2026):** OAuth, FILE_UPLOAD publish API, and **audit-compliant pre-publish UI** shipped. First TikTok app audit was **rejected for UX non-compliance** (single-tap post without required controls). Compliant flow is live on `main` — **resubmit with a new demo video** showing the full end-to-end publish experience.

**Business entity:** TikTok developer app under **KeyMacro LLC** / SlidePress product.

---

## Prerequisites

- [x] `platform_connections` migration applied (TikTok in platform check)
- [x] `platform_posts` migration applied (TikTok in platform check)
- [x] `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI` set on Vercel
- [x] Latest `main` deployed to `https://www.slidepress.co`
- [x] Privacy policy live with TikTok section (`/privacy`)
- [x] Audit-compliant publish UI (`campaign-tiktok-publish-panel.tsx`, `utils/tiktok/publish-settings.ts`)
- [ ] **New demo video recorded** after compliant UI ships (do not reuse pre-audit video)
- [ ] TikTok app audit resubmitted

---

## Sandbox constraints (unaudited app)

Until TikTok approves the app audit:

| Constraint | What to do |
|------------|------------|
| Posts are `SELF_ONLY` | Select **Only me** in privacy dropdown during demo |
| Account must be Private | In TikTok app: Profile → Menu → Settings and privacy → Privacy → **Private account** ON |
| 5-user / 24h cap | Use a dedicated test TikTok account for audit demos |
| `video.publish` scope | Grant posting permission on first publish (separate OAuth step from connect) |

After audit approval, creators can select public privacy levels and post without the private-account requirement.

---

## Required UX (audit checklist)

TikTok audits the **whole** publish flow. All items must be visible in the demo video.

| # | Requirement | Where in SlidePress |
|---|-------------|---------------------|
| 1 | Creator **nickname** (and avatar) shown before publish | Publish tab → TikTok section → “Posting to {nickname} (@username)” |
| 2 | **Posting eligibility** — block if creator cannot post | `creator_info` errors (rate limit, ban, empty privacy options) → red alert, publish disabled |
| 3 | **Video duration** vs `max_video_post_duration_sec` | Preview shows duration + max; blocks publish if over limit |
| 4 | **Privacy dropdown** — options from `privacy_level_options`, **no default** | “Select visibility” placeholder; publish disabled until selected |
| 5 | **Interaction toggles** — comment, duet, stitch; all off by default; greyed if disabled in TikTok app | Interaction settings checkboxes |
| 6 | **Music Usage Confirmation** consent line before publish button | “By posting, you agree to TikTok's Music Usage Confirmation.” |
| 7 | **Commercial content disclosure** — off by default; Your brand / Branded content sub-options with label prompts | Commercial content section |
| 8 | User selections passed to API | `privacy_level`, `disable_comment/duet/stitch`, `brand_organic_toggle`, `brand_content_toggle` |
| 9 | Video preview + editable title | Preview player + title textarea |
| 10 | Post visible on TikTok after publish | End demo in TikTok app on creator profile |

Reference: [TikTok Content Sharing Guidelines](https://developers.tiktok.com/doc/content-sharing-guidelines)

---

## Audit resubmission checklist

- [ ] Deploy latest `main` to production
- [ ] Confirm test TikTok account is **Private**
- [ ] Record new demo video using script below (screen recording + TikTok app at end)
- [ ] Video shows **manual** privacy selection (not pre-filled)
- [ ] Video shows interaction toggles and commercial disclosure section
- [ ] Video shows music consent text **before** tapping Post to TikTok
- [ ] Video ends with post **live on TikTok profile** (even if `SELF_ONLY` / only visible to account owner)
- [ ] Resubmit in [TikTok for Developers](https://developers.tiktok.com/) → your app → audit / review flow
- [ ] Attach updated demo video; do **not** reuse the pre-compliance recording

---

## Demo video script (full recording guide)

**Format:** Screen recording (1080p+, landscape or portrait — keep UI readable). No fast cuts through required controls. Total length: ~4–6 minutes.

**Test account prep (before recording):**

1. TikTok app → set account to **Private**
2. SlidePress → Settings → Connected accounts → TikTok connected
3. Have a campaign ready with: TikTok caption generated, 9:16 video export completed, not yet posted to TikTok
4. If first publish on this account/session, be ready to grant **posting permission** when prompted

---

### Scene 1 — Open SlidePress and navigate (0:00–0:45)

**On screen:** Browser or SlidePress native app → `https://www.slidepress.co`

**Narration (optional):** “This is SlidePress. Creators build social campaigns and post directly to TikTok from the Publish tab.”

**Actions:**

1. Sign in (if not already)
2. Open **My campaigns** → select a campaign that has TikTok caption + 9:16 video export
3. Tap **Publish** tab (or journey strip → Publish)
4. Scroll to the **TikTok** section
5. Expand TikTok if collapsed — show readiness checklist (caption ✓, video export ✓, connected ✓, posting permission ✓)

**Must be visible:** Campaign context, Publish tab, TikTok section header.

---

### Scene 2 — Connected account (0:45–1:15)

**On screen:** Settings → Connected accounts (quick detour OK) OR nickname line on publish form

**Narration:** “The user connects their own TikTok account in Settings. At publish time, SlidePress shows which account will receive the post.”

**Actions:**

1. (Optional) Show Settings → Connected accounts → TikTok connected with account label
2. Return to Publish tab → TikTok section
3. **Pause on:** “Posting to **{Creator Nickname}** (@username)” with avatar if shown

**Must be visible:** Creator nickname and @username from `creator_info` — not a generic “Post to TikTok” button alone.

---

### Scene 3 — Video preview and title (1:15–1:45)

**On screen:** TikTok publish form

**Actions:**

1. Show **video preview** player — play a few seconds
2. Point to **duration line** (e.g. “Duration: 32s (max 60s for this account)”)
3. Show **Title** field — scroll through pre-filled caption/hashtags
4. Edit a few characters in the title to prove it is user-editable

**Must be visible:** Preview, duration, editable title.

---

### Scene 4 — Privacy selection — no default (1:45–2:15)

**On screen:** Privacy dropdown

**Narration:** “Privacy has no default. The user must choose who can view the post.”

**Actions:**

1. Show dropdown on **“Select visibility”** (empty / no selection)
2. Show **Post to TikTok** button is disabled (or greyed) while privacy is unset
3. Open dropdown → show options (Public, Friends, Only me, etc. — whatever `creator_info` returns)
4. For sandbox demo: select **Only me** (`SELF_ONLY`)

**Must be visible:** Empty default state → manual selection.

---

### Scene 5 — Interaction settings (2:15–2:45)

**On screen:** Interaction settings checkboxes

**Narration:** “Comment, duet, and stitch are off by default. The user opts in. Options disabled in TikTok app settings appear greyed out.”

**Actions:**

1. Show all three checkboxes **unchecked**
2. If any are greyed/disabled, point to them briefly
3. Check **Allow comment** (and optionally one of duet/stitch if enabled for account)

**Must be visible:** Default-off state + at least one manual enable.

---

### Scene 6 — Commercial content disclosure (2:45–3:30)

**On screen:** Commercial content section

**Narration:** “Commercial disclosure is off by default. When enabled, the user indicates whether content promotes their own brand or a third party.”

**Actions:**

1. Show disclosure toggle **off** — publish can proceed without it (if other fields valid)
2. Turn disclosure **on**
3. Show hint if neither sub-option selected and publish blocked
4. Check **Your brand**
5. **Pause on prompt:** “Your photo/video will be labeled as 'Promotional content'”
6. (Optional) Also check **Branded content** → show “Paid partnership” label + updated consent line mentioning Branded Content Policy
7. For a simple demo, **Your brand only** is enough; uncheck branded content if it forces public-only privacy rules you do not need for sandbox

**Must be visible:** Toggle off by default, sub-checkboxes, promotional label prompt.

---

### Scene 7 — Music consent and publish (3:30–4:15)

**On screen:** Consent line + Post to TikTok button

**Narration:** “Before posting, the user sees TikTok's required music usage consent.”

**Actions:**

1. Scroll so this text is fully visible **above** the button:

   > By posting, you agree to TikTok's Music Usage Confirmation.

2. If branded content selected, show extended line with Branded Content Policy
3. Click **Post to TikTok**
4. Show uploading/processing state — keep page open
5. Show success message + **View on TikTok** link

**Must be visible:** Consent text immediately before button tap; upload progress; success state.

---

### Scene 8 — Proof on TikTok (4:15–5:00) **REQUIRED**

**On screen:** TikTok mobile app (same account)

**Narration:** “The post is live on the creator's TikTok profile.”

**Actions:**

1. Open TikTok app → go to **Profile**
2. Show the new video in the grid (may show lock/private icon for `SELF_ONLY` — that is OK for unaudited apps)
3. Tap the video → play it — confirm it matches SlidePress export
4. Hold on playing video for 3–5 seconds

**Must be visible:** Post on TikTok profile. **Do not end the recording before this step** — audit rejection often cites missing proof of live post.

---

### Scene 9 — Optional extras (if time)

- Show **Schedule for later** (Creator tier) — picker stores same publish settings
- Show publish blocked when video exceeds max duration (different campaign or trim message)
- Show disconnect TikTok in Settings

---

## Environment variables

```bash
# TikTok OAuth (Login Kit + Content Posting API)
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TIKTOK_REDIRECT_URI=https://www.slidepress.co/api/platforms/tiktok/callback
```

Scopes: `user.info.basic` (connect), `video.publish` (first publish grant).

---

## Key code paths

| Layer | Path |
|-------|------|
| Publish UI | `app/campaign/[id]/campaign-tiktok-publish-panel.tsx` |
| Form validation + API mapping | `utils/tiktok/publish-settings.ts` |
| `creator_info` + FILE_UPLOAD | `utils/tiktok/publish-video.ts` |
| Publish readiness API | `app/api/platforms/tiktok/publish-readiness/route.ts` |
| Publish API | `app/api/platforms/tiktok/publish/route.ts` |
| Scheduled cron | `utils/platforms/execute-platform-publish.ts` |

---

## After audit approval

1. Confirm public privacy levels appear in dropdown for public TikTok accounts
2. Test post with **Public** visibility from a non-private account
3. Update marketing copy — remove sandbox / private-account warnings where appropriate
4. Update `docs/launch-status.md` and `docs/client-features.md` sandbox notes

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `unaudited_client_can_only_post_to_private_accounts` | Set TikTok account to Private; select **Only me** |
| `spam_risk_too_many_posts` | Wait 24h or use fresh test account |
| `scope_not_authorized` | Grant posting permission again from Publish tab |
| Publish button disabled | Check privacy selected, title filled, commercial sub-options if disclosure on |
| Video too long | Re-export shorter Quick Reel or check `max_video_post_duration_sec` in UI |
