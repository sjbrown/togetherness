#!/usr/bin/env bash
set -euo pipefail

if [ `basename $(pwd)` != "crdt-svg" ]; then
  echo "You must be in the crdt-svg directory to run this command"
  exit 1
fi

echo "▶ Running unit tests (Docker)..."

docker compose -f docker-compose.test.yml run --rm test
docker compose -f docker-compose.test.yml down

echo "✓ Done."
