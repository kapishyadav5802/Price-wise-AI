# ⚡ WarGrid — Play. Compete. Conquer.

A mobile-first (9:16) esports platform for **BGMI scrims & tournament booking**: discover battles, register a squad, pay, get your room ID when it drops, and watch your results climb the leaderboard.

Built as a fully interactive React 18 + Vite prototype — all data is seeded in-memory, every flow is wired end to end, no backend required.

---

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production bundle in dist/
npm run preview  # serve the built bundle
```

The app renders inside a 402×874 device frame that auto-scales to any window; on small screens it goes full-bleed.

## Running it as an app

WarGrid ships as **one codebase, three shells**:

| Shell | How | What you get |
| --- | --- | --- |
| Mobile web | open the URL | responsive 9:16 arena in a device frame on desktop, full-bleed on phones |
| **Installed PWA** | browser menu → *Add to Home screen* / *Install app* | own window, home-screen icon + splash, offline cache, app shortcuts (Book / Matches / Wallet), safe-area aware edge-to-edge UI |
| **Native Android** | Capacitor WebView shell | real APK: branded launcher icons & splash, dark immersive status bar, hardware back button, haptic feedback on key taps |

### Install the PWA

1. Serve a production build (`npm run build && npm run preview`) — the service worker and install prompt only run outside the dev server.
2. Android/Chrome: ⋮ menu → **Add to Home screen** (or **Install app** when offered). iOS/Safari: Share → **Add to Home Screen**. Desktop Chrome/Edge: install icon in the address bar.
3. In-app, **Profile → Get the WarGrid app** offers the same install (Chromium) or shows per-platform steps (iOS, desktop, APK).
4. First visit in a plain browser tab shows a one-time install nudge; if WarGrid is opened inside an embedded preview frame (browsers block install prompts in iframes) a blue banner offers a one-tap escape into a real tab.

Offline: the app shell, icons and fonts are precached; hashed build assets are cached on first use; navigations fall back to the cached shell when the network dies.

### Build the Android app

```bash
npm run app:android     # build web -> sync into android/ -> open Android Studio
npm run app:build-apk   # or headless: gradlew assembleDebug (needs Android SDK + JDK 21)
```

The generated `android/` project is committed and pre-branded: `com.wargrid.esports`, WarGrid launcher icons (all densities + adaptive foreground), arena splash screens, dark `#04050a` theme/status bar. `capacitor.config.json` holds the app id, splash and status-bar config.

Native-only behaviour (loaded exclusively inside the WebView, zero cost on web): dark immersive status bar, splash handover, Android hardware back → in-app router (sheets close first), and haptics on CTA / pay / nav taps via `@capacitor/haptics`.

### Rebranding the icons

```bash
npm i -D sharp
node tools/gen-icons.cjs          # regenerates public/icons/* (PWA + store + mipmaps + splash)
node tools/sync-android-art.cjs   # copies/resizes them into android/app/src/main/res
```

Both scripts are pure SVG → PNG (the mark is drawn from the same paths as the in-app `LogoMark`), so there are no binary design assets in the repo.

## The loop

`discover → book → pay → confirm → room ID released → play → results → prize credited → leaderboard`

Deep links work for every screen (`#/home`, `#/event/t1`, `#/booking/t1`, `#/matches`, `#/organizer`, `#/admin`, …) and the browser back button follows the in-app navigation stack.

## Screens

| Area | Screens |
| --- | --- |
| Player | **Home** (live ticker, featured tournaments, upcoming scrims, search + filters), **Scrims**, **Tournaments**, **Event detail** (schedule, prize split, rules, registered teams, organizer), **Booking** (7-step flow), **My Matches** (room access, results, points), **Match detail**, **Teams** (squads, members, captain, invites), **Leaderboard** (players/teams, kills, points, earnings), **Wallet** (balance, add money, withdraw, history), **Notifications**, **Profile** |
| Organizer | Create scrims/tournaments (fees, prize, slots, banner art, schedule), manage teams & participants, **release room ID/password**, publish results & pay prizes, earnings dashboard |
| Admin | User management, organizer verification, tournament approvals, payments/escrow, disputes, reports, banned users, moderation actions |

