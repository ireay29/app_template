---
name: design-review
description: Prepare and independently review a software design before implementation. Use when asked to review a feature design or when a change needs product decisions about authorization, data compatibility, state transitions, or behavior across screens. Turn acceptance examples into a verification plan.
---

# 設計レビュー

仕様判断が必要な変更では、[設計メモのひな形](../../docs/templates/design-memo.md)でルール、具体例、未決事項を整理する。方針が明確な小さな修正は、原則としてチャットで変更内容を確認して進める。具体例の整理には Example Mapping、独立した設計レビューには Elephant-Goldfish Model の考え方を使う。[Example Mapping](https://cucumber.io/docs/bdd/example-mapping/) · [Elephant-Goldfish Model](https://github.com/google/elephant-goldfish-model)

1. 関連する実装、仕様、テストを読み、設計案をチャットにまとめる。影響する画面・API・データと、例ごとの前提、操作、期待結果を書く。未確認の仕様は、利用者に見える違いとともに未決事項に記録する。設計案をファイルに保存する場合は [AGENTS.md](../../AGENTS.md#基本ルール) の事前確認に従う。
2. 会話履歴を引き継がないサブエージェントに読み取り専用でレビューを依頼する。Codex では利用できる引数に合わせて `fork_turns: "none"` または `fork_context: false` を指定する。依頼には設計案の全文またはパス、参照を許可する資料、確認観点だけを渡す。資料から判断できない点は追加情報が必要な箇所として返すように伝える。
3. レビューでは、前提の不足、複数の解釈が可能なルール、重要な失敗例や権限・互換性の抜け、期待結果を確認できるテストがあるかを調べる。指摘には該当箇所、発生条件や影響、決めるべき内容を添えてもらう。独立レビューを実施できない場合は、設計案と理由をユーザーに提示する。レビューが完了するか、ユーザーが手順の例外を明示的に承認するまで実装を待つ。
4. レビュー結果を設計案に反映し、未決事項をユーザーと解消する。権限や期待結果などが変わった場合は、その変更箇所をレビューし直す。確定した設計と実装範囲をユーザーに確認し、承認に含まれる作業を進める。
5. 同意した具体例を Vitest・Playwright の検証に対応させる。[Test 方針](../../AGENTS.md#test-方針)で形式検証の対象となる変更は [形式検証 Skill](../formal-verification/SKILL.md) に従う。実装後は [セルフレビュー](../../AGENTS.md#セルフレビュー) を行う。
