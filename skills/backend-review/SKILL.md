---
name: backend-review
description: apps/api、API entrypoint、DB schema・migration と関連する E2E の差分を読み取り専用でレビューする。API 契約、認可、永続化、バックエンドのコーディング規約を確認する。
---

# バックエンドレビュー

指定された差分と変更目的を確認する。判断に必要な呼び出し元、API 契約、テストも読む。共通のルールと指摘の形式は [AGENTS.md](../../AGENTS.md#セルフレビュー)、アクセス制御は [API Authorization](../../docs/authorization.md)、実行環境への配備は [Deployment Contract](../../docs/deployment-contract.md) に従う。

## 実装観点

- 変更したエンドポイントのアクセス区分が `RouteRegistrar` で明示されているかを見る。通常の保護ルートでは未認証に `401`、権限不足に `403` を返し、許可後に handler を実行する。CORS やメンテナンスなど共通境界で先に処理するものと区別し、機能側の middleware や cache が認可前に応答する経路がないかを確認する。
- 読み書きの主体を検証済みの `principal` から取得し、service と repository の境界で所有者を確認する。入力のユーザー ID や UI の表示制御に依存する経路、別ユーザーのリソースを参照・更新できる経路がないかを見る。
- Zod OpenAPI の入力・応答・ステータス定義と実際の応答を比較する。契約を変更した場合は生成済みの Web クライアント型への反映を確認する。
- DB 変更では既存データへの適用、制約とデフォルト、必要なトランザクションを確認する。`schema/index.ts` からの export、`apps/api/drizzle` の生成 migration、runtime と migration の DB 接続の分離を確認する。本番の起動経路で migration や seed を実行する変更がないかを見る。
- service、repository、API 契約の回帰を Vitest で確認できるかを見る。認可の変更では未認証、権限不足、別所有者、許可されたアクセスを確認する。UI や API の挙動変更では、実装担当から共有された E2E の結果を確認する。

## コーディング規約

- route schema は `apps/api/src/routes`、handler 登録は `apps/api/src/app-routes.ts` に置く。機能側の登録には `RouteRegistrar` を使い、認可付き middleware はアクセス区分を指定して登録する。`app.ts` は配線と共通 middleware、エラー処理に集中させる。
- handler、service、repository、presenter の責務を分ける。DB アクセスは repository、業務ルールは service、応答形式への変換は presenter に置く。
- ランタイムやプロバイダー固有の処理は薄い entrypoint に置き、handler や service からは共通の契約を使う。
- Prettier、ESLint の import/export 順と AGENTS.md の行数管理に従っているかを確認する。

## レビュー結果

変更したファイルは編集せず、指摘を重大度順に返す。各指摘に P0〜P3、ファイルと行、発生条件または規約の根拠、影響を添える。対象差分と関係のある指摘に絞り、任意の提案と未検証事項は分ける。要修正の指摘がなければ、その旨を返す。
