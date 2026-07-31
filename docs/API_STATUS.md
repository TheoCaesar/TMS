# API Status Report

Every endpoint in the live spec (`GET /api/docs-json`), tested against the
running backend and cross-referenced with what the frontend actually calls.

**Audited:** 2026-07-31 · **Base:** `https://tms-api-m7yf.onrender.com/api/v1`
· **36 endpoints** in the spec — unchanged since the previous audit (nothing
added or removed).

Legend — **Wired**: called by the app · **UI**: has a screen using it ·
**Live**: result of hitting it just now.

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

| Screen | Needed |
| --- | --- |
| `/flights`, `/flights/results` | flight search (origin, destination, dates, pax, cabin), offers, fares, booking |
| `/hotels`, `/hotels/:slug` | property search + availability, room types/rates, amenities, reviews, reservation |
| `/food`, `/food/:slug` | restaurants, cuisine/price/dietary filters, menus, table reservation |
| `/transport`, `/transport/active-ride` | fare estimate, driver dispatch/matching, live ride tracking, cancel |
| `/emergency` | facility directory with geo/proximity, SOS dispatch, emergency contacts |

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
