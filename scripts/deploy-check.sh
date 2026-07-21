set -eu

test -f docs/deployment-contract.md
test -f docs/vercel-supabase.md
test -f docs/runtime-adapters.md
test -f .terraform-version
test -f infra/terraform/README.md
test -f infra/terraform/templates/alicloud-root-module/versions.tf
test -f infra/terraform/templates/alicloud-root-module/providers.tf
test -f infra/terraform/templates/alicloud-root-module/backend.tf
test -f infra/terraform/templates/alicloud-root-module/terraform.tfvars.example
test -f infra/terraform/templates/alicloud-root-module/backend.hcl.example
test -f infra/terraform/stacks/alicloud/sandbox/versions.tf
test -f infra/terraform/stacks/alicloud/sandbox/providers.tf
test -f infra/terraform/stacks/alicloud/sandbox/backend.tf
test -f infra/terraform/stacks/alicloud/sandbox/.terraform.lock.hcl
test -f scripts/terraform.sh
test -f scripts/terraform-version.sh
test -f scripts/terraform-fmt.sh
test -f scripts/terraform-wrapper-test.sh
test -f scripts/terraform-check.sh
test -f vercel.json
test -f supabase/config.toml
test -f Dockerfile.api
test -f deploy/k8s/example/api-deployment.yaml
test -f deploy/k8s/example/api-service.yaml
test -f deploy/k8s/example/api-config.example.yaml
test -f deploy/k8s/example/api-secret.example.yaml
test -f deploy/k8s/example/migration-secret.example.yaml
test -f deploy/k8s/example/migration-job.example.yaml

pnpm vercel:entrypoint:check

echo "Deployment support files are present."
