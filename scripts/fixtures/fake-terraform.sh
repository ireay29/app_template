#!/bin/sh
set -eu

if [ "${1:-}" = "version" ]; then
  printf 'Terraform v%s\n' "${FAKE_TERRAFORM_VERSION:-1.15.8}"
  exit 0
fi

printf '%s\n' "$*" > "${FAKE_TERRAFORM_LOG:?FAKE_TERRAFORM_LOG is required}"
