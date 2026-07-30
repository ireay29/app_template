#!/bin/sh
set -eu

fail() {
  printf 'terraform wrapper test: %s\n' "$1" >&2
  exit 1
}

script_dir=$(CDPATH= cd -- "$(dirname "$0")" && pwd -P)
repo_root=$(CDPATH= cd -- "$script_dir/.." && pwd -P)
wrapper="$repo_root/scripts/terraform.sh"
fixture="$repo_root/scripts/fixtures/fake-terraform.sh"
temp_dir=$(mktemp -d "${TMPDIR:-/tmp}/app-template-terraform-wrapper.XXXXXX")
fake_bin="$temp_dir/bin"
log_file="$temp_dir/terraform-args.log"
link_name="test-wrapper-symlink-$$"
link_path="$repo_root/infra/terraform/stacks/$link_name"
test_link_created=0

cleanup() {
  if [ "$test_link_created" -eq 1 ]; then
    rm -f "$link_path"
  fi
  rm -rf "$temp_dir"
}

trap cleanup EXIT INT TERM

mkdir -p "$fake_bin" "$temp_dir/no-terraform" "$temp_dir/outside"
cp "$fixture" "$fake_bin/terraform"
chmod +x "$fake_bin/terraform"

test_path="$fake_bin:/usr/bin:/bin"

PATH="$test_path" \
FAKE_TERRAFORM_LOG="$log_file" \
  "$wrapper" -- alicloud/sandbox init -backend=false -input=false -lockfile=readonly

assert_log_line() {
  line_number=$1
  expected=$2
  actual=$(sed -n "${line_number}p" "$log_file")
  [ "$actual" = "$expected" ] || fail "line $line_number expected '$expected', got '$actual'"
}

assert_log_line 1 '-chdir=infra/terraform/stacks/alicloud/sandbox'
assert_log_line 2 init
assert_log_line 3 '-backend=false'
assert_log_line 4 '-input=false'
assert_log_line 5 '-lockfile=readonly'

set +e
PATH="$test_path" \
FAKE_TERRAFORM_LOG="$log_file" \
FAKE_TERRAFORM_EXIT=23 \
  "$wrapper" alicloud/sandbox validate >/dev/null 2>&1
exit_code=$?
set -e
[ "$exit_code" -eq 23 ] || fail "Terraform exit code was not preserved"

expect_failure() {
  expected_message=$1
  shift

  if output=$(PATH="$test_path" FAKE_TERRAFORM_LOG="$log_file" "$wrapper" "$@" 2>&1); then
    fail "expected failure: $expected_message"
  fi

  case "$output" in
    *"$expected_message"*)
      ;;
    *)
      fail "missing error message: $expected_message"
      ;;
  esac
}

create_version_fixture() {
  fixture_root=$1
  mkdir -p "$fixture_root/scripts" "$fixture_root/infra/terraform/stacks/alicloud/sandbox"
  cp "$wrapper" "$fixture_root/scripts/terraform.sh"
  cp "$repo_root/scripts/terraform-version.sh" "$fixture_root/scripts/terraform-version.sh"
  chmod +x "$fixture_root/scripts/terraform.sh" "$fixture_root/scripts/terraform-version.sh"
  printf '1.15.8\n' > "$fixture_root/.terraform-version"
}

expect_fixture_failure() {
  expected_message=$1
  fixture_root=$2

  if output=$(PATH="$test_path" FAKE_TERRAFORM_LOG="$log_file" \
    "$fixture_root/scripts/terraform.sh" alicloud/sandbox validate 2>&1); then
    fail "expected fixture failure: $expected_message"
  fi

  case "$output" in
    *"$expected_message"*)
      ;;
    *)
      fail "missing fixture error message: $expected_message"
      ;;
  esac
}

expect_failure "usage"
expect_failure "stack path is not a directory" alicloud/sandbox/main.tf
expect_failure "stack path is not a directory" missing/stack
expect_failure "relative path without traversal" ../sandbox
expect_failure "relative path without traversal" alicloud/../sandbox
expect_failure "relative path without traversal" /tmp

[ ! -e "$link_path" ] && [ ! -L "$link_path" ] || fail "test symlink path already exists"
ln -s "$temp_dir/outside" "$link_path"
test_link_created=1
expect_failure "stack path escapes infra/terraform/stacks" "$link_name"

if output=$(PATH="$temp_dir/no-terraform:/usr/bin:/bin" "$wrapper" alicloud/sandbox validate 2>&1); then
  fail "missing Terraform CLI should fail"
fi
case "$output" in
  *"Terraform CLI is not installed"*)
    ;;
  *)
    fail "missing Terraform CLI error was not reported"
    ;;
esac

if output=$(PATH="$test_path" FAKE_TERRAFORM_LOG="$log_file" FAKE_TERRAFORM_VERSION=1.15.7 "$wrapper" alicloud/sandbox validate 2>&1); then
  fail "Terraform version mismatch should fail"
fi
case "$output" in
  *"does not match .terraform-version 1.15.8"*)
    ;;
  *)
    fail "Terraform version mismatch error was not reported"
    ;;
esac

secret='wrapper-test-secret'
output=$(PATH="$test_path" \
  FAKE_TERRAFORM_LOG="$log_file" \
  ALIBABA_CLOUD_ACCESS_KEY_ID="$secret" \
  ALIBABA_CLOUD_ACCESS_KEY_SECRET="$secret" \
  "$wrapper" alicloud/sandbox validate 2>&1)
case "$output" in
  *"$secret"*)
    fail "credentials leaked to wrapper output"
    ;;
esac

missing_version_fixture="$temp_dir/missing-version"
create_version_fixture "$missing_version_fixture"
rm "$missing_version_fixture/.terraform-version"
expect_fixture_failure "missing .terraform-version" "$missing_version_fixture"

invalid_version_fixture="$temp_dir/invalid-version"
create_version_fixture "$invalid_version_fixture"
printf '1.15.8\nextra\n' > "$invalid_version_fixture/.terraform-version"
expect_fixture_failure "exactly one non-empty line" "$invalid_version_fixture"

printf 'Terraform wrapper tests passed.\n'
