#!/usr/bin/env bash
set -euo pipefail

if [ `basename $(pwd)` != "crdt-svg" ]; then
  echo "You must be in the crdt-svg directory to run this command"
  exit 1
fi

MODE="${1:-unit}"

case "${MODE}" in
  unit)
    echo "▶ Running unit tests..."
    docker compose -f docker-compose.test.yml \
      --profile unit \
      run --rm --build test
    ;;
  e2e)
    echo "▶ Running e2e tests..."
    docker compose -f docker-compose.test.yml \
      --profile e2e \
      run --rm --build e2e
    docker compose -f docker-compose.test.yml --profile e2e down
    ;;
  all)
    echo "▶ Running all tests (unit + e2e)..."
    docker compose -f docker-compose.test.yml \
      --profile unit \
      run --rm --build test
    docker compose -f docker-compose.test.yml \
      --profile e2e \
      run --rm --build e2e
    docker compose -f docker-compose.test.yml --profile e2e down
    ;;
  *)
    echo "Usage: bin/test.sh [unit|e2e|all]"
    echo "  unit  — run Vitest unit tests (default)"
    echo "  e2e   — run Playwright e2e tests (requires Docker)"
    echo "  all   — run both"
    exit 1
    ;;
esac

echo "✓ Done."
