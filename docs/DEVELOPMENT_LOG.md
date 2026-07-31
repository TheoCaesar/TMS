# Development Log — Tourism Management System Frontend

This log records what was decided and done during development, and exact
steps to replicate the setup from scratch. Updated as the project progresses.

---

## Session 1 — 2026-07-30: Project initialisation

### Context

- Source of truth for requirements: `docs/Tourism Management System SRS.docx`
  (IEEE 830-1998 style SRS, v2.0, dated 21 May 2026).
- The SRS defines 6 core modules — M1 POI Locator, M2 Flight Booking,
  M3 Accommodation, M4 Food & Drinks, M5 Local Transport, M6 Emergency
  Medical — plus supporting subsystems (Auth, Payments, Reviews/Social,
  Notifications). Full entity model in SRS section 6.3 (ER Diagram).
- Appendix B of the SRS recommends a phased MVP: Phase 1 covers Auth, M1,
  M3, M4, M5, M6, Payments, and basic Reviews; M2 (flights), AI planning,
  and social/gamification features are Phase 2/3.
- There is an existing v1 deployment of this system to use as a design/UX
  reference, plus API documentation and a base URL for backend integration.
  **Status: links not yet provided — see "Open items" below.**
- Figma designs exist for the UI. Agreed approach: share the Figma link
  directly (Claude will use browser automation / inspect where possible to
  read exact values); screenshots can be added per-screen if a given frame
  is hard to navigate to reliably.

### Decisions made

| Decision | Choice | Rationale |
| --- | --- | --- |
| Language | TypeScript | SRS defines ~14 entities across 6 modules (section 6.3) — types catch mismatches early and double as living documentation. |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) | Fast to translate Figma spacing/color tokens directly; avoids maintaining many separate CSS files across modules. |
| Build tool | Vite | Fast dev server/HMR, first-class React + TS template. |
| Routing | React Router v7 (`react-router-dom`), client-side only (`BrowserRouter`) | Standard for a Vite SPA; not using React Router's SSR/RSC/framework-mode features, which is relevant to a security note below. |
| Folder structure | Feature-based: `src/modules/<module>/{pages,components}` | Mirrors the SRS module boundaries (M1–M6 + supporting subsystems) so requirement traceability (Appendix A RTM) stays easy to follow in code. |
| Package manager | npm | Already available in the environment, no extra setup. |

### Steps performed (replication instructions)

1. Scaffolded a Vite + React + TypeScript project:
   ```bash
   npm create vite@latest . -- --template react-ts
   npm install
   ```
   (Run in an empty directory, or scaffold elsewhere and copy files in, if
   the target directory already has other files — e.g. the SRS doc.)

2. Moved the SRS document into `docs/`.

3. Installed Tailwind CSS v4 and React Router:
   ```bash
   npm install tailwindcss @tailwindcss/vite react-router-dom
   ```

4. Registered the Tailwind Vite plugin and a `@/` → `src/` import alias in
   `vite.config.ts`:
   ```ts
   import tailwindcss from '@tailwindcss/vite'
   import path from 'node:path'
   // plugins: [react(), tailwindcss()]
   // resolve.alias: { '@': path.resolve(import.meta.dirname, './src') }
   ```
   and mirrored the alias in `tsconfig.app.json` under `compilerOptions.paths`:
   ```json
   "paths": { "@/*": ["./src/*"] }
   ```

5. Replaced `src/index.css` with a single `@import "tailwindcss";` (removed
   the default Vite demo styles), and removed the default Vite/React demo
   markup from `src/App.tsx`, `src/App.css`, and demo assets
   (`react.svg`, `vite.svg`, `hero.png`).

6. Wrapped the app in `BrowserRouter` in `src/main.tsx`.

7. Created the feature-based folder structure under `src/modules/` — one
   folder per SRS module (`auth`, `poi`, `flights`, `accommodation`, `food`,
   `transport`, `emergency`, `payments`, `reviews`, `notifications`), each
   with `pages/` and `components/` subfolders.

8. Added TypeScript interfaces under `src/types/` for every entity in SRS
   section 6.3 (User, EmergencyContact, Poi, Flight, Accommodation, Room,
   Restaurant, MenuItem, Transport, Booking, Payment, Review, Itinerary,
   MedicalFacility), plus shared enums (`UserRole`, `ServiceType`,
   `BookingStatus`, `PaymentStatus`, `PaymentMethod`) in `types/common.ts`.
   All re-exported from `src/types/index.ts`.

9. Built a minimal app shell: `AppLayout` + `NavBar` (`src/components/layout/`),
   a `PlaceholderPage` component for not-yet-designed screens
   (`src/components/ui/`), a `HomePage`, and one placeholder page per module
   wired up via routes in `src/App.tsx`. Route paths are centralised in
   `src/lib/routes.ts` (`ROUTES` object) so nav links and `<Route>` elements
   can't drift apart.

10. Verified the setup: `npx tsc -b --noEmit` (clean), `npm run build`
    (succeeds), `npm run lint` (oxlint, clean), and a dev-server smoke test
    (`npm run dev`, confirmed `index.html` + `/src/main.tsx` + `/src/App.tsx`
    serve without errors).

### Notable engineering judgment calls

- `npm audit` flags a "high" severity advisory on the latest
  `react-router-dom` (7.18.2): a CSRF bypass specific to **RSC Mode**
  (`GHSA-qwww-vcr4-c8h2`). This project uses plain client-side routing
  (`BrowserRouter`, no server actions/loaders, no RSC) so the advisory
  doesn't apply to how the app is built. Pinning to the last version before
  that advisory's range (7.11.0) was tried and rejected — it re-introduced
  a much larger set of *older*, more relevant SSR/data-router advisories.
  Staying on latest and re-checking `npm audit` periodically was judged the
  safer choice. Revisit if the app later adds SSR or server actions.

### Open items (need input before proceeding further)

- **Figma link** — not yet provided. Needed to build out real screens
  (currently all module pages are placeholders).
- **v1 deployed system** — mentioned as a design/UX reference; link not yet
  provided.
- **API documentation + base URL** — needed to wire up `src/lib/` API
  client(s) for real integration; not yet provided.

---

