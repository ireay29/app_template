# Terraform scaffold

このディレクトリは、アプリケーション本体から隔離した provider-specific
な Terraform root module と、stack 追加のためのテンプレートを管理します。
この scaffold は production provider を決めるものではなく、Alibaba Cloud
用の例を後続の構成追加へつなげるためのものです。

## Layout

```text
infra/terraform/
  templates/alicloud-root-module/  # Alibaba Cloud 用 root module の雛形
  modules/alicloud/                # 合成可能な共有 module の置き場
  stacks/alicloud/sandbox/         # 検証用の独立 stack
```

このリポジトリでいう stack は、`stacks/<provider>/<stack-name>` にある
1つの root module と1つの state の組み合わせです。Terraform Stacks 機能や
`.tfstack.hcl` は指しません。環境分離には Terraform workspace を使わず、
stack ディレクトリを明示的に分けます。

## Version and provider

- Terraform CLI: `.terraform-version` の `1.15.8`
- root module constraint: `~> 1.15.0`
- Alibaba Cloud provider: `aliyun/alicloud ~> 1.285.0`

`.terraform-version` は version manager 向け metadata にすぎないため、
`scripts/terraform.sh` も実行中の CLI が `1.15.8` であることを確認します。
provider は Alibaba Cloud 固有の scaffold であり、production provider を
Alibaba Cloud に固定するものではありません。

## Stack の追加

1. `templates/alicloud-root-module` を新しい
   `stacks/<provider>/<stack-name>` へコピーします。
2. `versions.tf`、`providers.tf`、backend、変数、outputs を stack の要件に
   合わせて編集します。
3. origin registry から次の platform checksum を取得し、
   `.terraform.lock.hcl` に登録して lock file を Git 管理します。

   ```sh
   terraform providers lock \
     -platform=linux_amd64 \
     -platform=linux_arm64 \
     -platform=darwin_amd64 \
     -platform=darwin_arm64 \
     -platform=windows_amd64
   ```

4. stack の README に作成資源、認証、state、検証方法を記載します。

`sandbox` はクラウド資源を作成しない最小 root module です。単一 resource
を包むだけの形式的な共有 module は追加せず、複数 stack から再利用する
責務が生じたときに `modules/alicloud` へ追加します。

## CLI

wrapper の第1引数は `stacks/` からの相対パスです。

```sh
pnpm terraform -- alicloud/sandbox init -backend=false -input=false -lockfile=readonly
pnpm terraform -- alicloud/sandbox validate

# 実運用の plan/apply 前は remote backend を明示的に初期化する
pnpm terraform -- alicloud/sandbox init -reconfigure -backend-config=backend.hcl
pnpm terraform -- alicloud/sandbox plan -var-file=terraform.tfvars -out=saved.tfplan
pnpm terraform -- alicloud/sandbox apply saved.tfplan
```

`init -backend=false` の直後に実運用の `plan` / `apply` を行わないでください。
実運用では必ず対象 OSS backend と TableStore locking を設定した
`backend.hcl` で `init -reconfigure` を行います。`apply` と `destroy` は
wrapper が自動承認せず、Terraform 標準の確認を維持します。

## Credentials and state

- provider block、backend block、`backend.hcl` に長期 credential を書かない。
- ローカル provider 認証は Alibaba Cloud CLI の shared profile を標準とし、
  `ALIBABA_CLOUD_PROFILE` など provider が読む環境変数で解決する。
- provider 認証と OSS backend 認証は別々に解決される。CI/CD では長期 access
  key を保存せず、OIDC exchange で得た短期 STS credential を両方へ渡す。
- 共有 state では OSS bucket の versioning、非公開設定、暗号化、最小権限
  RAM policy、TableStore locking を必須運用要件とする。
- `*.tfstate`、plan、実値 tfvars、実値 backend 設定、`.terraform/` は Git
  管理しない。example と lock file は Git 管理する。

OSS bucket と TableStore の bootstrap はこの scaffold の対象外です。
既存 backend を安全に指定できる契約だけを用意します。
