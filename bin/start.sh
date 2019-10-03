#! /bin/bash

set -e

if [ `basename $(pwd)` != "togetherness" ]; then
  echo "You must be in the togetherness directory to run this command"
  exit 1
fi

echo "Starting togetherness on port 8000"
echo ""
docker run --rm \
  -p 8000:80 \
  -v $PWD/src:/app/ \
  togetherness
