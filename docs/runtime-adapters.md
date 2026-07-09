# Runtime Adapters

The API app is runtime-neutral. Runtime-specific behavior belongs in thin
entrypoints.

## Boundaries

- `apps/api/src/app.ts`: Hono app wiring, middleware, route registration, and
  error handling.
- `apps/api/src/index.ts`: Node/container server startup, bind address, port,
  and shutdown handling.
- `api/[...route].ts`: Vercel Functions handler export.
- `apps/api/src/config/env.ts`: runtime configuration parsing.
- `apps/api/drizzle.config.ts`: migration-time database configuration.

Business logic, repositories, presenters, route schemas, and services must not
depend on Vercel, Supabase, AWS, Alibaba Cloud, Kubernetes, or Docker APIs.

## Supported Runtime Shapes

### Node / Container

The container runtime runs:

```sh
node apps/api/dist/index.js
```

It listens on `HOST` and `PORT`, logs to stdout/stderr, and closes the database
pool on `SIGINT` or `SIGTERM`.

### Vercel Functions

The Vercel handler imports the same Hono app and exports HTTP method handlers.
It must not call `listen` or start a long-running server.

### Future Runtimes

Future Lambda, Function Compute, or Kubernetes-specific entrypoints should:

- import the existing Hono app
- keep provider code in a small runtime file
- preserve `/api/*` paths
- keep Better Auth as the auth system unless a separate architecture decision
  changes it
- keep `pnpm openapi:check` passing

## Checklist For A New Runtime

1. Confirm `GET /api/health` works without a database.
2. Confirm `GET /api/ready` reports database connectivity when configured.
3. Confirm `/api/auth/*` works with `BETTER_AUTH_URL` and `WEB_ORIGIN`.
4. Confirm `/api/openapi.json` and `pnpm openapi:check` still work.
5. Confirm migrations are run outside normal process startup.
6. Document any provider-specific environment variables.
