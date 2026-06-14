# SlidePress mobile (Capacitor)

Native iOS and Android shells that load the production web app in a WebView.

**Default URL:** `https://www.slidepress.co` (configured in `capacitor.config.ts`)

The Next.js app stays on Vercel — no static export. Capacitor opens the live site.

---

## Prerequisites

### iOS (Mac only)

- Xcode (from the Mac App Store)
- Apple ID (simulator); Apple Developer account for device / TestFlight

### Android

- [Android Studio](https://developer.android.com/studio)
- JDK 17 recommended for Gradle (Capacitor 8 / Android Gradle Plugin)

---

## npm scripts

| Command | Action |
|---------|--------|
| `npm run cap:sync` | Copy web assets + config into `ios/` and `android/` |
| `npm run cap:ios` | Open the iOS project in Xcode |
| `npm run cap:android` | Open the Android project in Android Studio |

After changing `capacitor.config.ts`, run **`npm run cap:sync`**.

---

## First run

```bash
npm run cap:sync
npm run cap:ios      # Xcode → pick a simulator → Run
# or
npm run cap:android  # Android Studio → sync Gradle → Run emulator
```

The app should load SlidePress from production and behave like mobile Safari/Chrome.

**Important:** The Capacitor shell loads the **live web app** (default: production). UI changes such as hiding the mobile top bar only appear after that code is deployed, **or** when you point the shell at a local dev server (see below).

After changing `capacitor.config.ts`, run **`npm run cap:sync`**, then rebuild in Xcode/Android Studio so the custom user agent (`SlidePressApp/1`) is applied for native detection.

---

## Local web dev (optional)

Point the shell at your local Next.js server:

```bash
CAPACITOR_SERVER_URL=http://localhost:3000 npm run cap:sync
npm run dev          # in another terminal
npm run cap:ios
```

Use your machine’s LAN IP instead of `localhost` for a physical device.

---

## Project layout

| Path | Purpose |
|------|---------|
| `capacitor.config.ts` | App id, name, server URL |
| `capacitor-www/` | Fallback assets when offline (minimal) |
| `ios/` | Xcode project |
| `android/` | Android Studio / Gradle project |

**App ID:** `co.slidepress.app`

---

## Phase 5 roadmap

| Step | Status |
|------|--------|
| **5.1 Scaffold** | ✅ This setup |
| **5.2 Auth** | Deep links, Sign in with Apple |
| **5.3 App shell** | Splash, status bar, store icons |
| **5.4 Native affordances** | Share sheet, save to camera roll |
| **5.5 Beta** | TestFlight, Play internal testing |

See `docs/client-features.md` for full product roadmap.
