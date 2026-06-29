# App Template

A TypeScript app template with a Vite React frontend and a Hono API backend.

## Stack

- pnpm workspace
- Vite, React, TypeScript, Tailwind CSS
- Hono, Zod, OpenAPI, Swagger UI
- ESLint, Prettier, Vitest

## Commands

```sh
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Apps

- Web: http://localhost:5173
- API: http://localhost:8787
- API docs: http://localhost:8787/api/docs
- OpenAPI JSON: http://localhost:8787/api/openapi.json

The web app proxies `/api/*` to the API server during local development.
