# AGENTS.md

## 目的

このリポジトリは、UI とビジネスロジックを追加すればプロダクト実装に入れる状態を目指すフルスタック TypeScript テンプレートです。

Agent は、既存の設計・品質ゲート・ディレクトリ境界を保ちながら、機能追加の型を崩さずに作業してください。

## 基本ルール

- 常に日本語で返答すること。
- Python コマンドでファイル検証をしないこと。
- 推測と事実を分けて説明すること。
- 仕様や設計を確定するまでは修正を始めないこと。
- 既存の未コミット差分を勝手に戻さないこと。
- 仕様に関係ないリファクタリングや依存追加を混ぜないこと。
- 迷ったら、先に現状確認と選択肢を提示してから実装すること。

## 行数管理

- 1ファイルは基本的に300行前後までに収めること。
- 400行を超えたら、責務分割できないか必ず検討すること。
- 500行を超えるファイルは必ず分割またはリファクタリングすること。
- 例外は生成物、migration、lock file、設定スナップショットのみとする。
- 分割の優先順位は、domain/service、repository、presenter、hook、component、test helper の責務境界を基準にすること。
- 大きな UI は、状態管理 hook と表示 component を分けること。
- 大きな API 処理は、route 定義、handler 登録、service、repository、presenter を分けること。

## プロジェクト構成

- `apps/web`: Vite + React + TypeScript + Tailwind CSS
- `apps/api`: Hono + Zod OpenAPI + Better Auth + Drizzle ORM
- `e2e`: Playwright E2E tests
- `docs`: 実装状況、設計方針、Agent 向け補助資料
- `.github/workflows/ci.yml`: GitHub Actions CI

## よく使うコマンド

```sh
pnpm dev
pnpm agent:quick
pnpm agent:verify
pnpm fix
pnpm clean
```

## 検証コマンド

- `pnpm format:check`: Prettier check
- `pnpm lint`: ESLint
- `pnpm typecheck`: TypeScript
- `pnpm test`: Vitest
- `pnpm test:coverage`: Vitest coverage
- `pnpm build`: API and web production build
- `pnpm test:e2e`: Playwright
- `pnpm check`: full local verification
- `pnpm ci`: CI entrypoint

DB を使う検証は PostgreSQL が必要です。通常は `pnpm agent:quick` または `pnpm agent:verify` を優先してください。

## Web 方針

- routing は React Router で標準化すること。
- data fetching と cache は TanStack Query を標準とすること。
- form と validation は React Hook Form + Zod を標準とすること。
- 新規機能は `apps/web/src/features/<feature-name>` に置くこと。
- feature 配下は、表示 component、state hook、feature 固有 helper を近くに置くこと。
- API client は OpenAPI 生成に寄せ、fetch の詳細を component に漏らさないこと。
- component はなるべく presentational に保ち、通信・session・form side effect は hook に逃がすこと。
- `@/*` alias は `apps/web/src/*` を指す。

## UI / Design System 方針

- 通常の app UI は `apps/web/src/components/ui` の shadcn/ui-compatible primitives を優先すること。
- Material UI は、高機能 widget、アクセシビリティ実装が重い component、MUI ecosystem の利点が明確な場合に使うこと。
- `DesignSystemProvider` は `apps/web/src/providers/design-system-provider.tsx` にある。
- Tailwind class の結合は `apps/web/src/lib/utils.ts` の `cn` を使うこと。
- アイコンは原則 `lucide-react` を使い、MUI component と組み合わせる場合のみ MUI icons を使うこと。
- brand color、radius、typography を変更する場合は Tailwind tokens と MUI theme の両方を更新すること。
- loading、empty、error、unauthorized、toast、dialog は共通 UI として用意し、feature ごとに重複実装しないこと。
- Storybook は導入しない。必要な確認は app 内の実装例、component tests、E2E で担保すること。

## API 方針

- route schema は `apps/api/src/routes` に置くこと。
- route handler の登録は `apps/api/src/app-routes.ts` に集約すること。
- `apps/api/src/app.ts` は Hono app の配線、middleware、error handling を中心に保つこと。
- DB access を route handler や `app.ts` に直接書かないこと。
- business logic は service、永続化は repository、response 変換は presenter に分けること。
- protected endpoint は `sessionContext` を使い、未認証時は `401` を返すこと。
- API contract は Zod OpenAPI を source of truth とし、Web 側 client は OpenAPI 生成へ寄せること。
- OpenAPI 生成は自前 generator を作らず、既存ライブラリを使うこと。
- OpenAPI 生成の標準構成は `openapi-typescript`、`openapi-fetch`、`openapi-react-query` とすること。
- 生成型は `apps/web/src/generated/openapi.ts` に置き、手編集しないこと。
- 設定済み fetch client は `apps/web/src/lib/api/client.ts` に置くこと。
- TanStack Query 連携は `apps/web/src/lib/api/query.ts` に置き、feature 側では必要に応じて `features/<feature>/queries.ts` で薄く包むこと。
- OpenAPI 生成は API dev server の起動に依存させず、API app から schema を取得する script で実行すること。
- 生成物は Git 管理し、CI で生成差分が残っていないか検知すること。
- OpenAPI 生成型を使うため、TypeScript の `noUncheckedIndexedAccess` を有効にすること。
- 手書き API client は、生成環境がまだ未整備の endpoint、Better Auth client、または極小の bootstrap 用途に限定すること。
- 生成 client と手書き client で型や endpoint 定義を二重管理しないこと。

