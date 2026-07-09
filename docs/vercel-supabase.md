# Vercel + Supabase Development

Vercel + Supabase is the template's verification stack. It is useful for
checking the app close to a preview deployment, while keeping the production
architecture provider-neutral.

## Non-goals

- Do not migrate auth to Supabase Auth.
- Do not make Vercel the required production target.
- Do not make Supabase the required production database provider.
- Do not run production seed data.

## Local Supabase

Supabase local is used for Postgres. Better Auth remains the authentication
system.

```sh
pnpm supabase:start
pnpm supabase:status
pnpm supabase:stop
```

Default local database URL:

```sh
postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

The helper scripts default to that URL when `DATABASE_URL` is not already set.

## Supabase Development Server

```sh
pnpm dev:supabase
```

This starts Supabase local, exports the local database connection, waits for the
database, runs migrations, seeds local demo users, then starts the API and Web
development servers.

Use the existing Docker Compose flow when you want the smaller local Postgres
fallback:

```sh
pnpm dev
```

## Vercel Development Server

```sh
pnpm dev:vercel
```

This starts Supabase local, runs migrations and local seed, then starts
`vercel dev` on port `3000` by default.

Override the Vercel listen address when needed:

```sh
VERCEL_DEV_LISTEN=3001 WEB_PORT=3001 pnpm dev:vercel
```

## Vercel Project Settings

The repository includes `vercel.json` for a root Vercel project:

- install command: `pnpm install --frozen-lockfile`
- build command: `pnpm build`
- output directory: `apps/web/dist`
- API Functions: root `api/[...route].ts`
- SPA fallback: all non-API paths rewrite to `/index.html`

Set these environment variables in Vercel preview/production:

- `DATABASE_URL`
- `DATABASE_MIGRATION_URL` for migration jobs, if used outside Vercel runtime
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `WEB_ORIGIN`
- `NODE_ENV=production`

For Vercel Functions with Supabase Postgres, use `DATABASE_URL` for the
runtime-safe pooled connection and reserve `DATABASE_MIGRATION_URL` for direct
migration access.

## Verification

```sh
pnpm supabase:verify
pnpm vercel:check
```

`pnpm supabase:verify` requires Docker because Supabase local runs through
containers.

`pnpm vercel:check` verifies the deployment support files and the Vercel CLI.
Set `VERCEL_BUILD=1` in a linked Vercel project to also run `vercel build`.
