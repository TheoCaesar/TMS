# API Status Report

Every endpoint in the live spec (`GET /api/docs-json`), tested against the
running backend and cross-referenced with what the frontend actually calls.

**Audited:** 2026-07-31 (second pass) · **Base:**
`https://tms-api-m7yf.onrender.com/api/v1` · **50 endpoints** — up from 36.

## What changed since the last audit

The backend shipped a large update, including several things this repo had
specced in `API_REQUIREMENTS.md`:

1. **`GET /bookings/me` is fixed** — 200, and it now returns the
   **polymorphic booking** shape with an embedded `item` summary
   (`id`, `slug`, `title`, `imageUrl`, `startsAt`) plus `itemType`. `/trips`
   no longer fans out across every tour's departures to resolve a title.
   The `status=upcoming|completed|cancelled` filters work.
2. **Emergency module is live** (6 endpoints): facilities with `distanceKm`,
   national contacts, and SOS with the **client-generated idempotent
   `alertId`** that was specced. Facilities and contacts are **public** —
   correct, since this page must work with an expired session.
3. **Restaurants/Food module is live** (5 endpoints) plus `/reservations`.
   Not yet wired to the UI.

### ⚠️ Breaking change: money is now MAJOR units

Every money field dropped its `Minor` suffix and switched from pesewas to
whole GHS:

| Was | Now |
| --- | --- |
| `priceMinor: 8000` | `price: 80` |
| `totalMinor: 8000` | `total: 80` |
| `amountMinor: 8000` | `amount: 80` |
| `budgetMinor` / `estimatedTotalMinor` / `estimatedCostMinor` | `budget` / `estimatedTotal` / `estimatedCost` |

This contradicts the integration guide, which still documents integer minor
units. The frontend normalises **at the edge** in `src/lib/api/money.ts`
(`toMinorUnits` / `toOptionalMinorUnits`), applied in `tours.ts`,
`bookings.ts`, `itineraries.ts` and `payments.ts`, so the rest of the app
keeps one unit. Delete those fallbacks if the API ever matches its spec.

**Worth telling the backend team:** either the guide or the API is wrong —
they should agree. Silent unit changes are the kind of thing that turns into
a 100× billing error.

### Seed-data issue (cosmetic, but visible)

The seeded destination photos don't depict the places they label — the
`heroImageUrl` for **Accra** is a photo of Table Mountain, Cape Town. It
shows on Home's Featured Destinations and anywhere else that image is used.

Legend — **Wired**: called by the app · **UI**: has a screen using it ·
**Live**: result of hitting it just now.

---

## Inventory — 50 endpoints, where each one stands

**40 of 50 are wired into `src/lib/api/`. 10 are not.** Every endpoint below
was hit live during this audit.

### A. Wired and working end-to-end (40)

Auth (6) · Users + loyalty (3) · Destinations CRUD (5) · Tours incl. operator
/admin lifecycle (10) · Departures (2) · Reviews (2) · Bookings (5) ·
Payments (2) · Itineraries (4) · Uploads (1) · Emergency facilities/contacts
/SOS trigger + cancel (4) · plus both Socket.IO namespaces.

### B. NOW WIRED (was "backend ready, frontend not wired")

As of this session the Food module, emergency contacts and Explore's
server-side search are all connected:

- `GET /restaurants` — drives `/food` with **server-side** filtering
  (`q`, `cuisine`, `priceTier`, `dietary`, `openNow`); the debounced search
  box queries the API rather than filtering one page in memory.
- `GET /restaurants/:slug` + `/menu` — real detail and menu with prices.
- `GET /restaurants/:id/availability` + `POST /reserve` — a working table
  booking flow; slots come from the server so the UI can never offer a time
  the API would reject. Verified end-to-end: reserve → `TBL-2026-0002`
  CONFIRMED → `GET /reservations/:ref` → cancel.
- `GET`/`PUT /users/me/emergency-contacts` — new `/profile/emergency-contacts`
  screen; the Profile row is no longer dead.
- `GET /tours?q=` — Explore now searches the whole catalogue server-side.

`src/modules/food/data.ts` was deleted — the screens read the API now.

