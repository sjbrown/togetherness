#!/usr/bin/env sh

set -ex

if [ -z "$APP_URL" ]; then
    # Chromium does its own async DNS and won't resolve Docker internal hostnames
    # like "app" or "signaling" — so we look them up via getent (libc) and pass
    # the IPs directly as APP_URL and SIGNALING_URL.
    APP_URL=http://$(getent hosts "app" | awk '{print $1}'):80
fi

if [ -z "$SIGNALING_URL" ]; then
    # Chromium does its own async DNS and won't resolve Docker internal hostnames
    # like "app" or "signaling" — so we look them up via getent (libc) and pass
    # the IPs directly as APP_URL and SIGNALING_URL.
    SIGNALING_URL=http://$(getent hosts "signaling" | awk '{print $1}'):4444
fi

echo "   ----"
echo "CI=${CI}"
echo "APP_URL=${APP_URL}"
echo "SIGNALING_URL=${SIGNALING_URL}"
echo "   ----"

exec npx playwright test --reporter=list "$@"
