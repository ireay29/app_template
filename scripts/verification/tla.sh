#!/bin/sh
set -eu

usage() {
  printf '%s\n' 'Usage: pnpm verify:tla [--counterexample | MODEL.tla MODEL.cfg]' >&2
  exit 1
}

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
sample_dir=$script_dir/../../verification/tla
case "$#" in
  0) module=$sample_dir/SessionSwitch.tla; config=$sample_dir/SessionSwitch.cfg ;;
  1) [ "$1" = '--counterexample' ] || usage
     module=$sample_dir/SessionSwitch.tla; config=$sample_dir/SessionSwitchUnsafe.cfg ;;
  2) module=$1; config=$2 ;;
  *) usage ;;
esac

if [ ! -f "$module" ] || [ ! -f "$config" ]; then
  printf 'TLA+ module or config not found: %s %s\n' "$module" "$config" >&2
  exit 1
fi

if [ -z "${TLA2TOOLS_JAR:-}" ] || [ ! -f "$TLA2TOOLS_JAR" ] || [ ! -r "$TLA2TOOLS_JAR" ]; then
  printf '%s\n' 'Set TLA2TOOLS_JAR to a readable TLC jar. See docs/formal-verification.md.' >&2
  exit 1
fi

absolute_path() {
  case "$1" in
    /*) printf '%s\n' "$1" ;;
    *) printf '%s/%s\n' "$PWD" "$1" ;;
  esac
}

jar=$(absolute_path "$TLA2TOOLS_JAR")
config=$(absolute_path "$config")
module=$(absolute_path "$module")
meta_dir=$(mktemp -d "$(absolute_path "${TMPDIR:-/tmp}")/app-template-tlc.XXXXXXXX")
trap 'rm -rf -- "$meta_dir"' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

cd "$(dirname -- "$module")"
java -XX:+UseParallelGC -Xmx256m -jar "$jar" -workers 1 -metadir "$meta_dir" -config "$config" "$module"
