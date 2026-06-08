#!/usr/bin/env bash
set -euo pipefail

if [ `basename $(pwd)` != "togetherness" ]; then
  echo "You must be in the togetherness directory to run this command"
  exit 1
fi

echo "▶ Starting togetherness dev environment..."
echo "  App:       http://localhost:3000"
echo "  Signaling: ws://localhost:4444"
echo ""
echo "  Press Ctrl-C to stop."
echo ""

docker compose up --build

