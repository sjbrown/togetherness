#! /bin/bash

set -e

if [ `basename $(pwd)` != "togetherness" ]; then
  echo "You must be in the togetherness directory to run this command"
  exit 1
fi

echo "Starting cypress"
echo ""
xhost local:root
docker run --rm -it -v /tmp/.X11-unix:/tmp/.X11-unix -e DISPLAY=unix$DISPLAY togetherness npx cypress open
