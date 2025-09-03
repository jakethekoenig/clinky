#!/bin/bash
set -e

# Run prettier to format code
bun run format

# Run ESLint with autofix
bun run lint --fix 2>/dev/null || true