## Session 2 — 2026-07-30: Figma prototype, real API integration, design tokens

### Links received

- Figma prototype (interactive, not a static canvas — a "Figma Make" app):
  `https://www.figma.com/make/DbokKeXxurSiFhZQSQ8aJH/Voyago-mobile-app-prototype`
- API base URL: `https://tms-api-m7yf.onrender.com`
- API docs (Swagger UI): `https://tms-api-m7yf.onrender.com/api/docs#/`
  — full machine-readable spec at `/api/docs-json`.

### Key finding: Figma and the live API cover different scope

The user confirmed the deployed "v1" and the Figma prototype have drifted
and told me to **build strictly from the Figma prototype** for UI/UX.
Inspecting both sides directly:

- **Figma prototype** ("Voyago") matches the full SRS 6-module vision:
  bottom nav is Home / Explore / My Trips / Bookings / Profile; Home has a
  "Quick Access" grid for Explore, Flights, Hotels, Food, Transport,
  Emergency, plus an always-visible floating SOS button (FR-EMRG-08).
- **Live API** (`GET /api/docs-json`) only implements: Auth
  (register/login/refresh/logout/forgot-reset password), Users
  (profile + loyalty), Destinations, **Tours** (+ Departures), Bookings,
  Payments (Paystack `initiate`/`verify`), and Reviews. There is no
  Flight, Accommodation, Restaurant, Transport-dispatch, or
  Emergency-facility endpoint — "tours" is the API's only bookable-service
  concept, not six separate service types.

Decision (user): build every module's UI to match Figma. Wire real API
calls only where the backend supports it (Explore/Destinations, Tours,
Bookings, Payments, Reviews, Auth/Profile/Loyalty). For Flights, Hotels,
Food, and Transport — Figma screens exist but there's no backend — build
the UI only, with **no mock data layer** (static/empty states, not fake
data pretending to be real).

### Real API shapes (verified against the live server, not just the spec)

Every response is wrapped: `{ code, message, data }` (errors have
`data: null`, `message` is a human-readable string, `code` mirrors HTTP
status). Confirmed via direct calls:

- `GET /destinations`, `GET /tours` — paginated: `data: { results, total, page, pageSize, totalPages }`. Real seed data exists (Ghana destinations/tours), `heroImageUrl` is `null` on all seeded rows today.
- `POST /auth/register`, `POST /auth/login` → `data: { accessToken, refreshToken }`. Access token is a JWT (`sub`, `email`, `role`, `iat`, `exp`); observed lifetime **15 minutes** (900s). `role` seen: `TOURIST` (spec implies `OPERATOR`/`ADMIN` also exist, given operator/admin-only endpoints).
- `GET /users/me` → `{ id, email, fullName, phone, avatarUrl, role, loyaltyPoints }`.
- `GET /users/me/loyalty` → `{ points, tier }` (tier seen: `BRONZE`).
- `GET /tours/{id}/departures` → **not paginated**, plain array: `{ id, tourId, departsAt, capacity, seatsLeft, status }`.
- `GET /tours/{id}/reviews` → paginated, same envelope as destinations/tours.
- `GET /bookings/me` returned **HTTP 500** for a fresh user with zero bookings — likely a backend bug on the empty case, not a frontend concern; the frontend should treat it as "no bookings" defensively rather than crash.
- `POST /payments/initiate` response shape is **unverified** (would require creating and paying for a real booking to observe) — `InitiatePaymentResult` in `src/lib/api/payments.ts` is inferred from Paystack's typical `initialize-transaction` shape and flagged in a code comment; confirm once the booking flow is wired up end to end.

To get the above I registered one synthetic test account against the live
API (`claude.integration.test@example.com`, dummy password) — this is a
real row in the backend's user table now. No delete-account endpoint
exists in the spec, so it'll stay there; flagging in case the user wants
to clean it up manually.

### What was built this session

1. **Design tokens** (`src/index.css`, `@theme`) — brand teal, ink navy,
   accent amber, danger red, `--color-app-bg`, `--radius-card`. Sampled
   from screenshots of the Figma prototype's Home and Local Transport
   screens (see below) — approximate, not yet cross-checked against live
   computed styles (the prototype became slow/unreachable partway through
   this session; see "Figma prototype reliability" below).

2. **API client** under `src/lib/api/`, built directly from the verified
   shapes above (not just the OpenAPI spec, which was missing response
   schemas for several endpoints):
   - `types.ts` — types for every entity/DTO the live API actually returns.
   - `client.ts` — `apiRequest()`: base URL from `VITE_API_BASE_URL` (falls
     back to the shared dev deployment), JSON envelope unwrapping, throws
     `ApiError` with the server's `code`/`message` on failure, and
     transparently retries once via `POST /auth/refresh` on a 401.
   - `tokenStore.ts` — access/refresh token persistence in `localStorage`
     under `tms.auth`.
   - `auth.ts`, `users.ts`, `destinations.ts`, `tours.ts`, `bookings.ts`,
     `payments.ts`, `reviews.ts` — one file per domain, thin wrappers over
     `apiRequest`.
   - `.env.example` documents `VITE_API_BASE_URL`; `.gitignore` updated to
     ignore real `.env*` files while keeping `.env.example` tracked.

   Note: `src/types/` (from session 1) is now explicitly the **SRS-aligned
   full-scope model**, kept separate from `src/lib/api/types.ts` (the
   **live-API model**) — some names collide on purpose (`UserRole`,
   `BookingStatus`) because they describe different things; a comment in
   `src/types/index.ts` flags this so nobody imports the wrong one.

### Figma prototype reliability

The prototype is a real interactive app (client-side routed — confirmed
via a `preview-route` query param that deep-links into screens, e.g.
`&preview-route=%2Fhome`), not a static canvas, which is good for
inspection. But reloading it got increasingly slow and eventually hung on
the loading spinner across multiple fresh tabs (likely a cold-starting
dependency behind the preview, possibly the same Render-hosted API
spinning down between requests). Captured before it degraded: the Home
screen and the Local Transport screen (Taxi/Car Hire/Shuttle/Bus segmented
tabs, Pickup/Destination fields, Now/Schedule toggle) — both match the SRS
module scope closely.

