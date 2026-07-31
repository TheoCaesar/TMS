# Handoff — Tourism Management System Frontend

Snapshot of exactly where things stand, for picking this up cold (a new
session, a new person, or future-you). For the full chronological story
of *why* each decision was made, see [`DEVELOPMENT_LOG.md`](DEVELOPMENT_LOG.md)
— this file is the "state now," that file is the "how we got here."

**Last updated:** 2026-07-31

---

## TL;DR

React + TypeScript + Tailwind v4 SPA, built to match a Figma prototype
("Voyago") pixel-for-pixel where a screen exists, and wired to a live
backend (`https://tms-api-m7yf.onrender.com`) wherever the API actually
supports it. The Figma design shows a full 6-module tourism app (POI,
Flights, Hotels, Food, Transport, Emergency); **the real backend only
supports one bookable concept: Tours** (destinations, tours, departures,
bookings, Paystack payments, reviews, auth/loyalty). That mismatch drives
most of the architecture — see "Scope reality" below before building
anything new.

All work happens on the `dev` branch. `main` has one commit: the initial
scaffold baseline. Never commit large batches — one focused commit per
feature/fix, pushed to `origin/dev` only when the user asks.

## Right now

- **Branch:** `dev`, 2 commits ahead of `origin/dev` (not pushed —
  push only when asked). `main` is untouched since the initial scaffold.
- **Build health:** `npx tsc -b --noEmit`, `npm run lint` (oxlint), and
  `npm run build` all pass clean as of the last commit.
- **No blocking bugs in the frontend itself.** The blockers that exist
  are all backend-side (see below).

## How to run it

```bash
npm install
npm run dev          # http://localhost:5173 (or next free port)
npx tsc -b --noEmit   # type-check
npm run lint          # oxlint
npm run build         # production build (also type-checks)
```

No `.env` file is required — `src/lib/api/client.ts` falls back to the
live backend URL automatically. Only create one (copy `.env.example`) if
you need to point at a different backend.

**Dev-only CORS workaround:** the live API sends no CORS headers at all
(see "Known backend issues"), so in dev, API calls are proxied through
Vite (`vite.config.ts` → `server.proxy['/api']`) to sidestep it
server-to-server. This does **not** work in a production build — that
needs a real fix on the backend or a same-origin reverse proxy in front
of both apps.

## Scope reality — read this before building a new screen

