#! /bin/bash

set -e

if [ `basename $(pwd)` != "togetherness" ]; then
  echo "You must be in the togetherness directory to run this command"
  exit 1
fi

#docker run --rm -it -p 8000:80 togetherness bash

echo "Starting cypress"
echo ""
xhost local:root
#docker run --rm -it -v /tmp/.X11-unix:/tmp/.X11-unix -e DISPLAY=unix$DISPLAY togetherness npx cypress open


docker run --rm -it \
  -w /e2e \
  -v $PWD:/e2e \
  -v $HOME/tmp/docker_root:/root \
  -v /tmp/.X11-unix:/tmp/.X11-unix \
  -e DISPLAY=unix$DISPLAY \
  -e CYPRESS_baseUrl=$CYPRESS_baseUrl \
  --entrypoint=bash \
  cypress/included:4.5.0
