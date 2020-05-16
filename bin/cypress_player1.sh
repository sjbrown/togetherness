#! /bin/bash

set -e

if [ `basename $(pwd)` != "togetherness" ]; then
  echo "You must be in the togetherness directory to run this command"
  exit 1
fi

if [ -z "$CYPRESS_BASE_URL" ]; then
  echo "Environment variable CYPRESS_BASE_URL must be set!"
  echo ""
  echo "eg: CYPRESS_BASE_URL=http://172.17.0.1:8000 bin/cypress.sh"
  echo "eg: CYPRESS_BASE_URL=http://172.17.0.3 bin/cypress.sh"
  echo "eg: CYPRESS_BASE_URL=http://host.docker.internal:8000 bin/cypress.sh"
  exit 1
fi

echo "Starting cypress"
echo ""
xhost local:root
#docker run --rm -it -v /tmp/.X11-unix:/tmp/.X11-unix -e DISPLAY=unix$DISPLAY togetherness npx cypress open


docker run --rm -it \
  -w /e2e \
  -v $PWD:/e2e \
  -v /tmp/.X11-unix:/tmp/.X11-unix \
  -e DISPLAY=unix$DISPLAY \
  -e CYPRESS_BASE_URL=$CYPRESS_BASE_URL \
  --entrypoint=cypress \
  cypress/included:4.5.0 run --spec cypress/integration/player1.spec.js
