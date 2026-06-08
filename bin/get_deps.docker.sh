#!/usr/bin/env bash

#
# Vendors JS dependencies into src/lib/ as individual ESM files.
# Run this when you add or upgrade a dependency. Commit the results.
#
# Runs inside a docker container so that the host filesystem isn't
# polluted with npm nonsense.
#
# Output:
#   src/lib/yjs.js          — yjs, self-contained
#   src/lib/y-webrtc.js     — y-webrtc + its deps (yjs external)
#   src/lib/y-indexeddb.js  — y-indexeddb + its deps (yjs external)
#

set -xeuo pipefail

if [ `basename $(pwd)` != "togetherness" ]; then
  echo "You must be in the togetherness directory to run this command"
  exit 1
fi


OUT_DIR="./src/lib"

echo " Vendoring dependencies into $OUT_DIR ..."
echo ""

docker run --rm \
  -e npm_config_cache=/tmp/npm-cache \
  -v "${OUT_DIR}:/mnt/out" \
  -v "./bin:/mnt/bin" \
  node:22-alpine \
  sh /mnt/bin/get_deps.sh

echo "  fixing ownership..."
sudo chown -R "$(id -u):$(id -g)" "${OUT_DIR}"

echo ""
echo "✓ Done. Files written to src/lib/:"
ls -lh "${OUT_DIR}"/*.js | awk '{print "  " $5 "  " $9}'
echo ""
echo "  Import in your HTML with:"
echo "    import * as Y                   from '/lib/yjs.js';"
echo "    import { WebrtcProvider }       from '/lib/y-webrtc.js';"
echo "    import { IndexeddbPersistence } from '/lib/y-indexeddb.js';"