Agreed approach with the user: keep trying the live prototype for each
remaining screen as we build that module; if it hangs again, ask for a
screenshot of that specific screen instead of retrying indefinitely.

### CORS blocker (important — needs a backend fix)

While wiring the Home screen's "Featured Destinations" to real
`GET /destinations` data, requests failed in-browser with a generic
`TypeError: Failed to fetch`, even though the exact same request via
`curl` succeeded instantly. Confirmed with `curl -D -` and an `Origin`
header set: **the API sends no `Access-Control-Allow-Origin` header at
all**. This isn't a flaky-backend issue (that was a separate, real thing
observed earlier — 503s during a cold start) — it's a hard CORS
misconfiguration that blocks **every** browser-based caller, not just this
dev server. No frontend, on any origin, can call this API directly from
JS in a browser until the backend sends proper CORS headers (e.g., in
Nest: `app.enableCors({ origin: [...allowed frontend origins], credentials: true })`).

Interim workaround for local development only: `vite.config.ts` now
proxies `/api/*` to the live backend server-to-server (no CORS enforcement
between servers), and `src/lib/api/client.ts` defaults to a relative
`API_BASE_URL` in dev so requests go through that proxy. **This does not
fix the production build** — once deployed, the frontend will hit the same
`Failed to fetch` wall unless the backend adds real CORS headers, or a
production reverse proxy is put in front of both frontend and API on the
same origin. Flagging this for the user to fix backend-side; not something
fixable from the frontend alone.

### Local Transport and Explore built

- **Local Transport** (`src/modules/transport/pages/TransportBookingPage.tsx`)
  rebuilt to match the captured Figma screenshot: Taxi/Car Hire/Shuttle/Bus
  segmented tabs, pickup/destination fields, Now/Schedule toggle. UI only,
  no mock ride/fare data (no backend for this module).
- **Explore** — captured from the live prototype via
  `preview-route=%2Fexplore` (succeeded on retry after an earlier hang):
  search bar, All/Attractions/Restaurants/Hotels category pills, a "Map
  View" placeholder (Figma's own version is a placeholder too, not a real
  map), and a "Nearby Places" list (photo, name, category · distance,
  star rating).

  The live API has no generic POI concept — only bookable Tours. Moved
  this out of the misleadingly-named `src/modules/poi/` (deleted) into
  `src/modules/tours/`, and wired the results list to real
  `GET /tours` + `GET /destinations` data reusing Figma's card layout
  (image, title, destination · duration, rating — "New" shown instead of
  a fake 0.0 when `ratingCount` is 0). The category pills stay visually
  present to match Figma, but only "All" is populated — Attractions/
  Restaurants/Hotels show an honest "nothing here yet" state rather than
  fabricated results, consistent with the earlier "no mock data" decision
  extended to this partially-backed screen. Client-side search filters
  the already-fetched tours by title.

  Added `src/modules/tours/pages/TourDetailPage.tsx` (linked from each
  Explore card) so the flow doesn't dead-end: real tour title/description/
  price (formatted from `priceMinor` + `currency`)/duration/rating plus
  its upcoming departures (`GET /tours/{id}/departures`) with seats left.
  Booking against a departure isn't wired up yet.

  New `src/lib/format.ts` (`formatMoney`, `formatDuration`, `formatDate`,
  `formatTime`) — first reuse across two screens, extracted rather than
  duplicated.

### Auth, booking, and payment flow

