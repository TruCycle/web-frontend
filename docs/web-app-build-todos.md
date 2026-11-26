# Web App Build — Todos

Source: "Web app build.docx" (comment-only shared doc)

## Status (2026-09-10)

| # | Item | State |
|---|------|-------|
| 1 | Image recognition on Cloudflare | Smart Spot and the administrator tool use the authenticated API. Worker rollout and verification remain open. |
| 2 | Login session → 2 months | Source defaults are 15 minutes for access and 90 days for refresh. Verify the effective lifetimes per environment. |
| 3 | Social login — Google | **Done (needs env)** — `POST /auth/google` + "Sign in with Google" button on login/signup. Facebook not done. Set `GOOGLE_CLIENT_ID` (backend) and `VITE_GOOGLE_CLIENT_ID` (frontend). See "Google Cloud setup" below. |
| 4 | Landing page crawlable / SEO | **Done** — `<noscript>` fallback + WebSite/Organization JSON-LD + full OG/Twitter meta, **and** an opt-in build-time prerender (`npm run build:prerender`) that writes real HTML for `/`, `/browse`, `/privacy`, `/terms`, `/cookies`. See "Prerender & hosting" below. |
| 5 | Discoverability without signup | **Done** — public `/browse` catalogue for logged-out visitors (live items, search, filters, detail modal). Claiming prompts signup. `robots.txt` + `sitemap.xml` updated. |
| 6 | Gallery upload | **Done** — `ListItemDialog` (listings) already had it; Spot's camera flow now has a discoverable "Upload from gallery" control too (board asked for it). |
| 7 | Camera zoom glitch | **Done** — reset digital zoom to 1x; crop capture to on-screen aspect. |
| 8 | Geolocation pin | **Done** — real Leaflet map with draggable pin seeded from live GPS (`LocationPinMap`). |
| 9 | Council B2G dashboard | **Deferred** — own project. See spec below. |
| 10 | Error-message bug (w/ Ade) | **Blocked** — waiting on Ade's screenshot. |
| — | Social login — Facebook | **Deferred** — see spec below. |

---

## Original checklist

### Features & Enhancements

- [x] **Image recognition** — Cloudflare Vision Worker wired into Spot.
- [x] **Login session** — short-lived access token with refresh. Verify the effective deployment settings.
- [x] **Social login** — Google done; Facebook deferred.
- [x] **SEO / crawlability** — meta + JSON-LD + opt-in prerender. Landing + a few static pages.
- [x] **Discoverability** — public `/browse` without signup.
- [x] **Gallery upload** — listings (existing) + Spot (new).

### Bugs

- [x] **Camera zoom glitch** — fixed (zoom reset + aspect-correct crop).
- [x] **Geolocation bug** — real map pin on the live GPS spot, not the profile address.
- [ ] **Error-message bug (w/ Ade)** — waiting on the screenshot.

### New Build

- [ ] **Council B2G dashboard** — fly-tipping reports per neighbourhood/ward + item-exchange flows.

---

# Cloudflare Vision Worker — how it works & what's left

**The pieces**

