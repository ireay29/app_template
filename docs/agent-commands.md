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