- **Login/Register**: Register matches a captured Figma screen ("Create
  Account" — Full Name/Email/Phone/Password). Login has no Figma capture;
  styled consistently. New shared `TextField`/`PasswordField` components
  (the latter with a show/hide toggle). `RegisterDto` doesn't accept phone
  at registration, so phone is saved with a follow-up `PATCH /users/me`.
  Verified end-to-end: register -> redirect to Home -> authenticated
  greeting shows the new user's name.

- **Booking flow**: checked the live Figma prototype for a booking screen
  first (clicked into a POI detail page — "Cape Coast Castle" — and
  scrollbar-dragged to the true bottom, since mouse-wheel scroll doesn't
  reach that iframe reliably). Found no booking/purchase UI at all: the
  POI detail page's only CTAs are **Navigate** and **Save to Wishlist**.
  This confirms Figma's Explore/POI flow is discovery-only, matching the
  SRS's POI module — booking only exists as a concept for the API's
  separate Tour entity, which has no Figma screen. Designed the booking UI
  myself, consistent with the established Voyago design tokens (not
  invented from scratch): `TourDetailPage` departures are now selectable,
  with a seat stepper (capped at `seatsLeft` and the API's max of 20) and
  a sticky bottom bar showing the computed total that appears once a
  departure is picked. Booking as a signed-out user redirects to Login
  first.

  New `BookingDetailPage` (`/bookings/:reference`) — reached right after
  booking, and reusable later from a Bookings list: shows seats/total/
  status, and for a `PENDING` booking, a "Pay with Paystack" button plus
  a manual "I've already paid — check status" fallback (see below for why
  the fallback matters).

  New `PaymentCallbackPage` (`/payments/callback`) for when Paystack
  redirects back — reads `reference` or `trxref` from the query string and
  calls `GET /payments/{reference}/verify`. **This route is a best guess**:
  `InitiatePaymentDto` has no field for a callback URL, so the backend
  must have one hardcoded server-side (typical Paystack setup), and we
  don't know if it points here. That's exactly why `BookingDetailPage`
  also has the manual verify fallback — it doesn't depend on the redirect
  landing in the right place.

  Verified real booking creation end-to-end in the browser: selected a
  departure on the Cape Coast Castle Heritage Tour, booked 1 seat, landed
  on `BookingDetailPage` showing a real reference (`TUR-2026-0004`),
  correct total (GHS 80.00), status `PENDING`.

  **Payment initiation is broken server-side.** Clicking "Pay with
  Paystack" got `500 Internal server error` from `POST /payments/initiate`.
  Reproduced outside the app too: logged in as the booking's actual owner
  via `curl` and hit the same endpoint directly — same 500. (A first
  attempt with a different test account correctly got `403 Not permitted
  to view this booking`, confirming booking ownership is enforced properly
  — the 500 only happens for the rightful owner, i.e. on the actual code
  path.) This is very likely a Paystack integration/config issue on the
  backend (missing or invalid secret key, or a bug in that handler) — not
  fixable from the frontend. The `InitiatePaymentResult` type in
  `src/lib/api/payments.ts` therefore remains **unverified** — inferred
  from Paystack's typical response shape, still unconfirmed against a real
  response, since the endpoint currently never succeeds. Flagging for the
  user/backend team; the frontend code path is otherwise complete and
  ready as soon as that endpoint works.

### Tablet/desktop responsive pass

The app was mobile-first by design from session 1 (`AppLayout` was a
fixed `max-w-md` column at every screen size) — this session extends it
with `md:`/`lg:` breakpoints, since there's no Figma desktop design to
follow:

- `AppLayout`: container grows `max-w-md` → `md:max-w-3xl` →
  `lg:max-w-6xl`. New `TopNav` (`md:block`, hidden on mobile) replaces
  `BottomNav` (now `md:hidden`) — same 5 destinations, shared via new
  `navTabs.ts` instead of duplicated. `SosButton` also becomes `md:hidden`
  since `TopNav` has a persistent "Emergency" link covering the same
  FR-EMRG-08 requirement without a redundant floating button on wider
  screens; the `transform-gpu` fixed-positioning-container trick from
  session 1 keeps everything anchored to this column's actual width at
  any breakpoint, including page-level fixed bars like the booking bar.
- `HomePage` / `ExplorePage`: Quick Access grid goes `grid-cols-3` →
  `md:grid-cols-6` (all 6 tiles fit one row). Featured Destinations and
  the Explore results list switch from mobile horizontal-scroll/stacked
  to `md:grid` (`md:grid-cols-2/3` → `lg:grid-cols-3/4`).
- Form/detail pages (`LoginPage`, `RegisterPage`, `TransportBookingPage`,
  `TourDetailPage`, `BookingDetailPage`, `PaymentCallbackPage`) get a
  `md:max-w-*` cap instead of stretching full-width — full-bleed layouts
  only make sense for the grid-based browse screens.

**Verification gap, worth knowing about**: the browser automation's
`resize_window` tool did not actually change the tab's rendering
viewport in this environment — `window.innerWidth` stayed fixed (~1020px)
across every resize request from 375px to 1440px, confirmed via
`window.matchMedia`/`innerWidth` checks, not just visual inspection. So
desktop/tablet (`md`/`lg`) rendering was visually confirmed in the
browser; true mobile (<768px) rendering was **not** re-confirmed
visually after adding the responsive classes. Confidence there instead
comes from a code diff review: every change this pass was a strictly
additive `md:`/`lg:`-prefixed class alongside the existing unprefixed
(mobile) classes — no base/mobile-tier class was removed or altered — so
the mobile styles verified extensively earlier in the session should
still hold. Worth an actual phone or a working responsive-resize check
to be sure.

### API layer rewritten as Observables (RxJS)

User asked to implement the API integration as Observables instead of
Promises. Installed `rxjs` and rewrote the whole `src/lib/api/` layer plus
every call site:

- `client.ts`: `apiRequest$()` (RxJS convention — trailing `$` marks
  anything that returns an `Observable`, since forgetting to `subscribe()`
  silently does nothing, unlike a Promise which runs eagerly). Built on
  `fromFetch` from `rxjs/fetch` rather than wrapping `fetch()` in `from()`
  — `fromFetch` ties into an `AbortController` so unsubscribing (component
  unmount, or a fresh `retry()` firing while a previous request is still
  in flight) actually cancels the underlying network request. That's a
  real capability gap Promises have vs. Observables, so it's worth
  actually using rather than just changing the type signature.
  The envelope-unwrapping and 401-refresh-and-retry logic (previously a
  `try/catch` + a `let refreshInFlight: Promise | null` cache) became
  `switchMap`/`catchError`/`shareReplay(1)` — `shareReplay(1)` coordinates
  concurrent 401s into the one in-flight refresh call the same way the
  old Promise cache did, just expressed as a shared stream.
- All seven domain modules (`auth.ts`, `users.ts`, `destinations.ts`,
  `tours.ts`, `bookings.ts`, `payments.ts`, `reviews.ts`) renamed every
  exported function with the `$` suffix and changed return types from
  `Promise<T>` to `Observable<T>` (e.g. `login` → `login$`,
  `listTours` → `listTours$`).
- `useApiResource` (the shared fetch-with-retry hook) now subscribes
  instead of chaining `.then()/.catch()`, and actually uses the
  cancellation capability above: it tracks the current `Subscription` in a
  ref and unsubscribes on unmount *and* at the start of every `retry()`,
  so a slow stale request can't overwrite fresher state — something the
  Promise version had no way to express. `useCurrentUser` got the same
  subscribe-with-cleanup treatment.
- Every page that called the API directly (not through `useApiResource`)
  converted from `async/await` + `try/catch/finally` to `.subscribe({
  next, error })`: `LoginPage`, `RegisterPage` (chains `register$` →
  optional `updateMe$` via `switchMap`, swallowing the phone-update
  failure with `catchError(() => of(null))`, matching the original
  best-effort semantics), `TourDetailPage`'s `handleBookNow`,
  `BookingDetailPage`'s `handlePay`/`handleVerify` (the latter uses
  `finalize()` for the "always call retry() when done, success or not"
  behavior the old `finally` block had). Places that fetched from two
  endpoints at once switched from `Promise.all` to `forkJoin`
  (`ExplorePage`), and `TourDetailPage`'s slug → tour → {departures,
  destination} chain became `switchMap` into a `forkJoin`.

