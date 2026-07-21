#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname "$0")" && pwd -P)
repo_root=$(CDPATH= cd -- "$script_dir/.." && pwd -P)
cd "$repo_root"

pnpm terraform:wrapper:test
pnpm terraform:fmt
pnpm terraform -- alicloud/sandbox init -backend=false -input=false -lockfile=readonly
pnpm terraform -- alicloud/sandbox validate
