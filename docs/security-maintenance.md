# Security Maintenance

## Dependency updates

- Run `pnpm security:audit` to check every locked dependency, including tools.
  The command fails on any reported severity and on registry errors.
- The daily `Dependency security` workflow audits the lockfile without
  installing packages. The full CI gate also audits dependencies.
- Dependabot checks npm, GitHub Actions, and Docker weekly. Better Auth and
  Vitest packages have separate version-update and security-update groups so
  companion packages can be reviewed together in either case.
- Jest DOM stays on 6.9.1. Dependabot excludes the deprecated 6.10.0 release
  with unintended breaking changes; a deliberate upgrade to 7.x remains possible.
- pnpm enforces a one-day minimum release age; normal Dependabot npm updates
  use a three-day cooldown. These reduce exposure to newly poisoned releases
  but do not prove a package is safe. Review provenance and release notes.
- Dependency build scripts are allowlisted in `pnpm-workspace.yaml`. Keep the
  list narrow. Never suppress advisories to make the audit pass.
- After updates, run `pnpm agent:quick` and `pnpm agent:verify`.

Targeted overrides replace vulnerable versions pinned by Vercel CLI and
Drizzle tooling. Undici 5 has no fixes for several current advisories, so its
tooling consumers use the patched Undici 6 line. Validate Vercel CLI and DB
migrations when changing these overrides; remove them once upstream dependency
constraints allow patched versions without overrides.

## Runtime updates

The October 21, 2026 Node.js security release establishes these minimums:

| Major | Minimum |
| ----- | ------- |
| 22    | 22.23.4 |
| 24    | 24.22.1 |
| 26    | 26.12.1 |

`package.json` and `engineStrict` reject older releases. `.node-version` and
`Dockerfile.api` select the Node 22 baseline; Dependabot tracks Docker updates.
The container base image is also pinned by digest.
CI tests the latest Node 22 and 24 releases. `pnpm build` prints the build
runtime version for deployment logs.

Changing source or an image tag does not patch an already running instance.
Rebuild containers with a refreshed base image and redeploy. Check the runtime
version of the deployed service using the platform's build/runtime logs.
Vercel controls patch releases within the selected major; verify the project
settings and deployed runtime rather than assuming the local Node version
matches production. Do not add a public diagnostic endpoint for this check.

The API build context excludes local cloud/agent settings and `infra`, which
can contain Terraform providers, state, and credentials. Keep deployment-only
files out of the application image build context.

## Development servers

The Web dev server binds to `127.0.0.1`. Use an explicit `--host` override only
when LAN access is needed, on a trusted network. Do not publish Vite, Vitest UI,
or Drizzle Studio through a public tunnel or production reverse proxy.
Customer previews should use the built Web app and the API runtime.

The API uses a fixed CORS request-header allowlist. If a feature needs a custom
header, add that specific header to the allowlist instead of reflecting
arbitrary preflight headers.

## Package compromise response

Compare exact installed versions and installation history with the incident's
official affected-version list. If a malicious version was executed, isolate
and rebuild the affected development/CI host, rotate credentials accessible
to that host, and review account/repository/cloud access logs. Updating the
package alone does not remove stolen credentials or host persistence.

## References

- [Node.js October 2026 security release](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
- [Hono CORS DoS](https://github.com/honojs/hono/security/advisories/GHSA-8j4g-w8fx-2239)
- [Vite filesystem access control](https://github.com/vitejs/vite/security/advisories/GHSA-rq7h-c2jc-7f22)
- [Better Auth OAuth/Magic Link isolation](https://github.com/better-auth/better-auth/security/advisories/GHSA-965c-763c-88jm)
