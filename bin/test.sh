#!/usr/bin/env bash
set -euo pipefail

if [ `basename $(pwd)` != "togetherness" ]; then
  echo "You must be in the togetherness directory to run this command"
  exit 1
fi

# test.sh runs the WHOLE suite and takes no arguments — there'd be no
# sensible way to route one set of args to both vitest and playwright.
# To narrow a run, call the specific wrapper, which forwards args:
#   bin/test_unit.docker.sh tests/unit/conflict.test.js
#   bin/test_e2e.docker.sh  tests/e2e/concurrent-tray-drop.spec.js
if [ "$#" -gt 0 ]; then
  echo "bin/test.sh takes no arguments (it runs the full suite)."
  echo ""
  echo "To pass args down to a specific runner, use:"
  echo "  bin/test_unit.docker.sh [vitest args...]"
  echo "  bin/test_e2e.docker.sh  [playwright args...]"
  exit 1
fi

bin/test_unit.docker.sh
bin/test_e2e.docker.sh

echo "✓ Done."
