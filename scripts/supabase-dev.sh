set -eu

pnpm supabase:start
. ./scripts/supabase-env.sh

pnpm db:wait
pnpm db:migrate
pnpm db:seed
pnpm dev:servers
