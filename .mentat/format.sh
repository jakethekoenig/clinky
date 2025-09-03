#!/bin/bash

# Run prettier to format all files
bun x prettier --write . --ignore-path .gitignore

# Run ESLint with autofix
bun x eslint . --ext .ts --fix

# Exit successfully even if there were formatting changes
# (the changes will be included in the commit)
exit 0
