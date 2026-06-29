# App Template

A TypeScript app template with a Vite React frontend and a Hono API backend.

## Stack

- pnpm workspace
- Vite, React, TypeScript, Tailwind CSS
- Material UI, shadcn/ui-compatible components
- Hono, Zod, OpenAPI, Swagger UI
- ESLint, Prettier, Vitest, Playwright
- GitHub Actions CI

## Commands

```sh
pnpm install
pnpm exec playwright install chromium
pnpm dev
pnpm agent:quick
pnpm agent:verify
pnpm fix
pnpm clean
```

## Verification

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm build
pnpm test:e2e
pnpm check
```

## Apps

- Web: http://localhost:5173
- API: http://localhost:8787
- API docs: http://localhost:8787/api/docs
- OpenAPI JSON: http://localhost:8787/api/openapi.json

The web app proxies `/api/*` to the API server during local development.

## Design Systems

- Material UI theme provider: `apps/web/src/providers/design-system-provider.tsx`
- shadcn/ui config: `apps/web/components.json`
- shadcn/ui primitives: `apps/web/src/components/ui`
- Shared class helper: `apps/web/src/lib/utils.ts`

## CI

GitHub Actions runs `pnpm ci` on Node.js 22.x and 24.x. The CI job installs pnpm,
restores the pnpm cache, installs Playwright Chromium, and runs the full local check.
