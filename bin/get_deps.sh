#!/usr/bin/env sh

# Runs INSIDE the Docker container launched by bin/get_deps.docker.sh.
# Can also be stepped through manually:
#
#   docker run --rm -it \
#     --user "$(id -u):$(id -g)" \
#     -e npm_config_cache=/tmp/npm-cache \
#     -v "$(pwd)/src/lib:/mnt/out" \
#     node:22-alpine sh
#   # then paste commands from this file one at a time
#
# /mnt/out is mounted from the host's src/lib/ — files written here
# appear there, owned by the host user.

set -e

echo "→ installing packages..."
mkdir -p /tmp/deps /tmp/npm-cache
cd /tmp/deps
npm install yjs y-webrtc y-indexeddb esbuild

echo "→ bundling yjs..."
npx esbuild yjs \
  --bundle \
  --format=esm \
  --sourcemap=inline \
  --outfile=/mnt/out/yjs.js

echo "→ bundling y-webrtc..."
npx esbuild y-webrtc \
  --bundle \
  --format=esm \
  --sourcemap=inline \
  --external:yjs \
  --outfile=/mnt/out/y-webrtc.js

echo "→ bundling y-indexeddb..."
npx esbuild y-indexeddb \
  --bundle \
  --format=esm \
  --sourcemap=inline \
  --external:yjs \
  --outfile=/mnt/out/y-indexeddb.js

echo "→ done."