- `workers/imgrc/worker.js` — Cloudflare Worker. `POST` a multipart form with an
  `image` file (≤ 1.5 MB); it calls Cloudflare Workers AI
  (`@cf/meta/llama-3.2-11b-vision-instruct`, a vision LLM on Cloudflare's edge GPUs)
  and returns `{ success, data: { item_type, condition, reusable, suggested_category, notes } }`.
- `workers/imgrc/wrangler.toml` — deploy config. The `[ai]` binding gives the worker
  the AI model access.
- Smart Spot compresses the photo and posts it to `/found-items/vision` using the current app session. The API supplies a fixed prompt. The internal tool uses the same endpoint and requires a current administrator role for custom prompts.
- Configure `VISION_WORKER_URL` on the API with the matching environment’s HTTPS Worker endpoint. Set `VISION_WORKER_SECRET` on the API and as a Worker secret with the same dedicated 32-byte lowercase hexadecimal value. Use a distinct Worker and secret for staging.
- Coordinate the Worker and API releases before enabling `VITE_ENABLE_SMART_SPOT` in the frontend. The default staging build keeps Smart Spot disabled. Manual posting remains available.

---

# Google sign-in — Google Cloud setup

The flow: the frontend uses **Google Identity Services** to get an **ID token**,
POSTs it to `POST /auth/google`, and the backend verifies it with
`google-auth-library` against `GOOGLE_CLIENT_ID`, then issues our normal JWT pair.
One OAuth **Web** client ID is shared by both sides.

**In Google Cloud console (console.cloud.google.com):**

1. Create / pick a project (e.g. "TruCycle").
2. **APIs & Services → OAuth consent screen**
   - User type: **External**. Publish it (or add testers while in "Testing").
   - App name, support email, logo, app domain (`trucycle.co.uk`), privacy &
     terms URLs (`/privacy`, `/terms`).
   - Scopes: the defaults `openid`, `email`, `profile` are enough — no
     verification review needed for those.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**.
   - **Authorised JavaScript origins** (this is what GIS checks):
     - `http://localhost:5173`
     - `http://localhost:4173`
     - `https://trucycle-stage.up.railway.app` (or the real stage domain)
     - `https://trucycle.co.uk`
     - `https://www.trucycle.co.uk`
   - **Authorised redirect URIs**: none needed for the ID-token flow — leave empty.
   - Save. Copy the **Client ID** (looks like `xxxx.apps.googleusercontent.com`).
     You do **not** need the client secret for this flow.
4. Set the env vars to that **same** client ID:
   - Backend (`backend-api`): `GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com`
   - Frontend (`trucycle`): `VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com`
5. Redeploy both. The button appears automatically once `VITE_GOOGLE_CLIENT_ID` is set.

**Behaviour**
- Google sign-in requires a verified email claim. A new account or link also requires a Gmail address or a signed Google Workspace hosted-domain claim.
- An active password account with the eligible email can link to the Google subject. Pending or suspended accounts and accounts linked to a different subject are rejected.
- An existing Google identity is matched by its linked subject. Account status is checked at sign-in.
- The default staging frontend build clears `VITE_GOOGLE_CLIENT_ID`. Enable Google in a reviewed staging build with a matching backend audience and the verified staging origin.
- `user.google_id` is managed by migration `1700000000027`. Check the target migration ledger and use the normal release migration process.

---

# Prerender & hosting (SEO)

**What was added**
- `index.html`: `<noscript>` landing fallback inside `#root`, plus WebSite +
  Organization JSON-LD and complete OG/Twitter meta.
- `scripts/prerender.mjs` + `npm run build:prerender`: after a normal build, serves
  `dist/` as a SPA, loads each public route in headless Chromium, and writes the
  fully-rendered HTML back to `dist/<route>/index.html`. The client bundle still
  boots and takes over (`createRoot` clears `#root` first — no hydration step, no
  mismatch). Routes: `/`, `/browse`, `/privacy`, `/terms`, `/cookies`.
- Plain `npm run build` is unchanged — prerender is opt-in.

**To enable in production**
1. Change the Railway build command to `npm run build:prerender` (it needs
   `puppeteer`'s Chromium; Railway's Nixpacks usually provides the system libs,
   otherwise add `chromium` to the Nix packages).
2. Confirm the host serves a **SPA fallback** (any unknown path → `index.html`,
   HTTP 200) so client routes and the prerendered `dist/browse/index.html` both
   resolve.
3. Confirm `/robots.txt` and `/sitemap.xml` are reachable in prod.

**If puppeteer in CI is a problem**: the `<noscript>` + JSON-LD already make the
page reasonably crawlable (Googlebot renders JS). Prerender is the upgrade, not a
prerequisite.

---

# Follow-up specs (deferred items)

## Social login — Facebook

- Backend: verify the Facebook access token server-side
  (`GET https://graph.facebook.com/me?fields=id,email,first_name,last_name` +
  an app-token `debug_token` check), then the same find-or-create-by-email /
  link-by-`facebook_id` logic as Google. New nullable `user.facebook_id` column.
- Env: `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`.
- Provider: Meta app with **Facebook Login** product, valid OAuth redirect URIs,
  and **app review for the `email` permission** (Meta requires this before the
  app leaves dev mode).
- Frontend: "Continue with Facebook" button using the JS SDK
  (`FB.login({ scope: 'email' })`), POST the access token to `POST /auth/facebook`.

## Council B2G dashboard

Its own project. Rough shape:
- **Backend**: `council` module — auth for council users (role `council`), scoped to
  a local-authority area; endpoints for fly-tipping reports aggregated by
  ward/neighbourhood (`isFlyTipped` found-items already carry lat/lng + postcode),
  and item-exchange volume by area. Ward boundaries: ONS/OS boundary data,
  reverse-geocode on ingest.
- **Frontend**: separate `features/council` area — map + choropleth by ward, time
  series, export CSV. Reuse `LocationPinMap`/Leaflet + `dataviz`.
