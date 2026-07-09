set -eu

pnpm deploy:check
pnpm exec vercel --version

if [ "${VERCEL_BUILD:-0}" = "1" ]; then
  pnpm exec vercel build --yes
else
  echo "Set VERCEL_BUILD=1 to run vercel build in a linked Vercel project."
fi