The Figma prototype (`figma.com/make/DbokKeXxurSiFhZQSQ8aJH`, "Voyago
mobile app prototype") shows six service modules matching the SRS:
Explore/POI, Flights, Hotels, Food, Transport, Emergency. **The live API
(`GET /api/docs-json` for the full OpenAPI spec) only implements Tours** —
Destinations, Tours + Departures, Bookings, Paystack Payments, Reviews,
plus Auth/Users/Loyalty. There is no Flight, Accommodation, Restaurant,
Transport-dispatch, or Emergency-facility endpoint anywhere in the API.

Working convention established across every screen so far:
- Build the UI to match Figma (or a user-supplied screenshot) as closely
  as possible.
- Wire it to real data wherever the API actually has that data.
- Where Figma shows something with no backing data (e.g. Explore's
  Attractions/Restaurants/Hotels category filters, or per-type accent
  colors on booking cards), render the UI element but show an honest
  empty/inert state — **never fabricate mock data** to fill a gap.
- Where a whole module has zero backend (Flights, Hotels, Food,
  Emergency), it's UI-only with no data layer at all, not even mocked.

## Route inventory

| Route | Status | Notes |
| --- | --- | --- |
| `/` (Home) | ✅ Real data | Quick Access grid, Featured Destinations from `GET /destinations` |
| `/explore` | ✅ Real data | Tours + Destinations; category pills only "All" populated |
| `/explore/:slug` (Tour Detail) | ✅ Real data + booking | Full booking flow: select departure → seats → Book Now |
| `/bookings/:reference` (Booking Detail) | ✅ Real data + payment | Pay with Paystack, manual verify fallback |
| `/payments/callback` | ✅ Built | Handles Paystack redirect; best-guess URL, see below |
| `/login`, `/register` | ✅ Real, verified E2E | Register matches a captured Figma screen |
| `/trips` (My Trips / "My Bookings") | ⚠️ Built, unverified happy path | Real data via `GET /bookings/me`, but that endpoint 500s (see below) — only the error/retry state has been visually confirmed |
| `/profile` | ✅ Real data, verified E2E | Header + settings menu from a user screenshot |
| `/profile/personal-info` | ✅ Real data + save, verified E2E | The one settings row with backend support (`PATCH /users/me`) |
| `/flights` | ✅ Built from screenshot | Trip type toggle, From/To/dates/passengers/cabin form, Popular Routes — matches user-supplied screenshot. UI-only, no backend for this module |
| `/flights/results` | ✅ Built from screenshot | "Flight options" screen — 4 static flight offer cards (matches design), filter pills, Select buttons. UI-only, results don't reflect the (also inert) search form inputs |
| `/hotels` | ✅ Built from screenshot | "Find a Place to Stay" search + category pills + hotel list. UI-only, no backend for this module |
| `/hotels/:slug` | ✅ Built from screenshot | Full detail for Labadi Beach Hotel (matches "Hotel details" screenshot: amenities, room picker, reviews, sticky Reserve bar). Coconut Grove Hotel only had list-view data in the screenshot, so its detail page shows an honest "no rooms/reviews yet" empty state rather than invented data |
| `/food` | ✅ Built from screenshot | "Food & Drinks" search, price/cuisine/dietary filters (cuisine filter is real, filtering the static list), View on Map, restaurant list. UI-only, no backend for this module |
| `/food/:slug` | ✅ Built from screenshot | Full detail for Asanka Local (matches "food-detail" screenshot: tags, Menu/Reserve/Reviews/Info tabs, menu sections, sticky Reserve a Table bar). The other 3 restaurants only had list-view data, so their Menu tab (and all tabs for them) shows an honest empty state |
| `/transport` | 🟡 UI built, no data | Matches a captured Figma screen; no backend to wire, no mock data per user's call |
| `/emergency` | ✅ Built from screenshot | SOS trigger, Quick Actions grid, Nearest Medical Facilities list — matches user-supplied screenshot. UI-only, no backend for this module |
| `/bookings` (list, Calendar nav tab) | 🟡 Placeholder, unresolved | See "Open questions" — may or may not be a distinct screen from `/trips` |

## Known backend issues (not fixable from the frontend)

1. **CORS is unconfigured** — zero `Access-Control-Allow-Origin` headers
   on any response, even with a browser `Origin` set. Blocks every
   browser-based caller, on any origin, in production. Confirmed with
   `curl -D -`. The dev Vite proxy is a workaround for local development
   only.
2. **`GET /bookings/me` reliably 500s**, even for an account with a real
   booking (confirmed via `curl` directly, not just in-app). Originally
   thought to be an empty-list edge case; it isn't. This blocks
   verifying `/trips`'s real card-rendering happy path.
3. **`POST /payments/initiate`** — was 500ing consistently, then
   succeeded once during testing (real redirect to a genuine Paystack
   test-mode checkout, correct amount/customer). Unclear if it's fixed
   or intermittent. Re-test before relying on it.
4. **Intermittent 503s** generally (Render free-tier cold starts) — the
   frontend already handles this gracefully via `useApiResource`'s
   loading/error/retry states; just don't be surprised by it.

## Test accounts (already created on the live backend)

These are real rows in the backend's database now (no delete-account
endpoint exists to clean them up):

