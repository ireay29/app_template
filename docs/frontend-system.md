# Frontend System

The frontend uses two complementary UI systems:

- shadcn/ui-compatible primitives for app-specific composition.
- Material UI for mature, complex widgets and ecosystem coverage.

The goal is to keep day-to-day product UI local, inspectable, and easy to adapt,
while still allowing MUI where it provides real leverage.

## Entry Points

| Concern                 | File                                                |
| ----------------------- | --------------------------------------------------- |
| React mount             | `apps/web/src/main.tsx`                             |
| MUI provider            | `apps/web/src/providers/design-system-provider.tsx` |
| Tailwind and CSS tokens | `apps/web/src/styles/index.css`                     |
| shadcn/ui config        | `apps/web/components.json`                          |
| UI primitives           | `apps/web/src/components/ui`                        |
| Class merging helper    | `apps/web/src/lib/utils.ts`                         |
| Generated API types     | `apps/web/src/generated/openapi.ts`                 |
| Typed API client        | `apps/web/src/lib/api/client.ts`                    |
| Typed API query bridge  | `apps/web/src/lib/api/query.ts`                     |
| Protected route guard   | `apps/web/src/features/auth/ProtectedRoute.tsx`     |

`DesignSystemProvider` wraps the app with MUI `ThemeProvider` and
`CssBaseline`. Tailwind CSS variables define the shadcn/ui-compatible color,
radius, border, input, and ring tokens.

## Current Primitives

- `Button`: variant-based button primitive using `class-variance-authority`,
  `Slot`, and `cn`.
- `Card`: basic card composition with header, title, description, and content
  slots.

These primitives are intentionally small. Add more primitives only when they are
shared across features or match a common app surface.

## Usage Rules

- Prefer `apps/web/src/components/ui` primitives for normal app screens,
  feature panels, forms, and repeated interface elements.
- Use MUI when a component needs mature behavior that is not worth rebuilding,
  such as advanced pickers, menus, data grids, or accessibility-heavy widgets.
- Keep feature-specific components inside `apps/web/src/features/<feature>`.
- Use `lucide-react` icons in shadcn/ui-compatible controls.
- Use MUI icons with MUI components when that keeps the component idiomatic.
- Merge Tailwind classes with `cn` instead of manual string concatenation.
- Do not create one-off button, card, or input styling when a shared primitive
  should own the pattern.

## Token Rules

- Primary app color is teal, exposed through Tailwind CSS variables and the MUI
  theme.
- Border radius defaults to `0.5rem` in CSS variables and `8px` in the MUI
  theme.
- Global base styles live in `apps/web/src/styles/index.css`.
- MUI typography uses Roboto with system font fallbacks from the provider.

When changing brand colors, radius, or typography, update both the Tailwind CSS
variables and the MUI theme so mixed screens remain visually consistent.

## Adding UI

1. Check whether an existing primitive already covers the need.
2. If the component is reusable, add it under `apps/web/src/components/ui`.
3. If it is feature-specific, keep it under the owning feature folder.
4. Add a focused component test when the component has meaningful behavior,
   state, or accessibility expectations.
5. Run `pnpm agent:quick` before handing off.

## Current Demo Coverage

`apps/web/src/App.tsx` intentionally renders both systems:

- shadcn/ui-compatible `Button` and `Card`.
- MUI `Chip`, `Button`, and icon usage.

`apps/web/src/features/auth/AuthNotesDemo.tsx` demonstrates a feature-level
composition using shared primitives plus local form fields. Its behavior lives
in `apps/web/src/features/auth/useAuthNotesDemo.ts`, with schemas and static
state helpers colocated in the same feature folder so side effects and
presentation stay separate.

## API Client Rules

- Treat `apps/web/src/generated/openapi.ts` as generated code.
- Run `pnpm openapi:generate` after changing `apps/api/src/routes`.
- Prefer `apps/web/src/lib/api/client.ts` and `apps/web/src/lib/api/query.ts`
  for new API calls.
- Keep Better Auth calls on `apps/web/src/lib/auth-client.ts`.
- Keep hand-written fetch clients only for temporary bootstrap paths that are
  not yet covered by generated OpenAPI types.

## Auth UI Rules

- Use `ProtectedRoute` for pages that require a signed-in user.
- Keep role enforcement in the API. UI checks are only a convenience.
- Use admin-only API calls, such as `/api/admin/summary`, to prove role-specific
  access paths.
