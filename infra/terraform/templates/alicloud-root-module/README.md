# Alibaba Cloud root module template

このディレクトリは `stacks/<provider>/<stack-name>` にコピーして使う
Alibaba Cloud 固有の root module template です。production provider を
Alibaba Cloud に決めるものではありません。

コピー後に少なくとも次を変更してください。

- `main.tf`: stack が管理する module/resource
- `variables.tf` と `terraform.tfvars.example`: stack 固有の入力
- `outputs.tf`: 後続 stack や運用が必要とする出力
- `backend.hcl.example`: 実際の OSS bucket、prefix、key、region、TableStore
- `README.md`: resource、認証、state、検証方法

実値の `terraform.tfvars`、`backend.hcl`、state、plan は Git 管理しません。
`backend "oss" {}` の設定は `terraform init -backend-config=backend.hcl` で
注入します。共有 state では TableStore locking を有効にしてください。
