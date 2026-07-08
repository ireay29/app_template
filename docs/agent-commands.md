# Agent Commands

This template keeps a small set of predictable commands for coding agents and humans.

## Fast Loop

```sh
pnpm agent:quick
```

Starts PostgreSQL through Docker Compose, waits for readiness, runs migrations,
then runs formatting check, ESLint, TypeScript, and unit tests.

## Full Verification

```sh
pnpm agent:verify
```

Starts PostgreSQL through Docker Compose, waits for readiness, runs migrations,
then runs the same checks used by CI, including coverage, production build, and
Playwright E2E.

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