Verified the full rewrite end-to-end in the browser on a fresh account
(register → Home greeting → Explore → Tour Detail → select a departure →
Book Now → real booking `TUR-2026-0005` → **Pay with Paystack actually
worked this time**, redirecting to a genuine Paystack test-mode checkout
page for the right amount and customer email. Did not enter any payment
details or complete the transaction — just confirmed the redirect and
closed it. This means the earlier `POST /payments/initiate` 500 was
likely intermittent rather than a hard backend bug; updated the comment
in `payments.ts` accordingly, though it's worth keeping an eye on.

One pre-existing gap noticed during this testing, **not** caused by this
refactor: after registering via in-app navigation (no full page reload),
`TopNav`'s user chip kept showing "Log in" instead of the new user's name
— because `useCurrentUser` only fetches once per mount, and `TopNav`
(part of `AppLayout`) doesn't unmount across route changes within the
app. A fresh page load picks up the tokens correctly. Fixing this needs
some form of shared auth state (context, or a tiny store) so every
`useCurrentUser()` instance reflects the same login state — not done
here since it's out of scope for "implement the API as Observables," but
worth doing before this matters for real users.

### Next up

- Continue through Bookings list, Profile/Loyalty, and the four unbacked
  modules (Flights, Hotels, Food, Emergency), fetching each screen from
  Figma as we reach it.
- Confirm the mobile breakpoint still renders correctly now that md:/lg:
  overrides exist, once viewport resizing is reliable (or on a real
  device).
- Consider shared auth state (context/store) so login/register updates
  are reflected everywhere without a full page reload — see the TopNav
  gap noted above.

---

## Session 3 — 2026-07-30: My Trips built from a user-supplied screenshot

### Nav mapping clarified

User pasted a screenshot titled "My Bookings" (tabs: Upcoming/Completed/
Cancelled; booking cards with icon, title, status badge, date, ref,
View/Cancel/Download actions). Its bottom nav showed **"My Trips" as the
active tab**, not "Bookings" — asked the user to confirm since that
conflicts with the two-separate-tabs assumption from session 2's Figma
capture. Confirmed: this screen **is** `/trips`. `/bookings` (the
Calendar-icon tab) remains an unresolved placeholder — no evidence yet of
what it's meant to show separately, not touched this session.

### Built `src/pages/TripsPage.tsx`

Real data via `GET /bookings/me`. Notable adaptations from the Figma mock
to what the live API actually provides:

- The API only has one bookable entity (Tours), so every booking here is
  a tour booking — unlike Figma's per-type mock (hotel/flight/local-
  transport with different accent colors), there's no real data for
  those other types. Every card uses the same brand-teal accent/icon
  rather than fabricating categories that don't exist.
- `Booking` only has `departureId`, not a tour title, so the fetcher
  cross-references every tour's departures (`GET /tours/{id}/departures`
  for each tour from `GET /tours`) to build a `departureId -> title` map.
  Fine at the current tiny seed-data scale (a handful of tours); would
  need a real join (or the API adding tour info to the booking response)
  if the catalogue grows — noted in a code comment.
- Figma's third per-card action (a download icon, presumably for a
  ticket/receipt) was **omitted** — there's no receipt-generation
  endpoint to back it, and unlike Cancel (wired to the real
  `POST /bookings/{reference}/cancel`), a button that visually promises a
  download and does nothing felt worse than not having it.
- Upcoming/Completed/Cancelled tabs filter client-side over the full
  fetched list (`PENDING`/`CONFIRMED` → Upcoming, `COMPLETED` → Completed,
  `CANCELLED` → Cancelled) — the API's `listMyBookings$` only accepts one
  status filter at a time, not the two statuses "Upcoming" needs.

### New backend finding: `GET /bookings/me` appears to be broken, not just an edge case

Session 2 noted this endpoint 500s for a **fresh account with zero
bookings** and guessed it was an empty-list edge case. Testing
`TripsPage` against the `claude.rxjs.test@example.com` account — which
has a real booking (`TUR-2026-0005`) — it **still 500s**. Reproduced
directly with `curl` too (logged in as that account, hit
`GET /bookings/me` with a valid token): same 500. So this isn't specific
to empty lists — the endpoint looks broken more generally. Couldn't
visually verify the booking-card rendering against real data because of
this; the error/retry state renders correctly (confirmed), but the
happy-path card layout is unverified until the backend fixes this.
Flagging for the user/backend team, same as the payments findings.

### Profile built from a second user-supplied screenshot ("profile-b")

Screenshot showed only the settings-menu portion of the Profile screen
(Personal Info / Travel Preferences / Payment Methods / Saved Places /
Notifications / Emergency Contacts (red) / Help & Support, plus a
separate Log Out card). No header screenshot existed ("profile-a" was
asked about; user said design it instead). Asked two questions, both
answered before building:

