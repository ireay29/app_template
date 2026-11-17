#!/bin/sh
set -eu

if [ "$#" -gt 2 ]; then
  printf '%s\n' 'Usage: pnpm verify:lean [PROOF.lean [CASES.json]]' >&2
  exit 1
fi

if ! command -v elan >/dev/null 2>&1; then
  printf '%s\n' 'Install elan and the pinned Lean toolchain. See docs/formal-verification.md.' >&2
  exit 1
fi

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
sample_dir=$script_dir/../../verification/lean
toolchain=$(cat "$sample_dir/lean-toolchain")

if [ "$#" -eq 0 ]; then
  cd "$sample_dir"
  elan run "$toolchain" lean -DwarningAsError=true --run Discount.lean cases.json
  node --test discount.test.ts
  exit
fi

case "$1" in
  /*) proof=$1 ;;
  *) proof=$PWD/$1 ;;
esac

if [ "$#" -eq 2 ]; then
  elan run "$toolchain" lean -DwarningAsError=true --run "$proof" "$2"
else
  elan run "$toolchain" lean -DwarningAsError=true "$proof"
fi
