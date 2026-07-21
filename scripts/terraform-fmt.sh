#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname "$0")" && pwd -P)
repo_root=$(CDPATH= cd -- "$script_dir/.." && pwd -P)
. "$script_dir/terraform-version.sh"
terraform_bin=$(terraform_bin_for_repo "$repo_root")

cd "$repo_root"
exec "$terraform_bin" fmt -check -recursive infra/terraform
