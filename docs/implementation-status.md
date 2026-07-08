# Implementation Status

This repository is a full-stack TypeScript app template. It is intended to be
useful immediately after cloning, while still being small enough to understand
quickly.

## Current Scope

- `apps/web`: Vite, React, TypeScript, Tailwind CSS, Material UI, and
  shadcn/ui-compatible primitives.
- `apps/api`: Hono, Zod OpenAPI routes, Swagger UI, Better Auth, PostgreSQL,
  and Drizzle ORM.
- `e2e`: Playwright coverage for the dashboard, API health state, sign-up,
  authenticated note creation, and sign-out.
- `.github/workflows/ci.yml`: CI on Node.js 22.x and 24.x with PostgreSQL,
  migrations, Playwright browser install, and `pnpm ci`.

## Feature Map

| Area                | Entry Point                                                | Notes                                                              |
| ------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------ |
| Web shell           | `apps/web/src/App.tsx`                                     | Shows API health, design-system examples, and the auth notes demo. |
| Auth demo UI        | `apps/web/src/features/auth/AuthNotesDemo.tsx`             | Presentation for sign-up, sign-in, sign-out, and note creation.    |
| Auth demo state     | `apps/web/src/features/auth/useAuthNotesDemo.ts`           | Session, form, feedback orchestration, and note side effects.      |
| Auth demo support   | `apps/web/src/features/auth/auth-notes-demo-*.ts`          | Demo form schemas, query keys, submit state, and messages.         |
| Protected route     | `apps/web/src/features/auth/ProtectedRoute.tsx`            | Standard authenticated page guard for React Router routes.         |
| Admin page          | `apps/web/src/pages/admin/AdminPage.tsx`                   | Protected page and admin-only API example.                         |
| Web API clients     | `apps/web/src/lib/api.ts`, `apps/web/src/lib/notes-api.ts` | Fetch wrappers for health and authenticated notes.                 |
| Web fetch helpers   | `apps/web/src/lib/fetch-json.ts`                           | Shared JSON fetch and API error handling for hand-written clients. |
| Generated API types | `apps/web/src/generated/openapi.ts`                        | Generated from the Hono OpenAPI document; do not edit by hand.     |
| Typed API client    | `apps/web/src/lib/api/client.ts`                           | `openapi-fetch` client configured for same-origin API calls.       |
| Typed API queries   | `apps/web/src/lib/api/query.ts`                            | `openapi-react-query` bridge for TanStack Query usage.             |
| Auth client         | `apps/web/src/lib/auth-client.ts`                          | Better Auth React client.                                          |
| API app             | `apps/api/src/app.ts`                                      | Hono app wiring, middleware, dependency setup, and error handling. |
| API route wiring    | `apps/api/src/app-routes.ts`                               | Registers OpenAPI route handlers and docs.                         |
| API dependencies    | `apps/api/src/app-dependencies.ts`                         | Default dependency composition for auth, DB health, and notes.     |
| Auth server         | `apps/api/src/auth/auth.ts`                                | Better Auth with the Drizzle adapter.                              |
| Session middleware  | `apps/api/src/middleware/session.ts`                       | Loads the Better Auth session into Hono context.                   |
| Notes domain        | `apps/api/src/notes`                                       | Notes service and repository boundary.                             |
| Users domain        | `apps/api/src/users`                                       | User lookup and role updates for authz and seed scripts.           |
| API presenters      | `apps/api/src/http/presenters.ts`                          | Converts domain/session records into API response shapes.          |
| Database schema     | `apps/api/src/db/schema`                                   | Better Auth tables and the `notes` table.                          |
| Migrations          | `apps/api/drizzle`                                         | Initial Drizzle migration and metadata.                            |
| Seed data           | `apps/api/src/scripts/seed.ts`                             | Local admin/member user creation; refuses production execution.    |

## Runtime Flow

1. The web app runs on `http://localhost:3000`.
2. Vite proxies `/api/*` to the Hono API on `http://localhost:8787`.
3. Better Auth is mounted at `/api/auth/*`.
4. Protected routes use `sessionContext` and return `401` when no session is
   present.
5. Admin-only routes return `403` unless the current user has the `admin` role.
6. Authenticated notes are stored in PostgreSQL through Drizzle ORM.

## Local Setup

Use the root commands unless you are intentionally working inside one package.

```sh
pnpm install
pnpm exec playwright install chromium
cp .env.example .env
pnpm dev
```

`pnpm dev` starts PostgreSQL, waits for readiness, runs migrations, and starts
the API and web app. Open the first screen at `http://localhost:3000`.

Docker is required for the local PostgreSQL service. If a `POSTGRES_*` value in
`.env` is changed, keep `DATABASE_URL` in sync.

To create the default local users after migrations, run:

```sh
pnpm db:seed
```

The default seed users are `admin@example.com` and `member@example.com`, both
using `password1234`. Override them with the `SEED_*` variables documented in
`.env.example`.

## Verification

For normal local review, run:

```sh
pnpm agent:quick
pnpm agent:verify
```

`agent:quick` starts PostgreSQL, waits for readiness, runs migrations, then
checks format, lint, types, and tests. `agent:verify` runs the full local CI
path, including coverage, production builds, and Playwright E2E.

For interactive unit test review, run:

```sh
pnpm test:ui
pnpm test:ui:api
```

The Web Vitest UI uses port `51204`. The API Vitest UI uses port `51205` and
requires the local PostgreSQL service and migrations.

## Extension Points

- Add new API route schemas under `apps/api/src/routes`, then register handlers
  in `apps/api/src/app-routes.ts`.
- Run `pnpm openapi:generate` after changing API route schemas and commit the
  updated `apps/web/src/generated/openapi.ts` file.
- Keep role checks on the API side even when the UI also hides admin-only
  controls.
- Keep DB access behind a repository or service boundary instead of placing
  queries directly in `app.ts`.
- Add new database tables under `apps/api/src/db/schema`, export them from
  `apps/api/src/db/schema/index.ts`, then run `pnpm db:generate`.
- Add app features under `apps/web/src/features/<feature-name>`.
- Keep feature side effects in hooks or feature services; keep components mostly
  presentational.
- Keep reusable UI primitives under `apps/web/src/components/ui`.
- Keep feature-specific components near the feature that owns them.

## Current Known Assumptions

- The template uses email/password auth only.
- The local database is PostgreSQL through Docker Compose.
- Authorization starts with two roles: `admin` and `member`.
- API tests and E2E tests require a migrated database.
- The demo notes feature is intentionally small and exists to prove the auth,
  DB, API, and web integration path.
