#!/bin/bash
# SessionStart hook for Claude Code on the web.
# Installs JS deps so `npm test` / `npm run build` work in fresh sessions.
set -euo pipefail

# Only run in remote (Claude Code on the web) environment.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Idempotent: npm install is a no-op if node_modules is already present and in sync.
npm install --no-audit --no-fund --silent
