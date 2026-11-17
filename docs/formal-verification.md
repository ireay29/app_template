# 形式検証

このテンプレートには TLA+ のセッション切替モデルと、Lean の金額計算サンプルがある。派生アプリで対応する機能を変更する際は [形式検証 Skill](../skills/formal-verification/SKILL.md) を参照し、対象となる性質をモデルまたは定理として追加する。各コマンドはローカルで個別に実行できる。標準の `agent:static`、`agent:verify`、CI は Java や Lean を必要としない。

## TLA+ でイベントの順序を検証する

並行する操作、遅れて届く応答、再試行、権限変更などで結果が変わるフローに使う。[SessionSwitch.tla](../verification/tla/SessionSwitch.tla) は管理者とメンバー、最大3セッション、同時に最大2件のリクエストを扱う。ログアウト後も応答が到着でき、同じアカウントで再ログインした場合も別セッションとして扱う。モデルは表示中の応答を1件で表し、以下の条件を検査する。

- 表示される応答は現在のセッションに属する。
- 管理者向けの応答は管理者セッションでのみ表示される。

Java 11 以降と [TLC 1.7.4 のリリース](https://github.com/tlaplus/tlaplus/releases/tag/v1.7.4) の `tla2tools.jar` を用意する。

```sh
export TLA2TOOLS_JAR=/path/to/tla2tools.jar
pnpm verify:tla
pnpm verify:tla --counterexample
```

通常の設定では TLC が有限範囲内の訪問可能な状態を探索する。`--counterexample` は別セッションの応答を受け入れる設定で実行し、TLC が `VisibleDataBelongsToActiveSession` の違反とそこに至るイベント列を出力して失敗する。モデルの反例を実装で調べるときは、操作の順序を [遅延応答の Vitest](../apps/web/src/providers/protected-query-boundary.test.tsx) と [アカウント切替の Playwright テスト](../e2e/app.spec.ts) に対応づける。モデルの結果は、この探索範囲と不変条件に対する検証結果として扱う。

派生アプリでは `verification/tla/` に機能別の `.tla` と `.cfg` を置き、リポジトリルートから両方のパスを指定する。

```sh
pnpm verify:tla verification/tla/Checkout.tla verification/tla/Checkout.cfg
```

TLC 1.7.4 は起動時に Java RMI のソケットを開く。サンドボックスで `Listen failed on port: 0` が出る場合は、ローカルソケットを開ける実行環境を使う。

## Lean でビジネスルールを証明する

入力と出力で表せる金額計算、配分、ポイント計算、判定ルールなどに使う。[Discount.lean](../verification/lean/Discount.lean) は整数の最小通貨単位で値引き後の金額を定義し、元の金額を超えないこと、値引きが元の金額以上の場合にちょうどゼロになること、値引きを増やしても金額が増えないことを証明する。

[elan](https://github.com/leanprover/elan) を導入し、リポジトリで固定している Lean を用意する。

```sh
elan toolchain install leanprover/lean4:v4.36.0
pnpm verify:lean
```

引数なしのコマンドは Lean の定理を検査し、Lean と TypeScript の両方を [同じテストケース](../verification/lean/cases.json) で実行する。Lean 側の警告はエラーとして扱う。Lean の証明は自然数上の定義が対象で、TypeScript のサンプルでは非負の安全な整数を対象にケース単位の一致を検証する。

派生アプリでは `verification/lean/` に機能の定義と定理を置き、パスを指定する。第2引数に共通ケースを渡すと、そのファイルを引数に取る Lean の `main` を実行する。

```sh
pnpm verify:lean verification/lean/Allocation.lean
pnpm verify:lean verification/lean/Allocation.lean verification/lean/allocation-cases.json
```

機能の TypeScript テストは [サンプル](../verification/lean/discount.test.ts) と同じ方法で共通ケースを読み、実際のビジネスロジックを呼び出す。そのテストをアプリのユニットテストコマンドで実行し、入力の妥当性、丸め規則、オーバーフローなど実装が扱う境界も確認する。
