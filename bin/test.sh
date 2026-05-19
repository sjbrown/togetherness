#!/usr/bin/env bash
set -euo pipefail

if [ `basename $(pwd)` != "crdt-svg" ]; then
  echo "You must be in the crdt-svg directory to run this command"
  exit 1
fi

bin/test_unit.docker.sh
bin/test_e2e.docker.sh

echo "✓ Done."
