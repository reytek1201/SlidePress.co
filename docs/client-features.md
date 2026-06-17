# SlidePress — Product Features

**Turn a topic into post-ready carousel campaigns — and soon, Reels-ready video — in minutes.**

SlidePress is a marketing automation app for creators and small teams who need social content fast: slide copy, AI-generated visuals, voiceover scripts, platform captions, and one-click export. No design tool juggling. No blank-page syndrome.

**Live at:** [slidepress.co](https://www.slidepress.co)

---

## Who it's for

- Solo founders and marketers shipping organic social content
- Agencies and brands running **TikTok, Instagram carousels, Reels, and YouTube Shorts** from the same campaign
- Teams managing **multiple brands or clients** with separate kits, products, and campaigns
- Anyone who wants **topic → slides → images → captions → publish** in one workflow — with **AI-narrated video** on the roadmap

---

## What you can do today

### Create a campaign

- Enter a **topic or pain point**
- Choose **aspect ratio**: 4:5 (feed/carousel) or **9:16 (Reels/Shorts/TikTok)** — the format we optimize for future video export
- Choose **slide count**: 3, 5, or 7 slides
- Optionally upload **product, style, and logo** reference images to steer copy and visuals
- **Brand workspaces** — each brand has its own reference images, products, and campaigns; switch brands from the campaigns header when you manage more than one
- **Instant redirect** to the campaign workspace — a waiting screen runs while Gemini writes slide scripts (usually 15–30 seconds)
- **Retry** if text generation fails, with a clear error message

**Desktop:** full create form at **`/new`** (New campaign in nav) — redirects straight to workspace on submit.

**Mobile:** tap the **+** button to open a native-style **bottom sheet** — slide-up form with scroll, backdrop dismiss, and redirect to workspace on success.

**Public site:** **`/`** is the marketing landing page (web only); **`/login`** for sign in and sign up (email, Google, or create account). The native app opens at **`/login`** — marketing is skipped.

### Public site & SEO

- **Marketing landing** at **`/`** — hero, features, workflow; logged-in users redirect to campaigns
- **SEO** — sitemap, robots.txt, Open Graph / Twitter cards, JSON-LD, custom OG image
- App routes (`/login`, `/campaigns`, workspace, etc.) use **`noindex`** so search focuses on the landing page

### App navigation

- **Shared app shell** when signed in — one consistent way to move around
- **Desktop:** top bar with SlidePress **logo**, Campaigns, New campaign, **Settings**
- **Mobile:** top bar (logo) + **bottom tab bar** with Campaigns, center **+** FAB, and **Settings**
- **Settings** (`/settings`) — account, brands, security, usage; sign out lives here
- **Campaigns list** is browse-only — tap a row to open; brand switcher on campaigns when you have multiple brands
- Logged-in mobile users land on **My campaigns**; create always via **+** or New campaign button (opens sheet)
- **Forgot password** on the sign-in screen sends a reset email

### Campaign workspace

- **Campaign progress strip** — Copy → Images → Captions → Export with checkmarks and live image count
- **Sticky Next step bar** — one primary action that adapts (generate images → captions → download zip + copy all)
- **Inline campaign rename** — edit title from the workspace header
- **Slides before Publish** — review copy and images first, then captions
- **Mobile workspace** — tabbed layout (Slides / Publish / Details), filmstrip, compact progress strip
- **Scroll-to-top** button when deep in the page (above mobile tab bar)
- View all slides with **text overlay** and **voiceover script** (written for natural spoken delivery)
- **Edit headlines** inline (up to 12 words per slide)
- **Copy voiceover** per slide to clipboard — ready for recording or future AI narration
- **Download a single slide image** without exporting the full zip
- **Carousel preview** — full-screen swipe through ready slides (tap image or “Preview carousel”)
- **Generate images** when ready — one click for the whole campaign
- Live **image progress** — “2 of 5 images ready” with realtime updates
- Metadata at a glance: **target audience**, **aspect ratio**, **slide count**, **brand**
- **Duplicate campaign** from the workspace header — reuse topic and references, fresh AI copy
- **Delete campaign** in a **Danger zone** at the bottom (confirm before permanent removal)

### Image generation

- Powered by **Fal Nano Banana 2** (Google Gemini Flash Image)
- Headline text is rendered **on the slide** as part of the creative
- Reference images (product/style/logo) are respected when uploaded
- **Production webhooks** on SlidePress.co — images queue and update live via Fal callbacks
- **Regenerate a single slide** without redoing the whole campaign
  - Quick feedback chips: Brighter, Minimal, Bold colors, Product larger, Different layout, Try again
  - Optional free-text notes for what to change
  - Updated headlines apply on the next regeneration

### Voiceover scripts (today)

Every slide includes a **voiceover script** — a natural spoken line Gemini writes alongside the on-slide headline. Today you can:

- **Review** scripts in the workspace alongside each slide
- **Copy** any script to clipboard for recording in CapCut, TikTok, or your DAW

Scripts are authored with **text-to-speech in mind** so they’re ready for the next phase: **AI narration and video export** (see Roadmap).

### Publish copy

- **Platform captions** for TikTok, Instagram, and YouTube Shorts
- Publish section **after slides** in the workspace
- One scrollable page with hooks, captions, hashtags (# formatted), and YouTube title
- **Copy all** (via Next step bar) or **copy one platform** to clipboard
- **Regenerate captions only** — updates publish copy without touching slide images

### Export

- **Download zip** when all slide images are ready (via Next step bar)
- **Download individual slide images** from each slide card (web)
- **Native app:** **Save to Photos** and **Share** per slide; **Save all to Photos** in the next step bar (with **Copy all captions** and optional zip)
- Includes in zip:
  - `slides/` — numbered slide images
  - `captions.txt` — all platform copy in one file (if captions were generated)

### Brands & settings

- **Brands** — each workspace has a name, reference kit (product / style / logo), and optional **products** (name, photo, description) for campaign context
- **Settings → Brands** — manage all brands; edit kit and products per brand
- **Campaigns header** — switch active brand, edit kit, add a brand (returns to campaigns when done)
- **Usage** — campaigns and slide regenerations this month with beta limits (default 10 campaigns, 30 regenerations; resets monthly)
- **Security** (native) — optional Face ID / fingerprint app unlock
- **Account deletion** — type `DELETE` to confirm; removes all campaigns, brands, usage data, and auth access

### Campaign management

- **My campaigns** list with preview thumbnails, format, and date — scoped to the active brand
- **Duplicate campaign** — from the workspace (not the list)
- **Delete campaign** — hidden in workspace Danger zone only

### Account & security

- Email sign-in via Supabase Auth
- **Google sign-in** on **`/login`** — OAuth via Supabase; redirects through **`/auth/callback`**
- **Apple sign-in** (native iOS) — Sign in with Apple sheet
- **Strong passwords** on sign up — 8+ characters with uppercase, lowercase, and a number
- **Forgot password** on the sign-in screen (including deep links in the native app)
- Your campaigns are private to your account (row-level security)
- Production auth configured for SlidePress.co domain

### Beta usage limits

- **10 campaigns per month** — enforced on create and duplicate
- **30 slide regenerations per month** — enforced when regenerating a slide image
- Limits shown in **Settings**; create form blocks when campaign cap is reached
- Server returns a clear error if a limit is hit mid-flow
- Tune limits with env vars `BETA_CAMPAIGNS_PER_MONTH` and `BETA_REGENERATIONS_PER_MONTH`

### Design & brand

- **SlidePress** dark UI — zinc background with orange primary actions
- **Brand logo** in nav, landing, login, favicon, and OG image (`public/brand/logo.png`)
- Orange gradient CTAs for generate/create actions
- Semantic greens/ambers/reds for success, progress, and errors
- Unified **page layout** — shared shell widths for marketing and app pages

---

## Typical workflow (today)

```
1. Visit slidepress.co → sign in → My campaigns
2. Pick a brand (or use your default) → New campaign
3. Enter topic + pick format + slide count (+ optional references)
4. Land on workspace → slide scripts + voiceover appear
5. Review copy → Generate images
6. Preview carousel → fix any slide (edit headline → regenerate)
7. Generate captions
8. Copy all or download zip / save slides to Photos
9. Post to TikTok, Instagram, YouTube
```

**Goal:** Fewest steps between idea and publish-ready assets.

### Workflow coming soon (narration & video)

```
… steps 1–7 unchanged …
8. Preview AI voice → export narration or create a Reel-ready MP4
9. Post video + paste caption — no CapCut assembly required
```

---

## Coming soon: AI narration & video export

SlidePress already writes **per-slide voiceover scripts**. The next major release adds **premium AI narration** (via **ElevenLabs**) and **video export** so 9:16 campaigns become post-ready Reels, Shorts, and TikToks — not just image carousels.

### What customers will get (phased rollout)

| Phase | Customer-facing capability |
|-------|----------------------------|
| **Voice preview** | Hear how each slide sounds with a curated AI voice before you export |
| **Audio export** | Download narration as MP3s (per slide + full read-through) for editors who still want CapCut |
| **Video export** | One-click **MP4** — slides, motion, and AI narration stitched for vertical video |
| **Polish** | Presets (Quick Reel, silent + captions), optional **brand voice**, burned-in captions |
| **Paid tiers** | Higher video limits, studio-quality voices, multiple brand voices |

### Why it matters (marketing angle)

- **Same campaign, more reach** — carousels for feed, video for algorithms that favor Reels and Shorts
- **Scripts already written** — voiceover is generated with your slides; video completes the loop
- **Sounds human** — ElevenLabs-class voices, not robotic platform TTS
- **9:16 by design** — campaigns created for vertical video export from day one
- **Agency-ready** — multiple brands, consistent voice and motion per client

### What we’re not promising in v1 of video

- Full voice library browser (we’ll curate a small set of great voices)
- Direct upload to TikTok / Instagram / YouTube (export MP4 + captions; you post)
- 4:5 video before 9:16 Reels quality is solid

*Internal tracking: GitHub epic [#1](https://github.com/reytek1201/SlidePress.co/issues/1) (ElevenLabs: Narration & Video Export).*

---

## Roadmap

Phased delivery for SlidePress. **Mobile today** = responsive web + **native iOS/Android** via Capacitor (same Next.js app on Vercel).

### Shipped ✅

| Phase | Focus |
|-------|--------|
| **1** | Workspace clarity — progress strip, next-step bar, inline rename, async text generation, app nav |
| **2** | Publish handoff — carousel preview, copy voiceover, single-slide download |
| **3** | Brand library + **Settings** (account, brand assets, usage display) |
| **4** | Ship & protect — landing, SEO, usage limits, mobile polish, Google auth, account deletion, prod deploy |
| **5** | **Mobile app (Capacitor)** — native auth, share/save to Photos, push when images ready, biometric lock, settings hub |
| **5+** | **Brand workspaces** — multi-brand kits, products, campaigns switcher, unified settings UX |

### Phase 5 — Mobile app (Capacitor) ✅ (largely complete)

| Step | Deliverable |
|------|-------------|
| **5.1 Scaffold** ✅ | Capacitor iOS + Android loading production — see `docs/capacitor.md` |
| **5.2 Auth** ✅ | Google + Apple OAuth (deep link), password reset deep links |
| **5.3 App shell** ✅ | Icons + splash, status bar (SlidePress dark + orange) |
| **5.4 Native affordances** ✅ | Share sheet + Save to Photos (per slide, carousel, save all) |
| **5.5 Beta distribution** 🚧 | TestFlight + Play internal testing — see `docs/beta-release.md` |
| **5.6 Push notifications** ✅ | Opt-in alerts when all campaign images finish |

**Mobile UX:**

| Deliverable | Status |
|-------------|--------|
| Tabbed campaign workspace (Slides / Publish / Details) | ✅ |
| Filmstrip + inline generation feedback | ✅ |
| Mobile settings hub + sub-pages | ✅ |
| Face ID / biometric app unlock + Keychain session | ✅ |
| Offline connectivity screen (native) | ✅ |
| Privacy + Terms + Settings → About | ✅ |
| Brand switcher + per-brand campaigns | ✅ |

### Phase 6 — Narration, video & scale *(in progress / planned)*

**6A — ElevenLabs narration & video** *(active epic)*

1. Foundation — server-side TTS, voice catalog, usage metering  
2. Voice preview in workspace  
3. Audio export (narration ZIP)  
4. Video MVP — slides → MP4 (9:16, AI voice, motion)  
5. Polish — presets, brand voice, burned-in captions  
6. Scale — Stripe tiers, video limits, monitoring  

**6B — Business scale**

- **Usage tiers & billing** — paid plans with higher caps (Stripe)
- **Direct platform posting** — optional upload to TikTok / Instagram / YouTube (higher complexity; later)

### Not planned for v1

- Full design editor (Canva-style)
- Unlimited free regenerations without metering
- Programmatic pixel-perfect logo placement (logo is AI-guided today)
- Delete from the campaigns list (destructive actions stay in workspace only)
- Separate React Native / Expo app (Capacitor is the mobile app strategy)

---

## Under the hood (for trust, not sales fluff)

| Layer | Technology |
|-------|------------|
| App | Next.js 16, React 19, Tailwind |
| Mobile | Capacitor — iOS + Android WebView shell |
| Hosting | Vercel (SlidePress.co) |
| Database & auth | Supabase (PostgreSQL + RLS) |
| Slide copy & voiceover | Google Gemini 2.5 Flash |
| Slide images | Fal.ai Nano Banana 2 |
| Platform captions | Google Gemini |
| Narration & video *(planned)* | ElevenLabs TTS + FFmpeg/Remotion render pipeline |
| Realtime | Supabase Realtime on slides & campaigns |

Approximate **variable cost per 5-slide campaign** today (images + AI text): **~$0.45–0.65** depending on regenerations. **Video export** (planned) adds roughly **~$0.10–0.30** per Reel (TTS + render) at beta scale. End-user pricing will include tier limits above these costs.

---

## One-line pitch

**Today:** Describe your offer once — get carousel slides, AI images with headlines, voiceover scripts, and platform captions ready to post.

**Soon:** Same campaign → **AI-narrated Reel** in one export. No second production pass.

---

## Elevator pitch (for sales / landing copy)

SlidePress turns a topic into a full social campaign: headlines on every slide, AI-generated visuals, spoken scripts, and captions for TikTok, Instagram, and YouTube. Creators post carousels today; **Reels-ready video with premium AI narration** is next — built on the voiceover you already get with every slide.

---

*Last updated: June 2026*
