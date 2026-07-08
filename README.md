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
pnpm agent:quick
pnpm agent:verify
pnpm fix
pnpm clean
```

Docker is required for the local PostgreSQL service used by auth, notes, API
tests, and E2E tests.

`pnpm dev` starts PostgreSQL, waits for readiness, runs migrations, and starts
the API and web app. Open the first screen at http://localhost:3000.

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
pnpm db:studio
pnpm db:reset
```

- Local PostgreSQL runs through Docker Compose on `localhost:${POSTGRES_PORT:-15432}`.
- `apps/api/drizzle.config.ts` reads `DATABASE_URL`.
- Keep `DATABASE_URL` aligned with any `POSTGRES_*` overrides in `.env`.
- `BETTER_AUTH_URL` and `WEB_ORIGIN` default to `http://localhost:3000` so
  auth cookies work through the local `/api/*` proxy.
- Better Auth is mounted at `/api/auth/*`.
- Protected API calls must include cookies with `credentials: "include"`.

## Apps

- Web: http://localhost:3000
- API: http://localhost:8787
- API docs: http://localhost:8787/api/docs
- OpenAPI JSON: http://localhost:8787/api/openapi.json

The web app proxies `/api/*` to the API server during local development.

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
PostgreSQL service, migrates the database, installs Playwright Chromium, and
runs the full local check.
