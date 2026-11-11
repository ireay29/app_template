# API Authorization

Every endpoint must declare one access level when it is registered. There is no
implicit public mode. Feature registrars receive `RouteRegistrar`, not the raw
Hono app, and register handlers in `apps/api/src/app-routes.ts`.

| Access          | Enforcement                                                                  |
| --------------- | ---------------------------------------------------------------------------- |
| `public`        | Explicitly public; no session or user lookup                                 |
| `authenticated` | Valid session and current user record; missing session returns 401           |
| `admin`         | Same checks plus the current database role must be `admin`; otherwise 403    |
| Undeclared      | Startup validation fails; late raw registrations return 403 before execution |

## Registration

Define request and successful response schemas under `apps/api/src/routes`.
Register them through the common registrar:

```ts
routes.openapi(getNotesRoute, 'authenticated', async (c) => {
  const { authSession } = c.get('principal');
  const notes = await dependencies.notesService.listForUser(authSession.user.id);
  return c.json({ notes: notes.map(toNoteResponse) }, 200);
});
```

The common authorization middleware runs before OpenAPI request validation and
the handler. Protected handlers receive a non-null `principal` with the verified
session and current role. An `admin` handler's role is typed as `admin`.
Authentication and role lookup failures do not execute the handler.

The registrar derives OpenAPI 401/403 responses and the `x-access` extension
from the same access declaration. Do not duplicate these responses or role
checks in individual handlers. Run `pnpm openapi:generate` after contract
changes. `x-access` documents the policy; the server guard enforces it.

Use `routes.on(method, path, access, handler)` only for non-OpenAPI adapters such
as the Better Auth delegate, Swagger UI, or response middleware. Additional
middleware that can return a response must use this API with an explicit access
level so authorization runs before it can short-circuit. The Better Auth delegate is public
so sign-in and callbacks can reach Better Auth's own authentication logic. This
does not authorize additional handlers under `/api/auth/*`.

## Default Denial

`createRouteRegistry` must be constructed on an empty app. It installs the
first middleware and records the actual Hono route entries added by approved
registrations, including the authorization middleware and OpenAPI validators.
At request time it checks matched route entries, not a path-prefix allowlist.

- Direct `app.get`, `app.openapi`, `app.use`, or mounted subapps outside the
  registrar are undeclared and cannot execute handlers.
- A public route does not make an undeclared handler at the same path public.
- Matching declarations with different access levels fail closed with 403.
  Do not overlap a public wildcard delegate with a protected endpoint.
- HEAD follows the corresponding GET policy. CORS preflight is handled by the
  explicitly registered infrastructure middleware; it does not execute a
  business handler. After the declaration guard, CORS ends `/api/*` OPTIONS
  requests with 204, including requests without preflight headers and
  nonexistent paths. Do not use OPTIONS for business handlers. With maintenance
  off, other requests to nonexistent endpoints continue returning 404.

There is no `registry.use` API, including in app composition. The registry
internally installs a closed pre-authorization chain: route declaration checks,
timing, CORS, and maintenance. Configuration supplies only origins and
maintenance settings; it does not accept middleware callbacks. CORS OPTIONS and
maintenance responses can end a declared request before its authorization
middleware. Undeclared entries and conflicting policies are still rejected by
the first guard, before CORS.

Features receive only `registry.routes`. For example, a cache registered with
`routes.on('GET', path, 'authenticated', cacheHandler)` cannot respond until the
session and current user are verified. Use the same access level as the endpoint;
different matching declarations are rejected. This admission check does not make
a shared cache safe for user-specific data: its keys and contents must still
preserve resource ownership.

`registry.assertComplete()` checks all entries before the composed app is
returned; the request guard also rejects raw routes appended afterward. The
guard is application wiring, not a sandbox for malicious application code.

## Ownership and Roles

Access levels cover endpoint admission. Resource ownership remains enforced in
the service/repository boundary. Notes use the verified session's user ID, and
the repository filters by that ID. Request bodies, query parameters, and UI
visibility must not supply or replace the trusted owner identity. An admin has
no implicit access to other users' notes.

An explicit access declaration can still be incorrect for a product's needs.
Review intended permissions when adding an endpoint and add negative tests for
the relevant principals and resources. Keep the `admin`/`member` role model
until a product requirement calls for more complex authorization.

Web protected queries use keys scoped to both user ID and session ID. The shared
`ProtectedQueryBoundary` cancels and removes queries from previous identities;
sign-in, sign-up, and sign-out also discard protected queries before refetching
the session. Use `protectedQueryOptions` with generated query options for new
protected API queries. `/api/me` must match the current session's user ID before
its role can allow a protected page. These client checks complement server-side
authorization and do not replace it.

## Existing Public Surface

- `GET`/`HEAD` health, readiness, maintenance status, and greeting endpoints.
- OpenAPI JSON and Swagger UI.
- Requests delegated to Better Auth at `/api/auth/*`.

The authenticated `/api/me` and notes endpoints, and admin-only summary retain
their existing permissions. Maintenance still runs before session/user lookup:
restricted requests return 503 with Retry-After. Health and maintenance status
remain usable as described in `maintenance.md`.

## Verification

- Type checks reject omitted/invalid access declarations and nullable principal
  use in public handlers.
- Registrar tests cover undeclared handlers/middleware/subapps, wildcard
  collisions, HEAD, 401/403, live role changes, and lookup failures.
- Boundary tests cover the absence of generic pre-authorization registration,
  raw short-circuit middleware, protected cache responses, and public/private
  cache policy collisions.
- Database-backed tests verify session authentication and note isolation,
  including forged owner input, another user promoted to admin, current-role
  demotion, and reuse of a cookie after sign-out.
- The route policy inventory checks every declared endpoint, including public
  adapters absent from OpenAPI, and checks each OpenAPI operation's `x-access`.
  Adding a public endpoint requires an explicit update to the expected policy.
- Playwright checks the public surface, direct unauthenticated requests and
  malformed writes, and member/admin page flows including account switching
  without a page reload.

Use `pnpm agent:quick`, `pnpm test:e2e`, and `pnpm agent:verify` with the local
test database. No new dependency or permission table is needed.
