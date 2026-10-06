#!/bin/sh
set -eu

root_dir="$(git rev-parse --show-toplevel)"
context_dir="$root_dir/.local-context"

printf '%s\n' 'Repository-local task context (current request and working tree take precedence):'
git -C "$root_dir" status --short

for context_file in current-task.md decisions.md CHANGELOG.md; do
  path="$context_dir/$context_file"
  if [ -f "$path" ]; then
    printf '\n%s\n' "--- $context_file ---"
    sed -n '1,120p' "$path"
  fi
done
