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

<!-- Append new dated sessions below this line as work continues. -->
