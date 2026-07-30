#!/bin/sh
set -eu

if [ "${1:-}" = "version" ]; then
  printf 'Terraform v%s\n' "${FAKE_TERRAFORM_VERSION:-1.15.8}"
  exit 0
fi

: > "${FAKE_TERRAFORM_LOG:?FAKE_TERRAFORM_LOG is required}"
for argument in "$@"; do
  printf '%s\n' "$argument" >> "$FAKE_TERRAFORM_LOG"
done
exit "${FAKE_TERRAFORM_EXIT:-0}"
