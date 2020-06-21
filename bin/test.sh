#! /bin/bash

set -e

if [ `basename $(pwd)` != "togetherness" ]; then
  echo "You must be in the togetherness directory to run this command"
  exit 1
fi

if [ -z "$CYPRESS_BASE_URL" ]; then
  echo "Environment variable CYPRESS_BASE_URL must be set!"
  echo ""
  echo "eg:"
  echo "CYPRESS_BASE_URL=http://172.17.0.1:8000 bin/test.sh"
  echo "CYPRESS_BASE_URL=http://172.17.0.3 bin/test.sh"
  echo "CYPRESS_BASE_URL=http://host.docker.internal:8000 bin/test.sh"
  exit 1
fi

echo "Running tests..."
echo ""

docker run --rm -it \
  -v $PWD:/e2e \
  -w /e2e \
  -e CYPRESS_BASE_URL=$CYPRESS_BASE_URL \
  cypress/included:4.5.0 $@

