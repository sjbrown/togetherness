#!/usr/bin/env bash
set -euo pipefail

if [ `basename $(pwd)` != "crdt-svg" ]; then
  echo "You must be in the crdt-svg directory to run this command"
  exit 1
fi

echo "▶ Starting crdt-svg dev environment..."
echo "  App:       http://localhost:3000"
echo "  Signaling: ws://localhost:4444"
echo ""
echo "  Press Ctrl-C to stop."
echo ""

docker compose up --build

