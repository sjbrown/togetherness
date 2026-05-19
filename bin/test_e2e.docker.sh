#!/usr/bin/env bash
set -euo pipefail

if [ `basename $(pwd)` != "crdt-svg" ]; then
  echo "You must be in the crdt-svg directory to run this command"
  exit 1
fi

echo "▶ Running e2e tests (Docker)..."

docker compose -f docker-compose.test.yml run --build --rm e2e
docker compose -f docker-compose.test.yml down e2e

echo "✓ Done."
