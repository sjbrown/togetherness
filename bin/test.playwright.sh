#!/usr/bin/env sh
# bin/test.playwright.sh
#
# Resolves Docker service hostnames to IPs before launching Playwright.
# Chromium does its own async DNS and won't resolve Docker internal hostnames
# like "app" or "signaling" — so we look them up via getent (libc) and pass
# the IPs directly as APP_URL and SIGNALING_URL.
#
# Falls back to environment variables if already set (e.g. when running
# natively outside Docker where getent won't find these hostnames).

set -e

resolve() {
  getent hosts "$1" 2>/dev/null | awk '{print $1; exit}'
}

APP_URL=http://$(getent hosts "app" | awk '{print $1}'):80
SIGNALING_URL=http://$(getent hosts "signaling" | awk '{print $1}'):4444

echo "APP_URL=${APP_URL}"
echo "SIGNALING_URL=${SIGNALING_URL}"

exec npx playwright test --reporter=list "$@"
