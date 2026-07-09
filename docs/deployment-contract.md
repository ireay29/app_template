# Deployment Contract

This repository keeps deployment contracts provider-neutral. Vercel and
Supabase are supported as a verification stack, but the production target can
be AWS, Alibaba Cloud, another container platform, or Kubernetes.

## Responsibilities

- The app owns runtime ports, health endpoints, environment variables,
  migrations, seed safety, logs, and graceful shutdown.
- The platform owns DNS, TLS, load balancing, secrets storage, networking,
  managed database choice, autoscaling, and observability backends.
- Provider-specific code must stay in thin runtime entrypoints or deployment
  examples, not in domain, service, repository, or route handler code.

## Runtime Contract

- API runtime command: `node apps/api/dist/index.js`.
- API bind address: `HOST`, default `0.0.0.0`.
- API port: `PORT`, default `8787`.
- Web static output: `apps/web/dist`.
- API base path: `/api/*`.
- API liveness: `GET /api/health`.
- API readiness: `GET /api/ready`.
- Runtime logs must go to stdout/stderr.
- Runtime must handle `SIGINT` and `SIGTERM` and close the database pool.
- The app must not run migrations or seed data during normal process startup.

## Environment Variables

Required for production-like API runtime:

- `NODE_ENV=production`
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `WEB_ORIGIN`

Optional runtime variables:

- `HOST`
- `PORT`
- `WEB_PORT`
- `POSTGRES_*` values for Docker Compose local development
- `SEED_*` values for local seed customization

`DATABASE_URL` is the runtime database connection. In serverless or
auto-scaling environments, it should point to the runtime-safe pooled
connection when the provider offers one.

`DATABASE_MIGRATION_URL` is only for schema migration and Drizzle Kit. It can
point to a direct database connection. If omitted, migration commands fall back
to `DATABASE_URL`. Do not pass migration-only database credentials to normal
runtime containers or serverless functions.

## Database Operations

- Run migrations with `pnpm db:migrate`.
- Run local seed with `pnpm db:seed`.
- Do not run seed in production. The seed script refuses `NODE_ENV=production`.
- Production deployments should run migrations as an explicit release step or
  one-shot job before new runtime instances take traffic.
- Runtime instances should only start the API process.

## Verification Stack

Vercel + Supabase is a reference verification stack:

- Supabase local provides a Postgres-compatible local database.
- Vercel dev provides a same-origin Web + API runtime close to Vercel preview.
- Auth remains Better Auth. Supabase Auth is not part of this template.

See `docs/vercel-supabase.md` for concrete commands.

## Container Contract

The API container is the portable production baseline. Web delivery can be
static hosting, CDN, or a separate container depending on product requirements.

The container smoke test must verify `GET /api/health` without requiring a
database. Readiness checks that include the database belong to environments
where a database is available.

## Kubernetes Examples

Files under `deploy/k8s/example` are samples only. They are not production
ready and intentionally omit provider-specific TLS, WAF, IAM/RAM, secret
manager, ingress controller, and autoscaling settings.
