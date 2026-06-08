#!/usr/bin/env bash

set -euox pipefail

if [ `basename $(pwd)` != "togetherness" ]; then
  echo "You must be in the togetherness directory to run this command"
  exit 1
fi

npm ci --ignore-scripts

MODE="${1:-unit}"
case "${MODE}" in
    unit)
      echo "▶ Running unit tests (native)..."
      npx vitest run --reporter=verbose
      ;;
    e2e)
      echo "▶ Running e2e tests (docker)..."
      docker compose -f docker-compose.test.yml run --rm e2e
      ;;
    *)
      echo "Usage: bin/test.github_wrapper.sh [unit|e2e]"
      exit 1
      ;;
esac

echo "✓ Done."