1. Header (avatar/name/loyalty) — designed from real data fields
   (`GET /users/me` + `GET /users/me/loyalty`), styled consistent with
   the rest of the app: circular avatar (photo if `avatarUrl` is set,
   else the user's initial), name, email, a tier + points pill.
2. Most menu rows have zero backend support (Travel Preferences, Payment
   Methods, Saved Places, Notifications, Emergency Contacts, Help &
   Support — none of these exist as API concepts). User chose
   non-interactive: they render matching Figma (icon, label, dimmed) but
   don't navigate anywhere, rather than dead-ending on fake sub-screens.

**Personal Info was treated differently** — it's the one row with real
backend support (`PATCH /users/me`), so it got a real, working edit page
(`src/pages/PersonalInfoPage.tsx`, route `/profile/personal-info`): Full
Name and Phone editable, Email shown read-only (no change-email endpoint
exists). Verified end-to-end in the browser: loaded real prefilled
values, edited the name, saved, got a real "Saved." confirmation, and
navigating back to `/profile` showed the updated name — confirming the
`PATCH` actually persisted.

Also wired a real Log Out button (`authApi.logout$()` → redirect home),
and a logged-out prompt (`ProfilePage` checks `getTokens()` before
rendering anything, matching the pattern used for booking).

### Next up

- Once `GET /bookings/me` works, verify `TripsPage`'s card rendering
  against real data (currently only the error state has been visually
  confirmed).
- Figure out what `/bookings` (Calendar tab) is meant to show, if
  anything distinct from `/trips` — no Figma evidence yet.
- Continue through the four unbacked modules (Flights, Hotels, Food,
  Emergency) as screenshots/Figma come in.

---

<!-- Append new dated sessions below this line as work continues. -->

## Session 6 — 2026-07-31: AI itinerary planner + real-time sockets

### Context

The user supplied a backend integration guide ("Voyago Backend — Frontend
Integration Guide") alongside the base URL and Swagger docs. Auditing the
existing `src/lib/api/` against it and against a fresh pull of
`GET /api/docs-json` turned up **two whole capabilities the frontend had no
code for at all**, both confirmed live:

1. **AI itinerary planner** — four endpoints under `/api/v1/itineraries`.
2. **Socket.IO real-time** — two namespaces, absent from Swagger (they're
   only documented in the integration guide, §8). `socket.io-client` wasn't
   even a dependency.

Reviews were a third gap (`src/lib/api/reviews.ts` exists but nothing in the
UI calls it); the user scoped this session to the two above.

### The AI planner is synchronous and genuinely slow — measured

Before writing any UI, generated a real itinerary against the live API
(`Cape Coast`, 2 days, party 2, interests history/beaches):

- **`HTTP 201` in 66.1 seconds.** The guide warns ~75s on the configured
  free model; 66s is the real measured figure. Model reported itself as
  `openrouter/free`.
- The response matched the guide's §9 shape exactly — which mattered,
  because the OpenAPI spec types `plan` as an opaque `additionalProperties`
  object and is therefore useless for generating types. **`src/lib/api/types.ts`
  itinerary types were written from the real response, not the spec.**
- Grounding is real, not a claim: the two `bookable: true` items carried
  `cape-coast-castle-tour` and `kakum-canopy-walk`, both of which resolve
  via `GET /tours/:slug` to genuine `APPROVED` tours with live departures.

Two consequences for the UI:

- **A skeleton loader would be wrong here.** A minute of shimmer reads as a
  hang. `ItinerariesPage` gets a dedicated state that says out loud that it
  takes about a minute.
- **`client.ts` needed a timeout option.** Browser `fetch` has none, so a
  hung request (Render cold start) would spin forever. Added
  `RequestOptions.timeoutMs`, implemented with RxJS `timeout()` and
  re-thrown as `ApiError(408)` so callers keep a single error type. Because
  the pipeline is built on `fromFetch`, the timeout's unsubscribe genuinely
  aborts the request rather than just ignoring it. `generateItinerary$` uses
  a 2-minute ceiling; nothing else sets one.

### Sockets exposed as Observables, not raw emitters

`src/lib/api/socket.ts` wraps both namespaces in cold `Observable`s so
real-time matches the RxJS convention the rest of `src/lib/api/` already
uses (Session 4). Nothing connects until subscribe; unsubscribing
disconnects. That makes them safe to drive straight from a `useEffect`.

Verified against the live backend with a throwaway Node probe before
trusting them in the app:

- `/bookings` with a valid token — **connects over `websocket`** (not
  degraded long-polling).
- `/availability` — connects and accepts `departure.subscribe`.
- **Control case:** an unauthenticated `/bookings` handshake is dropped with
  `io server disconnect`, exactly as the guide says. Worth knowing that this
  arrives as a *disconnect*, not a `connect_error` — so an unauthenticated
  socket goes quiet rather than erroring. Socket.IO does not auto-reconnect
  after a server-initiated disconnect, so there's no reconnect storm.

The governing rule, written into the module's header comment: **sockets are
an enhancement, REST is the source of truth.** Every consumer swallows
socket errors. A socket that never connects must never blank a screen.

`booking.status_changed` on `BookingDetailPage` refetches over REST rather
than patching state from the event payload — the event is authoritative, but
refetching keeps one source of truth and reuses the existing rendering
untouched. The manual "I've already paid — check status" button stays as a
fallback, since a user returning from Paystack in a fresh tab may not have a
live socket.

One subtlety worth recording: `useApiResource` returns a fresh `retry`
closure every render, so subscribing with `retry` in the dependency array
would reconnect the socket on every state change. `BookingDetailPage` holds
it in a ref and keys the effect on `reference` alone.

**Known limitation (documented, not fixed):** the handshake carries whatever
access token was current at connect time. If it expires mid-session the
server drops the connection; reconnects re-read the token store, but a
socket won't itself trigger the REST refresh-and-retry flow in `client.ts`.

### Dev proxy now covers `/socket.io` too

Same CORS blocker, same workaround, one addition: **`ws: true` is required**
on the proxy entry. Without it the handshake succeeds but the connection
silently stays stuck on HTTP long-polling — a failure mode that looks like
it works.

### Backend status re-confirmed 2026-07-31 (both still broken)

- **`GET /bookings/me` still 500s.** Retested every variant, including each
  documented `status` filter value. Also confirmed the frontend's
  `listMyBookings$` types that filter wrongly (see below).
- **CORS still unconfigured.** `curl -D -` with `Origin: http://localhost:5173`
  returns no `access-control-allow-origin` at all. `vary: Origin` is present,
  so the server is evaluating the origin and rejecting it.

### Bugs found in the existing API layer, deliberately left alone

Out of scope for this session (user scoped it to itineraries + sockets), but
found while auditing and worth fixing:

1. **`listMyBookings$` filter enum is wrong.** `src/lib/api/bookings.ts`
   types `status` as `BookingStatus` (`PENDING`/`CONFIRMED`/…), but the API
   only accepts `upcoming | completed | cancelled` — confirmed:
   `?status=PENDING` returns `400 status must be one of the following
   values: upcoming, completed, cancelled`. It doesn't bite today only
   because `TripsPage` calls it with no argument and filters client-side.
2. `verifyPayment$` returns `unknown`; the guide defines a real `Payment`
   shape (`providerRef`, `status`, `amountMinor`, `currency`).
3. `DepartureStatus` includes a `CLOSED` member the spec doesn't have.
4. **Reviews are dead code.** `listTourReviews$`/`createReview$` exist and
   are exported but no component calls them. `TourDetailPage` shows
   `ratingAvg`/`ratingCount` without ever listing the reviews behind them.

### Verification performed

No browser automation was available this session, so rendering was not
visually confirmed — but every request path the new code takes was exercised
against the live backend **through the Vite dev proxy** (i.e. the exact URL
the app builds):

- Itinerary list / get / delete-shape and the full plan tree.
- Client-side bound enforcement mirrored server-side: `{destination:"X",
  days:99}` → `400 destination must be longer than or equal to 2 characters;
  days must not be greater than 14`.
- The deep-link payoff: both `bookable: true` slugs resolve to `APPROVED`
  tours, and `cape-coast-castle-tour` has a `SCHEDULED` departure with 25/25
  seats — so "Book this tour" lands on a genuinely bookable page.
- Both socket namespaces (see above).
- `npx tsc -b --noEmit`, `npm run lint`, `npm run build` all clean.

**Still unverified:** the live `PENDING → CONFIRMED` transition, which needs
a real Paystack test checkout completed while the booking page is open.
(Both new pages *were* subsequently verified in a real browser — see below.)

### Follow-up: the "request always fires twice" report

The user noticed that every call appeared in devtools as a failed request
followed by a successful one, and read it as the API needing a second try.

**It wasn't a failure or a retry.** `<StrictMode>` (`main.tsx`) makes React
deliberately mount → unmount → remount every component in development.
`useApiResource`'s cleanup unsubscribes, and because the client is built on
`fromFetch`, unsubscribing genuinely **aborts** the in-flight fetch — which
Chrome renders with the same red ⊗ it uses for failures. So the first
request was cancelled on purpose, and none of it happens in a production
build. Ruled out other causes first: nothing else double-fires (no page
calls `retry()` on mount).

**But it was hiding a real bug.** `TopNav` and `HomePage` each called
`useCurrentUser()` independently, and that hook fetched `GET /users/me` on
every mount — so Home issued **two concurrent `/users/me` requests in
production too**, and `/profile` did the same (TopNav's hook plus the page's
own `getMe$`). This is the "no shared auth state" gap flagged in HANDOFF.md
since Session 5, showing up as a concrete cost.

Fixed both, per the user's choice:

1. **Shared auth state.** `<AuthProvider>` (`src/lib/auth.tsx`) owns the one
   `GET /users/me` for the session; `useAuth()` (`src/hooks/useAuth.ts`)
   exposes `{ user, loading, refresh, signOut }`. `useCurrentUser` deleted;
   `TopNav`, `HomePage`, `ProfilePage` and `PersonalInfoPage` all read from
   the context now, and login/register/profile-save call `refresh()`.
   Context and hook are in a separate file from the provider so `auth.tsx`
   exports only a component — otherwise Fast Refresh can't hot-reload it
   (oxlint's `only-export-components` catches this).
2. **In-flight GET pooling** in `client.ts` (`shareInFlight$`), generalising
   the `shareReplay(1)` trick already used for token refresh. Concurrent
   callers of the same URL share one request. It is **not a response
   cache** — the map entry is evicted as soon as the response settles.
   Only GETs are pooled (sharing a mutation would collapse two distinct
   intents), and `timeoutMs` requests opt out to keep their cancellation.

   *Trade-off accepted:* a pooled GET no longer aborts at the network level
   when its last subscriber leaves, which slightly softens the cancellation
   benefit celebrated in Session 4. The protection that actually matters is
   untouched — `useApiResource` still unsubscribes, so a slow stale response
   can never write state. StrictMode stays on for its real dev warnings.

### Browser verification (Playwright + the installed Chrome)

`playwright-core` drives `/Applications/Google Chrome.app` directly, with no
browser binaries to download. Results:

- **Every request is now x1.** Home, Profile and Itineraries each issue one
  call per endpoint, with zero aborted requests and zero console errors —
  with StrictMode still enabled.
- **Signed out: zero `/users/me` calls.**
- **In-app login updates the nav with no reload** — chip goes from "Log in"
  to the user's name, greeting renders "Good morning, RxJS 👋". That's the
  Session 5 known gap closed and confirmed.
- **Both itinerary screens render correctly.** Detail page shows the header,
  interest chips, summary, days grouped MORNING/AFTERNOON/EVENING, kind
  badges and correctly divided money (`GHS 80.00` from `8000` pesewas).
  Exactly **2 "Book this tour" links**, only on the bookable items; the
  `FREE`/`MEAL` items correctly have none.
- **The deep-link works end to end**: clicking through lands on
  `/explore/cape-coast-castle-tour`, the real tour page, showing a live
  departure with "23 left".

Gotcha worth remembering: `waitForLoadState('networkidle')` resolves
instantly after an SPA client-side navigation, so a first pass captured the
loading skeleton — which has no text — and made the detail page look empty.

## Session 7 — 2026-07-31: Dropped the dead "Bookings" tab, moved SOS into the nav bar

### Context

The bottom/top nav had two entries for the same thing: "My Trips" (real
data via `GET /bookings/me`) and "Bookings" (Calendar icon), which had
always been a `PlaceholderPage` stub, never wired to any endpoint. No Figma
screen for a distinct "Bookings" view ever turned up — a screenshot titled
"My Bookings" earlier turned out to just *be* the My Trips screen. The
backend also has no concept that would support two different tabs here:
`GET /bookings/:reference` is owner-only and there's no "list all bookings"
or "join another user's booking" endpoint, so a browse-and-join reading of
"Bookings" was considered and ruled out as unbuildable, not just unbuilt.

### Decision — intentional Figma deviation

Removed the "Bookings" tab from `navTabs.ts` (and deleted the now-orphaned
`BookingsPage`/`PlaceholderPage`) and put the SOS button in its old slot in
`BottomNav.tsx`, raised above the bar with a ring cutout, instead of
floating over page content (the old `SosButton.tsx`, now deleted). This is
a deliberate departure from the Figma bottom nav (which has 5 tabs
including Calendar/Bookings), made with the user's explicit sign-off — not
something to "fix" back to match Figma later. Rationale: a permanently
docked center action for a single safety-critical function (FR-EMRG-08 —
no auth gate, no digging through menus) is a well-established mobile
pattern and a strictly better use of that slot than a dead duplicate tab.
Desktop `TopNav` is unaffected — it already had its own persistent
"Emergency" pill separate from the tab list, and simply loses the
"Bookings" link since it reads from the same shared `navTabs`.

`/bookings/:reference` (the real `BookingDetailPage`) is untouched — only
the bare `/bookings` list route is gone.
Wait on real content instead.

---

## Session 7 — 2026-07-31: Guide-2 audit, operator/admin consoles, real maps

Three asks: implement whatever `docs/frontend-integration-guide-2.md`
specifies that isn't built yet, add map integration per the SRS, and remove
`/bookings` as redundant with `/trips`.

### "Guide 2" is byte-identical to guide 1

First thing checked, and it changes the whole shape of the task: `diff
docs/frontend-integration-guide.md docs/frontend-integration-guide-2.md`
produces **no output**. There are no new endpoints in guide 2. So "implement
what isn't implemented" meant auditing the original guide against
`src/lib/api/` — which had never been done exhaustively.

Result of that audit: every tourist-facing endpoint was already wired
(including reviews — HANDOFF's "Reviews are dead code" note was stale, both
`TourReviews.tsx` and `WriteReview.tsx` consume them). **The only endpoints
with no client function at all were operator/admin-scoped**: `POST
/uploads/image`, tour create/update/submit/approve/suspend, create departure,
and destinations CRUD. Ten endpoints, one shared theme.

Three implemented-but-wrong-vs-spec items came out of the same pass:
`listMyBookings$` typed its filter as `BookingStatus` when the API only
accepts `upcoming|completed|cancelled` (a latent 400 — nothing passed it
yet); `verifyPayment$` returned `unknown`; `DepartureStatus` carried a
`CLOSED` member the spec doesn't list.

### The operator console is shaped by a backend gap, not by design

`GET /tours` and `GET /tours/:slug` are `APPROVED`-only, and there's no
`GET /tours/mine`. A created tour is a `DRAFT`, therefore **unreadable the
moment its create response is discarded** — no edit, no departures, no
submit-for-review. There's also no endpoint listing `PENDING_REVIEW` tours,
so there is no approval queue to render.

The honest options were: fabricate a listing (forbidden), or work with what
the API really returns. `/operator` keeps the API's own create/update
responses in `localStorage` (`src/lib/operatorTourStore.ts`) and labels that
section as device-local; `/admin` takes a pasted tour id and says why. Both
are written up in `API_REQUIREMENTS.md` §7b as backend asks.

`RoleGate` is deliberately **not** a redirect. A redirect races the
`GET /users/me` fetch and would bounce a legitimate operator to the home page
on every hard refresh; it also breaks the shell-first rule. It renders inline
in the page's own frame instead.

**Not verified against the live backend:** there are no OPERATOR or ADMIN
credentials, so every write path in these two consoles is type-checked and
lint-clean but unconfirmed end-to-end.

### Maps: three failures that only a real browser would have shown

Only `Destination.lat/lng` carries real coordinates (confirmed live: Accra
`5.6037/-0.187`, Cape Coast, Elmina, Kumasi, Mole). Hotels, Food, Emergency
and Transport have no coordinates anywhere, so per the no-fabrication rule
they keep their inert placeholders. Built: the Explore viewport map, the Tour
Detail location map, Directions, and opt-in "Near me".

Everything type-checked and built clean while being **completely broken** in
three separate ways. Each was only caught by driving a real browser:

1. **The tile source.** MapLibre's own `demotiles.maplibre.org` — the default
   in nearly every example — is country-outlines-only and paints as a blank
   green shape at city zoom. Switched to OpenFreeMap Liberty (keyless,
   unmetered, real street detail).

2. **MapLibre's Web Worker dies under Vite's dep pre-bundling.**
   `net::ERR_FAILED` on `/node_modules/.vite/deps/maplibre-gl-worker.mjs`.
   This is the nastiest one because it fails *convincingly*: the style,
   sprites and raster relief tiles all load over HTTP on the main thread with
   200s, the canvas exists, the attribution renders — but vector tiles are
   fetched **inside the worker**, so `.pbf` requests were exactly zero and the
   map painted as an empty background with markers floating on it. Fixed with
   `optimizeDeps.exclude: ['maplibre-gl']` in `vite.config.ts`; 0 → 13 vector
   tiles. Dev-only; the production build emits the worker as a normal asset.

3. **`load` is the wrong readiness event.** It waits for every
   initially-visible tile, so the stalled source above left it pending
   forever — which pinned the loading skeleton over a working map *and* dead-
   locked the camera effect, which waits on the same flag. `styledata` (style
   parsed, map painting) is the correct signal; `load` is kept as a second
   trigger. Related: `map.on('error')` no longer blanks the map after first
   paint, so one 404'd tile can't replace a working map with "Map
   unavailable".

Also: the first `fitBounds` was hand-rolled zoom maths that ignored the
container's aspect ratio, so pins spilled out of the short, wide map frame.
Delegated to MapLibre's own `fitBounds`, which knows the real aspect ratio.

MapLibre is ~950 kB, so `MapView` is `React.lazy`'d — entry bundle went
463 → 468 kB, with the library in its own chunk fetched only by the two
screens that use it. Its CSS is imported inside the component, not
`main.tsx`, so it splits into the same lazy chunk.

### "GHSNaN" — found by looking at the screen

While screenshotting the Tour Detail map, the price bar read **`GHSNaN`**.
The guide specifies integer minor units; the live API sends major units under
different names — `price: 80` not `priceMinor: 8000`, `total: 80` not
`totalMinor: 8000`. So the documented field read back `undefined` on Tour
Detail, My Trips and Booking Detail.

Pre-existing, not from this branch, but it's the price on a core screen.
Normalised at the API boundary (`src/lib/api/money.ts`) rather than per call
site, accepting either shape — so the backend can fix its side whenever
without a coordinated release. Verified: no NaN, real GHS amounts.

Two incidental findings: **`GET /bookings/me` no longer 500s** (it returned
real paginated data), and bookings embed an undocumented `item` object
carrying the tour title — which is exactly what `TripsPage` currently
reconstructs by cross-referencing every tour's departures. Typed and noted;
that simplification is left as a separate change.

### `/bookings` vs `/trips`

Resolved the standing open question. `/trips` is the real screen (headed "My
Bookings", `GET /bookings/me`, three tabs, view/cancel); `/bookings` was a
`PlaceholderPage` stub. Deleted it and `PlaceholderPage` with it, dropped the
nav tab (5 → 4) and the footer link, and pointed `/bookings` at a `Navigate`
to `/trips` so old links don't 404. `/bookings/:reference` is a different
screen and is untouched — a parent-path `Navigate` doesn't shadow it.
