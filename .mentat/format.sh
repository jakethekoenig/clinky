#!/usr/bin/env bash
set -euo pipefail
if command -v bun &>/dev/null; then
  bun install
fi
if command -v bunx &>/dev/null; then
  bunx prettier --write .
  bunx eslint . --ext .ts --fix || true
else
  npx prettier --write .
  npx eslint . --ext .ts --fix || true
fi
