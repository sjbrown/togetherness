#!/usr/bin/env bash
set -euo pipefail

if [ `basename $(pwd)` != "togetherness" ]; then
  echo "You must be in the togetherness directory to run this command"
  exit 1
fi

# Anything you pass to this script is forwarded, verbatim, to the
# `npx playwright test` invocation inside the container (see bin/test_e2e.sh).
#
#   bin/test_e2e.docker.sh tests/e2e/concurrent-tray-drop.spec.js
#   bin/test_e2e.docker.sh -g "converge" --headed=0 --retries=0
#
# The `--build` is what picks up edits to tests/ — docker/e2e.Dockerfile
# COPYs tests/ in rather than bind-mounting it.

echo "▶ Running e2e tests (Docker)..."

docker compose -f docker-compose.test.yml run --build --rm e2e bin/test_e2e.sh "$@"
docker compose -f docker-compose.test.yml down e2e

echo "✓ Done."
