#!/usr/bin/env bash
set -euo pipefail

if [ `basename $(pwd)` != "togetherness" ]; then
  echo "You must be in the togetherness directory to run this command"
  exit 1
fi

# Anything you pass to this script is forwarded, verbatim, to the
# `npx vitest run` invocation inside the container (see bin/test_unit.sh).
#
#   bin/test_unit.docker.sh tests/unit/conflict.test.js
#   bin/test_unit.docker.sh -t "reverts the loser"

echo "▶ Running unit tests (Docker)..."
echo ""
echo " run it faster manually with:"
echo "  docker compose -f docker-compose.test.yml run --rm unit bin/test_unit.sh [args...]"
echo ""

docker compose -f docker-compose.test.yml run --build --rm unit bin/test_unit.sh "$@"
docker compose -f docker-compose.test.yml down

echo "✓ Done."
