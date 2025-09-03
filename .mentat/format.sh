#!/usr/bin/env bash
set -euo pipefail
if command -v bun &>/dev/null; then
  bunx --bun prettier --write .
else
  npx prettier --write .
fi