**Still unwired (1):** `GET /emergency/sos/:alertId` (no SOS-tracking screen
exists yet). The `/reservations/:ref` endpoints now have a screen — see below.

### B2. Flights and Stays wired (2026-07-31)

The API docs were updated with the flights vertical, and the hotels vertical
shipped under the name `/stays` — both fully wired and verified end-to-end
against the live backend using `claude.rxjs.test@example.com`:

- `GET /flights/airports?q=` — debounced autocomplete on `/flights`'s
  From/To fields, real IATA codes (confirmed `ACC`, `LOS`, `LHR`, ...).
- `POST /flights/search` + `GET /flights/offers/:offerId` — `/flights/results`
  renders real offers (airline, times, duration, stops, baggage, refundable,
  amenities, price); sort pills re-search server-side.
- `POST /flights/offers/:offerId/book` — creates a real `FLIGHT` reservation.
  Verified: booked `FLT-2026-0003` (Africa World Airlines AW1148, ACC→LOS,
  GHS 850.00) → `PENDING` → cancelled → `CANCELLED`.
- `GET /stays` + `/stays/:slug` — `/hotels` search (with server-side `q`/
  `category` filtering) and `/hotels/:slug` detail, real images and amenities.
- `GET /stays/:id/rooms?checkIn=&checkOut=&guests=` — live room availability
  and rates on the detail page, refetched when dates/guests change.
- `POST /stays/:id/book` — creates a real `STAY` reservation. Verified:
  booked `STY-2026-0002` (Labadi Beach Hotel, Deluxe Room, 3 nights,
  GHS 3,600.00) → `PENDING` → cancelled → `CANCELLED`.
- `GET /reservations/:reference` + `POST /reservations/:reference/cancel` —
  now have a screen (`/reservations/:reference`), reused by Flights, Stays,
  and the existing Table reservations. Same Paystack-in-a-tab + socket
  pattern as `BookingDetailPage`.

**Deltas from `API_REQUIREMENTS.md`'s original spec** (§3/§4 there have the
full detail): booking is per-module (`POST /flights/offers/:id/book`,
`POST /stays/:id/book`), not a unified `POST /bookings`; `/stays/:id/rooms`
takes the stay's **id**, not its slug; `/stays/:id/reviews` was not
delivered, so the detail page shows `ratingAvg`/`ratingCount` only, no
review list; money arrived as `total`/`fromPrice`/`pricePerNight` (major
units), normalised at the boundary same as everywhere else.

**Not appearing in `/trips`:** flight/stay/table reservations are a separate
concept from tour `Booking`s (`GET /bookings/me` still returns tours only),
so there's no unified "all my bookings" list — each reservation is only
reachable via the confirmation redirect after booking. Worth flagging to the
backend if a combined history view matters.

### C. Original gap list — pure UI work

| Endpoint | Verified live | Blocks |
| --- | --- | --- |
| `GET /restaurants` | ✅ 4 seeded restaurants, filters `q, cuisine, priceTier, dietary, lat, lng, openNow` | `/food` still reads `data.ts` |
| `GET /restaurants/:slug` | ✅ full detail incl. `dietary`, `ratingAvg`, `openingHours` | `/food/:slug` |
| `GET /restaurants/:id/menu` | ✅ sections → items with `price` | Menu tab |
| `GET /restaurants/:id/availability?date=&partySize=` | ✅ returns bookable `slots[]` | "Reserve a Table" |
| `POST /restaurants/:id/reserve` | auth | Reserve action |
| `GET /emergency/sos/:alertId` | auth | Track a raised SOS |
| `GET /users/me/emergency-contacts` | ✅ 200 (empty) | Profile → "Emergency Contacts" row |
| `PUT /users/me/emergency-contacts` | auth | Editing those contacts |

**The Food module is the big one**: the entire vertical is live on the
backend and the screens already exist — they just read `src/modules/food/data.ts`
instead of the API.

### C. Gaps I previously reported that the backend has now CLOSED

- ✅ `GET /bookings/me` fixed, and bookings are polymorphic with an embedded
  `item` summary → the O(tours) fan-out is gone from `/trips`.
- ✅ `GET /tours?q=` text search now exists. **The frontend still filters
  client-side** — Explore should switch to server-side search.
