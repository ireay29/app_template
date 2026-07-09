set -eu

IMAGE_NAME="${IMAGE_NAME:-app-template-api:local}"
CONTAINER_NAME="${CONTAINER_NAME:-app-template-api-smoke}"
HOST_PORT="${HOST_PORT:-8788}"

cleanup() {
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
}

cleanup
trap cleanup EXIT INT TERM

docker build -f Dockerfile.api -t "$IMAGE_NAME" .
docker run \
  --detach \
  --name "$CONTAINER_NAME" \
  --publish "$HOST_PORT:8787" \
  --env NODE_ENV=production \
  --env HOST=0.0.0.0 \
  --env PORT=8787 \
  --env DATABASE_URL="${DATABASE_URL:-postgres://app_template:app_template@127.0.0.1:15432/app_template}" \
  --env BETTER_AUTH_SECRET="${BETTER_AUTH_SECRET:-container-secret-change-me-32-characters-min}" \
  --env BETTER_AUTH_URL="${BETTER_AUTH_URL:-https://api.app-template.example.com}" \
  --env WEB_ORIGIN="${WEB_ORIGIN:-https://app-template.example.com}" \
  "$IMAGE_NAME"

sleep 3

attempt=1
while [ "$attempt" -le 30 ]; do
  if curl -fsS "http://127.0.0.1:$HOST_PORT/api/health"; then
    echo
    exit 0
  fi

  attempt=$((attempt + 1))
  sleep 1
done

docker logs "$CONTAINER_NAME"
exit 1
