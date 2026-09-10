# Web App Build — Todos

Source: "Web app build.docx" (comment-only shared doc)

## Status (2026-09-10)

| # | Item | State |
|---|------|-------|
| 1 | Image recognition on Cloudflare | **Done** — Spot now calls the Vision Worker (`visionClassifier.ts`), TensorFlow removed. Set `VITE_VISION_WORKER_URL`. |
| 2 | Login session → 2 months | **Done** — backend JWT access 60d / refresh 90d; "keep me logged in" defaults on. |
| 3 | Social login (FB + Google) | **Deferred** — needs backend OAuth + provider apps. See spec below. |
| 4 | Landing page crawlable | **Partial** — `<noscript>` landing fallback + WebSite/Organization JSON-LD + full OG/Twitter meta added. Full SSR/prerender still open (see spec). |
| 5 | Discoverability without signup | **Deferred** — product/routing decision (which routes go public). |
| 6 | Gallery upload (listings only) | **Done already** — `ListItemDialog` supports multi-file gallery upload. Spot stays capture-first per spec. |
| 7 | Camera zoom glitch | **Done** — reset digital zoom to 1x; crop capture to on-screen aspect. |
| 8 | Geolocation pin | **Done** — real Leaflet map with draggable pin seeded from live GPS (`LocationPinMap`). |
| 9 | Council B2G dashboard | **Deferred** — own project. See spec below. |
| 10 | Error-message bug (w/ Ade) | **Blocked** — waiting on Ade's screenshot. |

---


## Features & Enhancements

- [ ] **Image recognition** — integrate image recognition sitting on Cloudflare.
- [ ] **Login session** — extend session expiry to 2 months (keep users signed in).
- [ ] **Social login** — add sign in with Facebook + Google.
- [ ] **SEO / crawlability** — ensure the landing page is crawl-able so Google can index and rank it. Landing page only.
- [ ] **Discoverability** — remove the barrier to discovering listed content without having to sign up first. Ease of discoverability / accessing / experiencing the app.
- [ ] **Gallery upload** — enable uploading existing photos (not just live capture). For listings only, not Spot.

## Bugs

- [ ] **Camera zoom glitch** — fix on the web app when listing items, especially with 'Spot'.
- [ ] **Geolocation bug** — pin the actual GPS spot of the fly-tipped item, not the user's registered profile address.
- [ ] **Error-message bug (w/ Ade)** — investigate the error message propagating on the page. Ade will share the screenshot of the page.

## New Build

- [ ] **Council B2G dashboard** — fly-tipping reports per neighbourhood/ward + item-exchange flows.

---

# Follow-up specs (deferred items)

## Social login (Facebook + Google)

**Backend (`backend-api`)**
- Add `@nestjs/passport` strategies: `passport-google-oauth20`, `passport-facebook`.
- New endpoints: `GET /auth/google`, `GET /auth/google/callback`, `GET /auth/facebook`, `GET /auth/facebook/callback`.
- On callback: find-or-create `User` by verified email, link a `provider` + `provider_id`
  (new nullable columns on `users` or a `user_identities` table), issue the same JWT pair as `/auth/login`.
- Env: `GOOGLE_CLIENT_ID/SECRET`, `FACEBOOK_APP_ID/SECRET`, `OAUTH_CALLBACK_BASE_URL`.
- Handle the "email already registered with password" case (link, don't duplicate).

**Provider setup (outside code)**
- Google Cloud console OAuth client (web) with authorised redirect URIs for stage + prod.
- Meta app with Facebook Login product, valid OAuth redirect URIs, app review for `email` scope.

**Frontend (`trucycle`)**
- "Continue with Google / Facebook" buttons on `LoginPage` + `SignupPage`.
- Button navigates to `${API_BASE}/auth/google`; callback lands on a `/auth/callback` route
  that reads the issued tokens (query or cookie) and calls `storeSession`.

## Landing page crawlability — full prerender

Current: `<noscript>` fallback + rich meta/JSON-LD. Googlebot renders JS so this is
"okay", but real HTML-at-fetch is better for ranking + non-Google crawlers.

Options, cheapest first:
1. **`vite-plugin-prerender` / `puppeteer` post-build** rendering `/` only to static HTML,
   served as `index.html`. React still hydrates. Watch for `document`/`window` access in
   `usePageMeta` and analytics init during SSR.
2. **Migrate landing to Astro** as a separate statically-generated page, app stays SPA.
3. **Full SSR** (Vite SSR / Remix) — biggest change, only if more pages need indexing.

Also confirm the Railway host serves a SPA fallback (all routes → `index.html`, 200)
and that `/sitemap.xml`, `/robots.txt` are reachable in prod.

## Discoverability without signup

Decide which routes become public (candidates: `/browse`, item detail pages,
`/found-items`, `/map`) and:
- Remove their auth guard in `AppRoutes`, gate only the actions (claim/message).
- Update `robots.txt` to `Allow` the newly public routes and add them to `sitemap.xml`.
- Add `usePageMeta` per public route.

## Council B2G dashboard

Its own project. Rough shape:
- **Backend**: `council` module — auth for council users (role `council`), scoped to a
  local-authority area; endpoints for fly-tipping reports aggregated by ward/neighbourhood
  (`isFlyTipped` found-items already carry lat/lng + postcode), and item-exchange volume
  by area. Ward boundaries: ONS/OS boundary data, reverse-geocode on ingest.
- **Frontend**: separate `features/council` area — map + choropleth by ward, time series,
  export CSV. Reuse `LocationPinMap`/Leaflet + `dataviz`.