- ✅ `GET /bookings/me?type=` for per-vertical tabs.
- ✅ Emergency module, including the idempotent `alertId`.

### D. Still static — no endpoint exists at all

**Flights and Hotels/Stays were closed out 2026-07-31** — see the new
"Flights and Stays wired" section above the legend note, and
`API_REQUIREMENTS.md` §3/§4 for the delivered-vs-spec deltas.

| Screen | What's missing |
| --- | --- |
| `/transport`, `/transport/active-ride` | fare quote, driver dispatch, live tracking, ride socket |
| Explore category pills (Attractions/Restaurants/Hotels) | `Tour` has **no `category` field** — the pills cannot work |
| Explore "Map View" | destinations carry `lat`/`lng`, but there's no bounds/near query; a map could plot the existing 5 |
| Profile → Travel Preferences, Payment Methods, Saved Places, Notifications, Help & Support | no endpoints (favourites + notifications were specced in `API_REQUIREMENTS.md`) |
| Tourist avatar upload | `POST /uploads/image` is still OPERATOR/ADMIN-only |
| Itinerary across verticals | planner is still grounded in `APPROVED` tours only |

### Recommended order

1. ~~Wire the Food module~~ — done.
2. ~~Wire `/users/me/emergency-contacts`~~ — done.
3. ~~Switch Explore to `?q=`~~ — done.
4. ~~Wire Flights and Stays~~ — done 2026-07-31, see B2 above.
5. Ask the backend for a `category` on `Tour` so Explore's pills work.
6. Transport remains the one genuine backend project left.

---

## 1. Working and wired (the app's real backbone)

| Endpoint | Live | UI |
| --- | --- | --- |
| `POST /auth/register` | ✅ 200 (409 on duplicate) | `/register` |
| `POST /auth/login` | ✅ 200 (401 on bad password) | `/login` |
| `POST /auth/refresh` | ✅ used automatically on 401 | — |
| `POST /auth/logout` | ✅ | Profile → Log Out |
| `GET /users/me` | ✅ 200 | AuthProvider (once per session) |
| `PATCH /users/me` | ✅ 200 | `/profile/personal-info` |
| `GET /users/me/loyalty` | ✅ 200 | Profile header pill |
| `GET /destinations` | ✅ 200 · 5 rows | Home, Explore |
| `GET /destinations/:id` | ✅ 200 | Tour detail |
| `GET /tours` | ✅ 200 · 3 rows | Explore |
| `GET /tours/:slug` | ✅ 200 | Tour detail |
| `GET /tours/:id/departures` | ✅ 200 · 1 row | Tour detail, Trips |
| `POST /bookings` | ✅ 201 → `PENDING` | Tour detail → Book Now |
| `GET /bookings/:reference` | ✅ 200 | Booking detail |
| `POST /bookings/:reference/cancel` | ✅ 201 → `CANCELLED`, seats released | Booking detail, Trips |
| `POST /payments/initiate` | ✅ **working** — opened a real `checkout.paystack.com` session today | Booking detail |
| `GET /payments/:reference/verify` | ✅ 200 | "Check status" |
| `POST /itineraries/generate` | ✅ 201 (~66s) | `/itineraries` |
| `GET /itineraries` | ✅ 200 | Saved list |
| `GET /itineraries/:id` | ✅ 200 | `/itineraries/:id` |
| `DELETE /itineraries/:id` | ✅ 200 | Saved list delete |
| Socket `/bookings` · `booking.status_changed` | ✅ connects over websocket | Booking detail |
| Socket `/availability` · `availability.changed` | ✅ connects, accepts subscribe | Tour detail |

`POST /payments/initiate` had been intermittently 500ing in earlier sessions.
It worked cleanly today — treat it as **fixed but worth re-checking**.

## 2. Broken on the backend — blocks a real screen

| Endpoint | Live | Impact |
| --- | --- | --- |
| `GET /bookings/me` | ❌ **500 on every call** | `/trips` can only ever show its error state |

**This is unconditional, not a data problem.** Tested today with:
`?page=1&limit=20`, no params, and each of `status=upcoming|completed|cancelled`
— all 500. Also tested on **two accounts with zero bookings** (`claude.integration.test`,
`claude.ui.test`) — still 500. So it isn't an empty-list edge case, isn't
specific to your account, and isn't caused by the frontend's request shape.
Nothing can be fixed from this side; **the backend team has to fix it.**