## DB / Auth 方針

- DB schema は `apps/api/src/db/schema` に置くこと。
- schema を追加・変更したら `apps/api/src/db/schema/index.ts` から export すること。
- migration は `pnpm db:generate` で生成し、`apps/api/drizzle` を Git 管理すること。
- local DB は Docker Compose の PostgreSQL を前提にすること。
- Better Auth は `/api/auth/*` に mount される。
- protected API を web から呼ぶ場合は `credentials: "include"` を使うこと。
- 認証は必須機能として扱い、protected page と protected API の標準形を用意すること。
- 認可は最初は `admin` / `member` の2ロールで始めること。
- ReBAC や細かい permission table などの複雑な認可は、必要になるまで導入しないこと。
- role は UI 表示制御だけでなく API 側でも検証すること。
- seed data は admin user と member user を1件ずつ用意すること。
- demo notes などの追加 seed は、開発体験と E2E の安定性に必要な範囲に絞ること。
- seed は本番実行されないようにコマンドと環境を分けること。

## Test 方針

- service、repository、API contract、重要な UI state は Vitest で検証すること。
- 認証、主要 CRUD、画面遷移、重要な回帰は Playwright E2E で検証すること。
- UI や API の挙動を変えた場合は `pnpm test:e2e` も通すこと。
- テスト helper が肥大化したら feature または package 境界で分割すること。

## 品質ゲート

- Prettier と ESLint の設定に従うこと。
- import/export の並び順は ESLint の simple-import-sort に従うこと。
- commit 前 hook は lint-staged で staged files に `eslint --fix` と `prettier --write` を走らせる。
- 依存追加は必要性を説明し、既存の stack と重複しないか確認すること。
- lock file は必ず commit 対象に含めること。

## Git 方針

- commit 前に `pnpm agent:status` で差分を確認すること。
- private email ではなく GitHub no-reply email を使うこと。
- 履歴を書き換える操作は、目的と影響を確認してから実施すること。
- unrelated changes は混ぜず、意味のある単位で commit を分けること。
- push 済み履歴を書き換えた場合は `git push --force-with-lease` を使うこと。

## 新規 Feature の追加手順

1. 仕様、画面、API、DB 変更の有無を整理する。
2. Web feature directory と API service/repository 境界を決める。
3. DB が必要なら schema と migration を追加する。
4. API route schema、handler、service、repository、presenter を追加する。
5. OpenAPI 生成 client または標準 client 経由で Web から呼ぶ。
6. TanStack Query hook、React Hook Form + Zod form、presentational component を追加する。
7. loading、empty、error、unauthorized state を共通 UI で実装する。
8. unit test と必要な E2E を追加する。
9. `pnpm agent:quick` を通し、完了前に `pnpm agent:verify` を通す。

## セルフレビュー

1. `pnpm agent:status` で変更範囲を確認する。
2. 仕様に関係ない差分が混ざっていないか確認する。
3. 500行以上のファイルがないか確認し、ある場合は分割する。
4. `pnpm agent:quick` を通す。
5. UIやAPIの挙動が変わる場合は `pnpm test:e2e` も通す。
6. 完了前に `pnpm agent:verify` を通す。

## 採用済み方針

- Routing: React Router
- Data fetching/cache: TanStack Query
- Form/validation: React Hook Form + Zod
- Common UI: `apps/web/src/components` 配下に loading、empty、error、unauthorized、toast、dialog を用意する
- Auth/Authz: protected page、protected API、`admin` / `member` role を標準化する
- Seed: admin user と member user を1件ずつ用意する
- API client: `openapi-typescript`、`openapi-fetch`、`openapi-react-query` による OpenAPI 生成へ寄せる
- Storybook: 導入しない

## 次に決めること

- OpenAPI 生成コマンド名と CI での差分検知方法。
- 共通 UI primitive の最小セット。
- seed data に含める demo user の email/password と demo notes の具体値。

## 後回しにすること

- deploy target、環境変数、health check、migration 実行方針は、実際の配備先を決める段階で固定する。
