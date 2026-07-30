# Alibaba Cloud sandbox stack

この stack は provider、backend、変数、outputs、lock file の検証用 scaffold
です。初期状態ではクラウド資源を作成しません。

構文検証は remote backend に接続しないように実行します。

```sh
pnpm terraform -- alicloud/sandbox init -backend=false -input=false -lockfile=readonly
pnpm terraform -- alicloud/sandbox validate
```

実運用へ拡張する場合は、先に実際の OSS backend と TableStore locking を
設定した `backend.hcl` で `init -reconfigure` を実行してください。実値の
tfvars、backend 設定、state、plan は Git 管理しません。
