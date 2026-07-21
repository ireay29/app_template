#!/bin/sh
set -eu

die() {
  printf 'terraform wrapper: %s\n' "$1" >&2
  exit 1
}

script_dir=$(CDPATH= cd -- "$(dirname "$0")" && pwd -P) || die "cannot resolve script directory"
repo_root=$(CDPATH= cd -- "$script_dir/.." && pwd -P) || die "cannot resolve repository root"
stack_root="$repo_root/infra/terraform/stacks"

[ -d "$stack_root" ] || die "stack root is missing: infra/terraform/stacks"
if [ "$#" -ge 1 ] && [ "$1" = "--" ]; then
  shift
fi

[ "$#" -ge 1 ] || die "usage: pnpm terraform -- <stack-path> <terraform-args...>"

stack_path=$1
shift

case "$stack_path" in
  ""|/*|../*|*/../*|*/..|..|./*|*/./*|.)
    die "stack path must be a relative path without traversal: $stack_path"
    ;;
  *[!A-Za-z0-9_./-]*)
    die "stack path contains unsupported characters: $stack_path"
    ;;
esac

stack_candidate="$stack_root/$stack_path"
[ -d "$stack_candidate" ] || die "stack path is not a directory: $stack_path"

stack_root_real=$(CDPATH= cd -P "$stack_root" && pwd -P) || die "cannot resolve stack root"
stack_dir_real=$(CDPATH= cd -P "$stack_candidate" && pwd -P) || die "cannot resolve stack path"

case "$stack_dir_real/" in
  "$stack_root_real"/*/)
    ;;
  *)
    die "stack path escapes infra/terraform/stacks: $stack_path"
    ;;
esac

[ "$stack_dir_real" != "$stack_root_real" ] || die "stack path must select a child directory"

. "$script_dir/terraform-version.sh"
terraform_bin=$(terraform_bin_for_repo "$repo_root") || die "Terraform CLI version check failed"

stack_dir_relative=${stack_dir_real#"$repo_root"/}
[ "$stack_dir_relative" != "$stack_dir_real" ] || die "stack path is outside repository root"

cd "$repo_root"
exec "$terraform_bin" "-chdir=$stack_dir_relative" "$@"
