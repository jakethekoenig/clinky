#!/bin/bash
set -e

# Install bun
curl -fsSL https://bun.sh/install | bash

# Add bun to the PATH for the current and future sessions
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