### Booking flow

1. **Review** — entry fee, slots left, rules acceptance (full lobbies route to a waitlist with live queue position)
2. **Select squad** — pick a team, play solo, or draft free agents
3. **Enter BGMI IDs** — validated for 9–12 digits and uniqueness across the roster
4. **Confirm members** — captain assignment, final roster review
5. **Pay** — UPI / card / wallet balance with insufficient-funds top-up
6. **Confirmation** — ticket with booking ID + barcode
7. **Match access** — room ID & password unlock automatically at release time (T‑30 min), then push into **My Matches**

## Design system

- **Palette** — near-black base (`#04050a`), electric blue `#2d7dff → #00d5ff`, neon yellow `#e8ff3a`, plus green/red/violet state tones
- **Type** — Orbitron (display), Chakra Petch (headings/labels), Inter (body)
- **Surfaces** — glassmorphism cards, procedural CSS battle banners (`.art-1 … .art-8`, no image assets), hex/grid deco, gradient edges
- **Motion** — route transitions, staggered card entry, count-up stats, live countdowns, skeleton-free optimistic sheets, toasts, tap-scale micro-interactions
- **Primitives** (`src/ui.jsx`) — `Art, Logo, Avatar, Btn, CtaButton, Badge, LiveBadge, Chip, Progress, Countdown, CdInline, CountUp, SearchBar, SectionHead, StatTile, EmptyState, Field, Input, Select, Textarea, Toggle, Segmented, Tabs, InfoRow, Sheet, ScreenHeader, Money, SlotMeter, ArtPicker, MapChip, TimeAgo, WhenLine`
- Sheets portal into a dedicated `.overlay-root` layer so they pin to the device screen instead of scrolling with page content

## Architecture

```
main.jsx              entry
index.html            fonts, theme colour, favicon
vite.config.js        dev server (0.0.0.0:3000, preview-host friendly)
src/
  App.jsx             Stage (responsive device frame) + Phone shell: status bar,
                      router, bottom nav, FAB, toasts, overlay host
  store.jsx           single WarGrid context: clock, route stack, all mock state
                      and mutations, toasts, sheets, live-match simulation
  data.js             seed data (organizers, tournaments, scrims, teams, bookings,
                      wallet, notifications, leaderboards, admin queues) — all
                      timestamps are relative to load time so the app always has
                      live, upcoming and completed events
  ui.jsx              component primitives
  icons.jsx           ~83 hand-drawn stroke glyphs + logo mark
  overlay.jsx         portal context for sheets
  components/         EventCards.jsx, Filters.jsx
  screens/            14 screens
  styles/             base.css (tokens, frame, nav, keyframes) +
                      components.css (component library)
public/               manifest.webmanifest, sw.js (offline shell), icons/* (generated)
android/              committed Capacitor project (com.wargrid.esports), pre-branded
tools/                icon + splash generators (SVG -> PNG via sharp)
capacitor.config.json native shell config (app id, splash, status bar)
legacy/               archived pre-WarGrid files (not part of the build)
```

**State** — `useWG()` exposes the clock, navigation (`navigate / back / goTab / resetTo`), and every domain mutation: `bookEvent, joinWaitlist, cancelBooking, addMoney, withdraw, createTeam, addMember, removeMember, setCaptain, inviteTeammate, createOrgEvent, releaseRoom, updateResults, toggleParticipant, adminAct, approveEvent, rejectEvent, verifyOrganizer, banUser, resolveDispute, notify, toast, openSheet…`

**Live simulation** — a ticking clock drives countdowns, match status (`live / soon / open / full / completed`), kill-feed updates and room releases, so the UI moves on its own.

## Notes

- Everything is mock data: payments, room IDs and prize credits resolve instantly with simulated processing states — swap `store.jsx` mutations for API calls to go live.
- `npm test` runs a production build as a CI smoke gate.
