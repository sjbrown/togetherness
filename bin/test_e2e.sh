#!/usr/bin/env sh

set -ex

echo "   ----"
echo "CI=${CI}"
echo "APP_URL=${APP_URL}"
echo "SIGNALING_URL=${SIGNALING_URL}"
echo "   ----"

if [ -z "$APP_URL" ]; then
    # Chromium does its own async DNS and won't resolve Docker internal hostnames
    # like "app" or "signaling" — so we look them up via getent (libc) and pass
    # the IPs directly as APP_URL and SIGNALING_URL.
    echo "Getting IP from getent"
    getent hosts "app"
    APP_URL=http://$(getent hosts "app" | awk '{print $1}'):80
fi

if [ -z "$SIGNALING_URL" ]; then
    # Chromium does its own async DNS and won't resolve Docker internal hostnames
    # like "app" or "signaling" — so we look them up via getent (libc) and pass
    # the IPs directly as APP_URL and SIGNALING_URL.
    echo "Getting IP from getent"
    getent hosts "signaling"
    SIGNALING_URL=http://$(getent hosts "signaling" | awk '{print $1}'):4444
fi

echo "Getting IP from getent"
getent hosts "app"
APP_URL=http://$(getent hosts "app" | awk '{print $1}'):80
echo "Getting IP from getent"
getent hosts "signaling"
SIGNALING_URL=http://$(getent hosts "signaling" | awk '{print $1}'):4444

echo "   ----"
echo "CI=${CI}"
echo "APP_URL=${APP_URL}"
echo "SIGNALING_URL=${SIGNALING_URL}"
echo "   ----"

exec npx playwright test --reporter=list "$@"
