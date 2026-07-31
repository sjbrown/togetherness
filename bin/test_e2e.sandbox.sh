#!/usr/bin/env bash
set -euo pipefail

if [ `basename $(pwd)` != "togetherness" ]; then
  echo "You must be in the togetherness directory to run this command"
  exit 1
fi

# e2e without Docker, for sandboxes that have a preinstalled browser but no
# container runtime. Args are forwarded to `npx playwright test`:
#
#   bin/test_e2e.sandbox.sh
#   bin/test_e2e.sandbox.sh tests/e2e/dice-roll.spec.js
#   bin/test_e2e.sandbox.sh -g "converge"
#
# Starts both servers itself and tears them down on exit, because the whole
# run has to fit in a single shell invocation — an agent's background
# processes don't survive from one tool call to the next.

PW_CHROME="${PW_CHROME:-/opt/pw-browsers/chromium-1194/chrome-linux/chrome}"
if [ ! -x "$PW_CHROME" ]; then
  echo "No browser at $PW_CHROME"
  echo "Set PW_CHROME to a Chromium binary, or run bin/test_e2e.docker.sh instead."
  exit 1
fi
export PW_CHROME
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}"

npx serve src -l 3000 >/tmp/tt-serve.log 2>&1 &
SERVE=$!
npx y-webrtc-signaling >/tmp/tt-signaling.log 2>&1 &
SIG=$!
trap 'kill $SERVE $SIG 2>/dev/null || true' EXIT

for _ in $(seq 1 20); do
  curl -sf -o /dev/null http://localhost:3000/ && break
  sleep 0.5
done

export APP_URL=http://localhost:3000
export SIGNALING_URL=ws://localhost:4444

npx playwright test --reporter=list "$@"
