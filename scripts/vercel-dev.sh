set -eu

pnpm supabase:start
. ./scripts/supabase-env.sh

pnpm db:wait
pnpm db:migrate
pnpm db:seed
pnpm exec vercel dev --listen "${VERCEL_DEV_LISTEN:-3000}"