| Email | Password | Notes |
| --- | --- | --- |
| `claude.integration.test@example.com` | `IntegrationTest123` | Earliest API-shape verification |
| `claude.ui.test@example.com` | `UiTestPass123` | First UI registration test |
| `claude.rxjs.test@example.com` | `RxjsTestPass123` | Has a real booking, reference `TUR-2026-0005` (Cape Coast Castle Heritage Tour, 1 seat, GHS 80.00, status PENDING). Full name currently "RxJS Updated User" from a live-edit test. Use this one for anything that needs an existing booking. |

## Architecture quick reference

- **API layer is Observable-based (RxJS)**, not Promise-based — this was
  an explicit user request. Every function in `src/lib/api/` returns
  `Observable<T>` and uses the `$` suffix convention (`login$`,
  `listTours$`, `createBooking$`, ...). `client.ts` uses `fromFetch` from
  `rxjs/fetch` specifically so unsubscribing cancels the underlying
  request. `src/hooks/useApiResource.ts` is the shared
  fetch-with-loading/error/retry hook every data-driven page uses —
  reach for it before writing a new one-off fetch pattern.
- **`src/types/` vs `src/lib/api/types.ts`**: the former is the SRS's
  full 6-module aspirational model (kept for documentation/reference);
  the latter is what the live API actually returns. Some names
  deliberately collide (`UserRole`, `BookingStatus`) — import from the
  one that matches what you're building against.
- **Design tokens** live in `src/index.css` under `@theme` — `brand`
  (teal, primary actions), `ink` (near-black headings), `accent` (amber,
  ratings/loyalty), `danger` (red, destructive/emergency), plus
  `--radius-card`. Sampled from Figma screenshots, not pixel-verified
  against live computed styles.
- **Layout**: `AppLayout` is mobile-first (`max-w-md`), widening at
  `md:`/`lg:` into a top-nav desktop layout (`TopNav` replaces
  `BottomNav`). `transform-gpu` on the layout root makes it the
  containing block for `position: fixed` children (nav, SOS button,
  sticky booking bar) so they stay anchored to that column at any
  breakpoint instead of the full viewport.
- **Known gap, not yet fixed**: no shared auth state. Each
  `useCurrentUser()` call fetches independently on its own mount, so
  `TopNav`'s user chip doesn't update after an in-app login/register
  without a full page reload (a fresh navigation works fine). Worth
  fixing with a context/store before this matters for real users.

## Open questions (need the user, not guessable)

- **What is `/bookings` (Calendar-icon nav tab) supposed to show?** A
  screenshot titled "My Bookings" turned out to actually be the `/trips`
  screen (confirmed with the user — its own bottom nav highlighted "My
  Trips"). `/bookings` remains an unresolved placeholder with no Figma
  evidence of what it's for, if anything distinct.
- **Figma reference still needed for:** none of the 6 SRS modules — all
  have at least a built screen now. Remaining open item is `/bookings`
  (see above).
  Ask the user for screenshots or try the live Figma prototype (see
  below) before designing these from scratch.

## Getting more Figma reference

Live prototype: `https://www.figma.com/make/DbokKeXxurSiFhZQSQ8aJH/Voyago-mobile-app-prototype?code-node-id=0-9&p=f&fullscreen=1`
(add `&preview-route=%2Fsome-route` to deep-link a screen). It's flaky —
loads hang unpredictably. Established approach: try it once or twice via
browser automation; if it hangs, ask the user for a screenshot of that
specific screen instead of retrying indefinitely. The user has also been
pasting screenshot file paths directly (e.g.
`C:\Users\nexa\Pictures\Screenshots\*.png`) — just `Read` those directly,
no browser needed.

Note: the mouse wheel doesn't reliably scroll the Figma prototype's
iframe — drag the visible right-side scrollbar thumb instead
(`left_click_drag`).

## Immediate next steps (in rough priority order)

1. Resolve the `/bookings` open question above.
2. Re-test `POST /payments/initiate` and `GET /bookings/me` — if fixed,
   verify `/trips`'s real card rendering (currently unconfirmed) and
   re-confirm the Paystack payment flow.
3. Consider shared auth state (see "Known gap" above).
