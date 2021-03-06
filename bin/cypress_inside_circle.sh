#! /bin/bash

set -e

if [ `basename $(pwd)` != "togetherness" ]; then
  echo "You must be in the togetherness directory to run this command"
  exit 1
fi

cat > package.json <<EOF
{
  "dependencies" : {
    "wait-on": "*"
  }
}
EOF

npm install
npm install wait-on -g
npm install http-server -g
npm install cypress@4.5.0


echo ""
echo "==================="
echo "Starting the server"

http-server -a localhost -p 80 src/ & wait-on http://localhost:80
curl -v http://localhost:80

echo ""
echo "================"
echo "Starting cypress"

CYPRESS_BASE_URL=http://localhost:80/ npx cypress run \
  --spec "cypress/integration/basics_spec.js"


