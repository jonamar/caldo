#!/usr/bin/env bash
set -euo pipefail

# Start Caldo data server (8422) and web UI (8421)
# - Ensures dependencies are installed
# - Starts both services
# - Verifies ports are responsive

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
UI_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVER_DIR="$(cd "$UI_DIR/../caldo-server" && pwd)"

check_or_install() {
  local dir="$1"
  if [ ! -d "$dir/node_modules" ]; then
    echo "[deps] Installing dependencies in $dir"
    (cd "$dir" && npm install)
  else
    echo "[deps] node_modules present in $dir"
  fi
}

wait_for_http() {
  local url="$1"
  local max_tries="${2:-30}"
  local delay="${3:-1}"
  local i=1
  while [ $i -le $max_tries ]; do
    if curl -s -I --max-time 2 "$url" >/dev/null 2>&1; then
      echo "[ok] $url is responsive"
      return 0
    fi
    printf "[wait] %s (attempt %d/%d)\n" "$url" "$i" "$max_tries"
    sleep "$delay"
    i=$((i+1))
  done
  echo "[error] Timed out waiting for $url"
  return 1
}

echo "[info] UI dir: $UI_DIR"
echo "[info] Server dir: $SERVER_DIR"

check_or_install "$SERVER_DIR"
check_or_install "$UI_DIR"

# Start data server (8422)
echo "[start] Data server on http://localhost:8422"
(cd "$SERVER_DIR" && npm start) &
SERVER_PID=$!
trap "echo '[info] Stopping servers'; kill ${SERVER_PID:-} ${UI_PID:-} 2>/dev/null || true" EXIT

wait_for_http "http://localhost:8422" 20 1 || true

# Start web UI (8421)
echo "[start] Web UI on http://localhost:8421"
(cd "$UI_DIR" && npm start) &
UI_PID=$!

# Verify both are up
wait_for_http "http://localhost:8421" 60 1 || true

cat <<EOF

Caldo is starting:
- Data server:  http://localhost:8422
- Web UI:       http://localhost:8421

This script leaves both processes running in the background of this shell.
Use Ctrl+C to terminate them.
EOF

# Keep the script attached so traps work
wait
