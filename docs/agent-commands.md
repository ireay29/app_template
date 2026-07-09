# Agent Commands

This template keeps a small set of predictable commands for coding agents and humans.

## Fast Loop

```sh
pnpm agent:quick
```

Starts PostgreSQL through Docker Compose, waits for readiness, runs migrations,
then runs formatting check, ESLint, TypeScript, and unit tests. It does not
seed demo data; use `pnpm db:seed` or `pnpm dev` when a browser flow needs the
standard admin/member demo users.

## Full Verification

```sh
pnpm agent:verify
```

Starts PostgreSQL through Docker Compose, waits for readiness, runs migrations,
then runs the same checks used by CI, including coverage, production build, and
Playwright E2E. The Playwright server command seeds local demo data before
browser tests.

## Vercel and Supabase

```sh
pnpm dev:supabase
pnpm dev:vercel
pnpm supabase:verify
pnpm vercel:check
```

`dev:supabase` starts Supabase local Postgres, migrates, seeds, and starts the
normal API and Web dev servers. `dev:vercel` uses the same database setup and
then starts `vercel dev`.

`supabase:verify` requires Docker. `vercel:check` does not run `vercel build`
unless `VERCEL_BUILD=1` is set in a linked Vercel project.

## Deployment Support

```sh
pnpm deploy:check
pnpm container:smoke
```

`deploy:check` verifies that the provider-neutral deployment support files are
present. `container:smoke` builds the API container and checks `/api/health`;
it requires Docker but does not require a database.

## Fixes

```sh
pnpm fix
```

Runs Prettier and ESLint auto-fixes.

## Interactive Tests

```sh
pnpm test:ui
pnpm test:ui:api
```

Opens Vitest UI for the Web package on port `51204` or API package on port
`51205`. The API UI expects PostgreSQL to be running and migrated.

## Cleanup

```sh
pnpm clean
```

Removes build, coverage, and Playwright output directories.

## Before Finishing

```sh
pnpm agent:status
pnpm agent:verify
```
