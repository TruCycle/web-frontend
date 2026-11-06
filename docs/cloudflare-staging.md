# Cloudflare Worker staging for frontend review

This is an offline scaffold, not a deployment. The frontend is built into `dist-staging` and served by a separate static-assets Worker named `trucycle-web-staging`. No production route, `workers.dev` endpoint or version-preview endpoint is enabled in the committed configuration. Nothing here provisions Cloudflare Access, a backend, a database or credentials.

The NestJS API remains a separate runtime, for example a dedicated Railway staging service. Its database, auth signing secrets, transactional email recipients/provider, media resources and any external service credentials must be isolated from production. A staging frontend name alone cannot establish that isolation.

## Offline checks and build

Run from the frontend repository with already-installed dependencies:

```powershell
node --test scripts/build-staging.test.mjs
```

Before building, the responsible owner must verify the staging API/service resources, then set three explicit staging variables. The example domains below are placeholders and are not provisioned:

```powershell
$env:STAGING_API_ORIGIN = 'https://api-staging.example.test'
$env:STAGING_WS_ORIGIN = 'https://api-staging.example.test'
$env:STAGING_RESOURCE_ISOLATION_CONFIRMED = 'isolated-staging-only'
node scripts/build-staging.mjs
```

The API origin must use HTTPS. Socket.IO may use HTTPS or WSS. Both must be bare origins without a path, credentials, query or fragment and must have a separate `staging` hostname label or segment. Known production hosts and `prod`, `production` or `live` hostname segments are rejected. If the existing isolated environment has an opaque hostname, create/review a staging-labelled alias before using this scaffold. Offline checks cannot verify DNS, redirects or actual account-side resource isolation: the attestation records a human prerequisite, not proof.

The script validates first, runs TypeScript and Vite locally, and writes only `dist-staging` build output plus normal TypeScript build metadata. Vite uses `envDir: false`, so repository `.env*` files are not loaded. Every inherited `VITE_*` variable is removed, including unknown keys; the script then supplies an explicit browser-variable allowlist derived from the staging origins. Do not bypass the script by invoking Vite directly.

Analytics, Google OAuth, Cloudinary uploads and the existing Vision Worker are disabled for this initial scaffold. No production analytics/media/OAuth credentials are copied. Email/password auth needs the separate staging backend. This is not yet a full media/Google-sign-in test environment. Optional integrations need their own reviewed staging resources before they can be enabled. The existing app still contains production canonical/social links and its current default-search behaviour; the build does not rewrite product code. Staging output gets `robots.txt` disallowing crawling and an `X-Robots-Tag` header; these are indexing controls, not access controls.

## Mandatory account steps before deployment

1. Confirm the intended Cloudflare account and separate staging Worker identity. Do not bind this scaffold to `trucycle.co.uk`, `www.trucycle.co.uk`, the production API or the existing image-recognition Worker.
2. Provision/verify the isolated API runtime, synthetic database/fixtures, staging JWT secrets and sandboxed outbound services. Confirm the API and socket endpoints do not redirect to production. Do not copy production user data or provider secrets.
3. Select a dedicated staging hostname and create a Cloudflare Access self-hosted application covering that entire hostname, including assets/deep links. Use an explicit tester allowlist and default deny. Confirm anonymous and non-allowlisted users are blocked. Access protection is an account-side prerequisite; the Wrangler file does not provide it.
4. Keep `workers_dev: false` and `preview_urls: false` so alternate Worker URLs cannot bypass the chosen Access application. Add only the reviewed staging custom domain to `routes` after Access is configured. For a Workers Custom Domain, the route entry takes the form `{ "pattern": "<reviewed staging hostname>", "custom_domain": true }`. No route is selected automatically by this scaffold.
5. Configure the isolated NestJS API CORS allowlist with the exact HTTPS staging frontend origin. Confirm preflight requests permit the app's actual Authorization/Content-Type headers, and configure Socket.IO's origin allowlist consistently. Avoid wildcard CORS for credentialed requests. The direct API remains responsible for application auth/authorization; frontend Access does not protect a separately reachable API. Review API network access separately. Cross-origin Access protection on the API needs an explicit cookie/preflight/socket design before use; this scaffold does not implement an Access proxy.
6. Inspect the built assets and network configuration, run the offline checks, and prepare the exact config/artifact for review. Obtain the required deployment approval before running a deployment command. Wrangler/account tooling is not installed or invoked by the build script.

After the config and artifact have been reviewed and deployment approved, the deployment command is:

```powershell
wrangler deploy --config workers/staging-web/wrangler.json
```

That command is documented for the later approved execution step and has not been run as part of this scaffold. Use a reviewed Wrangler installation/version and the intended staging account; never allow an unattended implicit install or selection of an account.

## Verification after approved deployment

Verify Access denial first, then tester access, `/login` and SPA deep-link reloads, static assets and indexing headers. With synthetic staging users, verify API requests, auth, CORS and socket reconnection. Inspect network traffic for production API, analytics, media and Vision requests. Confirm writes appear only in the isolated staging database and no real transactional emails/uploads occur. Capture the deployment identifier and tested build; a successful upload alone is not an end-to-end pass. Google OAuth and media flows remain untested while disabled.

## Official references

- [Workers static assets SPA routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)
- [Wrangler configuration: assets, routes, workers.dev and preview URLs](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Cloudflare Access self-hosted applications](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/)

Configuration guidance was checked against these official pages on 1 November 2026. Account-side configuration and live behaviour remain unverified.


## Hosted connection (6 Nov 2026)

Cloudflare Workers Builds deploys `trucycle-web-staging` from this branch to `staging.trucycle.co.uk` (behind Cloudflare Access). The staging API is `https://api-staging.trucycle.co.uk` on the Railway `staging` environment.
