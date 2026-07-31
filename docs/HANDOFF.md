# Handoff — Tourism Management System Frontend

Snapshot of exactly where things stand, for picking this up cold (a new
session, a new person, or future-you). For the full chronological story
of *why* each decision was made, see [`DEVELOPMENT_LOG.md`](DEVELOPMENT_LOG.md)
— this file is the "state now," that file is the "how we got here."

**Last updated:** 2026-07-31 (session 7 — dropped the dead Bookings tab, SOS moved into the nav bar)

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

- **Branch:** `dev`, ahead of `origin/dev` (not pushed — push only when
  asked). `main` is untouched since the initial scaffold.
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
server-to-server. **Socket.IO is proxied the same way**
(`server.proxy['/socket.io']`, with `ws: true` — without that flag the
connection silently stays stuck on long-polling instead of upgrading).
Neither proxy works in a production build — that needs a real fix on the
backend or a same-origin reverse proxy in front of both apps.

## Scope reality — read this before building a new screen

The Figma prototype (`figma.com/make/DbokKeXxurSiFhZQSQ8aJH`, "Voyago
mobile app prototype") shows six service modules matching the SRS:
Explore/POI, Flights, Hotels, Food, Transport, Emergency. **The live API
(`GET /api/docs-json` for the full OpenAPI spec) only implements Tours** —
Destinations, Tours + Departures, Bookings, Paystack Payments, Reviews,
plus Auth/Users/Loyalty, an **AI itinerary planner**, and image uploads.
There is no Flight, Accommodation, Restaurant, Transport-dispatch, or
Emergency-facility endpoint anywhere in the API.

Note that the AI planner is itself scoped to Tours: it plans around the
real `APPROVED` tours in the system, and any tour the model invents is
stripped server-side and downgraded to a non-bookable item. So it extends
the Tours vertical rather than filling any of the missing ones.

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
| `/` (Home) | ✅ Real data | Quick Access grid (Emergency removed — reachable via bottom nav SOS/TopNav instead), Featured Destinations from `GET /destinations`, Today's Deals (static design content, no deals backend exists) |
| `/explore` | ✅ Real data | Tours + Destinations; category pills only "All" populated |
| `/explore/:slug` (Tour Detail) | ✅ Real data + booking | Full booking flow: select departure → seats → Book Now |
| `/bookings/:reference` (Booking Detail) | ✅ Real data + payment | Pay with Paystack, manual verify fallback, Cancel booking (with inline confirm) for PENDING/CONFIRMED — verified end-to-end against the live API (PENDING → CANCELLED) |
| `/payments/callback` | ✅ Built | Handles Paystack redirect; best-guess URL, see below |
| `/login`, `/register` | ✅ Real, verified E2E | Register matches a captured Figma screen |
| `/trips` (My Trips / "My Bookings") | ⚠️ Built, unverified happy path | Real data via `GET /bookings/me`, but that endpoint 500s (see below) — only the error/retry state has been visually confirmed |
| `/itineraries` | ✅ Real data, verified E2E | AI trip planner. Generate form + saved list (`POST /itineraries/generate`, `GET/DELETE /itineraries`). Reached from Home's Quick Access |
| `/itineraries/:id` | ✅ Real data, verified E2E | Day-by-day plan grouped by morning/afternoon/evening; `bookable` items deep-link to `/explore/:slug` — followed in-browser through to a real bookable departure |
| `/profile` | ✅ Real data, verified E2E | Header + settings menu from a user screenshot |
| `/profile/personal-info` | ✅ Real data + save, verified E2E | The one settings row with backend support (`PATCH /users/me`) |
| `/flights` | ✅ Built from screenshot | Trip type toggle, From/To/dates/passengers/cabin form, Popular Routes — matches user-supplied screenshot. UI-only, no backend for this module |
| `/flights/results` | ✅ Built from screenshot | "Flight options" screen — 4 static flight offer cards (matches design), filter pills, Select buttons. UI-only, results don't reflect the (also inert) search form inputs |
| `/hotels` | ✅ Built from screenshot | "Find a Place to Stay" search + category pills + hotel list. UI-only, no backend for this module |
| `/hotels/:slug` | ✅ Built from screenshot | Full detail for Labadi Beach Hotel (matches "Hotel details" screenshot: amenities, room picker, reviews, sticky Reserve bar). Coconut Grove Hotel only had list-view data in the screenshot, so its detail page shows an honest "no rooms/reviews yet" empty state rather than invented data |
| `/food` | ✅ Built from screenshot | "Food & Drinks" search, price/cuisine/dietary filters (cuisine filter is real, filtering the static list), View on Map, restaurant list. UI-only, no backend for this module |
| `/food/:slug` | ✅ Built from screenshot | Full detail for Asanka Local (matches "food-detail" screenshot: tags, Menu/Reserve/Reviews/Info tabs, menu sections, sticky Reserve a Table bar). The other 3 restaurants only had list-view data, so their Menu tab (and all tabs for them) shows an honest empty state |
| `/transport` | ✅ Built from screenshot | Extended to match a fuller "Transport details" screenshot: Estimated Fare, Find a Driver, Available Drivers Nearby. No backend to wire, no mock data beyond the design's own content |
| `/transport/active-ride` | ✅ Built from screenshot | The design's own "View Active Ride (Demo)" preview screen (matches "find-a-driver" screenshot) — static map illustration, driver card, Chat/Call/Cancel. Cancel navigates back to `/transport`; Chat/Call are inert |
| `/emergency` | ✅ Built from screenshot | SOS trigger, Quick Actions grid, Nearest Medical Facilities list — matches user-supplied screenshot. UI-only, no backend for this module |

## Backend capabilities not yet used by the frontend

Reconciled against `docs/frontend-integration-guide.md` (the backend
team's integration doc — read that file for full details). The core
contract already matches what `src/lib/api/` implements (envelope,
pagination, base URL/`/api/v1` prefix, auth flow, `BookingStatus`
enum). Gaps found:

1. **AI Itinerary Planner is a real, working backend feature with zero
   frontend integration.** `POST /itineraries/generate` (+ list/get/
   delete) plans a real day-by-day trip grounded in actual APPROVED
   tours and deep-links bookable items via `tourId`/`tourSlug`. There
   is no `src/lib/api/itineraries.ts` — `src/types/itinerary.ts` is
   just the old pre-integration SRS placeholder model, unrelated to
   the real API shape. Biggest single opportunity here: a real,
   usable feature nobody's built UI for.
2. **No real-time updates.** The guide's whole booking→payment→
   confirmation flow is designed around two Socket.IO namespaces
   (`/bookings` for `booking.status_changed`, `/availability` for
   live seat counts) specifically so the frontend doesn't have to
   poll. No `socket.io-client` dependency exists in this repo — the
   current payment flow relies on the "manual verify fallback"
   instead (see known issue #3 below). Wiring the socket would
   directly clean up that exact pain point.
3. ~~Cancel-booking is half-wired.~~ **Fixed** — `BookingDetailPage.tsx`
   now has a Cancel booking action (inline "are you sure" confirm, no
   native dialogs) for PENDING/CONFIRMED bookings, calling the
   already-existing `cancelBooking$()`. Verified end-to-end against
   the live API with a real booking (PENDING → CANCELLED).
4. **Minor type mismatch.** `types.ts`'s `DepartureStatus` is
   `'SCHEDULED' | 'CLOSED' | 'CANCELLED'`; the guide's `Departure`
   shape only lists `'SCHEDULED' | 'CANCELLED'`. Worth confirming
   with the backend whether `CLOSED` is real or stale.

## Known backend issues (not fixable from the frontend)

Items 1 and 2 were **re-confirmed on 2026-07-31** — both still broken.

1. **CORS is unconfigured** — zero `Access-Control-Allow-Origin` headers
   on any response, even with a browser `Origin` set. Blocks every
   browser-based caller, on any origin, in production. Confirmed with
   `curl -D -` (`vary: Origin` *is* sent, so the server is evaluating the
   origin and rejecting it). The dev Vite proxy is a workaround for local
   development only.
2. **`GET /bookings/me` reliably 500s**, even for an account with a real
   booking (confirmed via `curl` directly, not just in-app). Originally
   thought to be an empty-list edge case; it isn't — it also 500s for
   every documented `status` filter value. This blocks verifying
   `/trips`'s real card-rendering happy path.
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
- **Real-time is Observables too** (`src/lib/api/socket.ts`). Both
  Socket.IO namespaces are wrapped as cold `Observable`s — nothing
  connects until subscribe, unsubscribing disconnects — so they drive
  straight from a `useEffect` and match the RxJS convention above.
  **Governing rule: sockets are an enhancement, REST is the source of
  truth.** Every consumer swallows socket errors; a dead socket must
  never blank a screen. Consumers today: `BookingDetailPage` (live
  `PENDING → CONFIRMED`) and `TourDetailPage` (live `seatsLeft`).
  *Known limitation:* the handshake uses whatever access token was
  current at connect time and won't itself trigger the REST refresh flow.
- **`apiRequest$` accepts `timeoutMs`** for calls expected to be slow.
  Only `generateItinerary$` sets one (120s) — the AI planner is
  synchronous and **measured at ~66s**, and browser `fetch` has no
  default timeout, so a hung request would otherwise spin forever.
  Surfaces as `ApiError(408)`.
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
- **Shared auth state** (`src/lib/auth.tsx` + `src/hooks/useAuth.ts`).
  `<AuthProvider>` wraps the app in `main.tsx` and owns the one
  `GET /users/me` for the whole session; `useAuth()` returns
  `{ user, loading, refresh, signOut }`. **Use it instead of fetching the
  profile in a page** — the old `useCurrentUser` hook (now deleted)
  fetched independently on every mount, so `TopNav` plus any page that
  also wanted the user fired two concurrent requests on every screen.
  Call `refresh()` after login/register or `PATCH /users/me`; the nav now
  updates in place with no reload (verified in a real browser). The
  context and hook are split across two files purely so `auth.tsx`
  exports only a component, which Fast Refresh requires.
- **Concurrent identical GETs are pooled** in `client.ts`
  (`shareInFlight$`). Two components asking for the same URL at the same
  time share one HTTP request. This is an in-flight pool, **not a
  response cache** — the entry is evicted the moment the response
  settles, so the next caller always gets fresh data. Only GETs are
  pooled (sharing a mutation would collapse two distinct intents), and
  requests with a `timeoutMs` opt out to keep their cancellation.
  *Trade-off:* a pooled GET no longer aborts at the network level when
  its last subscriber unsubscribes. The protection that matters is
  unaffected — `useApiResource` still unsubscribes, so a slow stale
  response can never write state.
- **On React StrictMode:** in dev, React deliberately mounts → unmounts →
  remounts every component. Before the GET pooling above, that aborted
  each initial request and issued a second one, which showed up in
  devtools as a red cancelled request followed by a real one — harmless
  and dev-only, but easy to misread as a failure-and-retry. The pool
  absorbs it: the remount re-attaches to the same in-flight request.
  StrictMode is deliberately kept on for its impure-render and
  missing-cleanup warnings.

## Open questions (need the user, not guessable)

- **Resolved (session 7):** the Calendar-icon "Bookings" tab was a dead
  placeholder duplicating `/trips` (a screenshot titled "My Bookings"
  turned out to actually be the `/trips` screen), and the backend has no
  endpoint shape that would make it a distinct feature (no cross-user
  booking listing, no "join a booking"). Removed the tab; SOS now sits in
  its old nav slot as a raised center button instead of floating over
  content — see `DEVELOPMENT_LOG.md` session 7 for the full rationale.
  This is an intentional, user-approved departure from the Figma bottom
  nav (which has 5 tabs including Calendar/Bookings).
- **Figma reference still needed for:** none of the 6 SRS modules — all
  have at least a built screen now.
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

## Known API-layer bugs (found 2026-07-31, not yet fixed)

Found while auditing against the backend integration guide; left alone
because that session was scoped to itineraries + sockets.

1. **`listMyBookings$` filter enum is wrong** (`src/lib/api/bookings.ts`).
   It types `status` as `BookingStatus` (`PENDING`/`CONFIRMED`/…), but the
   API only accepts `upcoming | completed | cancelled` — `?status=PENDING`
   returns a `400`. Harmless *today* only because `TripsPage` calls it with
   no argument and filters client-side; it would break the moment anyone
   passes the filter.
2. `verifyPayment$` returns `unknown` — the guide defines a real `Payment`
   shape (`providerRef`, `status`, `amountMinor`, `currency`).
3. `DepartureStatus` includes a `CLOSED` member the spec doesn't have.
4. **Reviews are dead code.** `listTourReviews$`/`createReview$` are written
   and exported but nothing calls them. `TourDetailPage` shows
   `ratingAvg`/`ratingCount` without ever listing the reviews behind them,
   and there's no way to review a `COMPLETED` booking. This is the largest
   remaining *already-supported* backend surface with no UI.

## Immediate next steps (in rough priority order)

1. Build the **Reviews UI** (see bug 4 above) — the API client is already
   written, so this is UI-only work against a working backend.
2. Re-test `POST /payments/initiate` and `GET /bookings/me` — if fixed,
   verify `/trips`'s real card rendering (currently unconfirmed) and
   confirm the live `PENDING → CONFIRMED` socket transition end-to-end
   with a real Paystack test checkout.
3. Fix API-layer bugs 1–3 above.

(Emergency, Flights, Hotels, Food/Drinks, and Transport are all built from
screenshots already — see the route inventory above. AI Itinerary Planner
and shared auth state are done too — see "Architecture quick reference".)
