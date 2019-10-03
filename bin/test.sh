#! /bin/bash

set -e

if [ `basename $(pwd)` != "togetherness" ]; then
  echo "You must be in the togetherness directory to run this command"
  exit 1
fi

if [ -z "$CYPRESS_baseUrl" ]; then
  echo "Environment variable CYPRESS_baseUrl must be set!"
  echo ""
  echo "eg: CYPRESS_baseUrl=http://172.17.0.3 bin/test.sh"
  echo "eg: CYPRESS_baseUrl=http://host.docker.internal:8000 bin/test.sh"
  exit 1
fi

echo "Running tests..."
echo ""

docker run -it \
  -v $PWD:/e2e \
  -w /e2e \
  -e CYPRESS_baseUrl=$CYPRESS_baseUrl \
  cypress/included:3.4.1

