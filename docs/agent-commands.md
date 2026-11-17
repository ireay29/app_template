# Agent Commands

This template keeps a small set of predictable commands for coding agents and humans.

## Static Checks

```sh
pnpm agent:static
```

Runs Prettier, ESLint, and TypeScript checks without starting Docker or
PostgreSQL. Use it for early feedback while editing.

ESLint includes checks for Web/API imports, comments in application
implementation files, and effects and timers in product UI. The lint command
also exercises the rules on allowed and rejected examples.

Use literal imports within application code so the linter can resolve
their destination. List modules individually when Vite glob imports or
direct filesystem imports would hide that boundary.

## Fast Loop

```sh
pnpm agent:quick
```

Runs `agent:static` first. After the checks pass, it starts PostgreSQL through
Docker Compose, waits for readiness, runs migrations, and runs the Vitest
suites, including database-backed API tests.
For browser flows that need demo users, use `pnpm db:seed` or `pnpm dev`.

`pnpm agent:review` runs `agent:quick`, the production build, and Playwright E2E.
The [review procedure in AGENTS.md](../AGENTS.md#セルフレビュー) describes how
to request a subagent review.

## Full Verification

```sh
pnpm agent:verify
```

Starts PostgreSQL through Docker Compose, waits for readiness, runs migrations,
then runs the same checks used by CI, including coverage, production build, and
Playwright E2E. When Playwright starts a new server locally, `pnpm dev` seeds
demo data. If it reuses a running server, the database must already contain
that data. In CI the workflow seeds the database before Playwright starts.

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

## Terraform scaffold

```sh
pnpm terraform -- alicloud/sandbox init -backend=false -input=false -lockfile=readonly
pnpm terraform -- alicloud/sandbox validate
pnpm terraform:fmt
pnpm terraform:wrapper:test
pnpm terraform:check
```

`terraform:check` is an independent gate. It runs wrapper tests, recursive
format checking, and the sandbox `init -backend=false` / `validate` path. It is
not included in `pnpm check` or `pnpm run ci` until provider download and ordinary
CI integration are decided by a follow-up issue.

The wrapper and `terraform:fmt` require the CLI version in
`.terraform-version`, reject absolute and traversal paths, prevent symlink
escape from `infra/terraform/stacks`, and do not print credentials. The sandbox
validation must not be followed by a real `plan` or `apply`; initialize the OSS
backend with `-reconfigure -backend-config=backend.hcl` first.

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

## Browser Evidence

Choose the test tag for the behavior in the
[Feature Map](implementation-status.md#feature-map):

```sh
pnpm test:e2e --grep @account-switch
pnpm agent:evidence --grep @account-switch
```

The regular run retains screenshots, videos, and traces from failed attempts,
including a local failure with no retry. The evidence command also records
successful attempts and builds a report. Open it with
`pnpm exec playwright show-report`.

Account switching and maintenance tests write `observed-states.mmd` under
`test-results/` and attach it to the HTML report when one is generated. The
statechart records each state after its assertions pass, so a failed test
shows the states it actually reached. Use the trace to inspect DOM, network
activity, and the failure. The CI jobs upload their Playwright reports under
`playwright-node-22.x` and `playwright-node-24.x` for seven days.

## Formal Verification

```sh
pnpm verify:tla
pnpm verify:lean
```

Run the relevant check when changing a modeled flow or business rule. See
[Formal Verification](formal-verification.md) for tool setup, sample properties,
and how to reproduce a counterexample in an application test.

## Cleanup

```sh
pnpm clean
```

Removes build, coverage, and Playwright output directories.

## Before Finishing

```sh
pnpm agent:status
```

Follow the [review procedure in AGENTS.md](../AGENTS.md#セルフレビュー) for the
required checks and subagent review. For application changes, `pnpm agent:verify`
includes the Playwright E2E run.