*Possible stopgap if you need `/trips` working before that lands:* record each
booking reference in `localStorage` as it's created and fan out to
`GET /bookings/:reference` (which works fine). That shows real data from a
real endpoint, but only for bookings made in that browser — it would miss
bookings made on another device. Say the word and I'll build it.

Also note the client-side bug flagged earlier and still unfixed:
`listMyBookings$` types its `status` filter as `BookingStatus`
(`PENDING`/`CONFIRMED`/…), but the API only accepts
`upcoming | completed | cancelled` — `?status=PENDING` returns a `400`.

## 3. Now wired (was "working but no UI")

`GET /tours/:id/reviews`, `POST /bookings/:reference/review`,
`POST /auth/forgot-password` and `POST /auth/reset-password` all have UI as of
2026-07-31 — reviews list on the tour page, a "How was your trip?" form on
COMPLETED bookings, and `/forgot-password` + `/reset-password` screens.

**API gap found while building:** `ReviewResponseDto` carries `authorId` but
**no author name or avatar**, so the reviews list deliberately shows no
reviewer identity — the alternative would be inventing one. Adding an
`author: { fullName, avatarUrl }` to the review payload would let the cards
show who wrote each review.

## 4. Correctly gated (verified, not bugs)

Confirmed `403 Insufficient role` as a TOURIST on `POST /tours`,
`POST /destinations`, `POST /uploads/image`; `401 Unauthorized` unauthenticated
on `/users/me`, `/bookings/me`, `/itineraries`.

**`POST /uploads/image` is OPERATOR/ADMIN-only**, so a tourist can't upload an
avatar — `PATCH /users/me` only takes an `avatarUrl` string, meaning tourist
avatars must be externally hosted until the backend opens uploads up.

Operator/admin endpoints (`POST/PATCH /tours`, `/tours/:id/submit|approve|suspend`,
destination CRUD) exist and are gated correctly, but this app is a
**tourist-facing client** — no operator or admin console is built, and none was
asked for.

---

## 5. What's missing to make the rest of the app dynamic

The six-module design is mostly static because **the endpoints don't exist**.
Nothing here is a frontend gap.

### Entire modules with zero backend

Flights, Hotels/Stays, Food and Emergency are all now backed and wired (see
B, B2 above) — this table is stale for them, kept only for Transport:

| Screen | Needed |
| --- | --- |
| `/transport`, `/transport/active-ride` | fare estimate, driver dispatch/matching, live ride tracking, cancel |

### Gaps inside the Tours vertical that already exists

1. **A booking→tour join.** `Booking` only carries `departureId`, so `/trips`
   has to fetch *every* tour's departures just to show a booking's title. That
   is O(tours) requests per page load and won't survive a real catalogue.
   Either embed tour/departure summary in the booking payload, or add
   `GET /departures/:id`.
2. **Search and filtering on `/tours`.** Only `destinationId`, `minPrice`,
   `maxPrice`, `sort` exist. Explore's search box filters client-side over one
   page of results; there's no `q=` text search, and no category concept —
   which is why the Attractions/Restaurants/Hotels pills are inert.
3. **Geo endpoints.** Destinations carry `lat`/`lng`, but there's no
   "near me" or bounds query, so Explore's Map View is a placeholder.
4. **Favourites / saved places.** Profile has a "Saved Places" row with no
   backing endpoint.
5. **Notifications.** A settings row exists; no endpoint, and the socket
   only carries booking/availability events.
6. **Tourist image upload**, per §4.
7. **Cross-vertical itineraries.** The AI planner is deliberately grounded in
   `APPROVED` tours only, so it can't schedule hotels, food or transport even
   once those exist.

### Priority if the backend can only do a few

1. **Fix `GET /bookings/me`** — one broken endpoint, one whole screen dead.
2. **Add the booking→tour join** — removes an O(n) request fan-out.
3. **Text search on `/tours`** — makes Explore's search real.
4. **Open uploads to TOURIST** — unblocks avatars.

Everything else is new-module work, which is a backend project rather than a
tweak.
