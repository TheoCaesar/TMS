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

### Next up

- Rebuild Local Transport to match Figma (UI only, no mock data).
- Continue through Explore/Tours list, Tour detail + booking + payment
  flow, Bookings list, Profile/Loyalty, and the four unbacked modules
  (Flights, Hotels, Food, Emergency), fetching each screen from Figma as
  we reach it.

---

<!-- Append new dated sessions below this line as work continues. -->
