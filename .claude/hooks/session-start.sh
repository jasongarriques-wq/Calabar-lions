#!/usr/bin/env bash
# Ensure dependencies are installed so `lint`, `typecheck`, and `build`
# work immediately during a Claude Code on the web session.
set -euo pipefail

cd "$(dirname "$0")/../.."

if [ ! -d node_modules ]; then
  echo "[session-start] installing npm dependencies…" >&2
  npm ci --no-audit --no-fund
fi

echo "[session-start] ready." >&2
