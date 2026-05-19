#!/usr/bin/env bash

set -euox pipefail

if [ `basename $(pwd)` != "crdt-svg" ]; then
  echo "You must be in the crdt-svg directory to run this command"
  exit 1
fi

if [ "${CI:-}" != "true" ]; then
  echo "Error - not in Github's environment"
  echo "  CI = ${CI}"
  exit 1
fi

export APP_URL="http://localhost:3000"
export SIGNALING_URL="ws://localhost:4444"

npm ci --ignore-scripts

MODE="${1:-unit}"
case "${MODE}" in
    unit)
      echo "▶ Running unit tests (native)..."
      npx vitest run --reporter=verbose
      ;;
    e2e)
      echo "▶ Running e2e tests (native)..."
      docker compose -f docker-compose.test.yml run --rm e2e
      #npx playwright install --with-deps chromium
      #./bin/test_e2e.sh
      ;;
    *)
      echo "Usage: bin/test.github_wrapper.sh [unit|e2e|all]"
      exit 1
      ;;
esac

echo "✓ Done."
