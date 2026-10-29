# Maintenance Operations

Maintenance has two independent controls: API enforcement and Web delivery.
`MAINTENANCE_MODE=full` alone does **not** change the HTTP status of static Web
pages. Configure the delivery layer before using a full stop in production.

## Modes

| Mode            | Web behavior                                                                                      | API behavior                                          |
| --------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `off` (default) | Normal app                                                                                        | Normal routing and authorization                      |
| `read-only`     | Keep public content and show a notice; disable demo mutation buttons                              | Allow GET/HEAD/OPTIONS; reject other methods with 503 |
| `full`          | Already delivered SPA shows a maintenance notice; delivery layer must return static HTML with 503 | Reject ordinary routes with 503, including auth reads |

The API guard runs before session lookup, request validation, and handlers.
In read-only mode, auth POSTs (sign-in, sign-up, sign-out, and callbacks) are
blocked as well as note mutations. There is no admin bypass. Existing sessions
can still read authorized endpoints. GET handlers must not introduce business
mutations. Better Auth session reads may still refresh session metadata; this
mode is an HTTP-method guard, not a database write lock. If all database access
must stop, use full mode and quiesce background jobs separately.

In every mode, GET/HEAD `/api/health`, `/api/ready`, and `/api/maintenance`
remain available. Readiness still checks the database and reports its actual
result; maintenance is not a liveness or readiness failure. Browser CORS
preflight remains available. Health/status access should also be preserved by
the platform's maintenance switch.

## Settings

Set these in the API environment and restart/redeploy all API instances:

| Variable                          | Default                     | Meaning                                                            |
| --------------------------------- | --------------------------- | ------------------------------------------------------------------ |
| `MAINTENANCE_MODE`                | `off`                       | `off`, `read-only`, or `full`                                      |
| `MAINTENANCE_MESSAGE`             | Japanese maintenance notice | Public message, 1–500 characters                                   |
| `MAINTENANCE_RETRY_AFTER_SECONDS` | `3600`                      | Retry delay, integer from 1 to 86400 seconds                       |
| `MAINTENANCE_ENDS_AT`             | Unset                       | Estimated restoration time, ISO 8601 with timezone                 |
| `MAINTENANCE_INFO_URL`            | Unset                       | Public HTTP(S) status/contact page, ideally independent of the app |

These values are public through `GET /api/maintenance`. Never put internal
details, secrets, or private contact data in them. The status response and
maintenance 503 responses use `Cache-Control: no-store`. Blocked API responses
include `Retry-After` and a JSON body with `code: "MAINTENANCE"`; the contract is
included in OpenAPI. The Web uses the generated client and polls status every
minute and when the window regains focus. Until status is loaded (or when it
cannot be fetched), public content remains available; server enforcement is
authoritative. The notice uses `data-nosnippet`.

The estimated end time is informational. It never automatically reopens the
service. `Retry-After` is a retry hint, not a promise of restoration or a way to
preserve indexing indefinitely.

## Web Delivery Contract

The platform owns the CDN, proxy, load balancer, or static hosting switch. It
must work when the API or database is unavailable. Keep provider-specific code
outside application services/repositories, following `deployment-contract.md`.

For a full stop:

1. Publish `apps/web/dist/maintenance.html` independently of the API. Its source
   is `apps/web/public/maintenance.html`. Before publishing, customize the text
   with the estimated restoration or next update time and a public contact or
   status URL. It uses inline CSS and no JavaScript or external assets.
2. At each affected **original page URL**, serve this body with HTTP **503**,
   `Content-Type: text/html; charset=utf-8`, `Retry-After`, and
   `Cache-Control: no-store`. Do not redirect all URLs to `/maintenance.html` or
   return the maintenance body with 200. Handle deep links and HEAD too.
3. Serve `/robots.txt` normally with **200** and the existing crawl policy. The
   template ships an allow-all public-site baseline. Do not switch to
   `Disallow: /`, a 503, or an SPA HTML fallback. Preserve any project-specific
   rules and sitemap declarations. Do not add `noindex`/`X-Robots-Tag: noindex`
   as a temporary maintenance measure for previously public URLs.
