set -eu

pnpm supabase:start
. ./scripts/supabase-env.sh

pnpm db:wait
pnpm db:migrate
pnpm db:seed
pnpm format:check
pnpm openapi:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
