---
name: formal-verification
description: Choose and run TLA+ or Lean when developing features with concurrent events, retries, session or ownership changes, or pure business rules with precise invariants such as monetary calculations and allocation. Connect model counterexamples and proof assumptions to TypeScript regression tests and Playwright coverage.
---

# 形式検証

[形式検証ガイド](../../docs/formal-verification.md) に実行手順とテンプレートの例がある。

1. 変更の影響を見て、利用者から観測できる性質と適用条件を一文ずつ書く。イベントの順序や競合で結果が変わる場合は TLA+、入出力で記述できる計算や判定の性質は Lean を使う。両方に当てはまる場合はそれぞれの性質を記述する。
2. TLA+ では状態、イベント、不変条件を列挙する。対象のフローに応じて遅延、順序の逆転、再試行、重複、権限や所有者の切り替えをモデルに含め、有限な探索範囲を設定する。`pnpm verify:tla MODEL.tla MODEL.cfg` に対象のパスを渡す。反例が出たらイベント列を実装に対応づけ、再現する Vitest または Playwright テストを追加する。モデルと実装のどちらが仕様に反するかを確認して修正する。
3. Lean では入力の範囲、数値単位、丸め、境界条件を仕様として表し、必要な性質を証明する。`pnpm verify:lean PROOF.lean` で定理を検査する。`sorry` や `admit` を残さず、定理の依存する公理は `#print axioms` で確認する。共通ケースを用意した場合は `pnpm verify:lean PROOF.lean CASES.json` で Lean 側を確認し、同じケースを読む実際の TypeScript 関数のテストも実行する。
4. 実装のテストと形式検証の結果を報告する。TLA+ は探索範囲と対象にした不変条件、Lean は定理と入力の前提を記録する。反例があればイベント列と回帰テストを添える。ツールが実行できなかった場合はその理由を記録する。
