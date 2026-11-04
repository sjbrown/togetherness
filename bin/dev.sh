#!/usr/bin/env bash
set -euo pipefail

if [ `basename $(pwd)` != "togetherness" ]; then
  echo "You must be in the togetherness directory to run this command"
  exit 1
fi

# Developer pages (tests/dev/*.html) are copied into the served folder at
# /dev/ for as long as this runs, with an index linking to each one. They
# are copied rather than linked because the app container only mounts src/.
DEV_PAGES=tests/dev
DEV_OUT=src/dev

rm -rf "$DEV_OUT"
mkdir -p "$DEV_OUT"
trap 'rm -rf "$DEV_OUT"' EXIT
cp "$DEV_PAGES"/*.html "$DEV_OUT"/
{
  echo '<!doctype html>'
  echo '<meta charset="utf-8">'
  echo '<title>Dev pages</title>'
  echo '<h1>Dev pages</h1>'
  echo '<ul>'
  for page in "$DEV_PAGES"/*.html; do
    name=$(basename "$page")
    title=$(sed -n 's:.*<title>\(.*\)</title>.*:\1:p' "$page" | head -n 1)
    echo "  <li><a href=\"$name\">$name</a> ${title:+— $title}</li>"
  done
  echo '</ul>'
} > "$DEV_OUT/index.html"

echo "▶ Starting togetherness dev environment..."
echo "  App:       http://localhost:3000"
echo "  Dev pages: http://localhost:3000/dev/"
echo "  Signaling: ws://localhost:4444"
echo ""
echo "  Press Ctrl-C to stop."
echo ""

docker compose up --build
