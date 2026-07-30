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

### Next up

- Once `POST /payments/initiate` is fixed backend-side, confirm the real
  response shape and correct `InitiatePaymentResult` if needed.
- Continue through Bookings list, Profile/Loyalty, and the four unbacked
  modules (Flights, Hotels, Food, Emergency), fetching each screen from
  Figma as we reach it.
- Confirm the mobile breakpoint still renders correctly now that md:/lg:
  overrides exist, once viewport resizing is reliable (or on a real
  device).

---

<!-- Append new dated sessions below this line as work continues. -->
