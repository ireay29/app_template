# App Template

A TypeScript app template with a Vite React frontend and a Hono API backend.

## Stack

- pnpm workspace
- Vite, React, TypeScript, Tailwind CSS
- Material UI, shadcn/ui-compatible components
- Hono, Zod, OpenAPI, Swagger UI
- PostgreSQL, Drizzle ORM, Better Auth
- ESLint, Prettier, Vitest, Playwright
- GitHub Actions CI

## Commands

```sh
pnpm install
pnpm exec playwright install chromium
cp .env.example .env
pnpm dev
pnpm dev:supabase
pnpm dev:vercel
pnpm agent:quick
pnpm agent:verify
pnpm fix
pnpm clean
```

Docker is required for the local PostgreSQL service used by auth, notes, API
tests, E2E tests, and Supabase local.

`pnpm dev` starts PostgreSQL, waits for readiness, runs migrations, seeds the
local admin/member demo data, and starts the API and web app. Open the first
screen at http://localhost:3000.

`pnpm dev:supabase` uses Supabase local Postgres instead of the smaller Docker
Compose Postgres service. `pnpm dev:vercel` uses Supabase local Postgres and
Vercel dev for a same-origin Web + API verification path.

If port 3000 is already in use, set `WEB_PORT` and align the auth origins:

```sh
WEB_PORT=3001 BETTER_AUTH_URL=http://127.0.0.1:3001 WEB_ORIGIN=http://127.0.0.1:3001 pnpm dev
```

## Verification

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm test:ui
pnpm test:ui:web
pnpm test:ui:api
pnpm build
pnpm test:e2e
pnpm check
```

The DB-backed commands (`pnpm test`, `pnpm test:coverage`, `pnpm check`, and
`pnpm ci`) expect PostgreSQL to be running and migrated. For local agent or
human verification, prefer `pnpm agent:quick` or `pnpm agent:verify`; both start
PostgreSQL, wait for readiness, and run migrations before checking the app.

`pnpm test:ui` opens the Web Vitest UI on port `51204`. Use
`pnpm test:ui:api` for API tests on port `51205`; API tests require the local
PostgreSQL service and migrations.

## Database and Auth

```sh
pnpm db:up
pnpm db:down
pnpm db:wait
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:studio
pnpm db:reset
```

- Local PostgreSQL runs through Docker Compose on `localhost:${POSTGRES_PORT:-15432}`.
- Supabase local Postgres runs on `127.0.0.1:54322` by default.
- API runtime reads `DATABASE_URL`.
- `apps/api/drizzle.config.ts` reads `DATABASE_MIGRATION_URL` when set and
  falls back to `DATABASE_URL`.
- Keep `DATABASE_URL` aligned with any `POSTGRES_*` overrides in `.env`.
- `BETTER_AUTH_URL` and `WEB_ORIGIN` default to `http://localhost:3000` so
  auth cookies work through the local `/api/*` proxy.
- Better Auth is mounted at `/api/auth/*`.
- Protected API calls must include cookies with `credentials: "include"`.
- Better Auth origin checks are enforced in production. Local development and
  tests disable the origin check because Vite proxy ports are intentionally
  configurable.
- Local seed creates `admin@example.com` and `member@example.com` with
  `password1234`, plus one demo note for each user. Seed refuses production
  execution.

## Vercel and Supabase Verification

Vercel + Supabase is supported as a verification stack, not as a required
production target. Auth remains Better Auth; Supabase Auth is not used.

```sh
pnpm supabase:start
pnpm dev:supabase
pnpm dev:vercel
pnpm supabase:verify
pnpm vercel:check
```

Supabase local uses `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
by default. Runtime database access uses `DATABASE_URL`; migration commands use
`DATABASE_MIGRATION_URL` when it is set.

## Apps

- Web: http://localhost:3000
- API: http://localhost:8787
- API docs: http://localhost:8787/api/docs
- OpenAPI JSON: http://localhost:8787/api/openapi.json
- API liveness: http://localhost:8787/api/health
- API readiness: http://localhost:8787/api/ready

The web app proxies `/api/*` to the API server during local development.

## Deployment

- Provider-neutral deployment contract: `docs/deployment-contract.md`
- Vercel + Supabase verification guide: `docs/vercel-supabase.md`
- Runtime adapter boundaries: `docs/runtime-adapters.md`
- API container build: `Dockerfile.api`
- Kubernetes examples: `deploy/k8s/example`

The API container is the portable production baseline for AWS ECS/Fargate,
Alibaba ACK, Kubernetes, or VM-like targets. The Web app remains a static build
under `apps/web/dist` and can be served by a CDN, static hosting, or a separate
container depending on product requirements.

## Implementation Guide

- Current implementation map: `docs/implementation-status.md`
- Frontend component and design-system rules: `docs/frontend-system.md`
- Agent command reference: `docs/agent-commands.md`

## Design Systems

- Material UI theme provider: `apps/web/src/providers/design-system-provider.tsx`
- shadcn/ui config: `apps/web/components.json`
- shadcn/ui primitives: `apps/web/src/components/ui`
- Shared class helper: `apps/web/src/lib/utils.ts`
- Use shadcn/ui-compatible primitives for app-specific UI surfaces.
- Use Material UI for mature, high-complexity widgets or examples that benefit
  from the MUI ecosystem.

## CI

GitHub Actions runs `pnpm ci` on Node.js 22.x and 24.x. The CI job starts a
PostgreSQL service, migrates and seeds the database, installs Playwright
Chromium, and runs the full local check.
