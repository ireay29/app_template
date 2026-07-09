set -eu

test -f docs/deployment-contract.md
test -f docs/vercel-supabase.md
test -f docs/runtime-adapters.md
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
