#! /bin/bash

set -e

if [ `basename $(pwd)` != "togetherness" ]; then
  echo "You must be in the togetherness directory to run this command"
  exit 1
fi

echo "Running tests..."
echo ""
# docker run --rm -p 8000:80 togetherness node_modules/.bin/cypress run

docker run -it -v $PWD:/e2e -w /e2e cypress/included:3.4.1