4. Exempt `/api/*` from the Web HTML substitution: forward it to the guarded API.
   When the origin is offline, the platform must supply its own uncached JSON
   503 responses and keep health/status checks meaningful. Do not cache errors
   or change health probes to point at the maintenance HTML.
5. Reserve `/robots.txt` and the maintenance asset ahead of the SPA fallback.
   Purge stale cached pages/errors when entering and leaving maintenance; check
   the public domain, not only the origin. Keep the status/contact destination
   outside the stopped route set.

This repository supplies the assets and API behavior, not a production CDN
adapter. Vite dev/preview and the current Vercel configuration continue serving
Web assets normally until a delivery adapter is configured. No SSR or Web
container is required by this contract.

For a longer pause, prefer read-only mode and leave original public content
accessible with 200. If that is impossible, Google's guidance offers an
indexable homepage with 200 as a placeholder; it does not guarantee preservation
of all other URLs. Do not replace every URL's content with the same 200 notice.

## Runbook

1. Decide which operations must stop and whether public content can remain.
   Prefer `read-only`. Use `full` only for a short emergency/maintenance window.
2. Set the public message, retry delay, restoration estimate, and independent
   contact/status URL. For full mode, customize and publish the static HTML too.
3. Enable the API mode on every instance. Enable the platform switch for a full
   stop. Coordinate background jobs, webhooks, and in-flight requests separately:
   this guard neither drains them nor cancels work already in progress.
4. Run the HTTP checks below on the public domain, including a deep link.
5. Monitor elapsed downtime and recovery status through the platform. Configure
   an alert before the planned end and when the estimate is exceeded. This
   template does not provision a monitor or send alerts. Review prolonged full
   stops early and move to restricted operation wherever possible. Google cites
   1–2 days for emergency 503 responses and at most a few days for a full stop;
   these are not guaranteed safe indexing windows.
6. After repair, verify dependencies and protected reads/writes. Explicitly set
   the API mode to `off`, restore normal Web delivery, and purge stale cached
   responses. Confirm original URLs return normal content/status and no
   maintenance `Retry-After` header. Confirm robots policy is unchanged. Review
   Search Console for crawl/indexing effects when relevant.

## Verification

```sh
# Inspect status, headers, and body at the PUBLIC delivery layer.
curl -i https://example.com/
curl -i https://example.com/a-real-public-deep-link
curl -I https://example.com/a-real-public-deep-link
curl -i https://example.com/robots.txt
curl -i https://example.com/api/maintenance
curl -i https://example.com/api/health
curl -i https://example.com/api/ready
# An empty unauthenticated POST should be rejected by the guard with 503.
curl -i -X POST https://example.com/api/notes
```

In full mode, affected Web URLs must return HTML with 503 and the configured
headers, while robots returns its plain text policy with 200. In read-only
mode, public pages return normal content with 200 and writes return JSON 503.
Check both a crawler user agent and a browser; use the same policy for each.
After disabling maintenance, the unauthenticated POST should again return 401.

`pnpm agent:quick`, `pnpm test:e2e`, and `pnpm agent:verify` cover config
validation, guard ordering, auth/write blocking, status/health exceptions,
notice/recovery states, and static assets. E2E UI mode tests stub the status
endpoint; API tests exercise the actual guard. Public delivery-layer HTTP 503,
cache behavior, and platform alerts require checks against the chosen adapter.

For isolated local verification, use `POSTGRES_PORT` and a matching
`DATABASE_URL` for the database, `WEB_PORT` with matching auth origins for the
Web, and `PORT` for the API. The Vite development proxy follows `PORT`.

## Source

- [Google Search Central: Pause or disable a website](https://developers.google.com/search/docs/crawling-indexing/pause-online-business)
- [Google Search Central: Planned site downtime](https://developers.google.com/search/blog/2011/01/how-to-deal-with-planned-site-downtime)
