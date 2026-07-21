terraform_bin_for_repo() {
  terraform_version_repo_root=$1
  terraform_version_bin=$(command -v terraform 2>/dev/null || true)

  if [ -z "$terraform_version_bin" ]; then
    printf 'terraform version: Terraform CLI is not installed or is not on PATH.\n' >&2
    return 1
  fi

  terraform_version_file="$terraform_version_repo_root/.terraform-version"
  if [ ! -f "$terraform_version_file" ]; then
    printf 'terraform version: missing .terraform-version.\n' >&2
    return 1
  fi

  terraform_version_line_count=$(awk 'NF { count += 1 } END { print count + 0 }' "$terraform_version_file")
  if [ "$terraform_version_line_count" -ne 1 ]; then
    printf 'terraform version: .terraform-version must contain exactly one non-empty line.\n' >&2
    return 1
  fi

  terraform_version_expected=$(awk 'NF { print; exit }' "$terraform_version_file" | tr -d '[:space:]')
  if ! terraform_version_output=$("$terraform_version_bin" version 2>&1); then
    printf 'terraform version: could not run Terraform CLI version command.\n' >&2
    return 1
  fi

  terraform_version_actual=$(printf '%s\n' "$terraform_version_output" | sed -n 's/^Terraform v\([^[:space:]]*\).*/\1/p' | sed -n '1p')

  if [ -z "$terraform_version_actual" ]; then
    printf 'terraform version: could not determine Terraform CLI version.\n' >&2
    return 1
  fi

  if [ "$terraform_version_actual" != "$terraform_version_expected" ]; then
    printf 'terraform version: Terraform CLI version %s does not match .terraform-version %s.\n' "$terraform_version_actual" "$terraform_version_expected" >&2
    return 1
  fi

  printf '%s\n' "$terraform_version_bin"
}
